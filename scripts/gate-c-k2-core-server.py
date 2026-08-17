import json
import os
from pathlib import Path
import tempfile

from apps.creator_workspace_mvp.ai_director import AiDirectorService
from apps.creator_workspace_mvp.public_auth import PublicApiAuthenticator
from apps.creator_workspace_mvp.server import create_server
from services.v4_platform import (
    DeterministicLocalFfmpegAdapter,
    InMemoryMediaJobAdapter,
    MediaJobCoordinator,
    V4CompositionExecutor,
)
from services.v5_core_os.episode_production import create_in_memory_boundary
from services.v5_core_os.text_generation.testing import FakeTextGenerationCapability
from tests.unit.test_episode_production_k2 import (
    WORKSPACE,
    activate_k2_m6_baseline,
    g2_command,
    g3_command,
    g4_command,
    g5_command,
    g6_approval_authority,
    k2_identity_authority,
    run_command,
    seed_k2_roots,
)


def main():
    token = os.environ["K2_GATE_TOKEN"]
    port = int(os.environ.get("K2_GATE_CORE_PORT", "18765"))
    configured_artifact_root = os.environ.get("K2_GATE_CORE_ARTIFACT_ROOT")
    temporary_artifacts = None
    if configured_artifact_root:
        artifact_root = Path(configured_artifact_root).resolve()
        artifact_root.mkdir(parents=True, exist_ok=True)
    else:
        temporary_artifacts = tempfile.TemporaryDirectory(prefix="acs-k2-gate-c-")
        artifact_root = Path(temporary_artifacts.name)

    assembly, refs, project, series, episode, _ = seed_k2_roots(
        with_m6_authority=True
    )
    activate_k2_m6_baseline(assembly, project, series)
    run_ref = "episode-production-run-k2-1"
    production = create_in_memory_boundary(
        project_boundary=assembly.project_context,
        series_episode_boundary=assembly.series_episode,
        series_planning_boundary=assembly.series_planning,
        script_studio_boundary=assembly.script_studio,
        identity_reference_authority=k2_identity_authority(),
        media_execution=MediaJobCoordinator(
            InMemoryMediaJobAdapter(),
            DeterministicLocalFfmpegAdapter(),
            artifact_root,
            ref_factory=refs,
            clock=lambda: "2026-08-17T01:00:00Z",
        ),
        composition_execution=V4CompositionExecutor.from_artifact_root(artifact_root),
        approval_authority=g6_approval_authority(run_ref),
        ref_factory=refs,
        clock=lambda: "2026-08-17T00:05:00Z",
    )
    run = production.create_run(run_command(project, series, episode))
    if run["productionRunRef"] != run_ref:
        raise RuntimeError("unexpected deterministic production run reference")
    production.authorize_and_lock(g2_command(run))
    production.compile_shot_graph(g3_command(run))
    production.resolve_assets(g4_command(run))
    production.execute_media(g5_command(run))

    server = create_server(
        ("127.0.0.1", port),
        AiDirectorService(FakeTextGenerationCapability([])),
        series_episode_boundary=assembly.series_episode,
        project_boundary=assembly.project_context,
        series_planning_boundary=assembly.series_planning,
        series_intelligence_boundary=assembly.series_intelligence,
        script_studio_boundary=assembly.script_studio,
        episode_production_boundary=production,
        public_authenticator=PublicApiAuthenticator.for_token(token, WORKSPACE),
        allow_internal_routes=False,
    )
    metadata = {
        "coreCommit": os.environ.get("K2_GATE_CORE_SHA"),
        "corePort": server.server_port,
        "workspaceRef": WORKSPACE,
        "projectRef": project["projectRef"],
        "seriesRef": series["seriesRef"],
        "episodeRef": episode["episodeRef"],
        "productionRunRef": run["productionRunRef"],
        "state": production.get_run(WORKSPACE, run_ref)["state"],
        "artifactRoot": str(artifact_root),
    }
    print("K2_GATE_READY " + json.dumps(metadata, ensure_ascii=False), flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()
        if temporary_artifacts is not None:
            temporary_artifacts.cleanup()


if __name__ == "__main__":
    main()
