# Frontend V3 Wave 1C Acceptance — 2026-09-05

Status: CURRENT

Document class: CURRENT_STATUS

## Acceptance result

FRONTEND_V3_WAVE_1C=IMPLEMENTED_AND_VERIFIED

REBUILT_USER_SCREEN_COUNT_THIS_WAVE=3

REBUILT_USER_SCREENS=Story Workspace,Script Studio,Character Studio

NEW_CANONICAL_ROUTE_COUNT_THIS_WAVE=3

NEW_CANONICAL_ROUTES=/creator/projects/[projectRef]/story,/creator/projects/[projectRef]/script,/creator/projects/[projectRef]/characters

LEGACY_ROUTE_REDIRECT_COUNT=3

LEGACY_ROUTE_REDIRECTS=/planning/bible→/story,/content/script→/script,/planning/characters→/characters

FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6

FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10

The three pages use new V3 component trees and the shared Project shell. The old page
implementation bodies remain frozen. Their old URL entries perform Next server
redirects to one canonical writable page per capability.

## Bounded capability result

STORY_M5_PLAN_MUTATIONS=PRESERVED_BOUNDED

STORY_M6_AUTHORITY_WRITES=false

SCRIPT_EPISODE_AND_VERSION_MUTATIONS=PRESERVED_BOUNDED

SCRIPT_REVIEWED_IMPORT_UI=false

CHARACTER_M6_MODE=READ_ONLY_OR_AUTHORITY_BLOCKED

LOCAL_FIXTURE_FALLBACK=false

Story retains only the existing M5 candidate generation and explicit confirmation
commands. Script retains only the existing Episode creation and ScriptVersion
generate, manual-save, and confirmation commands; its editable content is limited to
the synopsis and navigation is protected while dirty. Character performs no writes
and displays only contract-proven M6 counts or an explicit prerequisite/authority
blocker. These bounded results are not M3, M5, M6, or product completion claims.

## Integration and evidence boundary

METHOD_AWARE_ADAPTER_DIFF=0

CORE_PIN_DIFF=0

OLD_IMPLEMENTATION_BODY_DIFF=0

WAVE_1C_SCREENSHOT_COUNT=7

WAVE_1C_BROWSER_EVIDENCE_SCHEMA=acs.frontend-v3-wave-1c-browser-evidence.v1

MUTATION_REQUESTS_IN_BROWSER_GATE=0

The control-plane job runs the K2 base, Wave 1A, Wave 1B, and Wave 1C browser gates
serially against one Core fixture and one Next production server. The Wave 1C gate
tests three desktop pages, three server aliases, three mobile pages, the Script
unsaved-change Modal, request classification, focus restoration, and horizontal
overflow without issuing a product mutation.

## Current implementation boundary

FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS

FRONTEND_V3_REDESIGN_COMPLETE=false

M12_FRONTEND_EXECUTION=BLOCKED

M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE

No method-aware Adapter resource, browser-selected execution method, Provider/GPU
operation, M8 write, reviewed import, identity write, runtime execution, Master, or
publication capability is added by this wave.

## Next boundary

NEXT_TASK=ACS-FRONTEND-WAVE-2A-METHOD-AWARE-ADAPTER-AND-CONTRACTS

Wave 2A remains a separate authorization boundary and is not started by this record.
