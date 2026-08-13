# FE-G0-R1 — Frontend Global Shell and Route Governance Revision

> Status: `CHECKPOINT CANDIDATE / PROJECT LEAD OWNER REVIEW REQUIRED`
>
> Date: `2026-08-14`
>
> Repository: `lpjiayou/AI-Cinematic-Studio-Frontend`
>
> Sole application-code baseline branch: `codex/frontend-character-studio-v1`
>
> Sole application-code baseline SHA:
> `1cf2515ceec6c6415cae2e21360782174525d3a5`
>
> Historical FE-G0 checkpoint:
> `df3ccf098d1b2eeaef2a21a1a397ea7fb24adceb`
>
> FE-G0-R1 checkpoint branch: `governance/fe-g0-r1-global-shell-route-rev3`

## 1. Owner Review disposition of FE-G0 / Rev. 2

The original FE-G0 Git scope and remote evidence passed, but Rev. 2 was not Owner
Accepted because:

1. `/create` was incorrectly targeted at `/creator/create` instead of the New Project
   route `/creator/projects/new`;
2. FE-G1 removed page-owned headers before FE-G2 moved the pages under
   `src/app/creator/layout.tsx`.

The historical Frontend checkpoint `df3ccf0` and synchronized Core checkpoint
`61a94cd41e56d651d057c5f9529aef6adf5ede85` are preserved as immutable evidence with
the disposition:

`REVISION REQUIRED / NOT OWNER ACCEPTED / SUPERSEDED FOR IMPLEMENTATION BY REV. 3`

No historical commit is rewritten or force-pushed.

## 2. Exact FE-G0-R1 authority

The Project Lead authorized a governance-only Rev. 3 correction on `2026-08-14`.

Authorized Frontend additions:

- `governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV3.md`;
- `governance/FE-G0-R1_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md`;
- `governance/FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md`.

Authorized synchronized Core modification in `lpjiayou/AI-Cinematic-Studio`:

- `CURRENT_MILESTONE.md` — Frontend governance state only.

No other path is authorized. FE-G0-R1 has zero application, route, component, style,
test, configuration, workflow, dependency, lockfile or runtime authority.

## 3. Corrected decisions

Rev. 3 freezes these corrections:

- current `/create` New Project page → `/creator/projects/new`;
- legacy `/create` → temporary 307 redirect to `/creator/projects/new`;
- `/creator/create` remains reserved for the separate Global Creative Sandbox and is
  unavailable;
- FE-G1 is additive and leaves all current page-owned headers in place;
- FE-G2 performs route relocation first, then removes the five page-owned product
  headers during the same shell-cutover checkpoint;
- Domain backing and Frontend delivery readiness are separate classifications;
- default-branch promotion is a separate Owner-controlled repository action;
- Script Studio remains at `/script-studio`.

## 4. Freeze state after FE-G0-R1

| Scope | State |
| --- | --- |
| FE-G0-R1 governance documents | `LIMITED UNFREEZE / AUTHORIZED` |
| Rev. 3 | `CHECKPOINT CANDIDATE / OWNER REVIEW REQUIRED` |
| FE-G1 Global Shell foundation | `NOT AUTHORIZED` |
| FE-G2 route migration and shell cutover | `NOT AUTHORIZED` |
| FE-G3 presentation work | `NOT AUTHORIZED` |
| Experience Adapter | `FROZEN / NOT AUTHORIZED` |
| Creator Public HTTP/API integration | `FROZEN / NOT AUTHORIZED` |
| M6 data binding | `FROZEN / NOT AUTHORIZED` |
| Real Project/Series/Episode state | `FROZEN / NOT AUTHORIZED` |
| Cross-Repo Gate C | `FROZEN / NOT AUTHORIZED` |
| Script Studio migration | `DEFERRED / NOT AUTHORIZED` |

No `projectRef`, `seriesRef` or `episodeRef` may be fabricated.

## 5. FE-G1 exact future allowlist

This allowlist becomes writable only after Project Lead Owner Acceptance of FE-G0-R1
and a separate explicit FE-G1 authorization. Any required path outside it is a stop
condition.

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

