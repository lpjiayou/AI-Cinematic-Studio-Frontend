# ACS Frontend V3 Screen Contract

Status: ACCEPTED

Document class: ACCEPTED_DECISION

Decision date: 2026-09-04

Implementation authority: NONE

## Contract boundary

This document freezes 16 canonical product screens. It is target authority for page
responsibility, layout, state, operations, responsive behavior, migration, and
acceptance; it is not evidence that any V3 page has been implemented. Every operation
remains Browser → Frontend Experience Adapter → Creator Public HTTP/API v1 → Core.
“Future” write descriptions define a gated contract and grant no execution authority.

CANONICAL_SCREEN_CONTRACT_COUNT=16

AUDIT_WIREFRAME_SCREEN_COUNT=14

G0_LOW_FIDELITY_INPUT=NOT_FINAL_SCREEN_AUTHORITY

Every screen below contains the same 28 required fields. No field is delegated to an
unspecified implementation choice.

## Audit input revision

The 14-screen low-fidelity input remains historical evidence. The accepted contract
adds a standalone Story Workspace and splits its combined Works & Delivery concept
into Global Works and Project Delivery. Quick Create is reordered into the global
screen group; no audited capability is silently dropped.

STORY_WORKSPACE_ADDED=true

GLOBAL_WORKS_PROJECT_DELIVERY_SPLIT=true

| G0 input | Accepted V3 screen |
| --- | --- |
| Creator Home | 01 Creator Home |
| Project Center | 02 Project Center |
| Quick Create | 03 Quick Create |
| Asset Library | 04 Asset Library |
| Job Center | 05 Job Center |
| Works & Delivery | 06 Global Works and 16 Project Delivery |
| Project Overview | 07 Project Overview |
| No standalone screen | 08 Story Workspace |
| Script Studio | 09 Script Studio |
| Character Studio | 10 Character Studio |
| Storyboard Workspace | 11 Storyboard Workspace |
| Generation Studio | 12 Generation Studio |
| Audio Studio | 13 Audio Studio |
| Timeline Studio | 14 Timeline Studio |
| Review / QC | 15 Review / QC |

## Shared screen rules

At 1440 px and above the shell uses the existing 72 px global rail, 220 px project
navigator where applicable, flexible min-width-zero canvas, 360 px inspector, and
48 px collapsed job shelf. At 1152–1439 px the inspector is on demand and it cannot
cover the canvas together with the navigator. At 768–1151 px navigator and inspector
are named overlays and jobs use a bottom drawer. At 767 px and below, exact acceptance
width 390 px, one canvas and a 56 px context bar remain; at most one full-screen drawer
is open and focus returns to its trigger.

All enabled actions have real handlers through the Experience Adapter. Loading, empty,
disconnected, authentication, authority-blocked, policy-blocked, stale, conflict, and
error are distinct states. Raw refs/digests/Provider/queue/worker/stack details are
hidden behind evidence disclosure. Unknown values fail closed.

## 01 Creator Home

- **route:** /creator
- **purpose:** Resume recent work, choose Project Production or Quick Create, and expose cross-project blockers without claiming unavailable capability.
- **primaryAction:** Continue the most recent safe project task.
- **secondaryActions:** Create a project; start Quick Create; inspect a failed job.
- **desktopLayout:** GlobalRail at left; dual-mode entries, recent projects, and recent work in the flexible center canvas; next-safe-action and cross-project blockers at right; 48 px collapsed BottomJobShelf.
- **tabletLayout:** GlobalRail remains compact; recent work is the sole canvas; next-action/blocker content opens as a named drawer; job shelf becomes a bottom drawer.
- **mobileLayout:** 56 px context bar and one stacked canvas; mode, projects, and work are ordered by recency; navigation, blockers, and jobs use mutually exclusive full-screen drawers at exact 390 px.
- **dataSources:** Adapter projections for Projects, capability catalog, scoped recent Jobs, and restricted Works summary; no sample project data in connected mode.
- **readOperations:** Read scoped project list, capability state, recent jobs, and restricted works summary through the Experience Adapter.
- **writeOperations:** G0 authorizes none; future project creation uses the existing typed adapter command, while Quick Create submission remains disabled until its wave and authorities pass.
- **currentCapabilityState:** At Frontend baseline 4d2957, /creator is reusable but Assets, Create, Works, and the cross-project Job Center are incomplete.
- **authorityRequirements:** Authenticated actor and workspace scope supplied by Core; no browser-created actor, workspace, or authority ref.
- **runtimeRequirements:** None for reads and project continuation; capability cards reflect runtime blockers supplied by the adapter.
- **loadingState:** Use bounded skeletons for recent Projects and Jobs while preserving the shell and known connectivity state.
- **emptyState:** EmptyProductState explains first-project creation and contains no fabricated examples.
- **disconnectedState:** Persistent Core-disconnected state with retry; no fixture fallback and no false recent work.
- **authenticationState:** Show the repository-standard authentication boundary and withhold scoped project/job data until authenticated.
- **authorityBlockedState:** CapabilityBlocker names the missing authority, consequence, owner, and safe next action.
- **policyBlockedState:** Keep the affected action disabled and show the exact policy category in user language.
- **staleState:** Mark only the affected recent item stale and route the user to its authoritative workspace.
- **conflictState:** Show the conflicting object/version and require an explicit workspace resolution path.
- **errorState:** Persist load/action errors in the relevant region; do not reduce them to toast-only history.
- **evidenceDisclosure:** AuthorityEvidenceDisclosure exposes exact refs/digests only after explicit expansion.
- **keyboardBehavior:** Focus order is GlobalRail, mode/recent-work canvas, blocker region, then JobShelf; closing any drawer restores its trigger.
- **browserAcceptance:** At 1920×1080 and 1440×900 the center canvas remains primary; at 390×844 there is no horizontal overflow, dead entry, unreachable primary action, or simultaneous full-screen drawer.
- **implementationWave:** Wave 1B for V3 route/shell integration; later capabilities stay honest blockers.
- **legacyMigration:** Retains /creator as canonical and moves AI Director assistance into contextual slots only after separate acceptance.
- **completionCriteria:** All clickable entries have routes, connected data is real, unavailable capabilities are honest blockers, and recent work resumes through the adapter.

## 02 Project Center

