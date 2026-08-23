"""Run the non-GPU K2 control-plane fixture, Next production server and Chromium."""

from __future__ import annotations

from datetime import datetime, timezone
from hashlib import sha256
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import time


FRONTEND = Path(os.environ.get("K2_CONTROL_PLANE_FRONTEND_DIR", Path(__file__).resolve().parents[1])).resolve()
CORE = Path(
    os.environ.get(
        "K2_CONTROL_PLANE_CORE_DIR",
        FRONTEND.parent / "AI-Cinematic-Studio-work",
    )
).resolve()
RUN_ID = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
ARTIFACT_ROOT = Path(
    os.environ.get(
        "K2_CONTROL_PLANE_ARTIFACT_ROOT",
        FRONTEND / "artifacts" / "k2-control-plane-e2e" / RUN_ID,
    )
).resolve()
CORE_PORT = int(os.environ.get("K2_CONTROL_PLANE_CORE_PORT", "18766"))
FRONTEND_PORT = int(os.environ.get("K2_CONTROL_PLANE_FRONTEND_PORT", "3101"))


def git(repository: Path, *arguments: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(repository), *arguments], text=True
    ).strip()


def worktree_digest(repository: Path) -> str:
    paths = subprocess.check_output(
        [
            "git",
            "-C",
            str(repository),
            "ls-files",
            "--cached",
            "--others",
            "--exclude-standard",
            "-z",
        ]
    ).split(b"\0")
    digest = sha256()
    for raw_path in sorted(item for item in paths if item):
        relative = raw_path.decode("utf-8", errors="surrogateescape")
        source = repository / relative
        digest.update(raw_path)
        digest.update(b"\0")
        if source.is_symlink():
            digest.update(b"symlink\0")
            digest.update(os.readlink(source).encode("utf-8", errors="surrogateescape"))
        elif source.is_file():
            digest.update(b"file\0")
            with source.open("rb") as handle:
                for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                    digest.update(chunk)
        else:
            digest.update(b"missing\0")
        digest.update(b"\0")
    return digest.hexdigest()


def repository_identity(repository: Path) -> dict:
    status = git(repository, "status", "--porcelain=v1", "--untracked-files=all")
    return {
        "path": str(repository),
        "commit": git(repository, "rev-parse", "HEAD"),
        "tree": git(repository, "rev-parse", "HEAD^{tree}"),
        "dirty": bool(status),
        "status": status.splitlines(),
        "worktreeDigest": worktree_digest(repository),
    }


def wait_for_log(process: subprocess.Popen, log_path: Path, marker: str, timeout: int) -> str:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        content = log_path.read_text(encoding="utf-8", errors="replace") if log_path.exists() else ""
        if marker in content:
            return content
        if process.poll() is not None:
            raise RuntimeError(f"process exited before {marker!r}:\n{content}")
        time.sleep(0.2)
    content = log_path.read_text(encoding="utf-8", errors="replace") if log_path.exists() else ""
    raise TimeoutError(f"timed out waiting for {marker!r}:\n{content}")


def stop(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=8)


