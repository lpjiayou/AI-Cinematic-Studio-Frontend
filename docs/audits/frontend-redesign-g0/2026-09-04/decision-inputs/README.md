# Frontend Redesign G0 Decision Inputs

Status: HISTORICAL

Document class: HISTORICAL_EVIDENCE

HISTORICAL_AUDIT_INPUT=true

CURRENT_EXECUTION_AUTHORITY=false

HISTORICAL_PATH_NOT_EXECUTION_AUTHORITY=true

## Scope

This directory preserves the 15-file core decision-input subset supplied for the
2026-09-04 V3 decision checkpoint. It is not a complete archive of Gate logs,
screenshots, or raw runtime artifacts and does not authorize implementation.

INPUT_PACKAGE_SHA256=c230171b45fbc2bf0925ad4562c75145dd7a4816369bec96932ceb0680909636

AUDIT_AGGREGATE_SHA256=45f48b069a618da764e4c74e482d3821511171bee375164fe7fcaa735fb8b3b3

AUDIT_INPUT_FILE_COUNT=15

## Exact package inputs

Every entry has classification HISTORICAL_AUDIT_INPUT and
CURRENT_EXECUTION_AUTHORITY=false.

| File | Role |
| --- | --- |
| [FRONTEND_REDESIGN_G0_EXECUTIVE_DECISION.md](FRONTEND_REDESIGN_G0_EXECUTIVE_DECISION.md) | Historical executive recommendation |
| [EVIDENCE_SHA256SUMS.txt](EVIDENCE_SHA256SUMS.txt) | Evidence manifest and aggregate method |
| [FRONTEND_COMPONENT_INVENTORY.json](FRONTEND_COMPONENT_INVENTORY.json) | Frozen component inventory |
| [FRONTEND_ROUTE_INVENTORY.json](FRONTEND_ROUTE_INVENTORY.json) | Frozen route inventory |
| [COMPETITOR_PATTERN_MATRIX.md](COMPETITOR_PATTERN_MATRIX.md) | Historical official-source pattern audit |
| [FRONTEND_IMPLEMENTATION_WAVES.md](FRONTEND_IMPLEMENTATION_WAVES.md) | Superseded wave proposal input |
| [DESIGN_SYSTEM_V3_DELTA.md](DESIGN_SYSTEM_V3_DELTA.md) | Proposed design-system delta input |
| [TARGET_SCREEN_SPECIFICATIONS.md](TARGET_SCREEN_SPECIFICATIONS.md) | Fourteen-screen proposal input |
| [TARGET_USER_FLOWS.md](TARGET_USER_FLOWS.md) | Proposed user-flow input |
| [TARGET_INFORMATION_ARCHITECTURE.md](TARGET_INFORMATION_ARCHITECTURE.md) | Proposed IA input |
| [UX_PROBLEM_REGISTER.json](UX_PROBLEM_REGISTER.json) | Frozen problem register |
| [CURRENT_SCREEN_BASELINE.md](CURRENT_SCREEN_BASELINE.md) | Frozen evidence boundary and screen baseline |
| [CORE_FRONTEND_CAPABILITY_MATRIX.json](CORE_FRONTEND_CAPABILITY_MATRIX.json) | Machine-readable frozen capability matrix |
| [CORE_FRONTEND_CAPABILITY_MATRIX.md](CORE_FRONTEND_CAPABILITY_MATRIX.md) | Human-readable frozen capability matrix |
| [TARGET_WIREFRAMES.html](TARGET_WIREFRAMES.html) | Fourteen-screen editable low-fidelity artifact; not final design or implementation |

## Referenced screenshot companions

The seven files under [screenshots](screenshots/) are not ZIP inputs and are excluded
from AUDIT_INPUT_FILE_COUNT. Their bytes match the hashes declared in
EVIDENCE_SHA256SUMS.txt. They are preserved only to keep the historical Markdown’s
original relative evidence links resolvable. Their presence does not make this a
complete raw audit archive, and no missing Gate log or browser artifact was
reconstructed.

## Current authority

The accepted authority is the
[Frontend Redesign G0 acceptance](../../../../status/FRONTEND_REDESIGN_G0_ACCEPTANCE_2026-09-04.md)
and its linked Product IA, 16-screen, Design System V3, and route-migration decisions.