- **route:** /creator/projects
- **purpose:** Search, filter, create, and resume projects with clear connection and blocker states.
- **primaryAction:** Create a new project.
- **secondaryActions:** Open a project; search; filter by supported status, series, or update time; inspect a selected project summary.
- **desktopLayout:** GlobalRail plus flexible project grid/list; filters at left and selected-project summary at right without constraining the primary list canvas.
- **tabletLayout:** Project list is primary; filters and selected summary are separate on-demand drawers and never overlay together.
- **mobileLayout:** Single project list at 390 px; search and one Create action remain visible; filters and summary use named full-screen drawers.
- **dataSources:** Projects, ProjectContext, Series, and Episode projections exposed by the Experience Adapter.
- **readOperations:** Read scoped project list/detail and only filter fields supported by the public contract.
- **writeOperations:** Project, Series, and Episode foundation creation uses existing typed adapter routes; no production-readiness or canonical-registration mutation is implied.
- **currentCapabilityState:** Project browse/create is executable and bounded at the frozen baseline; canonical registration/preflight is not adapted.
- **authorityRequirements:** Authenticated actor/workspace scope and server-owned tenant isolation.
- **runtimeRequirements:** No media runtime required.
- **loadingState:** List skeleton preserves search and Create affordance; selected summary waits for its exact project response.
- **emptyState:** First-project EmptyProductState with the real Create route.
- **disconnectedState:** Inline connection failure with retry and no cached row represented as current.
- **authenticationState:** Unauthenticated users cannot see project names or filters derived from scoped data.
- **authorityBlockedState:** Disable only the affected create/open action and identify missing scope or authority.
- **policyBlockedState:** Explain policy denial beside the target project operation.
- **staleState:** Refresh the changed project summary and preserve the user’s list position.
- **conflictState:** Project foundation conflicts show exact target and a safe reload/review action.
- **errorState:** Pagination, search, creation, and detail errors remain attached to their control or row.
- **evidenceDisclosure:** Technical projectRef/workspaceRef appears only in explicit evidence details.
- **keyboardBehavior:** Search precedes filters, list, primary Create action, and summary; list selection is keyboard reachable and drawers restore focus.
- **browserAcceptance:** Real routes and handlers at 1920, 1440, and 390; no fake server filter, horizontal overflow, console error, or silent disconnected fallback.
- **implementationWave:** Wave 1B.
- **legacyMigration:** Keeps /creator/projects canonical; existing create/detail logic may be reused behind the V3 component tree.
- **completionCriteria:** Create/open/search work through the adapter, unsupported filters are not shown as server filters, and empty/disconnected states are distinct.

## 03 Quick Create

- **route:** /creator/create
- **purpose:** Offer a bounded image, video, audio, or digital-human task entry that shares Project Production objects and truth boundaries.
- **primaryAction:** At first landing, inspect the capability blocker; submission becomes primary only after Wave 5B and all required authority/runtime gates.
- **secondaryActions:** Choose task type; edit prompt; attach lawful references; inspect requirements; compare supplied candidates; explicitly add a result to a project.
- **desktopLayout:** GlobalRail; task type and history at left; GenerationPromptBar, references, and candidates in the center; parameters and CapabilityBlocker at right; JobShelf at bottom.
- **tabletLayout:** Prompt/candidates remain the sole canvas; task history and parameter/blocker panels are mutually exclusive drawers.
- **mobileLayout:** Mobile-first single prompt/candidate flow; task, references, parameters, blockers, and jobs use named drawers at exact 390 px.
- **dataSources:** Capability catalog and, when separately implemented, server method plan plus shared Job, Candidate, and AssetVersion projections.
- **readOperations:** Read capability, requirements, jobs, candidates, and project choices through typed adapter resources.
- **writeOperations:** None at G0; future submit and Add to project require server-derived method/route and explicit adapter binding. Browser never chooses method or Provider.
- **currentCapabilityState:** Honest blocked-first target; route and executable generation are not implemented at the frozen baseline.
- **authorityRequirements:** Task-specific server authority, lawful asset rights, and explicit project binding authority.
- **runtimeRequirements:** Matching authorized runtime is required for execution; absent runtime keeps submission disabled.
- **loadingState:** Prompt remains editable while capability/requirements load; Submit stays disabled until all authoritative inputs resolve.
- **emptyState:** Instructional EmptyProductState contains no fabricated user results.
- **disconnectedState:** Core-disconnected blocker persists and never falls back to LOCAL_FIXTURE.
- **authenticationState:** Authentication is required before scoped history, candidates, jobs, or project binding appear.
- **authorityBlockedState:** CapabilityBlocker explains missing execution or binding authority and keeps actions disabled.
- **policyBlockedState:** Policy denial is persistent and cannot be overridden by parameter changes.
- **staleState:** Changed method/input plan disables submission and requires a fresh authoritative read.
- **conflictState:** Changed replay or project-binding conflict offers revise/reload, never automatic reconciliation.
- **errorState:** Failed jobs remain in Job Center/JobShelf with exact recovery options; no toast-only loss.
- **evidenceDisclosure:** Server plan, route, refs, and digests are read-only technical details.
- **keyboardBehavior:** Task type, prompt, references, primary blocker/submit, candidate list, and JobShelf follow logical order; drawer focus restores.
- **browserAcceptance:** At 1920, 1440, and 390 every enabled control has a real handler; blocked-first state is explicit; no model/provider picker, dead button, fake candidate, or overflow.
- **implementationWave:** Wave 1B creates an honest blocked route; Wave 5B may activate supported capabilities.
- **legacyMigration:** New canonical route; shared objects may be explicitly bound into a project but are never copied as authority.
- **completionCriteria:** The page is honest while blocked, and later execution is usable only with shared server objects, exact handlers, persistent failures, and explicit project binding.

## 04 Asset Library

