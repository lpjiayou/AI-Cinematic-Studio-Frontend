# K2 G7 Connected Production Workspace Contract

> Status: `IMPLEMENTED TECHNICAL CANDIDATE / BROWSER GATE HOLD`
>
> Date: `2026-08-17`
>
> Scope: one authenticated K2 single-episode closure only.

## 1. Authorization and supersession

The current G0→G7 authorization supersedes earlier Frontend prohibitions against
new production routes, public HTTP integration, and enabling the project-level
`制作 / 后期 / 交付` destinations, but only for the bounded K2 single-episode
workflow in this document.

It does not generally open M7–M15, batch production, publication, release,
commercial providers, GPU execution, or global `资产库 / 创作中心 / 作品` routes.
Older documents remain historical evidence outside this exact exception.

## 2. Dependency direction

```text
Frontend production workspace
→ server-only Experience Adapter
→ authenticated Creator Public HTTP/API v1
→ Creator Application boundary
→ V5 episode-production evidence
→ V4 execution boundary
→ V3 composition / Compute
```

Browser code uses only same-origin `/api/creator/**`. It cannot supply
`workspaceRef`, `tenantId`, `contentProfileRef`, Core origin, or Core credentials.
No Frontend source imports Core modules, queries Core storage, or calls a provider.

## 3. Routes and jobs

| Route | Primary job | Required Core facts |
| --- | --- | --- |
| `/creator/projects/[projectRef]/production` | inspect scenes, shots, identity locks and Shot Graph lineage | matching `EpisodeProductionRun` and G3 bundle |
| `/creator/projects/[projectRef]/production?stage=assets` | inspect asset requirements, generation requests and V4 jobs; explicitly start G4/G5 when valid | G3/G4/G5 bundles |
| `/creator/projects/[projectRef]/post` | play authenticated preview, inspect machine QC, enter four external human approvals | G5/G6 bundle and external approval authority |
| `/creator/projects/[projectRef]/delivery` | play and download immutable local-evidence master | verified G6 master/export facts |

All surfaces use the existing `UnifiedAppHeader` and `ProjectWorkspaceChrome`.
The page root is viewport-fluid. The active object remains central, run navigation
stays left, and truth boundary / next action stays right on wide screens.

## 4. State and authority rules

- A route key is accepted only when an exact Core `projectRef` in the authenticated
  run collection matches it. Local fixtures never become production runs.
- Run, episode, script, shot, asset, preview, approval, master and export refs come
  only from Core responses or explicit external approval input.
- G4, G5 and preview/QC actions use stable client idempotency keys and Core validates
  the authoritative transition.
- The browser cannot auto-create M6 authority, Identity Lock, scene bindings or
  human approvals. Missing inputs remain a visible gate.
- Four approval kinds are separate: creative direction, identity continuity,
  technical QC and final master. The default Core authority rejects unknown refs.
- Preview and export bytes are authenticated, workspace-scoped and streamed through
  the server adapter. No internal storage path is returned to the browser.
- `LOCAL_EVIDENCE`, `gpuUsed=false`, and `publicationAllowed=false` remain visible.
  Local playback is not a provider, GPU, publication, or release claim.

## 5. Experience Adapter allowlist

The adapter permits only the exact K2 collection, run detail, six stage resources,
delivery projection, preview content and export content paths. Unknown nested paths
return `404` before contacting Core. JSON responses must retain the `{ ok }`
envelope; successful content responses must be video media and forward only safe
content headers.

## 6. Acceptance gates

- exact project filtering and no route-key authority promotion;
- state-driven views for shots, assets/jobs, preview/QC/approvals and delivery;
- no automatic human approval and no publication affordance;
- preview playable before approval and master playable/downloadable after approval;
- full-width wide-screen layout with no root horizontal overflow;
- keyboard-labelled actions and native inputs/video controls;
- adapter allowlist, scope stripping, JSON validation and binary streaming tests;
- TypeScript, ESLint, full Vitest and Next production build pass;
- real Core + production Frontend Gate C proves same-origin playback, approval
  rejection/acceptance boundaries, export download and clean browser console.

Technical completion is evidence for a K2 checkpoint candidate only. It is not
automatic feature acceptance and does not change human approval ownership.

## 7. Local verification result

The implemented candidate passed:

- TypeScript and ESLint;
- `118 / 118` Vitest tests across `24` files;
- Next.js `16.3.0` production build;
- Core full regression `518 / 518`;
- a real two-process HTTP flow through the production Next server and authenticated
  Core runtime, covering four shots, eight media jobs, preview bytes, six QC checks,
  four externally verified human approval records, immutable master and MP4 export;
- preview and export SHA-256 equality, `publicationAllowed=false` and `gpuUsed=false`.

The browser-specific part of Gate C is not claimed. The current environment has no
local Chromium executable, and the approved Cloud Browser security policy blocks
localhost/private-network targets and forbids bypass through raw CDP or another
browser surface. The remaining gate must be run from an approved Chrome environment
that can reach the two local processes and must record zero console errors, page
errors, unexpected HTTP errors, root horizontal overflow and broken interactions.
