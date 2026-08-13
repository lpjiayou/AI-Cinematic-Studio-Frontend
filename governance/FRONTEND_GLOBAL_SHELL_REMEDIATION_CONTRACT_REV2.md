# Frontend Global Shell and Route Structure — Remediation Contract (Rev. 2)

> Status: `ACCEPTED FOR FE-G0 GOVERNANCE / FE-G1-FE-G3 IMPLEMENTATION NOT AUTHORIZED`
>
> Supersedes: Rev. 1 of this contract
>
> Repository: `AI-Cinematic-Studio-Frontend`
>
> Baseline: branch `codex/frontend-character-studio-v1`, tip `1cf2515` — the sole
> valid baseline. The GitHub default branch `codex/frontend-landing-baseline-v1`
> (`464f6ce`, 2 commits) is stale and must not be built from.
>
> **Authorization note:** The Project Lead accepted this revision on 2026-08-13
> for FE-G0 governance only. The Frontend freeze is lifted only for the exact
> documentation checkpoint recorded in
> `FE-G0_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md`. FE-G1, FE-G2 and FE-G3
> implementation remain unauthorized and require separate Owner Review and
> authorization.

## 0. What changed from Rev. 1

Rev. 1 contained a **factual error in the route design** and is withdrawn on that
point. It proposed Next.js route groups — `(creator)/workspace/page.tsx` — believing
they would produce `/creator/...` URLs. They do not: parenthesised route group names
organise files only and are stripped from the URL, so that structure would have kept
generating `/workspace`, not `/creator`. The frozen route contract requires a real
`/creator` path segment.

Corrected in this revision:

- real directory `src/app/creator/**`, not a route group;
- every primary navigation `href` now points at a frozen `/creator/**` route;
- legacy flat routes are explicitly demoted to redirects rather than left in place;
- `/creator` (Production Command Center) is distinguished from `/` (Landing).

Rev. 1's non-route conclusions stand unchanged and are carried forward: build the
shared shell first, do not rebuild the page bodies, and do not fabricate refs.

## 1. Frozen route contract (source: UI Master Plan §2354–2422)

Global:

```text
/creator                     # 首页 — Production Command Center (NOT the landing page)
/creator/ai-director         # AI导演 — global discovery entry
/creator/projects            # 项目
/creator/projects/new
/creator/assets              # 资产库
/creator/create              # 创作中心
/creator/works               # 作品
```

Project-scoped (subset relevant to existing pages):

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

Production / post / delivery routes are also frozen but correspond to unbuilt
milestones (M8+) and are out of scope here.

**`/creator` is not the landing page.** UI Master Plan §424 states this explicitly:
首页 is the Production Command Center, i.e. today's `/workspace`. The public
marketing landing page has no entry in the frozen contract and stays at `/`.

## 2. Verified findings (unchanged from Rev. 1)

All checked directly against the source tree at `1cf2515`.

| Finding | Evidence |
| --- | --- |
| Six independently-written page headers | `WorkspaceHeader`, `CreateProjectHeader`, `AIDirectorHeader`, `StoryWorldHeader`, `CharacterStudioHeader`, plus `EditorLayout`'s inline header |
| No global shell | `src/app/layout.tsx` — zero matches for `nav`/`Sidebar` |
| Theme toggle duplicated 7× | `useACSTheme`/`toggleTheme` wired in all 6 app pages + `landing-theme-toggle.tsx` |
| Nav contradicts frozen spec | `/workspace` declares **7** items (工作台首页/AI导演/项目工坊/系列规划/剧本与分镜/资产库/成片交付); frozen spec is **6** (首页/AI导演/项目/资产库/创作中心/作品) |
| 5 of 7 nav items are non-functional | Rendered as `<button>` opening a "will open in the corresponding space" notice, despite `/director`, `/story-world`, `/character-studio` existing as real pages |
| Hardcoded back-navigation | `CharacterStudioHeader` hardcodes `router.push("/story-world")`; `/story-world` never links to it |
| Zero Project-scoped routes | No `[projectRef]` segment anywhere |
| Presentation-only | Zero `fetch()` calls; Script Studio uses a local fixture service |
| `npm run typecheck` fails | `src/app/layout.tsx(21,50): error TS2304: Cannot find name 'LayoutProps'` |
| No CI | No `.github/workflows`; the 63 tests are not enforced |

## 3. Target structure

```text
src/app/
├── layout.tsx                          # root: ThemeProvider only
├── page.tsx                            # Landing (stays at /)
├── landing-theme-toggle.tsx            # landing keeps its own toggle
│
├── creator/
│   ├── layout.tsx                      # NEW: the single Global Shell
│   ├── page.tsx                        # 首页 ← from /workspace
│   ├── ai-director/page.tsx            # ← from /director
│   ├── create/page.tsx                 # ← from /create
│   ├── projects/
│   │   ├── page.tsx                    # 项目 (list; new)
│   │   └── [projectRef]/
│   │       ├── layout.tsx              # NEW: Project Context Bar
│   │       └── planning/
│   │           ├── bible/page.tsx      # ← from /story-world
│   │           └── characters/page.tsx # ← from /character-studio
│   ├── assets/page.tsx                 # 资产库 (placeholder; see §3.3)
│   └── works/page.tsx                  # 作品 (placeholder; see §3.3)
│
└── script-studio/page.tsx              # UNCHANGED this pass — see §3.4
```

### 3.1 Legacy route redirects

Old flat routes must not remain as parallel live routes. Demote them to redirects in
`next.config.ts`, so existing links and any external references still resolve:

