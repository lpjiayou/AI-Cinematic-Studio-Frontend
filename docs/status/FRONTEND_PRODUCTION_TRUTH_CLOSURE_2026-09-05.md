# Frontend Production Truth Closure — 2026-09-05

Status: CURRENT

Document class: CURRENT_STATUS

## Scope and starting evidence

```text
TASK_ID=ACS-PRE-WAVE-1D-FRONTEND-PRODUCTION-TRUTH-CLOSURE
FRONTEND_START_MAIN=cdfcd120d05106177eda89ece3495a55852e52e4
FRONTEND_START_TREE=ac1068801226770e5a0c5b43f0da444c9b0948a3
CORE_BEHAVIOR_PIN=e21789d265c4e936b0e0b29921746a4c205889b8
CORE_BEHAVIOR_TREE=086f37ed4e5412d1d6608c4ee856ac75d61625e9
FRONTEND_PRODUCTION_TRUTH_CLOSURE=IMPLEMENTED_AND_VERIFIED
```

The starting remote contains only main, no open Frontend PR and no concurrent task
branch. Workspace State Integrity Closure and its branch cleanup are verified.
This task closes I2 and I3 in the existing Production/Post/Delivery component only.
The installed Next 16.3.0 Client Component guidance was read before implementation.

Five final-behavior tests first failed against the original production source: each
of SHOTS_COMPILED and ASSETS_READY exposed two legacy write buttons and issued its
legacy POST when clicked; the three legal stale projection cases were rejected with
state_projection_contract_mismatch. Production source was unchanged for that run.

## Legacy asset and media writes

```text
I2_REPRODUCTION_TEST=REPRODUCED_BEFORE_FIX
LEGACY_G4_G5_PRIMARY_WRITE_UI=REMOVED
LEGACY_ASSETS_PRIMARY_ACTION_COUNT=0
LEGACY_MEDIA_PRIMARY_ACTION_COUNT=0
LEGACY_ASSETS_PRODUCT_POST_CALLSITE_COUNT=0
LEGACY_MEDIA_PRODUCT_POST_CALLSITE_COUNT=0
LEGACY_G4_G5_READ_COMPATIBILITY_PRESERVED=true
LEGACY_G4_G5_EXACT_REPLAY_CORE_COMPATIBILITY_UNCHANGED=true
```

Production has no assets/media mutation branch, callback or disabled replacement.
The remaining execution function submits Preview only; Finalize retains its existing
explicit approval path. Core's historical exact-replay compatibility is unchanged
and is never initiated by this product UI.

AssetWorkspace permanently labels its content “历史兼容” and “只读”. Without an asset
plan it explains that the new asset/generation flow is not open, with a safe Project
Overview link to the Storyboard boundary. With a plan it displays “历史资产与媒体证据”,
preserving GET assets/media, manifest summaries, generation requests, asset references
and historical media jobs. The existing evidence details expose their recorded refs.
NextAction replaces asset parsing and media execution with the frozen blocked copy
and Overview anchors for Storyboard and Generation. No method-aware UI is connected.

The fixed Core sources audited are episode_production/assets.py, media.py and
state_projection.py, plus the public capability contract and state-projection tests.
They retain historical GET/exact replay while disabling new legacy assets/media writes.

## Closed stale contracts and action protection

```text
I3_REPRODUCTION_TEST=REPRODUCED_BEFORE_FIX
STATE_PROJECTION_STALE_COMPATIBILITY=PASS
ACTIVE_REVISION_STALE_BLOCKED_SUPPORTED=true
VISUAL_QC_STALE_SUPPORTED=true
VISUAL_QC_STALE_BLOCKED_SUPPORTED=true
UNKNOWN_STATE_REJECTION=PASS
STALE_INVARIANT_VALIDATION=PASS
LEGAL_STALE_REPORTED_AS_CONTRACT_MISMATCH=false
STALE_PRODUCTION_ACTIONS_BLOCKED=true
STALE_PREVIEW_ALLOWED=false
STALE_FINALIZE_ALLOWED=false
STALE_REFRESH_ALLOWED=true
```

The active-revision closed union adds STALE_BLOCKED with a nonempty revisionRef and
activationState=STALE. ACTIVE still requires a nonempty ref; NOT_RECORDED and
BLOCKED_AMBIGUOUS retain null refs. Visual QC adds only STALE and STALE_BLOCKED.
Optional mediaKind, candidateRefs and activationState follow the fixed public Core
projection. Unknown state values still fail validation.

The runtime parser preserves run/workspace binding, all four authority axes, candidate
counts and ref correspondence, expected-candidate count validity, immutable roots,
publicationAllowed=false, V4 isolation and AssetVersion authority. Present active
candidate refs must uniquely match the lifecycle. Core's expired-activation priority
requires active and QC STALE_BLOCKED together; QC STALE must come from a stale active
candidate. No generic string/any escape or method-aware contract widening is added.

| Public truth | User explanation |
| --- | --- |
| activeRevision STALE_BLOCKED | 素材版本已经变化，需要重新审查 |
| visualQcState STALE | 视觉质检基于旧候选 |
| visualQcState STALE_BLOCKED | 当前修订已过期，质检保持阻断 |

