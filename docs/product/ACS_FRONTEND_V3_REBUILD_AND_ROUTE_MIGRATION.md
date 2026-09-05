# ACS Frontend V3 Rebuild and Route Migration

Status: ACCEPTED

Document class: ACCEPTED_DECISION

Decision date: 2026-09-04

Implementation authority: NONE

## Rebuild decision

FRONTEND_V3_PAGE_REBUILD_MODE=PARALLEL_NEW_COMPONENT_TREE_AND_ATOMIC_ROUTE_CUTOVER

PAGE_LEVEL_IN_PLACE_PATCHING_ALLOWED=false

PARALLEL_REBUILD_REQUIRED=true

ATOMIC_ROUTE_CUTOVER_REQUIRED=true

A page that requires redesign is built as a separate V3 component tree. The old page
DOM, omnibus component, and page CSS are not the visual starting point. The old
canonical page stays unchanged until the replacement passes its screen-specific
acceptance. The canonical route then moves in one atomic, independently reversible
cutover. Core data and historical facts are never rolled back or rewritten.

This decision supersedes the primary-workspace target authority of
governance/PRODUCTION_WORKSPACE_USABILITY_AND_LAYOUT_CONTRACT.md. That document remains
historical; its verified evidence does not authorize an in-place V3 extension.

## Separation and reuse

A later implementation may use namespaces such as:

- src/features/creator-v3/
- src/components/production/
- src/layouts/v3/

Wave 1A may align the exact paths with repository conventions, but the V3 page tree
must remain visibly separate from the legacy page body.

Allowed reuse is limited to:

- the server-only Experience Adapter and safe browser request logic;
- TypeScript contract portions that still match the accepted public contract;
- semantic design tokens and themes;
- ACSButton, ACSCard, ACSBadge, ACSModal, and ACSDrawer;
- WorkspaceLayout and EditorLayout geometry;
- Modal/Drawer focus management;
- verified Script, Story, and Character data-operation logic.

The following may not become a V3 page’s visual body:

- ConnectedProductionWorkspace;
- the legacy production omnibus inspector;
- legacy assets/media mutation controls;
- machine-state-first page structure;
- stacked horizontal navigation layers;
- long marketing-page layouts.

No large condition tree may progressively turn a legacy page into V3. Before cutover,
the legacy page and V3 replacement may not both mutate the same user operation.

## Canonical route migration

This document freezes migration only; it changes no route.

| Current route | Pre-cutover treatment | Atomic cutover | Post-cutover treatment |
| --- | --- | --- | --- |
| /creator/projects/[projectRef]/planning/bible | Remains available until Story V3 passes | Wave 1C Story acceptance | Redirect to /creator/projects/[projectRef]/story |
| /creator/projects/[projectRef]/planning/characters | Remains available until Characters V3 passes | Wave 1C Characters acceptance | Redirect to /creator/projects/[projectRef]/characters |
| /creator/projects/[projectRef]/content/script | Remains available until Script V3 passes | Wave 1C Script acceptance | Redirect to /creator/projects/[projectRef]/script |
| /creator/projects/[projectRef]/production | Historical compatibility control plane only | Wave 2C Generation acceptance | Redirect to /creator/projects/[projectRef]/generation |
| /creator/projects/[projectRef]/post | Remains available until Review V3 passes | Wave 6A Review acceptance | Redirect to /creator/projects/[projectRef]/review |
| /creator/projects/[projectRef]/delivery | Remains canonical | Wave 6B page-body acceptance | Canonical route retained with atomically rebuilt body |
| /creator/ai-director | Contextual-assistance compatibility route | Only after a separately accepted assistance migration | Remains reachable until Home/Overview/workbench migration passes |

When /production cuts over, historical G4/G5 reads move to
/creator/projects/[projectRef]/history/legacy-production. The old route cannot remain
a second writable primary entry.

## Legacy production boundary

LEGACY_G4_G5_READ_COMPATIBILITY_PRESERVED=true

LEGACY_G4_G5_NEW_WRITE_UI_ALLOWED=false

The compatibility view may read historical G4/G5 state and support exact replay only
where the public contract already authorizes it. It may not restore legacy assets or
media writes, rewrite history, present a successor run as legacy-writable, or become a
fallback after a method-aware failure. The V3 Generation route is the only future
primary write surface for the successor path.

## Atomic cutover procedure

Each page cutover is a separate, authorized code PR and follows this order:

1. establish the new V3 component tree and closed-world view models;
2. keep the legacy page behavior unchanged while V3 tests run;
3. pass focused unit/contract tests and the page’s 1920, 1440, 390, keyboard, focus,
   disconnected, stale, conflict, authority, and policy acceptance;
