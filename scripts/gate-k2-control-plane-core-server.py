"""Serve one real in-memory K2 control-plane fixture over Creator Public HTTP.

This fixture deliberately stops at REAL_VIDEO_PLAN_READY.  It records four
technically validated video candidates and four canonical semantic-QC FAIL
decisions.  It never selects, admits, renders, exports or publishes media.
"""

from __future__ import annotations

import json
import os

from apps.creator_workspace_mvp.ai_director import AiDirectorService
from apps.creator_workspace_mvp.public_auth import PublicApiAuthenticator
from apps.creator_workspace_mvp.server import create_server
from services.v5_core_os.text_generation.testing import FakeTextGenerationCapability
from tests.unit.test_episode_production_k2 import WORKSPACE
from tests.unit.test_k2_real_video_selection import K2RealVideoSelectionTests


def _assert_control_plane_fixture(test_case: K2RealVideoSelectionTests) -> dict:
    recorded = test_case.record_candidates()
    if recorded["state"] != "REAL_VIDEO_PLAN_READY":
        raise RuntimeError("candidate handoff unexpectedly advanced production")
    validations = recorded["technicalValidations"]
    if len(validations) != 4:
        raise RuntimeError("control-plane fixture requires four validations")
    for ordinal, validation in enumerate(validations, start=1):
        decision = test_case.visual_qc(validation, ordinal, result="FAIL")
        if decision["result"] != "FAIL":
            raise RuntimeError("semantic visual QC must remain FAIL")

    boundary = test_case.boundary
    run_ref = test_case.run["productionRunRef"]
    projection = boundary.get_state_projection(WORKSPACE, run_ref)
    candidates = projection["candidateLifecycle"]["candidates"]
    checks = {
        "rootState": projection["rootState"]["state"] == "ROOTS_READY",
        "productionState": projection["productionState"] == "REAL_VIDEO_PLAN_READY",
        "compatibilityAlias": projection["state"] == projection["productionState"],
        "visualQcState": projection["visualQcState"]["state"] == "FAIL",
        "candidateCount": len(candidates) == 4,
        "activeRevision": bool(projection["activeRevision"].get("revisionRef")),
        "technicalValidation": all(
            item["technicalState"] == "TECHNICALLY_VERIFIED" for item in candidates
        ),
        "semanticVisualQc": all(
            item["visualQcState"] == "SEMANTIC_QC_FAILED" for item in candidates
        ),
        "humanSelection": all(
            item["selectionState"] == "UNSELECTED" for item in candidates
        ),
        "admission": all(item["admissionState"] == "NOT_ADMITTED" for item in candidates),
        "runtimeIsolation": projection["invariants"]["runtimeDoesNotAdvanceProduction"]
        is True,
        "publicationLock": projection["publicationAllowed"] is False,
    }
    failed = sorted(name for name, passed in checks.items() if not passed)
    if failed:
        raise RuntimeError(f"invalid control-plane fixture: {', '.join(failed)}")
    return projection


def main() -> None:
    token = os.environ["K2_CONTROL_PLANE_TOKEN"]
    port = int(os.environ.get("K2_CONTROL_PLANE_CORE_PORT", "18766"))
    test_case = K2RealVideoSelectionTests(
        methodName="test_semantic_qc_fail_cannot_select_or_advance_production"
    )
    test_case.setUp()
    server = None
    try:
        projection = _assert_control_plane_fixture(test_case)
        server = create_server(
            ("127.0.0.1", port),
            AiDirectorService(FakeTextGenerationCapability([])),
            series_episode_boundary=test_case.assembly.series_episode,
            project_boundary=test_case.assembly.project_context,
            series_planning_boundary=test_case.assembly.series_planning,
            series_intelligence_boundary=test_case.assembly.series_intelligence,
            script_studio_boundary=test_case.assembly.script_studio,
            episode_production_boundary=test_case.boundary,
            public_authenticator=PublicApiAuthenticator.for_token(token, WORKSPACE),
            allow_internal_routes=False,
        )
        metadata = {
            "schemaVersion": "k2.control-plane-browser-fixture.v1",
            "coreCommit": os.environ.get("K2_CONTROL_PLANE_CORE_SHA"),
            "corePort": server.server_port,
            "workspaceRef": WORKSPACE,
            "projectRef": test_case.project["projectRef"],
            "seriesRef": test_case.series["seriesRef"],
            "episodeRef": test_case.episode["episodeRef"],
            "productionRunRef": test_case.run["productionRunRef"],
            "rootState": projection["rootState"]["state"],
            "productionState": projection["productionState"],
            "runtimeState": projection["runtimeState"]["state"],
            "visualQcState": projection["visualQcState"]["state"],
            "candidateCount": len(projection["candidateLifecycle"]["candidates"]),
            "activeRevisionRef": projection["activeRevision"]["revisionRef"],
            "publicationAllowed": projection["publicationAllowed"],
            "gpuRequired": False,
        }
        print("K2_CONTROL_PLANE_READY " + json.dumps(metadata, ensure_ascii=False), flush=True)
        server.serve_forever()
    finally:
        if server is not None:
            server.server_close()
        test_case.tearDown()


if __name__ == "__main__":
    main()
