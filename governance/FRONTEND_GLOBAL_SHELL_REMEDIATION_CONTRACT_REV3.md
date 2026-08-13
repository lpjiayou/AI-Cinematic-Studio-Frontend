# Frontend Global Shell and Route Structure — Remediation Contract (Rev. 3)

> Status: `FE-G0-R1 GOVERNANCE CHECKPOINT CANDIDATE / FE-G1-FE-G3 NOT AUTHORIZED`
>
> Date: `2026-08-14`
>
> Supersedes: Rev. 2 after Owner Review marked its implementation contract
> `REVISION REQUIRED / NOT OWNER ACCEPTED`
>
> Repository: `AI-Cinematic-Studio-Frontend`
>
> Sole application-code baseline: branch `codex/frontend-character-studio-v1`,
> SHA `1cf2515ceec6c6415cae2e21360782174525d3a5`
>
> Historical FE-G0 evidence: `df3ccf098d1b2eeaef2a21a1a397ea7fb24adceb`

## 0. Decision history

Rev. 1 is withdrawn because it treated a Next.js route group as a URL segment.

Rev. 2 corrected that factual error and was published as FE-G0 evidence, but its
Owner Review found two implementation-blocking defects:

1. it moved the current New Project page from `/create` to `/creator/create`, even
   though the UI Master Plan defines `/creator/projects/new` as New Project and
   `/creator/create` as the separate Global Creative Sandbox;
2. it removed page-owned headers in FE-G1 while leaving the pages on flat routes
   until FE-G2, so `src/app/creator/layout.tsx` could not wrap those pages.

Rev. 2 and its FE-G0 commit remain immutable historical evidence. They are not
implementation authority. Rev. 3 corrects the contract without changing application
code.

## 1. Authority and freeze boundary

The only authorized application-code baseline remains `1cf2515`. The stale GitHub
default branch `codex/frontend-landing-baseline-v1` at
`464f6ce416602d55264762e6ea9a645119843053` is not a development base.

FE-G0-R1 authorizes governance documents only. It does not authorize route,
component, style, test, configuration, workflow, dependency, lockfile or runtime
changes. Exact future allowlists are published in
[`FE-G0-R1_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md`](FE-G0-R1_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md),
but those paths remain frozen until separately authorized.

The following remain outside this contract's implementation authority:

- Experience Adapter;
- Creator Public HTTP/API integration;
- M6 data binding;
- real Project, Series or Episode state;
- Cross-Repo Gate C;
- Script Studio migration;
- FE-G1, FE-G2 and FE-G3 implementation.

No `projectRef`, `seriesRef` or `episodeRef` may be fabricated.

## 2. Frozen route semantics

Global routes:

```text
/creator                     # 首页 — Production Command Center
/creator/ai-director         # AI导演 — global discovery entry
/creator/projects            # 项目
/creator/projects/new        # 新建项目
/creator/assets              # 资产库 — unavailable until separately activated
/creator/create              # 创作中心 — Global Creative Sandbox, currently unavailable
/creator/works               # 作品 — unavailable until separately activated
```

Project-scoped routes relevant to existing pages:

```text
/creator/projects/:projectRef/overview
/creator/projects/:projectRef/planning/director
/creator/projects/:projectRef/planning/series
/creator/projects/:projectRef/planning/bible
/creator/projects/:projectRef/planning/characters
/creator/projects/:projectRef/planning/continuity
/creator/projects/:projectRef/episodes
/creator/projects/:projectRef/episodes/:episodeRef/story
/creator/projects/:projectRef/episodes/:episodeRef/script
/creator/projects/:projectRef/episodes/:episodeRef/consistency
```

`/creator` is not the public landing page. `/` remains the landing page.

### 2.1 New Project and Creation Center are different capabilities

The source at `1cf2515` proves that `/create` imports `CreateProjectPage`, presents
project-type selection and is the existing New Project experience. Its target is:

```text
/create → /creator/projects/new
```

It must never be relocated to `/creator/create`.

