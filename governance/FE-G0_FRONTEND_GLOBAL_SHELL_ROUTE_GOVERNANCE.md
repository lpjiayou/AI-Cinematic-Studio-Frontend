# FE-G0 — Frontend Global Shell and Route Governance

> Status: `CHECKPOINT CANDIDATE / PROJECT LEAD OWNER REVIEW REQUIRED`
>
> Date: `2026-08-13`
>
> Repository: `lpjiayou/AI-Cinematic-Studio-Frontend`
>
> Authorized baseline branch: `codex/frontend-character-studio-v1`
>
> Authorized baseline SHA: `1cf2515ceec6c6415cae2e21360782174525d3a5`
>
> Checkpoint branch: `governance/fe-g0-global-shell-route-rev2`

## 1. Project Lead decision

The Project Lead accepts
[`FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV2.md`](FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV2.md)
as the normative Global Shell and route-remediation contract. Rev. 1 is withdrawn
because it incorrectly treated a Next.js route group as a URL segment.

The approved source attachment has SHA-256:

`0b430d0ead437173b935ec8abc4689c8819790c3b16f62e23fb3b5f8cf3f6130`

The GitHub default branch `codex/frontend-landing-baseline-v1` at
`464f6ce416602d55264762e6ea9a645119843053` is stale. It is not an authorized
development base. FE-G0 does not change repository default-branch settings.

## 2. Exact FE-G0 authority

The blanket Frontend freeze is lifted only for this governance checkpoint.

Authorized Frontend paths:

- `governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV2.md` — add;
- `governance/FE-G0_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md` — add.

Authorized synchronized Core path in `lpjiayou/AI-Cinematic-Studio`:

- `CURRENT_MILESTONE.md` — modify only the active Frontend governance state.

FE-G0 authorizes no application, route, component, style, test, configuration,
dependency, lockfile, workflow or runtime change. Publication of the FE-G1 and FE-G2
allowlists below is governance evidence only; it does not authorize those paths to be
edited.

## 3. Freeze state after FE-G0

| Scope | State |
| --- | --- |
| FE-G0 governance documents | `LIMITED UNFREEZE / AUTHORIZED` |
| FE-G1 Global Shell implementation | `NOT AUTHORIZED` |
| FE-G2 route migration | `NOT AUTHORIZED` |
| FE-G3 presentation work | `NOT AUTHORIZED` |
| Experience Adapter | `FROZEN / NOT AUTHORIZED` |
| Creator Public HTTP/API integration | `FROZEN / NOT AUTHORIZED` |
| M6 data binding | `FROZEN / NOT AUTHORIZED` |
| Real Project/Series/Episode state | `FROZEN / NOT AUTHORIZED` |
| Cross-Repo Gate C | `FROZEN / NOT AUTHORIZED` |

No `projectRef`, `seriesRef` or `episodeRef` may be fabricated. Script Studio stays
at `/script-studio` and every path under `src/app/script-studio/` remains excluded
from FE-G1 and FE-G2.

## 4. FE-G1 exact future allowlist

This list becomes writable only after a separate Project Lead FE-G1 authorization.
Any required path outside this list is a stop condition.

### Add

- `.github/workflows/frontend-ci.yml`
- `src/app/creator/global-shell.module.css`
- `src/app/creator/layout.test.tsx`
- `src/app/creator/layout.tsx`
- `src/lib/navigation.test.ts`
- `src/lib/navigation.ts`

### Modify

- `README.md`
- `src/app/layout.tsx`
- `src/app/workspace/workspace-home.module.css`
- `src/app/workspace/workspace-home.test.tsx`
- `src/app/workspace/workspace-home.tsx`
- `src/app/director/ai-director.module.css`
- `src/app/director/ai-director.test.tsx`
- `src/app/director/ai-director.tsx`
- `src/app/create/create-project.module.css`
- `src/app/create/create-project.test.tsx`
- `src/app/create/create-project.tsx`
- `src/app/story-world/story-world.module.css`
- `src/app/story-world/story-world.test.tsx`
- `src/app/story-world/story-world.tsx`
- `src/app/character-studio/character-studio.module.css`
- `src/app/character-studio/character-studio.test.tsx`
- `src/app/character-studio/character-studio.tsx`

### Delete

None. The five page-owned Header implementations are embedded in the listed page
components; FE-G1 may remove only those Header/theme sections and header-only CSS.

### FE-G1 exclusions

FE-G1 does not move routes, edit `next.config.ts`, edit any `page.tsx` route entry,
change page-body behavior, create placeholders, touch Script Studio, or connect to
Core. The Global Shell must use exactly one primary-navigation definition with the
six frozen labels and `/creator/**` destinations.

## 5. FE-G2 exact future allowlist