- **route:** /creator/assets
- **purpose:** Search and inspect uploads, candidates, selected/admitted versions, rights, lineage, and project membership without collapsing lifecycle states.
- **primaryAction:** Inspect the selected AssetVersion and its rights/lineage.
- **secondaryActions:** Search; filter; upload when authorized; add to project; request selection/admission through separate commands; perform explicit bulk operations.
- **desktopLayout:** GlobalRail; lifecycle/type/project/rights filters at left; flexible asset grid/list center; rights, lineage, and versions at right; explicit bulk bar at bottom.
- **tabletLayout:** Grid/list is primary; filter and Asset inspector are separate drawers; bulk state remains visible when active.
- **mobileLayout:** One- or two-column list at 390 px; filter and inspector are named drawers; bulk actions require explicit selection and confirmation.
- **dataSources:** Canonical asset registry/version stream and sanctioned method-aware binding, selection, and admission projections.
- **readOperations:** Read scoped assets, versions, lifecycle, rights, lineage, and project membership.
- **writeOperations:** None at G0; future upload, bind, select, and admit are separate typed adapter commands with separate confirmations.
- **currentCapabilityState:** Global route is missing and canonical registration/preflight plus key selection resources are not fully adapted.
- **authorityRequirements:** Authenticated scope, rights evidence, and operation-specific selection/admission authority.
- **runtimeRequirements:** No media runtime for library reads; upload processing requirements remain server-reported.
- **loadingState:** Grid skeleton and stable filters; never use decorative cards as loaded assets.
- **emptyState:** Honest first-upload/no-result state distinguishes an empty library from active filters.
- **disconnectedState:** Connection error replaces asset results and offers retry without stale-as-current display.
- **authenticationState:** No asset metadata, rights, or lineage is exposed before authentication.
- **authorityBlockedState:** Blocked select/admit/bind actions name the missing authority and preserve current lifecycle.
- **policyBlockedState:** Rights or policy denial is prominent and cannot be bypassed by bulk action.
- **staleState:** Stale version is labeled and cannot be selected/admitted until refreshed.
- **conflictState:** Concurrent lifecycle/version conflict identifies the current server version and safe next action.
- **errorState:** Upload/read/action errors persist on the item or operation and preserve retry context.
- **evidenceDisclosure:** Canonical refs, lineage digests, and registration evidence are disclosed on demand.
- **keyboardBehavior:** Roving grid/list selection, keyboard filters, explicit bulk selection, and focus-restoring inspector drawer.
- **browserAcceptance:** At all three viewports Candidate, Selected, Admitted, and Superseded remain distinct; no silent admission, fake asset, unreachable action, or overflow.
- **implementationWave:** Wave 5A.
- **legacyMigration:** Indexes existing Core-backed objects without copying or inventing canonical records; legacy history remains read-only.
- **completionCriteria:** Users can distinguish lifecycle/rights/lineage and every permitted mutation is separate, typed, confirmed, and fail-closed.

## 05 Job Center

- **route:** /creator/jobs
- **purpose:** Provide a cross-project recovery spine for queued, running, blocked, failed, succeeded, and superseded jobs.
- **primaryAction:** Open a job’s safe recovery or blocker path.
- **secondaryActions:** Filter by state/project; inspect evidence; exact replay when inputs match; revise when supported; cancel only under a future public contract.
- **desktopLayout:** GlobalRail; state/project filters at left; flexible job stream center; selected job, blocker, and recovery at right.
- **tabletLayout:** Job stream is primary; filters and detail/recovery use mutually exclusive drawers.
- **mobileLayout:** Grouped status cards and a full-screen job detail drawer at 390 px; the critical blocker and next action remain visible.
- **dataSources:** Sanctioned capability-specific Job/state projections through the Experience Adapter; never an internal queue or Provider endpoint.
- **readOperations:** Read all actor/workspace-scoped jobs, states, inputs, and permitted recovery metadata.
- **writeOperations:** None at G0; future replay/revision/cancel uses typed public commands only.
- **currentCapabilityState:** No global route exists; current run rail is project-local and implementation-facing.
- **authorityRequirements:** Authenticated scoped read authority and command-specific replay/revision/cancel authority.
- **runtimeRequirements:** None to inspect history; runtime state is a supplied blocker for executable commands.
- **loadingState:** Preserve filters and selected scope while loading real job rows.
- **emptyState:** No jobs yet is distinct from no filter results, disconnected, and unauthorized.
- **disconnectedState:** Persistent connection failure with no cached success or invented queue state.
- **authenticationState:** Require authentication before project/job identifiers are loaded.
- **authorityBlockedState:** Recovery command is disabled and names the authority owner and consequence.
- **policyBlockedState:** Policy-denied job remains blocked, never converted to failed or succeeded.
- **staleState:** Input currentness mismatch disables exact replay and offers the supported revise/source path.
- **conflictState:** Changed replay conflict preserves both requested and current context without bypass.
- **errorState:** Failed is a durable job state with user-readable cause and technical details disclosure.
- **evidenceDisclosure:** Queue/worker/Provider names and stack traces are hidden by default; exact server evidence is opt-in.
- **keyboardBehavior:** Filters, job rows, recovery action, and evidence are keyboard reachable; row selection does not steal focus.
- **browserAcceptance:** Unknown states fail closed; at 1920, 1440, and 390 failures persist, recovery is reachable, and no queue/provider call, dead button, or overflow occurs.
- **implementationWave:** Wave 5B.
- **legacyMigration:** Consolidates future sanctioned job projections; does not migrate or recreate internal queue records.
- **completionCriteria:** All six states are distinguishable, failed work is recoverable through typed commands, and unknown/disconnected conditions never look successful.

## 06 Global Works

- **route:** /creator/works
- **purpose:** Inspect cross-project restricted exports, approved Masters, and future publication objects without conflating them with previews.
- **primaryAction:** Inspect eligibility and evidence for the selected work object.
- **secondaryActions:** Filter by project/state; open the source project; download a restricted export only when authorized; inspect an upstream blocker.
- **desktopLayout:** GlobalRail; project/eligibility filters at left; works list center; eligibility, approval, and evidence summary at right.
- **tabletLayout:** Works list remains primary; filters and evidence use named drawers.
- **mobileLayout:** One status and one safe action per card at 390 px; evidence is a focus-restoring detail drawer.
- **dataSources:** Delivery, approval, readiness, and future release projections sanctioned through the adapter.
- **readOperations:** Read scoped PreviewCandidate, restricted export, Master, and future publication eligibility as distinct object types.
- **writeOperations:** None at G0; publication is not offered. Restricted download is enabled only by an exact authorized response.
- **currentCapabilityState:** Read-only/blocked-first target; global Works route is not implemented and M15+ authority is incomplete.
- **authorityRequirements:** Object read/download authority and, in the future, separate Master/publication authorities.
- **runtimeRequirements:** No runtime for reads; upstream render/QC/runtime blockers remain visible.
- **loadingState:** Stable filters and object-type skeletons without optimistic Master labels.
- **emptyState:** Explain whether no objects exist or an upstream Timeline/QC/approval prerequisite is missing.
- **disconnectedState:** No cached Preview or export is represented as currently eligible.
- **authenticationState:** Scoped work metadata and downloads require authentication.
- **authorityBlockedState:** Download or future action remains disabled with exact missing authority.
- **policyBlockedState:** Policy/rights restriction stays attached to the object and cannot be softened to warning-only.
- **staleState:** Stale eligibility forces refresh before any restricted operation.
- **conflictState:** Changed approval or delivery version blocks action and presents the current server state.
- **errorState:** Read/download errors persist on the work object and preserve eligibility truth.
- **evidenceDisclosure:** Approval refs, hashes, and exact restriction evidence are available only in explicit disclosure.
- **keyboardBehavior:** Filters, object cards, safe action, and evidence drawer follow logical focus order.
- **browserAcceptance:** At three viewports PreviewCandidate and Restricted Export are never labeled Master or published; no unauthorized publication control, dead action, or overflow.
- **implementationWave:** Wave 6B.
- **legacyMigration:** Splits the G0 Works & Delivery concept: this is the cross-project read surface; project delivery remains screen 16.
- **completionCriteria:** Cross-project objects remain type-correct and only authorized restricted operations are enabled.

