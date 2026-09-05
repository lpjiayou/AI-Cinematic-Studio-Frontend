# Frontend Workspace State Integrity Closure — 2026-09-05

Status: CURRENT

Document class: CURRENT_STATUS

## Scope and starting evidence

```text
TASK_ID=ACS-PRE-WAVE-1D-FRONTEND-WORKSPACE-STATE-INTEGRITY-CLOSURE
GATE_CLARIFICATION=ACS-PRE-WAVE-1D-FRONTEND-WORKSPACE-STATE-INTEGRITY-CLOSURE-GATE-CLARIFICATION
FRONTEND_START_MAIN=f1d56a0eee39990ac66beeb98ee1e0fb49c5ad6b
FRONTEND_START_TREE=7f9573a7180b4491130a8fedc15a46ced1b4213b
CORE_BEHAVIOR_PIN=e21789d265c4e936b0e0b29921746a4c205889b8
CORE_BEHAVIOR_TREE=086f37ed4e5412d1d6608c4ee856ac75d61625e9
FRONTEND_WORKSPACE_STATE_INTEGRITY=IMPLEMENTED_AND_VERIFIED
```

The starting remote has only main and no open Frontend PR. Wave 2A branch cleanup
is verified. This task preserves its four Adapter resources, eight typed operations,
four response parsers and zero UI callsites. Next 16.3.0's installed documentation for
App Router navigation, Link, useRouter, native history and Client Component boundaries
was read before implementation. No dependency, Core contract or route is changed.

Three repository regression tests first failed against the original production code:

- F1 submitted B, continued typing C, then received B from the save read; the old
  editor displayed B and lost C.
- F2 clicked the desktop Job Center while dirty; the old Shell called
  `router.push("/creator/jobs")` before any unsaved-change decision.
- F4 generated a candidate in project A, then rerendered the same hook for B; the old
  candidate remained. Final tests assert only the corrected safe behavior.

## Script save integrity

```text
F1_REPRODUCTION_TEST=REPRODUCED_BEFORE_FIX
F1_SCRIPT_SAVE_OVERWRITE=CLOSED
SCRIPT_SAVE_DRAFT_BASELINE_SEPARATION=PASS
SCRIPT_POST_SAVE_TYPING_PRESERVED=PASS
SCRIPT_SAVE_FAILURE_DRAFT_PRESERVED=PASS
SCRIPT_STALE_READ_REJECTED=PASS
```

Current draft, saved baseline and submitted snapshot are separate. Dirtiness compares
normalized draft and baseline. Every edit increments a local draft revision; a save
captures the exact snapshot, workspace scope, base ScriptVersion and edit revision.
The textarea remains editable through the POST and its GET verification.

The public mutation type makes ScriptVersion optional, so success is followed by an
explicit GET for the saved Series/Episode. The read must verify the submitted synopsis
and Script identity before updating the baseline. If no newer edit exists, the draft
synchronizes with the saved version; otherwise the new draft is retained and the user
is told that further unsaved changes remain. A failed POST or unverifiable read keeps
the draft and baseline, leaves the error visible and cannot continue navigation.
Discard restores the saved baseline. Confirmation requires a clean draft, matching
scope/version and no active save; stale captured callbacks cannot submit.

Project, Series, Episode and independently changed ScriptVersion reads initialize a
new editor baseline. A save's own returned version is reconciled using its snapshot
rather than treated as an unrelated scope switch. Old reads/mutations are aborted and
also rejected by local request identity. Same-version refreshes preserve local typing.
These local scope identities are never sent to Core as authority fields.

## Unified navigation and focus

```text
F2_REPRODUCTION_TEST=REPRODUCED_BEFORE_FIX
F2_UNSAVED_NAVIGATION_BYPASS=CLOSED
SCRIPT_UNIFIED_NAVIGATION_GUARD=PASS
SCRIPT_JOB_CENTER_GUARD=PASS
UNIFIED_NAVIGATION_REQUEST_ENTRY=requestWorkspaceNavigation
MOBILE_GATE_ASSERTION_CONFLICT_RESOLVED=true
PROJECT_NAVIGATION_DRAWER_OPEN_POLICY=NO_UNSAVED_PROMPT
PROJECT_NAVIGATION_ROUTE_LINK_POLICY=UNSAVED_PROMPT_WHEN_DIRTY
STAY_ACTION_FOCUS_POLICY=RETURN_TO_CLICKED_ROUTE_LINK
DRAWER_CLOSE_FOCUS_POLICY=RETURN_TO_DRAWER_TRIGGER
OTHER_GATE_ASSERTIONS_CHANGED=false
SCREENSHOT_COUNT_CHANGED=false
MUTATION_POLICY_CHANGED=false
```

Project/global route links, desktop and mobile Job Center, both Episode selectors,
and browser back use one Script-owned decision entry. The Shell delegates its two
Job Center actions with href and triggering element; other workspaces retain their
existing router behavior when no callback is supplied. The Shell owns no dirty/save
semantics. Actions are identified by typed navigation intent and actual href, never
by visible button labels.

Opening navigation, task, Inspector or Evidence drawers, expanding JobShelf, changing
theme/view and same-page anchors do not request departure. Staying retains the open
Drawer and returns focus to the clicked route link. Closing that Drawer independently
returns focus to its original button. Modal Escape cannot dismiss the underlying
Drawer. Focus restoration waits for the retained Drawer's own lifecycle commit.