This list becomes writable only after FE-G1 is remote-verified, Owner Reviewed and a
separate Project Lead FE-G2 authorization is recorded. Any required path outside
this list is a stop condition.

### Modify

- `next.config.ts`
- `src/app/creator/layout.tsx`

### Relocate: Production Command Center

- `src/app/workspace/page.tsx` → `src/app/creator/page.tsx`
- `src/app/workspace/workspace-home.module.css` → `src/app/creator/workspace-home.module.css`
- `src/app/workspace/workspace-home.test.tsx` → `src/app/creator/workspace-home.test.tsx`
- `src/app/workspace/workspace-home.tsx` → `src/app/creator/workspace-home.tsx`

### Relocate: AI Director

- `src/app/director/page.tsx` → `src/app/creator/ai-director/page.tsx`
- `src/app/director/ai-director.module.css` → `src/app/creator/ai-director/ai-director.module.css`
- `src/app/director/ai-director.test.tsx` → `src/app/creator/ai-director/ai-director.test.tsx`
- `src/app/director/ai-director.tsx` → `src/app/creator/ai-director/ai-director.tsx`

### Relocate: Create

- `src/app/create/page.tsx` → `src/app/creator/create/page.tsx`
- `src/app/create/create-project.module.css` → `src/app/creator/create/create-project.module.css`
- `src/app/create/create-project.test.tsx` → `src/app/creator/create/create-project.test.tsx`
- `src/app/create/create-project.tsx` → `src/app/creator/create/create-project.tsx`

### Relocate: Story World to Project Bible

- `src/app/story-world/page.tsx` → `src/app/creator/projects/[projectRef]/planning/bible/page.tsx`
- `src/app/story-world/story-world.module.css` → `src/app/creator/projects/[projectRef]/planning/bible/story-world.module.css`
- `src/app/story-world/story-world.test.tsx` → `src/app/creator/projects/[projectRef]/planning/bible/story-world.test.tsx`
- `src/app/story-world/story-world.tsx` → `src/app/creator/projects/[projectRef]/planning/bible/story-world.tsx`

### Relocate: Character Studio to Project Characters

- `src/app/character-studio/page.tsx` → `src/app/creator/projects/[projectRef]/planning/characters/page.tsx`
- `src/app/character-studio/character-studio.module.css` → `src/app/creator/projects/[projectRef]/planning/characters/character-studio.module.css`
- `src/app/character-studio/character-studio.test.tsx` → `src/app/creator/projects/[projectRef]/planning/characters/character-studio.test.tsx`
- `src/app/character-studio/character-studio.tsx` → `src/app/creator/projects/[projectRef]/planning/characters/character-studio.tsx`

### Add: Project list and Context-null Shell

- `src/app/creator/projects/page.tsx`
- `src/app/creator/projects/projects-page.module.css`
- `src/app/creator/projects/projects-page.test.tsx`
- `src/app/creator/projects/[projectRef]/layout.tsx`
- `src/app/creator/projects/[projectRef]/project-context-bar.module.css`
- `src/app/creator/projects/[projectRef]/layout.test.tsx`

### Add: explicitly unavailable global destinations

- `src/app/creator/assets/page.tsx`
- `src/app/creator/assets/assets-empty-state.module.css`
- `src/app/creator/assets/page.test.tsx`
- `src/app/creator/works/page.tsx`
- `src/app/creator/works/works-empty-state.module.css`
- `src/app/creator/works/page.test.tsx`

### Add: route contract regression

- `src/app/creator/route-contract.test.ts`

### FE-G2 exclusions

- `src/app/script-studio/**` is excluded and `/script-studio` receives no redirect.
- No `/episodes/:episodeRef/**` route is created.
- No mock Project, Series, Episode, asset or work is presented as authoritative data.
- Legacy flat routes become temporary 307 redirects only. `/story-world` and
  `/character-studio` redirect to `/creator/projects`; no Ref is synthesized.
- No Experience Adapter, API client, `fetch()` integration, M6 binding, auth,
  persistence, provider, GPU, Worker or ComfyUI path is authorized.

## 6. Checkpoint gates

FE-G0 passes only when:

1. the Frontend diff contains exactly the two authorized governance files;
2. the Core diff contains exactly `CURRENT_MILESTONE.md`;
3. production, test, route, config, dependency and lockfile diffs are zero;
4. the approved attachment hash and sole baseline are recorded accurately;
5. Markdown local links, secret scan and `git diff --check` pass;
6. both repositories are committed and non-force pushed;
7. each local SHA equals its remote branch SHA, ahead/behind is `0/0`, and each
   worktree is clean;
8. execution stops for Project Lead FE-G0 Owner Review.

FE-G0 completion is not FE-G1 acceptance or implementation authority.
