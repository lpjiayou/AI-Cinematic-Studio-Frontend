# Frontend V3 Wave 2A Acceptance — 2026-09-05

Status: CURRENT

Document class: CURRENT_STATUS

## Bounded implementation

```text
TASK_ID=ACS-FRONTEND-WAVE-2A-METHOD-AWARE-ADAPTER-AND-CONTRACTS
FRONTEND_START_MAIN=b2756cae2134e3507dc1a9acc89af6c5431510c0
FRONTEND_START_TREE=3592d0712a3eb4d143f6a07d574880899b8e6160
CORE_BEHAVIOR_PIN=e21789d265c4e936b0e0b29921746a4c205889b8
CORE_BEHAVIOR_TREE=086f37ed4e5412d1d6608c4ee856ac75d61625e9
FRONTEND_V3_WAVE_2A=IMPLEMENTED_AND_VERIFIED
METHOD_AWARE_ADAPTER=IMPLEMENTED_AND_VERIFIED
METHOD_AWARE_TYPED_CONTRACTS=IMPLEMENTED_AND_VERIFIED
METHOD_AWARE_RUNTIME_VALIDATION=IMPLEMENTED_AND_VERIFIED
METHOD_AWARE_ADAPTER_RESOURCE_COUNT=4
METHOD_AWARE_ADAPTER_RESOURCES=execution-method-plan,method-aware-input-plan,method-aware-video-route,explicit-audio-requirement-route
METHOD_AWARE_ALLOWED_METHODS=GET,POST
METHOD_AWARE_TYPED_CLIENT_OPERATION_COUNT=8
METHOD_AWARE_RUNTIME_VALIDATOR_COUNT=4
METHOD_AWARE_UI_CALLSITE_COUNT=0
METHOD_AWARE_UI=NOT_STARTED
```

The existing server-only Adapter now allowlists only these four additional run
subresources. Each has a GET and POST typed operation and one complete response
parser. Unknown resources and unsupported methods retain `404 / not_found`.
Malformed method-aware query/body fields are rejected before Core is contacted.
Successful method-aware responses are parsed on both sides of the Adapter boundary;
malformed or private data fails with `502 / invalid_method_aware_response`.
Core product status/error codes, no-store, request-size limits and server credentials
retain their existing behavior. There are no product callsites for these operations.

## Pinned contract audit and authorized revisions

The audit read `public_contract.py`, the Creator HTTP server, the public boundary,
the execution planning, method-aware media and explicit audio bridge implementations,
their two contract suites, the cutover HTTP and generic upstream integration suites,
and the public HTTP contract at the exact behavior pin. Audio request details also
follow `audio_authority.py` and the bridge's normalized speech parameter construction.

Three bounded revisions were explicitly authorized during this task:

1. Synchronize only the Adapter SHA-256 entry in the existing Wave 1C gate. Its other
   protected hashes, assertions, screenshots and workflow remain unchanged. The
   gate's `methodAwareAdapterDiff=0` now means no drift from this reviewed Adapter
   baseline; it does not mean Wave 2A added zero resources.
2. Require `audioIntent.sourceSpan` for DIALOGUE and NARRATION, with a matching
   `sourceField`; other audio intents retain precisely their three original fields.
3. Require `postprocessRequirementKey` on DETERMINISTIC_EVENT source beats and their
   responses. Other execution classes reject that field. The postprocess requirement
   must bind the same key and beat. The pin emits empty mask/resource/static key arrays.

| Resource | Success schema | Public request boundary |
| --- | --- | --- |
| execution-method-plan | v5.execution-method-plan.v2 | Current validation ref, complete source-bound shots and the authorized conditional fields |
| method-aware-input-plan | v5.method-aware-input-plan.v1 | Reference-only asset bindings; Core resolves plan and asset digests |
| method-aware-video-route | v5.video-method-route-plan.v1 | Scope and idempotency key only; Core resolves the current input plan |
| explicit-audio-requirement-route | v5.m9-m12-audio-requirement-route.v1 | Audio requirement ref and, when needed, opaque rights/voice refs |

GET forwards `projectRef`, `seriesRef`, `episodeRef`, and optional `versionRef`.
The Adapter first strips the four browser scope claims as required by task section
14.1, then rejects unknown, duplicate or empty query fields. The run ref comes only
from the encoded path; authenticated Core supplies the workspace. POST similarly
strips browser workspace/run/tenant/profile fields before the closed body validation.

Audio public DTOs use closed unions for dialogue, narration, SFX and ambience requests,
including exact speech source binding and optional clone lineage. Rights bodies,
requested provenance and voice snapshots are stripped by Core and forbidden recursively
by the parsers. SILENCE and MUSIC have null requests and null cue bindings. Speech
parameters reflect the bridge's exact output; the bridge does not emit an emotion tag.

