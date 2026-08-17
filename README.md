# AI Cinematic Studio V2.3 Frontend

Independent Next.js frontend for the AI Cinematic Studio V2.3 Experience Layer.

## Scope

This repository contains the commercial Creator experience, its presentation system,
and the server-side Frontend Experience Adapter:

- official ACS design-system contracts in `docs/design-system/`
- ACS color, typography, spacing, radius, elevation, layout, and motion tokens
- explicit light and dark theme support
- reusable ACS primitives, AI presentation components, workflow components, and overlays
- customer, workspace, and editor layout shells
- landing, workspace, new-project, AI Director, Project, Story World, Character Studio,
  and Script Studio routes
- the `/creator/**` Global Shell and connected project navigation
- a same-origin `/api/creator/**` adapter over Creator Public HTTP/API v1
- connected M1–M5 workflows and the accepted M6 read/authority boundary
- truthful M7–M19 capability status without executable placeholder controls
- component and page tests, production-build validation, lint, typecheck, and CI

The only accepted runtime dependency direction is:

```text
Browser → Frontend Experience Adapter → Creator Public HTTP/API v1
→ Creator Application → V5 → V4 → V3 → Compute/Foundation
```

Browser code never receives the Core origin, bearer credential, or credential-owned
workspace scope and never
calls `/creator/internal/*`. Core owns authoritative references, lifecycle, versions,
confirmation and persistence. `LOCAL_FIXTURE` pages remain separate, visibly labelled
non-authoritative demonstrations; they are never used as fallback after a Core error.

See [Creator Core integration](docs/CREATOR_CORE_INTEGRATION.md) for the exact capability,
route and runtime mapping.

## Structure

```text
docs/design-system/  Official ACS brand, theme, component, layout, and status guides
src/
  app/          Next.js App Router pages, Creator shell, and same-origin API route
  components/   ACS, AI, workflow, and inspector component library
  features/     Server adapter, browser client, capability contract, and provider
  layouts/      Customer, workspace, and editor layout shells
  lib/          Framework-neutral presentation helpers
  styles/       Global tokens and baseline styles
  theme/        Light/dark theme provider
```

## Commands

```bash
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
```

Copy `.env.example` to `.env.local` and supply the same runtime credential registered
by Core. All three integration variables are server-only; do not create a
`NEXT_PUBLIC_*` equivalent.