```typescript
async redirects() {
  return [
    { source: "/workspace",  destination: "/creator", permanent: false },
    { source: "/director",   destination: "/creator/ai-director", permanent: false },
    { source: "/create",     destination: "/creator/create", permanent: false },
    // /story-world and /character-studio are Project-scoped; with no projectRef
    // available they cannot be redirected to a concrete target. Send them to the
    // project list rather than fabricating a ref:
    { source: "/story-world",      destination: "/creator/projects", permanent: false },
    { source: "/character-studio", destination: "/creator/projects", permanent: false },
  ];
}
```

Use `permanent: false` (307). These are transitional while Project context is being
established; a 308 would be cached by browsers and hard to undo.

### 3.2 Single navigation source

```typescript
// src/lib/navigation.ts — the only place primary navigation is defined
export const PRIMARY_NAVIGATION = [
  { label: "首页",     href: "/creator",             available: true  },
  { label: "AI导演",   href: "/creator/ai-director",  available: true  },
  { label: "项目",     href: "/creator/projects",     available: true  },
  { label: "资产库",   href: "/creator/assets",       available: false },
  { label: "创作中心", href: "/creator/create",       available: true  },
  { label: "作品",     href: "/creator/works",        available: false },
] as const;
```

Order and labels are frozen (UI Master Plan §291). Exactly six entries.

### 3.3 Unavailable destinations

资产库 and 作品 have no implementation. Render them as `aria-disabled="true"` with a
`title` stating they are not yet available — **not** as buttons that open a
"coming soon" notice. A disabled control honestly says the capability does not exist;
a clickable notice implies it does, which is the pattern UI Master Plan forbids for
capabilities that already exist. The four available entries must navigate for real.

If placeholder pages are created at `/creator/assets` and `/creator/works` to avoid
404s, they must render an explicit empty state — no mock inventory, no fake works.

### 3.4 Script Studio deferral

The frozen path is `/creator/projects/:projectRef/episodes/:episodeRef/script`. No
Episode selection UI exists, so migrating now would require inventing an
`episodeRef` — forbidden ("禁止在 Browser 中创造权威 Ref"). Script Studio therefore
**stays at `/script-studio` in this pass**, with no redirect, and migrates in a later
slice once Episode context exists. This is a deliberate deferral recorded here so it
is not mistaken for an oversight.

### 3.5 Project Context Bar

`creator/projects/[projectRef]/layout.tsx` renders the Context Bar (Project / Series /
Episode / Stage / Object / Version). Because Core's Public API has no auth and binds
only to `127.0.0.1`, there is no authoritative data source yet. This layout must
render the **Context-null Shell**: real bar structure, explicit empty states, no
fabricated `projectRef`/`seriesRef`/`episodeRef`, no mock project data presented as
real.

## 4. Staged execution

**FE-G0 — Governance revision.** Accept this Rev. 2 contract; record the bounded
freeze lift with `1cf2515` as sole baseline; publish the file allowlist for FE-G1 and
FE-G2. No code changes.

**FE-G1 — Global Shell.** Create `src/lib/navigation.ts` and `creator/layout.tsx`.
Delete the five page-owned `*Header` components and their header-only CSS. Remove
per-page theme wiring. Fix the `LayoutProps` typecheck failure. Add CI running
`npm test`, `npm run build`, `npm run lint`, `npm run typecheck`. Page bodies
unchanged. Routes not yet moved.

**FE-G2 — Route migration.** Move pages into `src/app/creator/**`; add
`[projectRef]` segments and the Context-null Project layout; add the §3.1 redirects;
remove hardcoded back-navigation so breadcrumbs derive from route position.

**FE-G3 — Presentation-only page work.** Further page development may resume.

**Later, separately authorized.** Experience Adapter, Creator Public HTTP/API
integration, M6 data binding, real Project/Series/Episode state, Cross-Repo Gate C.
None of this is in scope here, and none of it is unlocked by FE-G0–G3.

Splitting shell (G1) from routes (G2) keeps each diff reviewable: G1 changes what
wraps every page without moving any file; G2 moves files without changing what wraps
them. A combined pass would make regressions hard to attribute.

## 5. Acceptance checklist

- [ ] `PRIMARY_NAVIGATION` defined in exactly one file; exactly six entries; labels
      and order match UI Master Plan §291.
- [ ] Every `href` in it matches a frozen `/creator/**` route.
- [ ] No `*Header` component remains in `src/app/*/`; no per-page theme wiring.
- [ ] `src/app/creator/layout.tsx` exists and is the only navigation renderer.
- [ ] `/creator`, `/creator/ai-director`, `/creator/create` resolve; `/workspace`,
      `/director`, `/create` return 307 redirects.
- [ ] `bible` and `characters` resolve under
      `/creator/projects/[projectRef]/planning/`.
- [ ] `/script-studio` unchanged; no `episodeRef` invented anywhere.
- [ ] No fabricated `projectRef`; Context-null Shell renders for absent context.
- [ ] Unavailable nav entries are `aria-disabled`, not "coming soon" buttons.
- [ ] `npm run typecheck` passes from a clean checkout.
- [ ] `npm test`, `npm run build`, `npm run lint` pass; test count ≥ 63.
- [ ] CI workflow exists and passes.
- [ ] README corrected — it currently claims the repo "intentionally contains no
      business pages, navigation behavior, domain models" while shipping six.
- [ ] A `main` branch containing this work exists and is the GitHub default.

## 6. Verification method

Re-verification means running §5 directly against the repository: pull the branch,
run the greps, run the four npm scripts, check the redirects resolve, read the diffs.
Not reading a status claim about it. This is the method used on Core's
`ACS-ARCH-R1-V5-TEXT-GENERATION-G1` and `ACS-M6-P3-B1-R1`, where a claimed defect was
confirmed by reverting the fix and reproducing the failure — the same standard
applies here.
