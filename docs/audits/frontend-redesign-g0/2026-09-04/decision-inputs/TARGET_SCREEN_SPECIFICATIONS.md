# Target screen specifications

Status: `LOW-FIDELITY G0 / NOT IMPLEMENTED`

All screens preserve Browser → Frontend Experience Adapter → Creator Public HTTP/API → Core. Technical refs/digests are available in an Evidence disclosure, not used as the only primary label. “Write” below means a future authorized UI command—not authority to execute it now.

## 1. Creator Home

- **Purpose:** Resume work, choose Quick Create or Project Production, and surface cross-project blockers.
- **Primary actions:** Continue recent project; create project; start Quick Create; open failed job.
- **Regions:** left/global rail; center/recent projects + mode cards; right/next actions and blockers; bottom/active-job shelf.
- **Data:** projects, capability catalog, recent jobs, restricted works summary through the adapter.
- **Read / write:** read projects/jobs/capabilities; write project creation only. No production mutation.
- **States / permissions:** connected, disconnected, no projects, blocked capability; actor/workspace scope is server-owned.
- **Empty / error:** guided first-project state; Core-disconnected panel with retry and no fabricated examples.
- **Responsive:** 390 px stacks mode cards and recent work; job shelf becomes a bottom sheet.
- **Current / blocker:** current `/creator` is reusable; Assets/Create/Works remain incomplete.

## 2. Project Center

- **Purpose:** Search, filter, create and resume projects.
- **Primary actions:** New project; open; filter by status/series; view blockers.
- **Regions:** left/global rail; center/project grid/list; right/filter/detail summary; bottom/none.
- **Data:** projects, project contexts, series, episodes.
- **Read / write:** read list/detail; write project/series/episode foundations through exact adapter routes.
- **States / permissions:** draft, active, blocked, archived future; tenant/workspace isolation is mandatory.
- **Empty / error:** first-project CTA; pagination/Core errors stay inline.
- **Responsive:** list replaces grid; filter is a drawer; one obvious Create action.
- **Current / blocker:** project browser and create form are reusable; canonical registration/preflight are not adapted.

## 3. Project Overview

- **Purpose:** Make readiness, lineage, current phase and next safe action understandable in one place.
- **Primary actions:** Continue next task; inspect blocker; open recent version/job.
- **Regions:** left/project navigator; center/phase summary + recent work; right/AuthorityStatus + evidence; bottom/job shelf.
- **Data:** project context, capability catalog, production readiness, state projection, recent versions/jobs.
- **Read / write:** read-only except navigation and explicitly authorized small actions.
- **States / permissions:** healthy, incomplete, stale, runtime-blocked, authority-blocked, policy-blocked.
- **Empty / error:** explain which prerequisite creates the missing state; never show generic “ready.”
- **Responsive:** summary cards become a vertical checklist; evidence moves to a drawer.
- **Current / blocker:** route is currently visible but disabled; new page required.

## 4. Script Studio

- **Purpose:** Author, import, compare, review and confirm script versions.
- **Primary actions:** Edit manually; generate candidate; reviewed import; compare; rewrite scene; confirm.
- **Regions:** left/episode + scene navigator; center/editor or comparison; right/version/authority inspector; bottom/save/version status.
- **Data:** script workspace, version graph, reviewed import, confirmation and storyboard bootstrap readiness.
- **Read / write:** current manual/generate/rewrite/confirm writes; reviewed import/accept after adapter coverage.
- **States / permissions:** draft, unsaved, candidate, review needed, confirmed, stale, conflict.
- **Empty / error:** empty screenplay starter; unsaved guard; stale/digest/actor-bound errors remain exact.
- **Responsive:** one canvas; navigator and inspector drawers; comparison switches between panes.
- **Current / blocker:** editor core and mobile guards are strong; reviewed-import routes are missing from adapter.

## 5. Character Studio

- **Purpose:** Manage identity, appearance, relationships, continuity and reference assets.
- **Primary actions:** Draft version; generate candidate; compare; request confirmation; inspect conflicts.
- **Regions:** left/character rail; center/identity + appearance + relationships; right/continuity and authority; bottom/version timeline.
- **Data:** series-intelligence workspace, character versions/candidates/confirmations, asset lineage.
- **Read / write:** bounded local authoring; authoritative confirmation only when external authority exists.
- **States / permissions:** draft, candidate, baseline, conflicted, authority required.
- **Empty / error:** create first character; missing source plan and identity-authority errors are actionable.
- **Responsive:** character list drawer; card-based editor; reference comparison is full-screen.
- **Current / blocker:** substantial current UI reusable; production activation is not authorized and continuity page is missing.