## 07 Project Overview

- **route:** /creator/projects/[projectRef]/overview
- **purpose:** Explain readiness, lineage, current phase, recent work, blockers, and the next safe project action.
- **primaryAction:** Continue the next safe task.
- **secondaryActions:** Inspect a blocker; open a recent version, candidate, or job; navigate to a project destination.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3 at left; phase/readiness and recent work in the flexible center; AuthorityStatus at right; project JobShelf at bottom.
- **tabletLayout:** Project navigator is compact or a drawer; canvas stays primary; AuthorityStatus opens in a separate drawer.
- **mobileLayout:** Vertical readiness checklist and recent work in one canvas; project navigation, AuthorityStatus/evidence, and jobs use named drawers.
- **dataSources:** ProjectContext, capability catalog, production readiness, state projection, and recent version/job projections.
- **readOperations:** Read authoritative project context, readiness, capability, versions, candidates, and scoped jobs.
- **writeOperations:** G0 authorizes none; only separately authorized small actions may later appear through typed adapter commands.
- **currentCapabilityState:** Current navigation exposes Overview as disabled; a new page is required.
- **authorityRequirements:** Authenticated project/workspace scope and operation-specific authority for any future action.
- **runtimeRequirements:** None for overview reads; runtime availability is presented as supplied capability state.
- **loadingState:** Readiness skeleton never says Ready before authoritative response.
- **emptyState:** Names the prerequisite that creates missing project state and links to its real route.
- **disconnectedState:** Project context remains identified without fabricating readiness; retry is persistent.
- **authenticationState:** No project context or recent work is shown without valid authentication.
- **authorityBlockedState:** AuthorityStatus separates UI, runtime, authority, and policy layers.
- **policyBlockedState:** Blocked next step stays disabled and names the policy owner.
- **staleState:** Stale readiness/version points to the authoritative source workspace.
- **conflictState:** Conflicting current versions require review before continuation.
- **errorState:** Each failed projection has a scoped retry; aggregate Ready is withheld.
- **evidenceDisclosure:** Exact refs and readiness evidence are separate from selected-object inspection.
- **keyboardBehavior:** Project navigation, readiness canvas, next action, AuthorityStatus, and JobShelf have deterministic order and restored drawer focus.
- **browserAcceptance:** At all three viewports there is one obvious next action, honest blockers, no generic Ready, no dead destination, and no overflow.
- **implementationWave:** Wave 1B.
- **legacyMigration:** New canonical project landing; no data migration and no removal of accepted old routes in this wave.
- **completionCriteria:** Readiness and next action are evidence-backed, user-readable, and fail closed when any projection is unknown.

## 08 Story Workspace

- **route:** /creator/projects/[projectRef]/story
- **purpose:** Unify user entry to Series planning, world, locations, factions, and continuity while preserving their separate Core authorities.
- **primaryAction:** Continue editing the current story/world object.
- **secondaryActions:** Select Series/world/location/faction/continuity object; compare versions; inspect source; request a separately authorized confirmation.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; Series/world/location/faction/continuity navigator at left; story/world canvas center; version/source/continuity/Authority inspector right; VersionTimeline bottom.
- **tabletLayout:** Story canvas stays primary; object navigator and inspector are mutually exclusive drawers.
- **mobileLayout:** One story canvas with persistent project/object title; navigator, version/Authority, and evidence use named drawers at 390 px.
- **dataSources:** Series planning workspaces/versions plus Series Intelligence world and continuity projections via the adapter.
- **readOperations:** Read planning, world, continuity, source lineage, and version state without merging authority domains.
- **writeOperations:** G0 authorizes none; future bounded drafts use their exact adapter commands, while authoritative confirmation remains separately gated.
- **currentCapabilityState:** World/Bible and bounded Character-adjacent authoring are partly reusable; Series Planning and Continuity user routes are incomplete.
- **authorityRequirements:** Per-domain Series Planning/Series Intelligence authority; one domain’s authority cannot satisfy another.
- **runtimeRequirements:** No media runtime.
- **loadingState:** Load selected object/version independently; preserve known source and do not merge partial responses.
- **emptyState:** Guide creation of the first appropriate story object without inventing continuity facts.
- **disconnectedState:** Keep local unsaved presentation state explicit; do not present it as accepted Core fact.
- **authenticationState:** Project and story objects require authenticated actor/workspace scope.
- **authorityBlockedState:** Draft remains distinguishable from authoritative baseline; blocked confirmation names the exact authority.
- **policyBlockedState:** Policy restriction disables only its operation and preserves readable history.
- **staleState:** Source/version mismatch blocks confirmation and points to current source.
- **conflictState:** Continuity/version conflicts show both claims and require explicit resolution.
- **errorState:** Object-specific load/save errors persist with unsaved-work protection.
- **evidenceDisclosure:** Source refs, version digests, and authority evidence are opt-in details.
- **keyboardBehavior:** Object navigator uses roving selection; editor then inspector/version actions follow; drawers restore trigger focus.
- **browserAcceptance:** At 1920, 1440, and 390 the page preserves one canvas, separates draft/candidate/baseline, and never merges Core authority.
- **implementationWave:** Wave 1C.
- **legacyMigration:** After Story V3 acceptance, /planning/bible redirects to /story; Series Planning/Bible/Continuity become user entries here without authority consolidation.
- **completionCriteria:** The unified story experience preserves exact source/version/authority boundaries and passes responsive, keyboard, stale, and conflict acceptance.

