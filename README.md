# AI Cinematic Studio V2.3 Frontend

Independent Next.js frontend for the AI Cinematic Studio V2.3 Experience Layer.

## Scope

This repository contains presentation foundations and presentation-only product pages:

- official ACS design-system contracts in `docs/design-system/`
- ACS color, typography, spacing, radius, elevation, layout, and motion tokens
- explicit light and dark theme support
- reusable ACS primitives, AI presentation components, workflow components, and overlays
- customer, workspace, and editor layout shells
- landing, workspace, new-project, AI Director, Story World, Character Studio, and Script Studio presentation pages
- the additive `/creator/**` Global Shell foundation for a later route migration
- component and page tests, production-build validation, lint, typecheck, and CI

The current product pages remain on their existing flat routes during FE-G1. The new Creator layout does not wrap those pages until a separately authorized route-migration stage.

The repository intentionally contains no accepted Experience Adapter, backend integration, authoritative Project/Series/Episode state, or Core OS source dependency. Fixture-backed page content is presentation evidence, not production data.

## Structure

```text
docs/design-system/  Official ACS brand, theme, component, layout, and status guides
src/
  app/          Next.js App Router pages, root boundary, and Creator shell foundation
  components/   ACS, AI, workflow, and inspector component library
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