def main() -> None:
    if not (CORE / "AGENTS.md").is_file():
        raise RuntimeError(f"K2 Core checkout is missing: {CORE}")
    if not (FRONTEND / ".next" / "BUILD_ID").is_file():
        raise RuntimeError("production frontend bundle is missing; run npm run build first")
    if not (FRONTEND / "node_modules" / "playwright").is_dir():
        raise RuntimeError("Playwright is missing; install the CI-pinned playwright@1.62.1 package")

    ARTIFACT_ROOT.mkdir(parents=True, exist_ok=False)
    token = secrets.token_urlsafe(32)
    runtime = {
        "schemaVersion": "k2.control-plane-browser-runtime.v1",
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "gpuRequired": False,
        "canonicalMutationAllowed": False,
        "core": repository_identity(CORE),
        "frontend": repository_identity(FRONTEND),
    }
    (ARTIFACT_ROOT / "runtime.json").write_text(
        json.dumps(runtime, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    core_process = None
    frontend_process = None
    core_log_handle = None
    frontend_log_handle = None
    try:
        core_env = os.environ.copy()
        core_env.update(
            {
                "PYTHONPATH": str(CORE),
                "K2_CONTROL_PLANE_TOKEN": token,
                "K2_CONTROL_PLANE_CORE_PORT": str(CORE_PORT),
                "K2_CONTROL_PLANE_CORE_SHA": runtime["core"]["commit"],
            }
        )
        core_log_path = ARTIFACT_ROOT / "core.log"
        core_log_handle = core_log_path.open("w", encoding="utf-8")
        core_process = subprocess.Popen(
            [sys.executable, str(FRONTEND / "scripts" / "gate-k2-control-plane-core-server.py")],
            cwd=CORE,
            env=core_env,
            stdout=core_log_handle,
            stderr=subprocess.STDOUT,
            text=True,
        )
        core_ready = wait_for_log(core_process, core_log_path, "K2_CONTROL_PLANE_READY", 180)
        ready_line = next(
            line for line in core_ready.splitlines() if line.startswith("K2_CONTROL_PLANE_READY ")
        )
        fixture = json.loads(ready_line.split(" ", 1)[1])
        (ARTIFACT_ROOT / "fixture.json").write_text(
            json.dumps(fixture, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        frontend_env = os.environ.copy()
        frontend_env.update(
            {
                "CREATOR_CORE_BASE_URL": f"http://127.0.0.1:{CORE_PORT}",
                "CREATOR_CORE_TOKEN": token,
                "CREATOR_CONTENT_PROFILE_REF": "content-profile-k2",
                "NEXT_TELEMETRY_DISABLED": "1",
            }
        )
        frontend_log_path = ARTIFACT_ROOT / "frontend.log"
        frontend_log_handle = frontend_log_path.open("w", encoding="utf-8")
        frontend_process = subprocess.Popen(
            [
                str(FRONTEND / "node_modules" / ".bin" / "next"),
                "start",
                "--hostname",
                "127.0.0.1",
                "--port",
                str(FRONTEND_PORT),
            ],
            cwd=FRONTEND,
            env=frontend_env,
            stdout=frontend_log_handle,
            stderr=subprocess.STDOUT,
            text=True,
        )
        wait_for_log(frontend_process, frontend_log_path, "Ready in", 90)

        browser_env = os.environ.copy()
        browser_env.update(
            {
                "K2_CONTROL_PLANE_FRONTEND_ORIGIN": f"http://127.0.0.1:{FRONTEND_PORT}",
                "K2_CONTROL_PLANE_PROJECT_REF": fixture["projectRef"],
                "K2_CONTROL_PLANE_RUN_REF": fixture["productionRunRef"],
                "K2_CONTROL_PLANE_ARTIFACT_ROOT": str(ARTIFACT_ROOT),
                "K2_CONTROL_PLANE_CORE_SHA": runtime["core"]["commit"],
                "K2_CONTROL_PLANE_FRONTEND_SHA": runtime["frontend"]["commit"],
            }
        )
        browser_log_path = ARTIFACT_ROOT / "browser.log"
        with browser_log_path.open("w", encoding="utf-8") as browser_log:
            result = subprocess.run(
                ["node", str(FRONTEND / "scripts" / "gate-k2-control-plane-browser.mjs")],
                cwd=FRONTEND,
                env=browser_env,
                stdout=browser_log,
                stderr=subprocess.STDOUT,
                check=False,
                timeout=600,
            )
        print(browser_log_path.read_text(encoding="utf-8", errors="replace"))
        if result.returncode:
            raise SystemExit(result.returncode)
        print(f"K2_CONTROL_PLANE_BROWSER_E2E=PASS\nEVIDENCE_DIR={ARTIFACT_ROOT}")
    finally:
        stop(frontend_process)
        stop(core_process)
        if frontend_log_handle is not None:
            frontend_log_handle.close()
        if core_log_handle is not None:
            core_log_handle.close()


if __name__ == "__main__":
    main()