Save-and-continue waits for the scoped POST/read and a clean resulting draft; a new
unsaved edit or failed save prevents departure. Discard restores the saved baseline
before executing the intent. beforeunload protection remains. A single same-page
history sentinel restores the page before requesting a decision; only its base entry
is intercepted. Approved back disarms the listener before traversing the sentinel and
base, so later pop events cannot recurse. Hash-only history changes do not prompt.

## Story frontend scope isolation

```text
F4_FRONTEND_REPRODUCTION_TEST=REPRODUCED_BEFORE_FIX
STORY_FRONTEND_SCOPE_ISOLATION=PASS
STORY_STALE_ASYNC_RESPONSE_REJECTION=PASS
STORY_SCOPE_KEY=projectRef,seriesRef
STORY_CROSS_PROJECT_CONFIRM_REQUEST_COUNT=0
F4_FRONTEND_VECTOR_CLOSED=true
F4_CORE_CANDIDATE_SOURCE_BINDING_COMPLETE=false
```

Creative input, candidate, operation, errors and messages reset when project or the
resolved unique Series changes. The hook itself is safe under same-component prop
changes. Project/planning/intelligence reads, refreshes, generation and confirmation
use AbortController plus lifetime/read/scope generations. A late result cannot update
another scope, clear its error or finish its newer operation. Unmount aborts work.

The candidate's local wrapper contains sourceProjectRef, sourceSeriesRef,
sourceInputRevision, requestGeneration and candidatePayload. Confirmation checks the
current scope and generation before any POST. Editing creative input invalidates its
candidate. A same-scope refresh preserves valid input and candidates. Only the existing
public candidate payload is sent to Core; the wrapper is not added to its contract.
This closes the frontend contamination vector, not malicious-client request forgery
or Core candidate-source binding. Those require a separate Core task.

## Verification and browser acceptance

```text
LOCAL_FOCUSED_TEST_COUNT=101
LOCAL_F1_REGRESSION_TESTS=PASS
LOCAL_F2_REGRESSION_TESTS=PASS
LOCAL_F4_FRONTEND_REGRESSION_TESTS=PASS
LOCAL_WAVE_1C_REGRESSION=PASS
LOCAL_PRODUCTION_BUILD_EXECUTED=true
LOCAL_PRODUCTION_BUILD=PASS
LOCAL_NPM_CI_COUNT=1
LOCAL_PRODUCTION_BUILD_COUNT=1
NEXT_VERSION=16.3.0
BUILD_SOURCE_MANIFEST_UNCHANGED=true
ORIGINAL_DEPENDENCY_LINK_UNCHANGED=true
LOCAL_FULL_VITEST_EXECUTED=false
LOCAL_CHROMIUM_GATE_EXECUTED=false
WAVE_1C_SCREENSHOT_COUNT=7
```

The 101 focused tests cover the Script hook, Studio, navigation and pure state/history
helpers; Story hook and workspace; Project Shell; unique Series scope; and Character
regressions. Typecheck, changed-source lint, gate syntax, document governance and
closed-path diff verification are mandatory before submission. The standard production
build passed once in an independent local clone with source-manifest parity and one
physical npm ci installation, preserving the original node_modules symlink. The only
post-build changes record this successful build in the three status-bearing documents;
production, test and Gate source remain identical to the built manifest.

The sole PR-triggered CI run must pass verify, gate-c-k2-browser and
gate-k2-control-plane-browser before squash merge. The existing serial K2 → Wave 1A
→ Wave 1B → Wave 1C gates remain. Local Chromium is not attempted.

Wave 1C adds a desktop Job Center block/stay/focus/draft check. Its authorized mobile
revision opens the Project Drawer without prompting, clicks the actual Overview link,
checks the unsaved Modal and preserved URL/draft, then verifies route-link focus after
staying and Drawer-button focus after closing. Existing screenshot names/count, other
pages, geometry, RSC classification and zero mutation/network/error policies remain.
The result includes scriptJobCenterUnsavedGuard and scriptMobileProjectNavigationGuard.
Exact CI/head/tree/merge evidence is reported against the final PR, without predicting
future commit identifiers in this file.

## Preserved boundaries and next sequence

```text
CORE_DIFF=0
CORE_PIN_DIFF=0
EXPERIENCE_ADAPTER_DIFF=0
METHOD_AWARE_CONTRACT_DIFF=0
METHOD_AWARE_UI_CALLSITE_COUNT=0
SRC_APP_ROUTE_DIFF=0
DEPENDENCY_DIFF=0
LOCKFILE_DIFF=0
NEXT_CONFIG_DIFF=0
WORKFLOW_DIFF=0
CSS_DIFF=0
VISUAL_REDESIGN_DIFF=0
VISUAL_LAYOUT_DIFF=0
FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS
FRONTEND_V3_REDESIGN_COMPLETE=false
FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6
FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10
M12_FRONTEND_EXECUTION=BLOCKED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
A100_START_AUTHORIZED=false
OLD_WAVE_1D_COMMAND=SUPERSEDED_NOT_EXECUTED
OLD_WAVE_1D_COMMAND_STATUS=SUPERSEDED_NOT_AUTHORIZED_FOR_EXECUTION
NEXT_TASK=ACS-PRE-WAVE-1D-FRONTEND-PRODUCTION-TRUTH-CLOSURE
```

The next authorized sequence is Workspace State Integrity Closure, then a separately
authorized Production Truth Closure, then rewritten Wave 1D, then Wave 2B. The old
Wave 1D command is superseded and has not been executed. No stored acceptance document
is reclassified as superseded merely because its historical next-task pointer changed.
This task starts none of those subsequent tasks and makes no Core scope-binding,
visual redesign, runtime, media-generation or product-completion claim.