## 09 Script Studio

- **route:** /creator/projects/[projectRef]/script
- **purpose:** Author, import, compare, review, rewrite, and explicitly confirm script versions.
- **primaryAction:** Edit or continue the current script version.
- **secondaryActions:** Generate candidate; reviewed import; compare; rewrite scene; confirm when authorized.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; Episode/Scene navigator at left; one editor or comparison canvas center; version/source/confirmation/stale inspector right; save/version bar bottom.
- **tabletLayout:** One editor canvas; comparison and inspector are never forced open together and use mutually exclusive modes/drawers.
- **mobileLayout:** Single editor or comparison pane; navigation and inspector are focus-restoring full-screen drawers; persistent save/version status at 390 px.
- **dataSources:** Script workspace, version graph, reviewed import/accept, confirmation, and storyboard-readiness projections.
- **readOperations:** Read current script, scenes, versions, import candidates, confirmation, and source currentness.
- **writeOperations:** Existing manual/generate/rewrite/confirm commands may be reused; reviewed import/accept requires its separately implemented adapter coverage.
- **currentCapabilityState:** Editor core, mobile drawers, unsaved guard, and bounded writes are reusable; reviewed-import adapter resources are missing.
- **authorityRequirements:** Actor-bound confirmation/import authority and exact project/script scope.
- **runtimeRequirements:** No media runtime; text-generation availability remains server-authorized.
- **loadingState:** Editor shell and known save status remain; no placeholder text is treated as script content.
- **emptyState:** Provide an empty screenplay starter backed by an explicit create/edit operation.
- **disconnectedState:** Unsaved local draft is labeled local; Core state is not synthesized.
- **authenticationState:** Authenticated project scope is required before script content loads or writes.
- **authorityBlockedState:** Confirmation/import action is disabled with exact missing actor/authority explanation.
- **policyBlockedState:** Policy denial persists beside the action and does not alter draft history.
- **staleState:** Stale source/digest blocks write or confirmation until refreshed/rebased through supported flow.
- **conflictState:** Show local and current server version choices; never silently overwrite.
- **errorState:** Save/import/rewrite errors remain in the editor/version context with recovery.
- **evidenceDisclosure:** Actor binding, digests, and version refs are available in explicit details.
- **keyboardBehavior:** Episode/Scene navigator, editor, compare mode, inspector, and save bar have deterministic order; existing unsaved-navigation guard remains keyboard accessible.
- **browserAcceptance:** At 1440–1500 px edit, compare, and inspector do not all compete; at 390 drawers and unsaved guard work; no inaccessible primary action or overflow.
- **implementationWave:** Wave 1C.
- **legacyMigration:** After Script V3 acceptance, /content/script redirects to /script; correct data operations may be reused, old page layout may not.
- **completionCriteria:** All supported edits and confirmation preserve version/currentness/actor rules across desktop, tablet, mobile, and disconnected/conflict states.

## 10 Character Studio

- **route:** /creator/projects/[projectRef]/characters
- **purpose:** Manage character identity, appearance, relationships, continuity, and reference assets with explicit authority separation.
- **primaryAction:** Continue editing the selected character draft.
- **secondaryActions:** Create/select character; generate candidate when authorized; compare; inspect conflicts; request confirmation.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; character list left; identity/appearance/relationships canvas center; continuity/Authority inspector right; VersionTimeline bottom.
- **tabletLayout:** Character canvas is primary; list and inspector are separate drawers; reference compare may replace the canvas.
- **mobileLayout:** Card-based single canvas at 390 px; character list and continuity/Authority use full-screen drawers; reference compare is a dedicated mode.
- **dataSources:** Series Intelligence workspace, character versions/candidates/confirmations, continuity, and asset-lineage projections.
- **readOperations:** Read scoped character facts, relationships, versions, candidates, authority, and references.
- **writeOperations:** G0 authorizes none; future bounded draft/candidate commands use the adapter, while authoritative baseline confirmation remains separately gated.
- **currentCapabilityState:** Substantial presentation and bounded authoring are reusable; production activation/identity authority and continuity surface remain incomplete.
- **authorityRequirements:** Exact identity/continuity/confirmation authority; local draft or AI origin cannot create an authoritative baseline.
- **runtimeRequirements:** No runtime for editing; candidate generation, if later offered, requires its separately authorized service.
- **loadingState:** Selected character identity and version load independently; no placeholder identity is persisted.
- **emptyState:** Create-first-character state does not invent identity, appearance, or reference assets.
- **disconnectedState:** Local draft is explicitly local and cannot appear confirmed.
- **authenticationState:** Authenticated project scope is required for characters and lineage.
- **authorityBlockedState:** Local Draft, AI Candidate, and authoritative baseline are visibly distinct; blocked confirmation names the owner.
- **policyBlockedState:** Rights or identity policy keeps the affected reference/action disabled.
- **staleState:** Stale source/version blocks confirmation and generation inputs.
- **conflictState:** Continuity/identity conflicts show competing values and explicit resolution path.
- **errorState:** Draft, candidate, reference, or version failures remain scoped and recoverable.
- **evidenceDisclosure:** Source plan, baseline refs, and lineage digests stay behind disclosure.
- **keyboardBehavior:** Roving character selection, editor fields, compare, inspector, and timeline are keyboard reachable; drawers restore focus.
- **browserAcceptance:** All three viewports visibly distinguish draft, AI Candidate, and baseline; no unauthorized activation or overflow.
- **implementationWave:** Wave 1C.
- **legacyMigration:** After Characters V3 acceptance, /planning/characters redirects to /characters; correct data logic may be reused in a new V3 tree.
- **completionCriteria:** Identity and continuity editing remains usable while every authoritative transition is explicit, evidence-backed, and separately gated.

## 11 Storyboard Workspace