### Delete or relocate

None.

### FE-G1 mandatory behavior

- define exactly one `PRIMARY_NAVIGATION` source with six frozen labels and order;
- mark 首页, AI导演 and 项目 available;
- mark 资产库, 创作中心 and 作品 unavailable;
- create and unit-test the future Creator Global Shell;
- correct the root-layout `LayoutProps` typecheck failure without changing root
  product behavior;
- add CI for tests, build, lint and typecheck;
- correct README claims that contradict the shipped pages;
- leave every current flat route, page component, page CSS, page test and page-owned
  header unchanged.

### FE-G1 exclusions

- no `page.tsx` edit;
- no existing page component, CSS or test edit;
- no `next.config.ts` edit;
- no route move or redirect;
- no removal of page-owned headers or per-page theme wiring;
- no Script Studio edit;
- no placeholder page;
- no Core, Experience Adapter, API, persistence or provider integration.

FE-G1 must not claim that `src/app/creator/layout.tsx` wraps still-flat pages. It is
an additive shell foundation and stops after remote verification for Owner Review.

## 6. FE-G2 exact future allowlist

This allowlist becomes writable only after FE-G1 is remote-verified, Owner Accepted
and separately authorized as FE-G2. Any required path outside it is a stop condition.

### Modify existing FE-G1 infrastructure

- `next.config.ts`
- `src/app/creator/global-shell.module.css`
- `src/app/creator/layout.test.tsx`
- `src/app/creator/layout.tsx`
- `src/lib/navigation.test.ts`
- `src/lib/navigation.ts`

### Relocate and shell-cut over: Production Command Center

- `src/app/workspace/page.tsx` → `src/app/creator/page.tsx`
- `src/app/workspace/workspace-home.module.css` → `src/app/creator/workspace-home.module.css`
- `src/app/workspace/workspace-home.test.tsx` → `src/app/creator/workspace-home.test.tsx`
- `src/app/workspace/workspace-home.tsx` → `src/app/creator/workspace-home.tsx`

### Relocate and shell-cut over: AI Director

- `src/app/director/page.tsx` → `src/app/creator/ai-director/page.tsx`
- `src/app/director/ai-director.module.css` → `src/app/creator/ai-director/ai-director.module.css`
- `src/app/director/ai-director.test.tsx` → `src/app/creator/ai-director/ai-director.test.tsx`
- `src/app/director/ai-director.tsx` → `src/app/creator/ai-director/ai-director.tsx`

### Relocate and shell-cut over: New Project

- `src/app/create/page.tsx` → `src/app/creator/projects/new/page.tsx`
- `src/app/create/create-project.module.css` → `src/app/creator/projects/new/create-project.module.css`
- `src/app/create/create-project.test.tsx` → `src/app/creator/projects/new/create-project.test.tsx`
- `src/app/create/create-project.tsx` → `src/app/creator/projects/new/create-project.tsx`

No source file from `src/app/create/**` may move to `src/app/creator/create/**`.

### Relocate and shell-cut over: Story World to Project Bible

- `src/app/story-world/page.tsx` → `src/app/creator/projects/[projectRef]/planning/bible/page.tsx`
- `src/app/story-world/story-world.module.css` → `src/app/creator/projects/[projectRef]/planning/bible/story-world.module.css`
- `src/app/story-world/story-world.test.tsx` → `src/app/creator/projects/[projectRef]/planning/bible/story-world.test.tsx`
- `src/app/story-world/story-world.tsx` → `src/app/creator/projects/[projectRef]/planning/bible/story-world.tsx`

### Relocate and shell-cut over: Character Studio to Project Characters

- `src/app/character-studio/page.tsx` → `src/app/creator/projects/[projectRef]/planning/characters/page.tsx`
- `src/app/character-studio/character-studio.module.css` → `src/app/creator/projects/[projectRef]/planning/characters/character-studio.module.css`
- `src/app/character-studio/character-studio.test.tsx` → `src/app/creator/projects/[projectRef]/planning/characters/character-studio.test.tsx`
- `src/app/character-studio/character-studio.tsx` → `src/app/creator/projects/[projectRef]/planning/characters/character-studio.tsx`

