# AI Cinematic Studio Frontend

Independent Next.js commercial experience layer for AI Cinematic Studio.

## Current baseline

```text
FRONTEND_BEHAVIOR_COMMIT=a0be9edc91437bf0e7c5dd14883e656e750b3aee
FRONTEND_BEHAVIOR_TREE=c25b9e3744d561c93fed26d0a07e59a1915a6071
FRONTEND_CI_CORE_PIN_SHA=e21789d265c4e936b0e0b29921746a4c205889b8
FRONTEND_CI_CORE_PIN_TREE=086f37ed4e5412d1d6608c4ee856ac75d61625e9
CORE_M13_BASE_TAG=m13-base-backend-v1
CORE_M13_BASE_TAG_OBJECT=b2d086b622bdb5456f6af325e458aa3771e43e80
CORE_M13_BASE_TAG_TARGET=a455c8e76427d53d75bb7f15259b9875d9768914
```

The Core pin is a tested behavior dependency. It is not a claim that all M12/M13
Frontend product surfaces are complete. The accepted M13 base backend remains product
incomplete; Extension G0, M14/M15 and publication are not authorized. See the
[cross-repository baseline](docs/status/CROSS_REPOSITORY_BASELINE.md).

## Scope

This repository contains:

- the ACS design-system and theme contracts;
- customer, workspace and editor presentation shells;
- Creator routes and reusable product components;
- the server-side Frontend Experience Adapter;
- same-origin browser access to Creator Public HTTP/API v1;
- explicit disconnected, blocked, local-evidence and not-open states;
- unit, build, lint, typecheck and Chromium integration gates.

The only accepted runtime dependency direction is:

```text
Browser
→ Frontend Experience Adapter
→ Creator Public HTTP/API v1
→ Creator Application
→ V5
→ V4
→ V3
→ Compute / Foundation
```

The browser never receives the Core origin or credential and never calls
`/creator/internal/*`. Core owns authoritative refs, lifecycle, versions, confirmation
and persistence. `LOCAL_FIXTURE` is an explicit non-authoritative demonstration, never
a fallback after a Core error.

See [Creator Core integration](docs/CREATOR_CORE_INTEGRATION.md) for the exact boundary.

## Current M12/M13 truth

```text
M12_RUNTIME_INSTALLED=false
M12_RUNTIME_G0=NOT_COMPLETE
M12_FRONTEND=UNVERIFIED
M12_PRODUCT=NOT_COMPLETE

M13_BASE_BACKEND=COMPLETE
M13_BASE_CLOSEOUT=ACCEPTED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
M13_PRODUCT_CAPABILITY_COMPLETE=false
M13_EXTENSION_G0_AUTHORIZED=false
A100_START_AUTHORIZED=false
PUBLICATION_ALLOWED=false
```

Existing preview/production-workspace routes and pin-only compatibility do not prove a
Timeline Studio, Effect Inspector, RenderCandidate review UI, M14 QC/Approval or M15
Master/Export experience.

## Accepted Frontend V3 target

~~~text
FRONTEND_REDESIGN_G0=ACCEPTED_WITH_REVISIONS
FRONTEND_V3_TARGET_IA=ACCEPTED
FRONTEND_V3_SCREEN_CONTRACT_COUNT=16
FRONTEND_V3_DESIGN_SYSTEM_DECISION=ACCEPTED
FRONTEND_V3_WAVE_1A=IMPLEMENTED_AND_VERIFIED
FRONTEND_V3_WAVE_1A_OBJECT_COUNT=9
FRONTEND_V3_WAVE_1B=IMPLEMENTED_AND_VERIFIED
FRONTEND_V3_WAVE_1C=IMPLEMENTED_AND_VERIFIED
FRONTEND_V3_WAVE_2A=IMPLEMENTED_AND_VERIFIED
FRONTEND_WORKSPACE_STATE_INTEGRITY=IMPLEMENTED_AND_VERIFIED
FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=6
FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=10
FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS
FRONTEND_V3_REDESIGN_COMPLETE=false
PAGE_LEVEL_IN_PLACE_PATCHING_ALLOWED=false
PARALLEL_REBUILD_REQUIRED=true
ATOMIC_ROUTE_CUTOVER_REQUIRED=true
~~~

