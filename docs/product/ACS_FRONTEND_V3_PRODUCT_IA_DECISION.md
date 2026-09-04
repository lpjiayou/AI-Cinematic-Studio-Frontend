# ACS Frontend V3 Product IA Decision

Status: ACCEPTED

Document class: ACCEPTED_DECISION

Decision date: 2026-09-04

Implementation authority: NONE

## Decision scope

This decision freezes the target product model, navigation, routes, shell geometry,
object lifecycle, and browser authority boundary for Frontend V3. It does not
implement a route, page, adapter operation, runtime, or Core capability.

The decision input is the 15-file G0 decision subset archived under
[the historical audit input directory](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/README.md).
That subset has package SHA-256
c230171b45fbc2bf0925ad4562c75145dd7a4816369bec96932ceb0680909636 and
declares aggregate evidence SHA-256
45f48b069a618da764e4c74e482d3821511171bee375164fe7fcaa735fb8b3b3.

## Frozen baselines

| Authority | Commit | Tree |
| --- | --- | --- |
| Frontend decision start | 4d295718975c0ddb3d2e5d6099d4dea4d63acb54 | 4214fa4a4c5ddf8a61583d94f5ae89248d684da1 |
| Core repository input | 6b10166532c3cac9b8976a5d8986a4e8c1cfd7fc | dd9ca7d2d5da9fba65305348aa367698f1145946 |
| Core production behavior | e21789d265c4e936b0e0b29921746a4c205889b8 | 086f37ed4e5412d1d6608c4ee856ac75d61625e9 |

The Frontend CI pin remains the Core production-behavior commit and tree above.
This decision does not move that pin.

## Product model

FRONTEND_V3_PRODUCT_MODEL=GUARDED_DUAL_MODE_SINGLE_OBJECT_LIFECYCLE

QUICK_CREATE_MODE=ACCEPTED_WITH_GUARDRAILS

PROJECT_PRODUCTION_MODE=ACCEPTED_AS_PRIMARY

Quick Create and Project Production are two entries into one product, not separate
products or duplicate persistence models. Both modes use the same server-backed Job,
Candidate, AssetVersion, TimelineCandidate, and Delivery object lifecycle.

- Quick Create is a bounded prompt/reference entry for a single task. Its result can
  join a project only through an explicit server-authorized binding.
- Project Production is the primary context for long-form work, version history,
  continuity, admission, review, and delivery.
- Neither mode may let the browser choose executionMethod or an internal Provider,
  mint an authority reference, infer approval, or call Core directly.
- A Quick Create Candidate is never a Master, a published work, or an admitted project
  asset merely because it was generated.

## Target global navigation

Order is normative and may not be rearranged by an implementation wave.

| Order | Label | Canonical route | Responsibility |
| ---: | --- | --- | --- |
| 1 | 首页 | /creator | Resume recent work, select a mode, and see actionable blockers |
| 2 | 项目 | /creator/projects | Browse, create, and resume projects |
| 3 | 快速创作 | /creator/create | Start a bounded task using the shared object lifecycle |
| 4 | 资产 | /creator/assets | Inspect assets, lifecycle, rights, lineage, and project membership |
| 5 | 任务 | /creator/jobs | Inspect asynchronous work, blockers, and recovery |
| 6 | 作品 | /creator/works | Inspect cross-project restricted outputs, approved masters, and future publication objects |

AI Director is not a target top-level global destination.
/creator/ai-director is classified as
CONTEXTUAL_ASSISTANCE_COMPATIBILITY_ROUTE. It remains reachable without redirect in
this decision. A later authorized code wave may move its capability into Home,
Project Overview, and relevant workbenches only after migration acceptance.

## Target project navigation

Order is normative. User-facing navigation must not use M1–M19 as menu labels.

| Order | Label | Canonical route |
| ---: | --- | --- |
| 1 | 概览 | /creator/projects/[projectRef]/overview |
| 2 | 故事 | /creator/projects/[projectRef]/story |
| 3 | 剧本 | /creator/projects/[projectRef]/script |
| 4 | 角色 | /creator/projects/[projectRef]/characters |
| 5 | 分镜 | /creator/projects/[projectRef]/storyboard |
| 6 | 生成 | /creator/projects/[projectRef]/generation |
| 7 | 音频 | /creator/projects/[projectRef]/audio |
| 8 | 剪辑 | /creator/projects/[projectRef]/timeline |
| 9 | 审片 | /creator/projects/[projectRef]/review |
| 10 | 交付 | /creator/projects/[projectRef]/delivery |

The exact screen contracts and phased capability posture are frozen in
[ACS Frontend V3 Screen Contract](ACS_FRONTEND_V3_SCREEN_CONTRACT.md).

## Shell contract

