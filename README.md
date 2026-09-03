# AI Cinematic Studio Frontend

Independent Next.js commercial experience layer for AI Cinematic Studio.

## Current baseline

```text
FRONTEND_BEHAVIOR_COMMIT=a0be9edc91437bf0e7c5dd14883e656e750b3aee
FRONTEND_BEHAVIOR_TREE=c25b9e3744d561c93fed26d0a07e59a1915a6071
FRONTEND_CI_CORE_PIN_SHA=e21789d265c4e936b0e0b29921746a4c205889b8
FRONTEND_CI_CORE_PIN_TREE=086f37ed4e5412d1d6608c4ee856ac75d61625e9
CORE_M13_BASE_TAG=m13-base-backend-v1
CORE_M13_BASE_TAG_OBJECT=b2d086b622bdb5456f6af325e458aa3771e43e80
CORE_M13_BASE_TAG_TARGET=a455c8e76427d53d75bb7f15259b9875d9768914
```

The Core pin is a tested behavior dependency. It is not a claim that all M12/M13
Frontend product surfaces are complete. The accepted M13 base backend remains product
incomplete; Extension G0, M14/M15 and publication are not authorized. See the
[cross-repository baseline](docs/status/CROSS_REPOSITORY_BASELINE.md).

## Scope

This repository contains:

- the ACS design-system and theme contracts;
- customer, workspace and editor presentation shells;
- Creator routes and reusable product components;
- the server-side Frontend Experience Adapter;
- same-origin browser access to Creator Public HTTP/API v1;
- explicit disconnected, blocked, local-evidence and not-open states;
- unit, build, lint, typecheck and Chromium integration gates.

The only accepted runtime dependency direction is:

```text
Browser
→ Frontend Experience Adapter
→ Creator Public HTTP/API v1
→ Creator Application
→ V5
→ V4
→ V3
→ Compute / Foundation
```

The browser never receives the Core origin or credential and never calls
`/creator/internal/*`. Core owns authoritative refs, lifecycle, versions, confirmation
and persistence. `LOCAL_FIXTURE` is an explicit non-authoritative demonstration, never
a fallback after a Core error.

See [Creator Core integration](docs/CREATOR_CORE_INTEGRATION.md) for the exact boundary.

## Current M12/M13 truth

```text
M12_RUNTIME_INSTALLED=false
M12_RUNTIME_G0=NOT_COMPLETE
M12_FRONTEND=UNVERIFIED
M12_PRODUCT=NOT_COMPLETE

M13_BASE_BACKEND=COMPLETE
M13_BASE_CLOSEOUT=ACCEPTED
M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE
M13_PRODUCT_CAPABILITY_COMPLETE=false
M13_EXTENSION_G0_AUTHORIZED=false
A100_START_AUTHORIZED=false
PUBLICATION_ALLOWED=false
```

Existing preview/production-workspace routes and pin-only compatibility do not prove a
Timeline Studio, Effect Inspector, RenderCandidate review UI, M14 QC/Approval or M15
Master/Export experience.

## Documentation

- [complete documentation index](docs/README.md)
- [documentation governance policy](docs/governance/DOCUMENTATION_GOVERNANCE_POLICY.md)
- [machine-readable document registry](docs/governance/DOCUMENT_REGISTRY.json)
- [human-readable authority map](docs/governance/DOCUMENT_AUTHORITY_MAP.md)
- [contribution and document-impact rules](CONTRIBUTING.md)

Historical governance checkpoints retain their original facts but do not authorize
current work. Superseded contracts are isolated from the current-authority section.

## Structure

```text
docs/design-system/  ACS brand, component, layout, status and theme contracts
src/app/             Next.js App Router pages and same-origin API routes
src/components/      presentation and workflow components
src/features/        adapter, browser client and capability contract
src/layouts/         customer, workspace and editor shells
src/lib/             presentation helpers
src/styles/          global tokens and baseline styles
src/theme/           light/dark theme provider
```

## Commands

```bash
npm ci
npm test
npm run build
npm run lint
npm run typecheck
```

Copy `.env.example` to `.env.local` only for local development. All Core integration
variables remain server-only; never add a `NEXT_PUBLIC_*` equivalent.

## Next legal project boundary

```text
NEXT_TASK=LOCAL_WSL2_HANDOFF_AND_M12_C3_PREFLIGHT
```

This is a handoff/preflight boundary only. It does not authorize M12-C3/C4, A100,
models, provider/GPU execution, M13 Extension G0 or publication.