- **route:** /creator/projects/[projectRef]/storyboard
- **purpose:** Turn the current confirmed script into an inspectable Shot graph and read-only server-derived method plan.
- **primaryAction:** Select a Shot and inspect its server-derived plan.
- **secondaryActions:** Bootstrap/refresh when authorized; inspect execution class and axes; resolve stale source; continue to Generation inputs.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; Scene/ShotNavigator left; Storyboard/Shot Graph canvas center; Method Plan and CapabilityBlocker right; Shot Strip bottom.
- **tabletLayout:** Canvas stays primary; Shot navigator and Method Plan/Blocker are mutually exclusive drawers.
- **mobileLayout:** Shot review and blocker inspection are supported in one canvas; graph editing is tablet/desktop-first; drawers are exclusive at 390 px.
- **dataSources:** Storyboard bootstrap, Shot graph, execution-method-plan, and source-currentness projections.
- **readOperations:** Read Shot graph, source lineage/currentness, executionClass, reasons, and image/video/audio axes.
- **writeOperations:** None at G0; future bootstrap/refresh uses exact typed adapter commands. executionClass is never writable by the client.
- **currentCapabilityState:** No dedicated page; Shot graph read exists but execution-method-plan is absent from the adapter.
- **authorityRequirements:** Project/Shot read authority and separately authorized bootstrap/refresh command scope.
- **runtimeRequirements:** None for planning reads; Contact/Gait runtime availability is supplied as a blocker.
- **loadingState:** Shot graph and plan have independent loading states; Generate remains unavailable until both authoritative reads resolve.
- **emptyState:** Require a confirmed/current script and explain the exact bootstrap prerequisite.
- **disconnectedState:** No local plan is substituted for a failed Core read.
- **authenticationState:** Authenticated project scope is required.
- **authorityBlockedState:** Bootstrap/refresh stays disabled and identifies required authority.
- **policyBlockedState:** Contact/Gait or other policy restrictions remain explicit with no fallback.
- **staleState:** Stale script/Shot plan blocks continuation and routes to the script/source.
- **conflictState:** Changed replay conflict returns to source review; no auto-fix.
- **errorState:** Foreign workspace, missing plan, or load failures are persistent and typed.
- **evidenceDisclosure:** Exact plan version, executionClass evidence, refs, and digests are opt-in and read-only.
- **keyboardBehavior:** ShotNavigator uses roving selection; selected Shot, plan, blocker, and Shot Strip have predictable focus; drawer focus restores.
- **browserAcceptance:** At 1920/1440 the graph is primary; at 390 Shot review works; no executionMethod override, Contact/Gait fallback, dead route, or hidden blocker.
- **implementationWave:** Wave 2B after Wave 2A adapter contracts.
- **legacyMigration:** New canonical route; no legacy Shot data rewrite.
- **completionCriteria:** A user can understand server-derived planning and blockers for every Shot without client override or fallback.

## 12 Generation Studio

- **route:** /creator/projects/[projectRef]/generation
- **purpose:** Resolve method-compatible inputs, preflight, monitor, compare, revise, select, and admit generated media through the successor path.
- **primaryAction:** Resolve the selected Shot’s next safe method-aware input or review action.
- **secondaryActions:** Bind lawful reference; preflight; generate when authorized; revise; compare; select; admit; inspect history; open a job.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; Shot and GenerationHistory left; GenerationPromptBar, AssetPicker, candidates, and MediaCompare center; InputPlan/Route/QC/properties right; JobShelf bottom.
- **tabletLayout:** Generation canvas is primary; Shot/history and input/QC inspector are mutually exclusive drawers; compare may replace the candidate grid.
- **mobileLayout:** Prompt/reference review, queue, and candidate selection are first-class; multi-candidate compare is tablet/desktop-first; named drawers are exclusive at 390 px.
- **dataSources:** execution-method-plan, method-aware-input-plan, method-aware-video-route, dynamic preflight, candidates, revisions, QC, selection, admission, and state projection.
- **readOperations:** Read plans/routes, current inputs, preflight, jobs, candidates/revisions, QC, lifecycle, and evidence through closed-world adapter resources.
- **writeOperations:** None at G0; future bind/preflight/job/revise/select/admit commands require exact current plan, runtime, policy, and authority. Legacy assets/media write commands never appear.
- **currentCapabilityState:** Current /production is compatibility-only; all four method-aware resources are unadapted and execution is unauthorized.
- **authorityRequirements:** Operation-specific project/Shot/asset/job authority plus explicit selection and admission authority.
- **runtimeRequirements:** The exact server-selected runtime route must be available and authorized; browser never selects Provider or executionMethod.
- **loadingState:** Plan, inputs, preflight, and candidates show separate loading; no Generate action enables before all required authoritative state is known.
- **emptyState:** No candidates explains the next prerequisite and never displays fabricated outputs.
- **disconnectedState:** Persistent disconnected blocker; no LOCAL_FIXTURE or cached plan fallback.
- **authenticationState:** Authenticated project scope is required for all reads and writes.
- **authorityBlockedState:** CapabilityBlocker names execution, selection, or admission authority separately.
- **policyBlockedState:** Policy-denied execution remains disabled; parameter changes cannot bypass it.
- **staleState:** Stale plan/input/candidate disables the affected mutation and requests an authoritative refresh.
- **conflictState:** Changed replay, revision, selection, or admission conflict preserves current server state and offers supported recovery.
- **errorState:** Provider/job/QC failures remain durable Job states with source-specific recovery.
- **evidenceDisclosure:** Method/route, refs, digests, Provider evidence, and QC details are hidden by default and read-only.
- **keyboardBehavior:** Shot/history, prompt/references, candidates/compare, inspector, and JobShelf follow deterministic order with roving candidate selection.
- **browserAcceptance:** At three viewports Candidate→Selected→Admitted remains exact; no legacy write, unconditional video/audio request, method/provider selector, fallback, dead action, or hidden failure.
- **implementationWave:** Wave 2C after Wave 2A and Wave 2B.
- **legacyMigration:** After acceptance, /production redirects to /generation and historical G4/G5 reads move to /history/legacy-production.
- **completionCriteria:** The complete method-aware input-to-admission loop is real, typed, fail-closed, currentness-safe, and keeps history readable without legacy new writes.

## 13 Audio Studio