## 6. Storyboard Workspace

- **Purpose:** Turn current script scenes into an inspectable shot graph and server-derived method plan.
- **Primary actions:** Bootstrap/refresh; select shot; inspect execution class; resolve stale source; open generation inputs.
- **Regions:** left/scene + ShotNavigator; center/storyboard/shot graph; right/method plan + CapabilityBlocker; bottom/shot strip.
- **Data:** storyboard bootstrap, shot graph, execution-method plan.
- **Read / write:** bootstrap when authorized; method plan is read-only from the client.
- **States / permissions:** current, stale script, plan missing, Contact/Gait unavailable, foreign workspace.
- **Empty / error:** require confirmed script; changed-replay conflicts route back to source, never auto-fix.
- **Responsive:** mobile supports shot review and blocker inspection; graph editing is tablet/desktop-first.
- **Current / blocker:** no dedicated page; `execution-method-plan` is missing from the adapter.

## 7. Generation Studio

- **Purpose:** Resolve method-compatible inputs, run preflight, monitor jobs and compare/select/admit image/video candidates.
- **Primary actions:** Bind approved reference; preflight; generate if authorized; revise; compare; select; admit.
- **Regions:** left/shot and generation history; center/prompt + candidates/MediaCompare; right/input plan, QC and properties; bottom/job shelf.
- **Data:** method-aware input plan/video route, dynamic preflight, candidates, revisions, QC, selection, admission, state projection.
- **Read / write:** reads are first; writes require exact route, current plan, authority and runtime. Browser never chooses method/provider.
- **States / permissions:** needs input, ready, queued, running, failed, QC failed, selected, admitted, superseded, blocked.
- **Empty / error:** no candidates explains the next prerequisite; stale/conflict/replay and Provider errors are persistent job states.
- **Responsive:** mobile supports prompt/reference review, queue and candidate selection; multi-candidate compare is tablet/desktop-first.
- **Current / blocker:** current Production evidence view is compatibility-only; four key M10/M11 resources are unadapted and execution is unauthorized.

## 8. Audio Studio

- **Purpose:** Inspect explicit audio requirements and prepare dialogue, ambience, music and effects without implying runtime completion.
- **Primary actions:** Inspect requirement; bind lawful source; preview admitted audio; request job only after authorization.
- **Regions:** left/shot + requirement rail; center/audio items and Waveform; right/AudioInspector + rights/lineage; bottom/job/timeline handoff.
- **Data:** explicit audio requirement route, production readiness, future audio candidates/assets.
- **Read / write:** read-only/blocked first; no synthesis or clone mutation in G0.
- **States / permissions:** required, silence, source missing, runtime blocked, rights blocked, ready future.
- **Empty / error:** explain why audio is absent; silence is an explicit state, not a failed fetch.
- **Responsive:** mobile supports requirement/status and playback; detailed waveform editing is desktop/tablet-first.
- **Current / blocker:** no page or adapter route; M12 Runtime G0 is not complete and C3/C4 are not authorized.

## 9. Timeline Studio

- **Purpose:** Assemble admitted video/audio/captions/effects into a versioned timeline and create a RenderCandidate.
- **Primary actions:** Add clip; trim/reorder; add caption/effect; inspect; save version; create preview candidate.
- **Regions:** left/assets/ShotNavigator; center/viewer; right/EffectInspector or clip properties; bottom/multi-track timeline + waveform.
- **Data:** timeline, timeline versions/edits, deterministic effects, render candidates, admitted assets.
- **Read / write:** all writes go through M13 public resources and preserve version/currentness checks.
- **States / permissions:** draft, dirty, saving, stale inputs, conflict, candidate queued, candidate ready.
- **Empty / error:** start from admitted assets; missing audio remains explicit; render error returns to exact clip/effect if known.
- **Responsive:** desktop/tablet primary; phone supports playback, comments and simple reorder only.
- **Current / blocker:** no page; five M13 resources are absent from adapter; M13 product surface/extension authority incomplete.

## 10. Review / QC

- **Purpose:** Review a PreviewCandidate, inspect QC, comment and make an explicit approval/correction decision.
- **Primary actions:** Play; compare; comment; mark issue; request correction; approve when authorized.
- **Regions:** left/version/candidate list; center/player + MediaCompare; right/QC, comments and AuthorityStatus; bottom/time-coded issue track.
- **Data:** preview, semantic/technical QC, media selection, future approval/local-regeneration contract.
- **Read / write:** current evidence read; M14 decisions remain disabled until authorized.
- **States / permissions:** QC pending/pass/fail; approval absent; correction requested; stale candidate.
- **Empty / error:** missing preview links to Timeline; a failed QC is never softened into warning/success.
- **Responsive:** phone-first review/player/comments; detailed A/B compare becomes swipe or two-up on larger screens.
- **Current / blocker:** current Post correctly preserves QC failure; full M14 authority is absent.

