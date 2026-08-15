# Frontend IA Correction and Data Boundary Contract

> Status: `AUTHORIZED / IMPLEMENTATION ACTIVE`
>
> Repository baseline: `AI-Cinematic-Studio-Frontend` `main@b4997ec`
>
> Core reference: `AI-Cinematic-Studio` `main@5976263f`
>
> Scope: customer experience routes under `/creator/**` plus the deferred flat
> `/script-studio` editor header. Internal Content Lab and Core are excluded.

## 1. Decision

The customer application uses one visual application header with three explicit
modes:

| Mode | Routes | Primary navigation |
| --- | --- | --- |
| `global` | `/creator`, AI Director, Project Center, New Project | the frozen six-item global navigation |
| `project` | `/creator/projects/[projectRef]/**` | the frozen six-item Project Workspace navigation |
| `editor` | `/script-studio` until a real `episodeRef` exists | no primary navigation; editor context and an exit affordance only |

The modes are variants of one `UnifiedAppHeader`, not separately implemented page
headers. Brand, utility controls, focus treatment, responsive behaviour and local
data disclosure remain visually consistent.

## 2. Corrected findings

Six findings are in scope:

1. Project Workspace navigation is absent.
2. Global and project destinations occupy the wrong navigation level.
3. The global banner, context bar and breadcrumb create excessive stacked chrome.
4. Project production workspaces are unnecessarily width-constrained.
5. Story World and Character Studio data is declared inside presentation modules.
6. Script Studio exposes a third, seven-item information architecture.

## 3. Navigation contract

Global labels and order remain:

`首页 / AI导演 / 项目 / 资产库 / 创作中心 / 作品`

Project labels and order remain:

`概览 / 策划 / 内容 / 制作 / 后期 / 交付`

Project navigation is defined once. An unavailable destination is a disabled item,
never a link to a route that does not exist. At this baseline, `策划` links to the
first existing planning surface; `概览`, `内容`, `制作`, `后期` and `交付` remain
visible and disabled until their route exists. Planning sub-navigation exposes the
existing Story World and Character Studio routes and keeps future destinations
disabled.

`内容` must not be renamed to `分集`. Project settings remain outside production
navigation.

## 4. Context and identity rules

The project route parameter is a routing key, not proof of authoritative project
identity. The shell may use it to construct links within the current route tree, but
must not present it as an accepted `projectRef`.

Client-side view models therefore separate:

- `clientKey`: required local UI identity;
- `projectRef`, `seriesRef`, `episodeRef`: nullable authoritative identities;
- `dataOrigin`: currently `LOCAL_FIXTURE`;
- `authoritative`: currently `false`.

No title, display name, fixture key or URL segment may be upgraded to an
authoritative Ref.

Project chrome is exactly the unified header plus one compact context row. The row
contains the local-fixture disclosure, nullable context dimensions and the active
third-level navigation. The disclosure may be compacted but not removed.

## 5. FE-G4-A — Unified Shell and IA

FE-G4-A implements:

- one `UnifiedAppHeader` with `global`, `project` and `editor` modes;
- one frozen `PROJECT_NAVIGATION` source with six entries;
- project-only primary and planning sub-navigation;
- a single compact Context-null row for project routes;
- a minimal Script Studio editor header with no seven-item navigation;
- keyboard focus, `aria-current`, `aria-disabled`, explanatory titles and horizontal
  overflow at narrow viewports.

No page body or domain data shape changes in FE-G4-A.

## 6. FE-G4-B — Data and layout boundary

FE-G4-B implements a project-scoped data boundary before page correction:

- a typed `ProjectPresentationViewModel` selected by route `clientKey`;
- a provider/container boundary keyed by that `clientKey`;
- two local fixture projects to prove project switching changes the supplied data;
- `dataOrigin=LOCAL_FIXTURE` and `authoritative=false` at the boundary;
- nullable authoritative refs throughout;
- presentation components receive data through props or the provider and may not
  import fixture modules;
- project workspace pages render full width; global presentation pages remain
  contained.

Only Story World and Character Studio are migrated in this checkpoint because they
are the two existing project-scoped production workspaces. Remaining global pages
stay presentation-only and are not falsely claimed as data-bound.

No `fetch`, Axios, HTTP client, Core API, persistence or authentication work is
authorized.

## 7. Sequencing after FE-G4-B

1. Correct Story World against the accepted Series Bible surface.
2. Correct Character Studio against the accepted character surface.
3. Do not start AI Director or Script Studio field alignment until these prerequisites
   and a real episode plan-item catalog exist.

## 8. Prohibited

- changes outside the customer frontend repository;
- changes to Internal Content Lab;
- fabricated authoritative refs;
- links to missing routes;
- removal or weakening of local-fixture disclosure;
- network integration or persistence;
- new Core fields or schema changes;
- enabling M8+ destinations;
- changing frozen colour tokens or navigation labels/order.

## 9. Acceptance

- `PROJECT_NAVIGATION` has exactly the six frozen labels in order.
- Global pages render global navigation; project pages render project navigation;
  Script Studio renders the editor variant; none render two primary navigations.
- Missing routes are disabled and non-interactive.
- Project pages render one compact context row and retain the local-fixture badge.
- Story World and Character Studio are not constrained by
  `--acs-content-max-width`.
- Two fixture client keys produce distinct view models.
- Presentation components do not import fixture modules.
- All authoritative refs remain nullable and unset for fixtures.
- No `fetch` or Axios use is introduced.
- Tests cover navigation order, mode selection, route availability, provider origin,
  project switching and Context-null behaviour.
- `npm run typecheck`, `npm test`, `npm run build` and `npm run lint` pass.