- **route:** /creator/projects/[projectRef]/audio
- **purpose:** Inspect explicit audio requirements and lawful sources, including SILENCE, without implying M12 runtime completion.
- **primaryAction:** Inspect the selected explicit audio requirement and its blocker or source.
- **secondaryActions:** Select Shot/requirement; bind lawful source when authorized; preview admitted audio; hand off to Timeline; request a job only after independent authorization.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; Shot/requirement list left; Audio Requirement, existing audio, and Waveform center; AudioInspector, rights, lineage, and runtime blocker right; jobs/Timeline handoff bottom.
- **tabletLayout:** Audio canvas is primary; requirements and inspector/blocker are mutually exclusive drawers.
- **mobileLayout:** Requirement/status and playback are supported at 390 px; detailed waveform editing is tablet/desktop-first; drawers are named and focus-restoring.
- **dataSources:** explicit-audio-requirement-route, production readiness, lawful source/admitted audio projections, and future authorized Job/Candidate resources.
- **readOperations:** Read explicit requirement or SILENCE, source lineage, rights, runtime/authority state, and admitted audio.
- **writeOperations:** None at G0; no TTS, clone, source binding, or Job command appears until its exact adapter, runtime, rights, and authority gates pass.
- **currentCapabilityState:** No page or explicit-audio adapter route; M12 Runtime G0 is not complete and C3/C4 are unauthorized.
- **authorityRequirements:** Requirement/source read scope; separate rights, binding, synthesis, and any voice-related authority. No voice-profile mutation route is implied.
- **runtimeRequirements:** None for read/preview of admitted audio; real synthesis/clone controls require completed M12 Runtime G0 and separate authorization.
- **loadingState:** Requirement and source load independently; absence is not interpreted as SILENCE until server says SILENCE.
- **emptyState:** Explain why audio is absent and distinguish no requirement, SILENCE, and disconnected.
- **disconnectedState:** No inferred request or local audio result replaces Core state.
- **authenticationState:** Authenticated project/Shot scope is required.
- **authorityBlockedState:** Execution/binding control remains absent or disabled with exact authority explanation.
- **policyBlockedState:** Rights or runtime policy denial remains persistent.
- **staleState:** Stale requirement/source blocks any future execution or handoff.
- **conflictState:** Changed requirement or source binding conflict requires explicit refresh/revision.
- **errorState:** Requirement, rights, playback, or future Job error remains attached to its object.
- **evidenceDisclosure:** Requirement lineage, rights refs, and runtime evidence are disclosed on demand.
- **keyboardBehavior:** Requirement list, playback, inspector, blocker, and handoff are keyboard reachable; waveform has an accessible time-range alternative.
- **browserAcceptance:** At three viewports SILENCE is explicit, no fake request, TTS/clone button, unauthorized execution, dead control, or overflow appears.
- **implementationWave:** Wave 3A for requirement read/blocked-first; Wave 3B only after Runtime G0 and separate authorization.
- **legacyMigration:** New canonical route; no inferred/backfilled audio request and no legacy mutation restoration.
- **completionCriteria:** Read-only requirements are truthful and accessible; execution stays impossible until all independent gates pass.

## 14 Timeline Studio

- **route:** /creator/projects/[projectRef]/timeline
- **purpose:** Assemble admitted video, audio, captions, and deterministic effects into a versioned Timeline and create a RenderCandidate.
- **primaryAction:** Edit or inspect the current Timeline version within its authorized boundary.
- **secondaryActions:** Add admitted clip; trim/reorder; add caption/effect; inspect properties; save version; create Preview/RenderCandidate when authorized.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; admitted assets/captions/effects left; Viewer center; Clip/Effect/Audio inspector right; multitrack Timeline and Waveform bottom.
- **tabletLayout:** Viewer and timeline share the primary canvas; source browser and inspector are mutually exclusive drawers.
- **mobileLayout:** Playback, comments, and simple reorder are supported; complex multitrack editing is not compressed to phone; named drawers remain exclusive at 390 px.
- **dataSources:** Timeline, versions, edits, deterministic effects, RenderCandidates, previews, and admitted AssetVersions.
- **readOperations:** Read current Timeline/version, admitted sources, effects schema, candidates, preview, and currentness.
- **writeOperations:** None at G0; future edit/save/candidate commands use M13 public resources and exact version/currentness checks.
- **currentCapabilityState:** No page; Timeline/effects/RenderCandidate resources are absent from the adapter and M13 product/extension authority is incomplete.
- **authorityRequirements:** Timeline edit/version and RenderCandidate authority, distinct from Master/publication authority.
- **runtimeRequirements:** Authorized deterministic CPU path for candidate creation as separately approved; no GPU expansion.
- **loadingState:** Timeline/version/assets load separately; edit controls remain disabled until current admitted inputs resolve.
- **emptyState:** Start only from admitted assets and explicitly represent missing audio/captions.
- **disconnectedState:** Local edit state is labeled unsaved/local and never presented as persisted.
- **authenticationState:** Authenticated project scope is required.
- **authorityBlockedState:** Save/render controls identify missing M13 authority and remain disabled.
- **policyBlockedState:** Unadmitted asset or prohibited effect keeps the drop/action rejected with explanation.
- **staleState:** Stale source or Timeline version blocks save/render until resolved.
- **conflictState:** Concurrent Timeline version conflict preserves local edits and offers explicit compare/rebase/discard paths.
- **errorState:** Render or edit errors map to the exact clip/effect where known and persist.
- **evidenceDisclosure:** Version/edit refs, effect evidence, and render hashes are opt-in.
- **keyboardBehavior:** Tracks/clips use roving selection, keyboard reorder only when authorized, accessible playhead alternatives, and predictable inspector focus.
- **browserAcceptance:** At 1920/1440 the media stage and tracks remain usable; at 390 playback/light actions work; only admitted assets enter, PreviewCandidate is never Master, and no overflow/dead action occurs.
- **implementationWave:** Wave 4B after Wave 4A adapter; Wave 4C supplies review handoff.
- **legacyMigration:** New canonical route; imported preview evidence remains historical/read-only and no candidate-to-Master promotion occurs.
- **completionCriteria:** Versioned edits and candidate creation are currentness-safe, use admitted inputs only, and preserve Candidate/Master truth.

## 15 Review / QC