`/creator/create` is reserved for the Global Creative Sandbox described by the UI
Master Plan. No such capability exists in the Frontend baseline, and the later image,
video, audio and model capabilities are not authorized. The route and navigation item
therefore remain unavailable.

## 3. Verified current-state findings

All findings below are source facts at `1cf2515`:

| Finding | Evidence |
| --- | --- |
| Multiple page-owned product headers | Workspace, New Project, AI Director, Story World and Character Studio each own a header; Script Studio owns a separate deferred header |
| No shared Creator shell | `src/app/layout.tsx` contains the root theme boundary only |
| Duplicate theme controls | Theme wiring is repeated in page-owned headers |
| Flat routes | `/workspace`, `/director`, `/create`, `/story-world`, `/character-studio` |
| Current `/create` semantics | `src/app/create/page.tsx` renders `CreateProjectPage` |
| No Project-scoped route | No `[projectRef]` route exists |
| No Frontend/Core integration | No accepted Experience Adapter or Creator Public HTTP/API consumer is present |
| Typecheck defect | Root layout refers to unresolved `LayoutProps<"/">` |
| No CI workflow | `.github/workflows` is absent |

These facts do not authorize a page redesign or data integration.

## 4. Target structure after separately authorized FE-G2

```text
src/app/
├── layout.tsx
├── page.tsx
├── landing-theme-toggle.tsx
│
├── creator/
│   ├── layout.tsx
│   ├── page.tsx                                      # from /workspace
│   ├── ai-director/page.tsx                          # from /director
│   └── projects/
│       ├── page.tsx
│       ├── new/page.tsx                              # from /create
│       └── [projectRef]/
│           ├── layout.tsx
│           └── planning/
│               ├── bible/page.tsx                    # from /story-world
│               └── characters/page.tsx               # from /character-studio
│
└── script-studio/page.tsx                            # unchanged and unmigrated
```

No page is created for `/creator/create`, `/creator/assets` or `/creator/works` in
FE-G2. Those entries remain disabled capability declarations, not live placeholders.
A later separately authorized milestone may create honest empty states when the
corresponding capability activation is defined.

### 4.1 Legacy redirects

After FE-G2 relocation, legacy flat routes become temporary 307 redirects:

```typescript
async redirects() {
  return [
    { source: "/workspace", destination: "/creator", permanent: false },
    { source: "/director", destination: "/creator/ai-director", permanent: false },
    { source: "/create", destination: "/creator/projects/new", permanent: false },
    { source: "/story-world", destination: "/creator/projects", permanent: false },
    { source: "/character-studio", destination: "/creator/projects", permanent: false },
  ];
}
```

`/story-world` and `/character-studio` cannot redirect to a Project route without a
trusted `projectRef`. No Ref may be inferred from a title, name, fixture or URL.

### 4.2 Single primary-navigation definition

```typescript
export const PRIMARY_NAVIGATION = [
  { label: "首页", href: "/creator", available: true },
  { label: "AI导演", href: "/creator/ai-director", available: true },
  { label: "项目", href: "/creator/projects", available: true },
  { label: "资产库", href: "/creator/assets", available: false },
  { label: "创作中心", href: "/creator/create", available: false },
  { label: "作品", href: "/creator/works", available: false },
] as const;
```

Labels and order are frozen. Unavailable items render as genuinely disabled
navigation, not clickable "coming soon" controls. New Project is an action within
the Project Center and Production Command Center, not a seventh global navigation
entry.

### 4.3 Project Context-null rule

The `[projectRef]` route segment is a route parameter, not proof that the Project
exists. Until an accepted public contract and Experience Adapter can validate it,
the Project layout must fail closed to Context-null presentation and must not display
the parameter as an authoritative Project identity.

Existing fixture-backed page bodies remain presentation evidence only. Relocation
does not make their fixtures real domain state and does not count as Domain
integration or page completion.

### 4.4 Script Studio deferral

Script Studio stays at `/script-studio`. Its target route requires both a trusted
`projectRef` and `episodeRef`, and neither may be invented. No redirect or file under
`src/app/script-studio/**` is authorized by FE-G1 or FE-G2.

