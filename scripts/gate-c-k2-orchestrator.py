import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import time


FRONTEND = Path(os.environ.get("K2_GATE_FRONTEND_DIR", Path(__file__).resolve().parents[1])).resolve()
CORE = Path(os.environ.get("K2_GATE_CORE_DIR", FRONTEND.parent / "AI-Cinematic-Studio")).resolve()
ARTIFACT_ROOT = Path(os.environ.get("K2_GATE_ARTIFACT_ROOT", FRONTEND / "artifacts" / "gate-c-k2")).resolve()
CORE_PORT = int(os.environ.get("K2_GATE_CORE_PORT", "18765"))
FRONTEND_PORT = int(os.environ.get("K2_GATE_FRONTEND_PORT", "3100"))


def git_value(repository, *arguments):
    return subprocess.check_output(
        ["git", "-C", str(repository), *arguments], text=True
    ).strip()


def wait_for_log(process, log_path, marker, timeout):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        content = log_path.read_text(encoding="utf-8", errors="replace") if log_path.exists() else ""
        if marker in content:
            return content
        if process.poll() is not None:
            raise RuntimeError(
                f"process exited before {marker!r}:\n{content}"
            )
        time.sleep(0.2)
    content = log_path.read_text(encoding="utf-8", errors="replace") if log_path.exists() else ""
    raise TimeoutError(f"timed out waiting for {marker!r}:\n{content}")


def stop(process):
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=8)


def main():
    if not CORE.is_dir() or not (CORE / "AGENTS.md").is_file():
        raise RuntimeError(f"K2 Core checkout is missing or invalid: {CORE}")
    if not (FRONTEND / ".next" / "BUILD_ID").is_file():
        raise RuntimeError("production frontend bundle is missing; run npm run build before Gate C")

    token = secrets.token_urlsafe(32)
    core_sha = git_value(CORE, "rev-parse", "HEAD")
    frontend_sha = git_value(FRONTEND, "rev-parse", "HEAD")
    runtime = {
        "coreCommit": core_sha,
        "coreTree": git_value(CORE, "rev-parse", "HEAD^{tree}"),
        "coreDirty": bool(git_value(CORE, "status", "--porcelain")),
        "frontendCommit": frontend_sha,
        "frontendTree": git_value(FRONTEND, "rev-parse", "HEAD^{tree}"),
        "frontendDirty": bool(git_value(FRONTEND, "status", "--porcelain")),
    }
    if runtime["coreDirty"] or runtime["frontendDirty"]:
        raise RuntimeError("Gate C requires clean Core and Frontend checkouts")
    ARTIFACT_ROOT.mkdir(parents=True, exist_ok=True)
    core_artifacts = ARTIFACT_ROOT / "core-artifacts"
    core_artifacts.mkdir(parents=True, exist_ok=True)
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
                "K2_GATE_TOKEN": token,
                "K2_GATE_CORE_PORT": str(CORE_PORT),
                "K2_GATE_CORE_ARTIFACT_ROOT": str(core_artifacts),
                "K2_GATE_CORE_SHA": core_sha,
            }
        )
        core_log_path = ARTIFACT_ROOT / "core.log"
        core_log_handle = core_log_path.open("w", encoding="utf-8")
        core_process = subprocess.Popen(
            [sys.executable, str(FRONTEND / "scripts" / "gate-c-k2-core-server.py")],
            cwd=CORE,
            env=core_env,
            stdout=core_log_handle,
            stderr=subprocess.STDOUT,
            text=True,
        )
        wait_for_log(core_process, core_log_path, "K2_GATE_READY", 120)

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
        wait_for_log(frontend_process, frontend_log_path, "Ready in", 60)

        browser_env = os.environ.copy()
        browser_env.update(
            {
                "K2_GATE_FRONTEND_ORIGIN": f"http://127.0.0.1:{FRONTEND_PORT}",
                "K2_GATE_PROJECT_REF": "project-k2-1",
                "K2_GATE_ARTIFACT_ROOT": str(ARTIFACT_ROOT),
                "K2_GATE_CORE_SHA": core_sha,
                "K2_GATE_FRONTEND_SHA": frontend_sha,
            }
        )
        result = subprocess.run(
            ["node", str(FRONTEND / "scripts" / "gate-c-k2-browser.mjs")],
            cwd=FRONTEND,
            env=browser_env,
            check=False,
            timeout=600,
        )
        if result.returncode:
            raise SystemExit(result.returncode)
    finally:
        stop(frontend_process)
        stop(core_process)
        if frontend_log_handle is not None:
            frontend_log_handle.close()
        if core_log_handle is not None:
            core_log_handle.close()


if __name__ == "__main__":
    main()
