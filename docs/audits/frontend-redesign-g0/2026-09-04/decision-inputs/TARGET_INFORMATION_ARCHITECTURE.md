# Target information architecture

Status: `G0 RECOMMENDATION / NOT FROZEN / NO IMPLEMENTATION AUTHORITY`

## Decision on the dual-mode hypothesis

| Hypothesis | Decision | Reason | Required revision |
| --- | --- | --- | --- |
| A. Quick Create | `ACCEPT_WITH_GUARDRAILS` | A bounded prompt/reference → queue → candidates flow matches lightweight creation and competitor patterns. | It must create the same server-backed Job/Candidate/Asset objects as Project mode, cannot choose `executionMethod`, and cannot imply master/publication. |
| B. Project Production | `ACCEPT_AS_PRIMARY_MODE` | Long-form cinematic work needs project context, story continuity, shots, assets, generation, timeline, review and delivery. | Navigation must use creator language rather than M1–M19 and expose runtime/authority blockers without raw internal refs by default. |

These are not two products. Quick Create is a shallow entry into the same object lifecycle; Project Production is the authoritative editing context.

## Target global navigation

`首页 | 项目 | 快速创作 | 资产 | 任务 | 作品`

| Destination | Responsibility | Must not own |
| --- | --- | --- |
| 首页 | Continue recent work, choose mode, see actionable blockers and recent jobs | Project editing, raw system diagnostics |
| 项目 | Browse/create projects and resume a project workflow | Cross-project job queue |
| 快速创作 | Bounded image/video/audio/digital-human task brief, references and candidate review | Client-selected execution method or Provider |
| 资产 | Uploads, generated candidates, admitted asset versions, rights and lineage | Silent admission or canonical selection |
| 任务 | Cross-project queued/running/blocked/failed jobs and recovery | Rendering blocked as success |
| 作品 | Restricted deliveries and approved masters when available | PreviewCandidate presented as Master; publication without authority |

AI Director becomes contextual assistance in Home, Project Overview and relevant planning workspaces, not a permanent global peer of Projects/Assets/Tasks.

## Target project navigation

`概览 | 故事 | 剧本 | 角色 | 分镜 | 生成 | 音频 | 剪辑 | 审片 | 交付`

| Destination | Primary objects | Current posture |
| --- | --- | --- |
| 概览 | readiness, blockers, recent work, next safe action | New page required |
| 故事 | series plan, bible, continuity facts | Consolidate M5/M6 surfaces |
| 剧本 | workspace, versions, reviewed import, confirmation | Reuse Script Studio core |
| 角色 | identity, appearance, relationships, continuity | Reuse Character Studio core |
| 分镜 | scenes, shots, shot graph, server method plan | New method-aware surface |
| 生成 | input plan, candidates, revisions, selection/admission | Rebuild primary production workspace |
| 音频 | explicit requirements, voice/FX/music needs, blocked runtime | New read-only/blocked-first surface |
| 剪辑 | timeline, tracks, clips, effects, RenderCandidate | New M13 surface |
| 审片 | preview, QC, comments, approvals, local regeneration | Refactor current Post surface |
| 交付 | master eligibility, restricted export, evidence | Retain fail-closed behavior |

## Layout model

1. **Compact global rail/header** — mode and cross-project destinations only.
2. **Project context bar** — title, episode, branch/version state, readiness and collaborator context.
3. **Project navigator** — the ten creator-language destinations above; no milestone IDs.
4. **Primary canvas** — one task at a time, maximized for script, storyboard, candidates or timeline.
5. **Contextual inspector** — selected object properties only.
6. **Authority/evidence disclosure** — a persistent compact status that expands to exact Core evidence, refs and digests for expert inspection.
7. **Bottom job shelf** — active jobs and failures; expands into Tasks without occupying the entire inspector.

## Object model exposed to users

| User object | User-facing state examples | Hidden-by-default technical detail |
| --- | --- | --- |
| Project | Draft, Ready for story, Blocked | projectRef, workspaceRef |
| Script version | Draft, Review needed, Confirmed, Stale | digest, actor-bound acceptance refs |
| Shot | Needs planning, Ready for inputs, Blocked | execution plan version ref |
| Requirement | Image required, Audio not required, Contact runtime unavailable | executionClass enum and route evidence |
| Candidate | Generating, Ready to review, QC failed, Selected | job/queue/provider refs |
| Asset version | Candidate, Selected, Admitted, Superseded | canonical refs and lineage digests |
| Timeline | Draft, Stale inputs, Candidate created | timeline version/edit refs |
| Delivery | Not eligible, Restricted, Master approved | export refs and evidence hashes |

Exact technical values remain accessible for evidence and support, but are never the only explanation.

## Authority rules

- Browser → Frontend Experience Adapter → Creator Public HTTP/API → Core remains mandatory.
- The browser cannot access Core directly, receive a Core token, mint authority refs or select `executionMethod`.
- Capabilities are rendered from server state plus repository-declared UI support. Unknown states fail closed.
- `LOCAL_FIXTURE` may be used only in explicit test/evidence mode and is never a silent runtime fallback.
- Candidate, selected asset, admitted asset, PreviewCandidate, Master and published work remain distinct.
- Historical G4/G5 reads remain reachable from an “历史兼容记录” view; legacy writes do not return as primary actions.

## Responsive strategy

- **≥1440 px:** global rail, project navigator, canvas and inspector can coexist; inspector is collapsible.
- **768–1439 px:** project navigator becomes a compact rail; only one of navigator/inspector may be expanded over the canvas.
- **≤767 px / 390 px target:** Home, Quick Create, Tasks, candidate review, blocker inspection and lightweight approvals are first-class. Script/storyboard/timeline preserve a single canvas with drawers. Complex multi-track editing is tablet/desktop-first, not a squeezed desktop clone.

## Disposition

`CURRENT_INFORMATION_ARCHITECTURE_DISPOSITION=REPLACE_WITH_DUAL_MODE_PROJECT_FIRST_SHELL`

The current top-nav taxonomy can provide migration aliases, but the target IA should be frozen in a separate decision checkpoint before code changes.