Parsers validate exact keys, schemas, reference/digest formats, enum values, linkage,
counts, timing and immutable false flags. They do not regenerate authority digests or
independently establish currentness against Core's evidence journal. The test fixtures
are synthetic public contract examples, not runtime evidence or a product fallback.

## Preserved boundaries

```text
BROWSER_CAN_SELECT_EXECUTION_METHOD=false
BROWSER_CAN_SELECT_PROVIDER=false
BROWSER_CAN_SUPPLY_ASSET_DIGEST=false
BROWSER_CAN_SUPPLY_AUTHORITY_DIGEST=false
CONTACT_TO_MICRO_FALLBACK_ALLOWED=false
GAIT_TO_MICRO_FALLBACK_ALLOWED=false
DETERMINISTIC_EVENT_TO_WAN_ALLOWED=false
LEGACY_G4_G5_READ_COMPATIBILITY_PRESERVED=true
LEGACY_G4_G5_NEW_WRITE_UI_ALLOWED=false
CORE_DIFF=0
CORE_PIN_DIFF=0
SRC_APP_DIFF=0
CREATOR_V3_PAGE_DIFF=0
CREATOR_V3_WORKSPACE_DIFF=0
COMPONENT_DIFF=0
LAYOUT_DIFF=0
CSS_DIFF=0
NAVIGATION_DIFF=0
CANONICAL_ROUTE_DIFF=0
CANONICAL_SCREEN_DIFF=0
DEPENDENCY_DIFF=0
LOCKFILE_DIFF=0
NEXT_CONFIG_DIFF=0
WORKFLOW_DIFF=0
FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6
FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10
FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS
FRONTEND_V3_REDESIGN_COMPLETE=false
M12_FRONTEND_EXECUTION=BLOCKED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
```

The fixed mapping is STATIC_HOLD to STATIC_PLATE_OR_REUSE, MICRO_MOTION to
SINGLE_ANCHOR_I2V, CONTACT_ACTION to CONTACT_CONDITIONED_VIDEO, GAIT_LOCOMOTION to
POSE_OR_TRAJECTORY_CONDITIONED_VIDEO, and DETERMINISTIC_EVENT to
V3_DETERMINISTIC_COMPOSITION. Contact/Gait stay capability-unavailable, deterministic
events stay at M13, and every fallback flag stays false. A queued video request is
not executed media; an audio request does not install or authorize M12 runtime.

## Verification and merge gate

```text
LOCAL_METHOD_AWARE_FOCUSED_TEST_COUNT=2676
LOCAL_CORE_INTEGRATION_REGRESSION_TEST_COUNT=44
LOCAL_METHOD_AWARE_ADAPTER_TESTS=PASS
LOCAL_METHOD_AWARE_CONTRACT_TESTS=PASS
LOCAL_METHOD_AWARE_VALIDATOR_TESTS=PASS
LOCAL_METHOD_AWARE_CLIENT_TESTS=PASS
LOCAL_CORE_INTEGRATION_REGRESSION=PASS
LOCAL_CHANGED_SOURCE_LINT=PASS
LOCAL_TYPECHECK=PASS
LOCAL_PRODUCTION_BUILD=PASS
LOCAL_PRODUCTION_BUILD_RUN_COUNT=1
NPM_CI_RUN_COUNT=1
NEXT_VERSION=16.3.0
BUILD_SOURCE_MANIFEST_UNCHANGED=true
ORIGINAL_DEPENDENCY_SYMLINK_UNCHANGED=true
LOCAL_DOC_GOVERNANCE=PASS
GIT_DIFF_CHECK=PASS
LOCAL_FULL_VITEST_EXECUTED=false
LOCAL_CHROMIUM_GATE_EXECUTED=false
WAVE_2A_NEW_BROWSER_SCREENSHOT_COUNT=0
WAVE_2A_NEW_VISUAL_GATE=false
```

Only the authorized focused suites and existing client/provider regressions run
locally. Build uses an isolated local clone with identical source manifests and one
physical dependency installation, preserving the original dependency symlink.
Documentation governance and diff checks are required before submission.

Acceptance and merge require one PR-triggered CI run for the final head/tree and all
three required checks: `verify`, `gate-c-k2-browser`, and
`gate-k2-control-plane-browser`. Existing K2 and Wave 1A/1B/1C gates remain serial;
the seven Wave 1C screenshots and its zero-mutation/error result remain required.
CI and merge receipts are reported against the final PR rather than embedded as
guessed future commit IDs in this record. This wave adds no live Core POST, Provider,
GPU, runtime installation, canonical page, Master or publication evidence.

## Next boundary

```text
NEXT_TASK=ACS-FRONTEND-WAVE-2B-STORYBOARD-AND-METHOD-PLAN-READ-ONLY
```

Wave 2B is not started by this record. Storyboard, Generation Studio, Audio Studio,
Timeline Studio and complete M8–M12 product execution remain outside Wave 2A.
