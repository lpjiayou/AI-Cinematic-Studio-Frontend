# AI Cinematic Studio V2.3 Frontend

Independent Next.js frontend foundation for the AI Cinematic Studio V2.3 Experience Layer.

## Scope

This repository contains presentation foundations only:

- official ACS design-system contracts in `docs/design-system/`
- ACS color, typography, spacing, radius, elevation, layout, and motion tokens
- explicit light and dark theme support
- reusable ACS primitives, AI presentation components, workflow components, and overlays
- customer, workspace, and editor layout shells
- component tests and production-build validation

It intentionally contains no business pages, navigation behavior, domain models, backend integrations, or Core OS dependencies.

## Structure

```text
docs/design-system/  Official ACS brand, theme, component, layout, and status guides
src/
  app/          Next.js App Router boundary and global style entry
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