The target project shell is:

GlobalRail + ProjectContextBar + ProjectNavigatorV3 + PrimaryCanvas +
SelectionScopedInspector + AuthorityEvidenceDisclosure + BottomJobShelf.

GlobalRail owns only the six global destinations plus theme and account tools.
ProjectContextBar owns project name, Series/Episode context, user-readable version
state, readiness summary, and a future collaboration entry. It must not show raw
workspaceRef, productionRunRef, Provider, GPU worker, or database state.

ProjectNavigatorV3 owns only the ten project destinations. The selection-scoped
inspector shows properties for exactly one selected Scene, Shot, Candidate, Asset,
Clip, Effect, or Audio item. Authority and evidence are separate from that inspector.
BottomJobShelf summarizes queued, running, blocked, and failed jobs and links to the
Job Center; it never accesses an internal queue.

## Geometry and responsive bands

The existing design tokens remain authoritative; V3 does not create a second sizing
system.

| Region | Desktop contract at 1440 px and above |
| --- | --- |
| Global rail | 72 px using --acs-sidebar-collapsed-width |
| Expanded global overlay | 240 px using --acs-sidebar-width; never permanently occupied |
| Project navigator | 220 px using --acs-project-nav-width |
| Project context bar | minimum 56 px using --acs-topbar-min-height |
| Inspector | 22.5 rem / 360 px using --acs-inspector-width |
| Bottom job shelf | 48 px collapsed; maximum 280 px using --acs-bottom-drawer-height |
| Primary canvas | min-width 0; all remaining flexible width; no marketing-page max width |
| Media/editor stage | uses --acs-media-stage |

At 1152–1439 px the 72 px global rail remains, the project navigator is compact or
an overlay, the inspector is closed until selected, and navigator and inspector may
not cover the canvas simultaneously. At 768–1151 px both project navigator and
inspector are on-demand overlays, project/episode/state context remains visible, and
the job shelf becomes a bottom drawer.

At 767 px and below, with 390 px as the exact acceptance width, there is no fixed
left rail, project rail, or right inspector. A 56 px context bar and one primary
canvas remain. Named drawers provide navigation, inspector, evidence, and jobs; at
most one full-screen drawer is open, and closing it restores focus to its trigger.
Phone layouts support playback, comments, approvals within authority, job inspection,
blocker inspection, and lightweight actions. Complex multitrack timeline editing is
tablet/desktop-first.

## Visual and information-density boundary

DEFAULT_THEME=DARK_CINEMATIC

LIGHT_THEME_SUPPORTED=true

The V2.3 foundation remains 90% neutral, 8% teal interaction, and 2% amber or AI
purple emphasis. Teal means primary interaction/current selection; purple means AI
origin, never approval; amber means warning/restriction; red means failure, rejection,
or danger; green means technical completion or explicit success, never creative,
rights, or publication approval.

Pages are Chinese-first, have at most one primary action per task region, and do not
use giant heroes or marketing feature grids as workbenches. Empty states do not use
decorative imagery as data. Raw refs, digests, queue/worker/Provider names, and stack
traces remain behind explicit evidence disclosure. Color is never the sole state cue.

## Object and truth boundaries

The product exposes user-readable states while retaining exact technical evidence on
demand. These distinctions are closed:

- Candidate is not Selected.
- Selected is not Admitted.
- Admitted is not TimelineCandidate.
- PreviewCandidate is not Master.
- Master is not Published Work.
- blocked is not success.
- local evidence is not production completion.
- Legacy G4/G5 read and exact-replay history remains accessible; new G4/G5 write UI
  remains prohibited.

## Browser and authority boundary

The only accepted dependency direction remains:

Browser → Frontend Experience Adapter → Creator Public HTTP/API v1 → Core.

The adapter remains server-only and closed-world. Unknown capability or lifecycle
states fail closed. Connected mode must not hard-code Projects, Candidates, Assets,
or Jobs. LOCAL_FIXTURE requires explicit test/evidence selection and may not silently
replace a Core error.

No decision in this document authorizes M12/M13 execution, a Provider/GPU call,
publication, an A100 start, or a live canonical mutation.

## Decision outcome

FRONTEND_V3_TARGET_IA=ACCEPTED

FRONTEND_V3_IMPLEMENTATION=NOT_STARTED

FRONTEND_V3_REDESIGN_COMPLETE=false

CURRENT_INFORMATION_ARCHITECTURE_DISPOSITION=REPLACE_WITH_DUAL_MODE_PROJECT_FIRST_SHELL

NEXT_TASK=ACS-FRONTEND-WAVE-1A-V3-SHELL-AND-TRUTH-PRESENTATION-COMPONENTS

The next task is a separate authorization boundary. Wave 1A is not started by this
decision.