## 5. Corrected staged execution

### FE-G0-R1 — governance correction

Add Rev. 3, the corrected governance record and the Domain Alignment standard;
synchronize Core `CURRENT_MILESTONE.md`. Application and test diff remains zero.

### FE-G1 — additive Global Shell foundation

FE-G1 may create the single navigation definition, the future Creator layout, its
styles and tests, correct the root-layout typecheck defect, add CI and correct README.

FE-G1 must not:

- move any route;
- edit any existing page component, page CSS, page test or `page.tsx`;
- remove a page-owned header or per-page theme wiring;
- claim that `creator/layout.tsx` wraps the still-flat pages;
- edit `next.config.ts`;
- touch Script Studio;
- connect to Core.

FE-G1 is an additive shell foundation only. After remote verification it stops for
Owner Review.

### FE-G2 — route migration and shell cutover

Only after FE-G1 Owner Acceptance and separate FE-G2 authorization may FE-G2:

1. relocate the five flat routes into the frozen `/creator/**` structure;
2. redirect the legacy routes;
3. remove the five page-owned product headers and their header-only CSS after each
   relocated page is actually wrapped by `creator/layout.tsx`;
4. remove per-page product-header theme controls while preserving page-body theme
   reads that remain necessary for visual behavior;
5. remove hardcoded cross-page navigation;
6. add the Project list and Context-null Project layout;
7. preserve all page-body behavior outside the explicit shell cutover.

FE-G2 stops after remote verification for Owner Review.

### FE-G3 — presentation work

FE-G3 remains separately gated. It may not begin from FE-G0-R1, FE-G1 or FE-G2
without explicit Project Lead authorization.

### Later, separately authorized

Experience Adapter, Creator Public HTTP/API integration, M6 binding, real Project /
Series / Episode state and Cross-Repo Gate C remain outside FE-G0-R1–FE-G3.

## 6. Domain Alignment governance

[`FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md`](FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md)
is the normative analysis standard adopted by Rev. 3. It separates:

1. whether a Core domain fact exists and matches the page shape; and
2. whether an accepted public delivery path exists and is authorized for Frontend.

Domain backing never implies integration readiness. Route and shell work may proceed
without data integration, but it cannot upgrade a page's domain or delivery status.

## 7. Acceptance gates by stage

### FE-G0-R1

- Frontend diff contains only the three new governance documents.
- Core diff contains only `CURRENT_MILESTONE.md`.
- Application, route, component, style, test, configuration, workflow, dependency
  and lockfile diff is zero.
- Rev. 2 historical evidence is preserved and explicitly superseded.
- Markdown links, secret scan and `git diff --check` pass.
- Both branches are committed, non-force pushed and remote-verified.
- Execution stops for Project Lead FE-G0-R1 Owner Review.

### FE-G1

- Diff stays inside the exact FE-G1 allowlist.
- Primary navigation has exactly six ordered entries and the three unavailable
  destinations remain disabled.
- Existing flat pages and their headers are unchanged.
- No route relocation or redirect exists.
- Typecheck, tests, build and lint pass; CI enforces the same commands.
- Remote verification passes; execution stops for Owner Review.

### FE-G2

- Diff stays inside the exact FE-G2 allowlist.
- `/create` redirects to `/creator/projects/new`, never `/creator/create`.
- Relocated pages are wrapped by the Creator shell before page-owned product headers
  are removed.
- Script Studio remains unchanged.
- No authoritative Ref or mock production fact is fabricated.
- Tests, typecheck, build, lint and route-contract checks pass.
- Remote verification passes; execution stops for Owner Review.

Repository default-branch promotion is not an FE-G0-R1, FE-G1 or FE-G2 code action.
It requires a separate Owner-controlled repository-governance decision after an
accepted checkpoint. No stage may silently replace the GitHub default branch.

## 8. Verification method

Re-verification means checking the actual clean checkout, exact diff paths, route
destinations, navigation availability, test commands and local/remote SHAs. A status
claim inside a document is not sufficient evidence.