These states render a specific explanation and preserve refresh, historical evidence,
Preview playback, Delivery downloads and safe navigation. Historical QC cannot
authorize a new Preview or Finalize. Every production mutation handler also checks
current committed run/projection identity and action eligibility, so even a retained
handler captured before a refresh cannot submit after the new truth becomes stale.
Genuine run/projection or invariant conflict retains its separate conflict presentation.

## Verification and browser acceptance

```text
LOCAL_FOCUSED_TEST_COUNT=155
LOCAL_I2_REGRESSION_TESTS=PASS
LOCAL_I3_CONTRACT_TESTS=PASS
LOCAL_I3_UI_TESTS=PASS
LOCAL_PRODUCTION_WORKSPACE_REGRESSION=PASS
LOCAL_CHANGED_SOURCE_LINT=PASS
LOCAL_TYPECHECK=PASS
LOCAL_GATE_SYNTAX=PASS
LOCAL_DOC_GOVERNANCE=PASS
GIT_DIFF_CHECK=PASS
BUILD_SOURCE_MANIFEST_UNCHANGED=true
ORIGINAL_DEPENDENCY_LINK_UNCHANGED=true
LOCAL_PRODUCTION_BUILD_EXECUTED=true
LOCAL_PRODUCTION_BUILD=PASS
LOCAL_NPM_CI_COUNT=1
LOCAL_PRODUCTION_BUILD_COUNT=1
NEXT_VERSION=16.3.0
LOCAL_FULL_VITEST_EXECUTED=false
LOCAL_CHROMIUM_GATE_EXECUTED=false
WAVE_1C_SCREENSHOT_COUNT=7
WAVE_1C_OTHER_FINGERPRINTS_CHANGED=false
WAVE_1C_ASSERTIONS_CHANGED=false
WAVE_1C_SCREENSHOTS_CHANGED=false
WAVE_1C_NETWORK_ERROR_MUTATION_POLICY_CHANGED=false
```

The 155 focused tests comprise 116 browser-client tests, nine pure state/type tests
and 30 Production workspace regressions. They include both stale families, malformed
scopes/refs/counts/authorities, direct Preview handler invocation, a captured Finalize
handler after refresh, legacy write absence, read-only history and existing positive
Preview, approval and Delivery paths. Typecheck and changed-source lint pass.
All five document governance checks, three Gate syntax checks and the closed-path diff
check pass; the inventory contains 100 Markdown files and 102 registered documents.

The standard build passed once in a physical dependency mirror with one npm ci and
exact parity across all 438 source files, retaining the original node_modules link.
Only this status record and the migration status appendix were updated after the build
to record its success; all production, test and Gate files retain the built hashes.
Local Chromium
is not attempted because of the established PROCESS_SINGLETON_SOCKET_EPERM boundary.

The existing two K2 browser Gates now assert historical asset/media GET and visible
read-only evidence, no legacy buttons and zero legacy assets/media POST from entering
Production until leaving it. Existing positive Preview/Finalize, QC FAIL and Delivery
not-created assertions remain. No fixture preparation re-enables old writes. A new
stale browser fixture is not introduced; strict contract and component tests cover it.

The separately authorized Wave 1C edit synchronizes only the browser-client.ts and
contracts.ts SHA-256 values with verified source. The other 13 fingerprints, all Gate
assertions, seven screenshots and network/error/mutation policies remain byte-identical.
The sole PR-triggered CI run must pass verify, gate-c-k2-browser and
gate-k2-control-plane-browser before squash merge; the serial K2, Wave 1A, Wave 1B
and Wave 1C sequence remains. Exact head/tree/run/merge identifiers are reported from
that run rather than predicted here.

## Preserved boundaries and next sequence

```text
METHOD_AWARE_ADAPTER_PRESERVED=true
METHOD_AWARE_ADAPTER_DIFF=0
METHOD_AWARE_CONTRACT_DIFF=0
METHOD_AWARE_UI_CALLSITE_COUNT=0
METHOD_AWARE_UI=NOT_STARTED
CORE_DIFF=0
CORE_PIN_DIFF=0
EXPERIENCE_ADAPTER_DIFF=0
DEPENDENCY_DIFF=0
LOCKFILE_DIFF=0
NEXT_CONFIG_DIFF=0
WORKFLOW_DIFF=0
VISUAL_REDESIGN_DIFF=0
CSS_DIFF=0
FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS
FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6
FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10
FRONTEND_V3_REDESIGN_COMPLETE=false
M12_FRONTEND_EXECUTION=BLOCKED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
OLD_WAVE_1D_COMMAND=SUPERSEDED_NOT_EXECUTED
NEXT_TASK=ACS-CORE-PUBLIC-INPUT-AND-SCOPE-HARDENING
```

This bounded correction completes no new canonical screen, route, M10/M11 product
surface, media runtime or visual redesign. Script, Story, Character, GlobalRail and
the completed Wave 2A transport are unchanged. Core public input/scope hardening is
the next separate task, followed by rewritten Wave 1D and Wave 2B. This task stops
after its PR merge and branch cleanup and starts none of those tasks.