4. prove every enabled control has a real Experience Adapter handler;
5. prove old and new pages do not both write the same operation;
6. switch the canonical route once;
7. retain the accepted redirect or history route;
8. keep a route-level rollback that restores the old presentation without changing
   Core data or replaying mutations;
9. remove legacy presentation code only after the deletion conditions pass.

## Rollback

Rollback is presentation- and route-scoped. It may restore the previous route target
or hide the V3 route while preserving all server objects and facts created through
authorized public commands. It must not:

- re-enable a frozen legacy write;
- move a Candidate backward in lifecycle;
- delete or rewrite Job, AssetVersion, Timeline, approval, or Delivery history;
- replace a failed Core response with LOCAL_FIXTURE;
- roll back Core, schema, runtime, or authority state.

## Legacy deletion conditions

A legacy page body may be deleted only when all of the following are true:

- its V3 canonical screen contract is accepted by its assigned wave;
- required desktop/tablet/exact-390 and keyboard/focus browser gates pass;
- old URL redirect or named history route passes;
- every retained read/replay use case is reachable;
- no second writable primary entry exists;
- production data and history require no migration rewrite;
- rollback no longer depends on the deleted body, or an independently verified
  rollback replacement exists;
- the same PR updates the applicable Frontend authority documents.

ConnectedProductionWorkspace may not receive successor features while awaiting these
conditions.

## Directly usable UI definition

DIRECTLY_USABLE_UI_DEFINITION=FROZEN

### A. Navigation is usable

Every clickable entry has a real route. There are no dead links or clicks without a
result. Unimplemented capability opens an explicit EmptyProductState or
CapabilityBlocker.

### B. Operations are usable

Every enabled button has a real handler through the Experience Adapter and persistent
success, failure, stale, conflict, and disconnected outcomes. An operation without
Backend, Runtime, or Authority is disabled. A toast does not replace durable failure
state.

### C. Data is real

Connected mode contains no hard-coded Project, Candidate, Asset, or Job. LOCAL_FIXTURE
is explicitly selected and labeled and never replaces a Core error. The browser does
not generate refs, digests, or authority.

### D. Product state is true

Candidate differs from Selected; Selected differs from Admitted; Admitted differs
from TimelineCandidate; PreviewCandidate differs from Master; Master differs from
Published Work; blocked differs from success; local evidence differs from production
completion.

### E. Browser use is accepted

Every applicable screen passes 1920×1080, 1440×900, and 390×844 acceptance, keyboard
navigation, drawer focus restoration, no horizontal overflow, no application console
error, no unhandled request error, and no unreachable primary action.

### F. Final completion is global

No single page, Wave 1, or Wave 2 may declare the redesign complete. Only all 16
canonical screens meeting their then-authorized boundaries plus Wave 7B E2E may set
FRONTEND_V3_REDESIGN_COMPLETE=true.

## Frozen implementation sequence

Wave numbers and letters define serial merge order, not present authority.

| Wave | Single responsibility | Gate / stop boundary |
| --- | --- | --- |
| Wave 0 | This docs-only IA, screen, design-system, migration, acceptance, and wave freeze | No source, route, adapter, runtime, or Core change |
| Wave 1A | V3 Shell, GlobalRail, ProjectContextBar, ProjectNavigatorV3, AuthorityStatus, CapabilityBlocker, EvidenceDisclosure, EmptyProductState, JobShelf | Presentation-only contracts; no domain or navigation ownership |
| Wave 1B | Six global routes, Project Overview, target project navigation, and honest blocked routes | Every clickable entry resolves; no fake executable capability |
| Wave 1C | Story, Script, and Character new V3 trees and canonical routes | Correct data logic may be reused; old page body may not; old URLs redirect only after acceptance |
| Wave 2A | Four method-aware Adapter and TypeScript contract connections | Closed-world DTO/allowlist; browser cannot select method/Provider |
| Wave 2B | Storyboard Workspace | Server method plan read-only; stale/foreign/conflict fail closed |
| Wave 2C | Generation Studio, candidate compare/select/admit, and history entry | No legacy new write, fallback, or unconditional video/audio request |
| Wave 3A | Audio requirement read and blocked-first Audio Studio | SILENCE explicit; no runtime execution control |
| Wave 3B | Audio execution controls | Starts only after M12 Runtime G0 and separate authorization |
| Wave 4A | Timeline/version/effects/RenderCandidate adapter | M13 authority required; public contracts closed-world |
| Wave 4B | Timeline Studio editing objects | Admitted assets only; version/currentness enforced |
| Wave 4C | PreviewCandidate/RenderCandidate review handoff | Candidate is never Master |
| Wave 5A | Asset Library | Rights/lineage/lifecycle exact; no silent admission |
| Wave 5B | Job Center, GenerationHistory, and usable Quick Create capability | Sanctioned Job resources only; shared object lifecycle |
| Wave 6A | Review / QC | QC FAIL remains FAIL; M14 approval separately authorized |
| Wave 6B | Global Works and Project Delivery | No Preview/Restricted Export/Master/Published conflation |
| Wave 7A | Mobile, keyboard, accessibility, and responsive closure | Exact 390, focus restoration, reduced motion, no overflow |
| Wave 7B | Cross-repository E2E, performance, visual baseline, and old-primary-page retirement | All 16 screens pass before completion |