- **route:** /creator/projects/[projectRef]/review
- **purpose:** Review a PreviewCandidate, inspect QC, comment, and make only separately authorized correction or approval decisions.
- **primaryAction:** Inspect or play the selected PreviewCandidate and its QC result.
- **secondaryActions:** Compare; comment; mark time-coded issue; request correction; approve only with M14 authority.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; Candidate/version list left; Player/MediaCompare center; QC/comments/AuthorityStatus right; time-coded issue track bottom.
- **tabletLayout:** Player remains primary; candidate list and QC/comments inspector are mutually exclusive drawers; compare can replace player.
- **mobileLayout:** Phone-first playback/comments; compare is swipe/two-up on larger devices; list, authority/evidence, and issue details use named drawers.
- **dataSources:** Preview, semantic/technical QC, candidate selection, comments, and future authorized approval/local-regeneration projections.
- **readOperations:** Read previews, versions, QC, comments, selection, and authority state.
- **writeOperations:** None at G0; future comment/correction/approval uses typed public commands, with approval absent until M14 authority exists.
- **currentCapabilityState:** Current /post preserves QC failure evidence; complete M14 approval/regeneration authority is absent.
- **authorityRequirements:** Comment/correction scopes and separate external human approval authority.
- **runtimeRequirements:** None for review playback; correction/runtime requirements are supplied blockers.
- **loadingState:** Player metadata, QC, and comments load separately; QC is never optimistically Pass.
- **emptyState:** Missing preview links to Timeline and explains the exact prerequisite.
- **disconnectedState:** Cached media may not imply current QC or approval; actions remain disabled.
- **authenticationState:** Authenticated project/review scope is required.
- **authorityBlockedState:** Approval is disabled and names missing M14/human authority.
- **policyBlockedState:** Policy-denied playback/export/correction remains explicit.
- **staleState:** Stale candidate/QC disables decision and requests current version.
- **conflictState:** Concurrent comment/decision state is refreshed before any mutation.
- **errorState:** QC FAIL remains FAIL; playback/comment/action errors persist and do not become success.
- **evidenceDisclosure:** QC details, candidate refs, and approval evidence are opt-in.
- **keyboardBehavior:** Candidate list, player controls, compare, comments, AuthorityStatus, and issue track are fully keyboard reachable with focus restoration.
- **browserAcceptance:** At 1920, 1440, and 390 QC FAIL remains FAIL, approval is absent/disabled without authority, and no PreviewCandidate is called Master.
- **implementationWave:** Wave 6A; Wave 4C provides candidate handoff.
- **legacyMigration:** After Review V3 acceptance, /post redirects to /review; historical read evidence remains available.
- **completionCriteria:** Review/playback/comments are usable at their authorized boundary and QC/approval truth survives every loading, error, stale, and disconnected state.

## 16 Project Delivery

- **route:** /creator/projects/[projectRef]/delivery
- **purpose:** Inspect project-scoped delivery versions, eligibility, approval, evidence, and restricted operations without publication authority.
- **primaryAction:** Inspect the selected delivery object’s eligibility and upstream blocker.
- **secondaryActions:** Select delivery version; inspect evidence; download restricted export when authorized; return to Timeline, Review, or approval owner.
- **desktopLayout:** GlobalRail and ProjectNavigatorV3; delivery versions/eligibility left; project delivery objects center; Eligibility/Approval/Evidence right; restricted-action explanation bottom.
- **tabletLayout:** Delivery objects remain primary; versions and evidence/eligibility are separate drawers.
- **mobileLayout:** One status and one safe action per delivery card at 390 px; eligibility/evidence opens in a focus-restoring drawer.
- **dataSources:** Project delivery, production readiness, approval, restricted export, and future Master eligibility projections.
- **readOperations:** Read project-scoped delivery versions, prerequisites, approval, restrictions, and evidence.
- **writeOperations:** None at G0; restricted export/download is separately authorized. No Publication command is present.
- **currentCapabilityState:** Canonical /delivery exists and correctly blocks missing upstream output; its V3 body is rebuilt in Wave 6.
- **authorityRequirements:** Project delivery read/download authority and separate Master authority; publication remains outside scope.
- **runtimeRequirements:** No runtime for reads; upstream render/QC/runtime status is a blocker.
- **loadingState:** Known delivery identity remains while eligibility loads; never display optimistic Master/available.
- **emptyState:** Explain whether Timeline, QC, approval, or eligible export is missing.
- **disconnectedState:** No local preview/export is represented as current delivery.
- **authenticationState:** Authenticated project scope is required.
- **authorityBlockedState:** Restricted operation remains disabled with exact authority owner.
- **policyBlockedState:** Restriction or rights policy remains attached to the delivery and cannot be bypassed.
- **staleState:** Stale upstream approval/readiness invalidates eligibility until refreshed.
- **conflictState:** Changed delivery/approval version blocks operation and presents the current state.
- **errorState:** Creation/read/download errors persist with upstream context.
- **evidenceDisclosure:** Eligibility, approval refs, hashes, and restriction evidence are explicit opt-in details.
- **keyboardBehavior:** Version list, delivery objects, safe action, and evidence drawer follow deterministic focus order.
- **browserAcceptance:** At all three viewports Preview, Candidate, Restricted Export, and Master remain distinct; there is no Publication button, dead action, false eligibility, or overflow.
- **implementationWave:** Wave 6B.
- **legacyMigration:** Route remains canonical; the page body is atomically rebuilt in Wave 6 after acceptance.
- **completionCriteria:** Project delivery is fail-closed, state-correct, usable at its authorized boundary, and contains no publication affordance.

## Completion boundary

The full redesign is complete only after all 16 canonical screens meet their then-
authorized contracts and Wave 7B cross-repository E2E, performance, visual-baseline,
responsive, keyboard, and accessibility acceptance passes.

FRONTEND_V3_IMPLEMENTATION=NOT_STARTED

FRONTEND_V3_REDESIGN_COMPLETE=false

## Wave 1C implementation status — 2026-09-05

This appendix records bounded implementation of the accepted Story, Script, and
Character screen contracts. It does not revise any target screen contract or declare
the overall redesign complete.

FRONTEND_V3_WAVE_1C=IMPLEMENTED_AND_VERIFIED

REBUILT_USER_SCREENS=Story Workspace,Script Studio,Character Studio

STORY_M5_PLAN_MUTATIONS=PRESERVED_BOUNDED

STORY_M6_AUTHORITY_WRITES=false

SCRIPT_EPISODE_AND_VERSION_MUTATIONS=PRESERVED_BOUNDED

SCRIPT_REVIEWED_IMPORT_UI=false

CHARACTER_M6_MODE=READ_ONLY_OR_AUTHORITY_BLOCKED

LOCAL_FIXTURE_FALLBACK=false

FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6

FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10

FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS

FRONTEND_V3_REDESIGN_COMPLETE=false

NEXT_TASK=ACS-FRONTEND-WAVE-2A-METHOD-AWARE-ADAPTER-AND-CONTRACTS