The accepted target is a guarded Quick Create plus primary Project Production model
over one Job/Candidate/AssetVersion/TimelineCandidate/Delivery lifecycle. Its global
navigation is 首页, 项目, 快速创作, 资产, 任务, 作品; project navigation is 概览,
故事, 剧本, 角色, 分镜, 生成, 音频, 剪辑, 审片, 交付. Wave 1A implements
GlobalRail, ProjectContextBar, ProjectNavigatorV3, WorkbenchShell and five truth-
presentation components. Wave 1B atomically cuts over Creator Home and Project Center,
adds Project Overview, and makes four blocked global destinations honestly reachable.
Those four blockers are not completed business screens. The unlinked Wave 1A evidence
route remains CI-only and is not a product route. Wave 1C adds new Story, Script, and
Character V3 trees on canonical project routes. Story retains the bounded M5
candidate/confirmation flow, Script retains bounded Episode and version operations,
and Character remains M6 read-only or authority-blocked. None of these states proves
M3, M5, M6, runtime, or product completion.

See the [Product IA decision](docs/product/ACS_FRONTEND_V3_PRODUCT_IA_DECISION.md),
[16-screen contract](docs/product/ACS_FRONTEND_V3_SCREEN_CONTRACT.md),
[Design System V3 decision](docs/design-system/ACS_DESIGN_SYSTEM_V3_DECISION.md),
[rebuild and route migration](docs/product/ACS_FRONTEND_V3_REBUILD_AND_ROUTE_MIGRATION.md),
and [G0 acceptance](docs/status/FRONTEND_REDESIGN_G0_ACCEPTANCE_2026-09-04.md).
Wave 1A's bounded implementation status is recorded in the
[Wave 1A acceptance](docs/status/FRONTEND_V3_WAVE_1A_ACCEPTANCE_2026-09-04.md).
Wave 1B's route, data, shell, navigation, and execution boundaries are recorded in the
[Wave 1B acceptance](docs/status/FRONTEND_V3_WAVE_1B_ACCEPTANCE_2026-09-04.md).
Wave 1C's page, route, mutation, read-only authority, and redirect boundaries are
recorded in the
[Wave 1C acceptance](docs/status/FRONTEND_V3_WAVE_1C_ACCEPTANCE_2026-09-05.md).
Wave 2A adds four closed method-aware Adapter resources, eight typed operations,
and four runtime parsers, with zero product UI callsites. See the
[Wave 2A acceptance](docs/status/FRONTEND_V3_WAVE_2A_ACCEPTANCE_2026-09-05.md)
for the pinned contract, authorized field corrections and verification boundary.
The [workspace state integrity closure](docs/status/FRONTEND_WORKSPACE_STATE_INTEGRITY_CLOSURE_2026-09-05.md)
separates Script drafts from saved baselines, unifies departure protection, and isolates
Story client state by project and Series. Core candidate-source binding remains incomplete.

## Documentation

- [complete documentation index](docs/README.md)
- [documentation governance policy](docs/governance/DOCUMENTATION_GOVERNANCE_POLICY.md)
- [machine-readable document registry](docs/governance/DOCUMENT_REGISTRY.json)
- [human-readable authority map](docs/governance/DOCUMENT_AUTHORITY_MAP.md)
- [contribution and document-impact rules](CONTRIBUTING.md)

Historical governance checkpoints retain their original facts but do not authorize
current work. Superseded contracts are isolated from the current-authority section.

## Structure

```text
docs/design-system/  ACS brand, component, layout, status and theme contracts
src/app/             Next.js App Router pages and same-origin API routes
src/components/      presentation and workflow components
src/features/        adapter, browser client and capability contract
src/layouts/         customer, workspace and editor shells
src/lib/             presentation helpers
src/styles/          global tokens and baseline styles
src/theme/           light/dark theme provider
```

## Commands

```bash
npm ci
npm test
npm run build
npm run lint
npm run typecheck
```

Copy `.env.example` to `.env.local` only for local development. All Core integration
variables remain server-only; never add a `NEXT_PUBLIC_*` equivalent.

## Next legal project boundary

```text
NEXT_TASK=ACS-PRE-WAVE-1D-FRONTEND-PRODUCTION-TRUTH-CLOSURE
OLD_WAVE_1D_COMMAND=SUPERSEDED_NOT_EXECUTED
INDEPENDENT_M12_BOUNDARY=LOCAL_WSL2_HANDOFF_AND_M12_C3_PREFLIGHT
```

Production Truth Closure requires separate authorization, followed by rewritten
Wave 1D and then Wave 2B. None starts as part of workspace integrity closure.
Wave 2A adds Adapter/contracts only;
method-aware UI, media runtime, reviewed import, identity writes and publication
remain outside this implementation.
The independent M12 handoff/preflight boundary also grants no M12-C3/C4, A100, model,
Provider/GPU, M13 Extension G0, or publication authority.