Every later code PR is single-purpose, uses the new tree, renders real data or an
honest blocker, runs focused tests and one CI tree, includes a real Chromium gate, is
independently reversible, and updates same-scope Frontend documentation.

## Stop conditions

A wave stops before merge if it requires browser-selected executionMethod/Provider,
direct Core access, a legacy new write, a second writable primary route, fake
connected data, hidden failure, authority inference, unauthorized M12/M13 execution,
or Core/history rewrite.

## Current decision boundary

FRONTEND_V3_WAVE_1A=IMPLEMENTED_AND_VERIFIED

FRONTEND_V3_WAVE_1B=IMPLEMENTED_AND_VERIFIED

FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS

FRONTEND_V3_REDESIGN_COMPLETE=false

FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=3

GLOBAL_NAVIGATION_V3=ACTIVE_ON_V3_ROUTES

PROJECT_NAVIGATION_MODE=TRANSITIONAL_MIGRATION_MAP

CURRENT_PRODUCTION_WORKSPACE_DISPOSITION=RETAIN_AS_LEGACY_READ_COMPATIBILITY

CURRENT_PRODUCTION_WORKSPACE_DISPOSITION=REBUILD_PRIMARY_METHOD_AWARE_WORKSPACE

NEXT_TASK=ACS-FRONTEND-WAVE-1C-STORY-SCRIPT-CHARACTER-V3-PAGE-REBUILD

Wave 1B cuts over Creator Home and Project Center, adds Project Overview, and makes
four blocked global destinations reachable without claiming their business capability
is complete. This document does not start Wave 1C.

## Wave 1C implementation status — 2026-09-05

This status appendix records implementation against the accepted migration policy; it
does not alter the target IA or authorize the next wave.

FRONTEND_V3_WAVE_1C=IMPLEMENTED_AND_VERIFIED

FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6

FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10

WAVE_1C_CANONICAL_ROUTES=/creator/projects/[projectRef]/story,/creator/projects/[projectRef]/script,/creator/projects/[projectRef]/characters

WAVE_1C_LEGACY_REDIRECTS=/planning/bible→/story,/content/script→/script,/planning/characters→/characters

METHOD_AWARE_ADAPTER_DIFF=0

CORE_PIN_DIFF=0

FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS

FRONTEND_V3_REDESIGN_COMPLETE=false

NEXT_TASK=ACS-FRONTEND-WAVE-2A-METHOD-AWARE-ADAPTER-AND-CONTRACTS

## Wave 2A implementation status — 2026-09-05

The [Wave 2A record](../status/FRONTEND_V3_WAVE_2A_ACCEPTANCE_2026-09-05.md)
adds four method-aware Adapter resources, eight typed operations and four response
parsers. The authorized request corrections preserve speech source spans and the
deterministic event's postprocess requirement key at the exact Core pin. Only the
Adapter hash in the existing Wave 1C gate is synchronized; all other assertions and
protected hashes remain intact. Prior wave counts above describe those wave snapshots.

```text
FRONTEND_V3_WAVE_2A=IMPLEMENTED_AND_VERIFIED
METHOD_AWARE_ADAPTER_RESOURCE_COUNT=4
METHOD_AWARE_TYPED_CLIENT_OPERATION_COUNT=8
METHOD_AWARE_RUNTIME_VALIDATOR_COUNT=4
METHOD_AWARE_UI_CALLSITE_COUNT=0
METHOD_AWARE_UI=NOT_STARTED
FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6
FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10
FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS
FRONTEND_V3_REDESIGN_COMPLETE=false
M12_FRONTEND_EXECUTION=BLOCKED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
NEXT_TASK=ACS-FRONTEND-WAVE-2B-STORYBOARD-AND-METHOD-PLAN-READ-ONLY
```

This wave changes no page, navigation or canonical route. Method-aware UI, M12 runtime
and M13 product surfaces remain separate authorization boundaries. Wave 2B is not started.