### Add: Project list and Context-null Project shell

- `src/app/creator/projects/page.tsx`
- `src/app/creator/projects/projects-page.module.css`
- `src/app/creator/projects/projects-page.test.tsx`
- `src/app/creator/projects/[projectRef]/layout.tsx`
- `src/app/creator/projects/[projectRef]/project-context-bar.module.css`
- `src/app/creator/projects/[projectRef]/layout.test.tsx`

### Add: route-contract regression

- `src/app/creator/route-contract.test.ts`

### FE-G2 mandatory behavior

- relocate a page under `src/app/creator/**` before relying on the Creator layout;
- remove only the five relocated page-owned product headers, their header-only CSS
  and their product-header theme controls;
- preserve page-body theme reads where they still drive visuals;
- preserve page-body behavior outside the explicit shell cutover;
- redirect `/workspace` → `/creator`;
- redirect `/director` → `/creator/ai-director`;
- redirect `/create` → `/creator/projects/new`;
- redirect `/story-world` and `/character-studio` → `/creator/projects`;
- use temporary 307 redirects only;
- keep `/creator/create`, `/creator/assets` and `/creator/works` unavailable with no
  FE-G2 placeholder page;
- fail closed to Context-null presentation when authoritative Project context is not
  available.

### FE-G2 exclusions

- `src/app/script-studio/**` is excluded and `/script-studio` receives no redirect;
- no `/episodes/:episodeRef/**` route is created;
- no Project, Series, Episode, asset, work, state or Ref is fabricated;
- no fixture is upgraded to authoritative production data by route relocation;
- no Experience Adapter, API client, `fetch()` integration, M6 binding, auth,
  persistence, provider, GPU, Worker or ComfyUI path is authorized;
- no `/creator/create/page.tsx`, `/creator/assets/page.tsx` or
  `/creator/works/page.tsx` is added;
- no repository default-branch setting is changed.

## 7. Domain Alignment adoption

[`FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md`](FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md)
is adopted as the normative candidate for future page-alignment records. It does not
authorize those records or any page/data change.

The reviewed supplementary proposal has SHA-256
`9cd23faeffcaea5745b79b23226f317e178459cf583edf5b4eee4d590d10e731` and disposition
`REVISION REQUIRED / CORRECTED BY THE REPOSITORY STANDARD`.

Its binding decisions are:

- two-axis classification: Domain fit plus delivery stage;
- centralized records under `governance/domain-alignment/` when allowlisted;
- raw region counts instead of an undefined Tier-C percentage;
- re-review only on relevant contract/page/integration changes;
- Character relationship is B;
- textual visual identity and identity-binding references are B, while unresolved
  image/asset presentation is C;
- Story World mappings that need Refs are B;
- Script Studio storyboard bootstrap owns the
  `storyboardProductionAuthorized: false` attribution.

## 8. FE-G0-R1 checkpoint gates

FE-G0-R1 passes only when:

1. Frontend diff from `df3ccf0` contains exactly the three authorized governance
   additions;
2. aggregate Frontend diff from application baseline `1cf2515` contains only the two
   historical FE-G0 documents plus the three R1 documents;
3. Core diff from `61a94cd` contains exactly `CURRENT_MILESTONE.md`;
4. production, route, component, style, test, config, workflow, dependency and
   lockfile diff is zero;
5. Markdown local links, secret scan and `git diff --check` pass;
6. both repositories are committed and non-force pushed;
7. local SHA equals remote branch SHA, ahead/behind is `0/0`, and worktrees are clean;
8. execution stops for Project Lead FE-G0-R1 Owner Review.

FE-G0-R1 completion is not FE-G1 acceptance or implementation authority.

## 9. Next-stage rule

After FE-G0-R1 remote verification:

```text
STOP — FE-G0-R1 REV.3 GOVERNANCE CHECKPOINT CANDIDATE
PROJECT LEAD OWNER REVIEW REQUIRED
FE-G1 NOT AUTHORIZED / NOT STARTED
```

Only a later explicit Project Lead decision may Owner Accept FE-G0-R1 and authorize
the exact FE-G1 allowlist.