## 11. Asset Library

- **Purpose:** Search and understand uploads, generated candidates, selected/admitted versions, rights and project membership.
- **Primary actions:** Upload; filter; inspect lineage; add to project; request selection/admission through authorized workflow.
- **Regions:** left/library facets; center/grid/list; right/AssetInspector + rights/lineage; bottom/bulk selection bar.
- **Data:** canonical asset registry/version stream and method-aware bindings through future public/adapter coverage.
- **Read / write:** reads never imply admission; upload/bind/select/admit are distinct writes with separate confirmation.
- **States / permissions:** uploaded, candidate, selected, admitted, superseded, rights blocked, stale.
- **Empty / error:** honest first-upload state; missing rights/source prevents use and explains the owner.
- **Responsive:** grid becomes two/one columns; inspector is a drawer; bulk actions remain explicit.
- **Current / blocker:** global nav item is disabled; canonical registration/preflight and key selection resources are not fully adapted.

## 12. Job Center

- **Purpose:** Make asynchronous work, blockers and recovery visible across projects.
- **Primary actions:** Filter; open job; exact replay; revise; return to blocker; cancel only if a future contract permits it.
- **Regions:** left/status/project filters; center/job table/stream; right/job detail + evidence; bottom/none.
- **Data:** capability-specific job/state projections through adapter; no direct queue or Provider access.
- **Read / write:** read all scoped jobs; retry/replay only through typed public commands.
- **States / permissions:** queued, running, blocked, failed, succeeded, superseded; unknown fails closed.
- **Empty / error:** “No jobs yet” differs from disconnected/unauthorized; full stack traces stay hidden.
- **Responsive:** mobile uses grouped status cards and detail sheet; critical blocker remains visible.
- **Current / blocker:** no route; current run rail is project-local and technical.

## 13. Works & Delivery

- **Purpose:** Separate previews, restricted exports, approved masters and publishable works.
- **Primary actions:** Inspect eligibility/evidence; download restricted export when allowed; open upstream blocker.
- **Regions:** left/project/work filters; center/work/delivery list; right/eligibility, approval and evidence; bottom/none.
- **Data:** delivery, production readiness, approval and future release resources.
- **Read / write:** read-only until M15+ authority; publication is never offered in this G0.
- **States / permissions:** not eligible, restricted, awaiting approval, master future, publication unavailable.
- **Empty / error:** explain whether Timeline, QC or approval is missing; do not label PreviewCandidate as Master.
- **Responsive:** cards with one status and one safe action; evidence in a detail sheet.
- **Current / blocker:** project Delivery correctly blocks; global Works missing; M15/M16+ not authorized.

## 14. Quick Create

- **Purpose:** Generate one bounded image/video/audio/digital-human result and optionally continue it into a project.
- **Primary actions:** Choose task; enter prompt; attach references; inspect requirements; submit when authorized; compare; add to project.
- **Regions:** left/task type/history; center/GenerationPromptBar + results; right/contextual parameters + CapabilityBlocker; bottom/job shelf.
- **Data:** capability catalog, method-aware plan where applicable, job/candidate/asset lifecycle through adapter.
- **Read / write:** no client-selected method/provider; submission requires server plan and authorization; “add to project” creates explicit binding/admission.
- **States / permissions:** draft, needs reference, blocked, queued, failed, candidates ready, added to project.
- **Empty / error:** examples are instructional copy, never fabricated user results; failures persist in Tasks.
- **Responsive:** designed mobile-first for one prompt and a small candidate set; advanced controls become disclosure panels.
- **Current / blocker:** global Create is disabled; M10–M13 adapter/runtime/authority gaps prevent executable generation today.

## Shared interaction acceptance

- All actionable blocked states use `CapabilityBlocker` with cause, consequence, owner/next step and technical details disclosure.
- All generated outputs show lifecycle badges: Candidate → Selected → Admitted → Timeline Candidate → Approved Master; no skipped states.
- Keyboard focus order follows global navigation → local navigation → canvas → inspector → job shelf; drawers return focus to their trigger.
- At 390 px, there is one primary canvas and at most one full-screen drawer; no four-column compression.
- Internal refs, digests, provider/queue names and stack traces are hidden by default and copied only from an explicit Evidence view.
