# Frontend Documentation Governance Policy

Status: `ACTIVE`

Owner: `Frontend Owner / Documentation Governance Owner`

Reviewed baseline: Frontend `a0be9edc91437bf0e7c5dd14883e656e750b3aee`, tree
`c25b9e3744d561c93fed26d0a07e59a1915a6071`, on `2026-09-02`.

## 1. Purpose

This policy classifies every governed Frontend document and separates current product
truth from historical implementation checkpoints, prototypes and evidence. It aligns
with Core's documentation authority without granting the Frontend authority over Core
Domain facts, runtime state or publication.

The complete inventory is
[`DOCUMENT_REGISTRY.json`](DOCUMENT_REGISTRY.json), its human projection is
[`DOCUMENT_AUTHORITY_MAP.md`](DOCUMENT_AUTHORITY_MAP.md), and navigation begins at
[`../README.md`](../README.md).

## 2. Authority order

Use the authority order already established by repository instructions and the Core
architecture process:

1. a bounded Project Lead authorization;
2. applicable `AGENTS.md` and repository instructions;
3. Core Accepted ADRs for cross-repository architecture plus accepted Frontend
   governance contracts inside their scopes;
4. Core System/UI Master Plans and Golden/normative contracts;
5. current Core and Frontend baseline/status projections;
6. current Frontend design and integration contracts;
7. implementation/test evidence and receipts;
8. immutable historical checkpoints and prototypes.

Scope remains mandatory. The Frontend cannot reinterpret a Core Accepted ADR, mint a
Core identity or turn a tested pin into product-completion authority.

```text
HISTORICAL_DOCUMENT_GRANTS_CURRENT_AUTHORITY=false
PR_DESCRIPTION_OVERRIDES_ACCEPTED_ADR=false
CURRENT_STATUS_OVERRIDES_ACCEPTED_ADR=false
TASK_RECEIPT_CREATES_ARCHITECTURE_AUTHORITY=false
FRONTEND_PIN_PROVES_PRODUCT_COMPLETION=false
```

## 3. Document classes

Every governed document has exactly one primary class:

- `ACCEPTED_DECISION`
- `NORMATIVE_ARCHITECTURE`
- `NORMATIVE_CONTRACT`
- `CURRENT_STATUS`
- `CAPABILITY_MATRIX`
- `OPERATIONAL_RUNBOOK`
- `IMPLEMENTATION_EVIDENCE`
- `HISTORICAL_EVIDENCE`
- `SUPERSEDED`
- `DRAFT`
- `DEPRECATED`
- `GENERATED_REFERENCE`

`DOCUMENT_CLASS=UNKNOWN` is forbidden. Only `CURRENT_STATUS` and `CAPABILITY_MATRIX`
may project repository-wide current execution state. A normative design contract can
define a target without claiming that target is implemented.

## 4. Frontend/Core boundary

The browser calls only the same-origin Experience Adapter. The adapter may call the
authenticated Creator Public HTTP/API; it must not expose the Core origin or token to
the browser, call internal routes, accept caller-minted workspace/Domain facts or fall
back to fixtures after a Core error.

Core owns identities, versions, lifecycle and authoritative facts. Frontend documents
may map those facts to a product surface, but cannot upgrade `UNVERIFIED`,
`local_evidence_only`, `not_open` or a Core blocker.

The current Frontend CI pin is:

```text
CORE_PIN_SHA=5c9ea7fe6993eddb7a492b2ae8f6bd8c2d5ae326
CORE_PIN_TREE=de6d43a16f97c1e34dc536336d05b0174d9aab39
```

It is a tested Core behavior dependency. It does not prove complete M12/M13 Frontend
product surfaces, M14/M15, live production or publication. This documentation wave
must not change the pin.

## 5. Historical and superseded material

Historical authorization/checkpoint documents preserve their original statements,
including old branches, commits and words such as “current” or “not authorized”. Their
registry notes include:

```text
HISTORICAL_PATH_NOT_EXECUTION_AUTHORITY=true
```

They are indexed only under evidence, historical or superseded sections. A superseded
document has a non-empty `supersededBy`; total successors record the reverse edge.
History is repaired only by metadata or link correction, never rewritten into a pass.

Prototype specifications are normative only for their declared presentation/design
scope. They do not prove that a page, adapter or Core capability is implemented.

## 6. Current-document portability

Current status, contracts and runbooks must not rely on `sandbox:/workspace`, a
conversation scratch root, an undeclared `/tmp`, a user-specific home, `/mnt/c` or a
Windows user path. Declared loopback development defaults are permitted only as
configurable server-side values. Historical paths may remain as evidence but cannot be
copied into a current execution instruction without review.

## 7. Pull-request document impact

Every pull request follows [`CONTRIBUTING.md`](../../CONTRIBUTING.md) and declares:

```text
DOC_IMPACT=NONE|STATUS|PUBLIC_CONTRACT|ARCHITECTURE|RUNTIME
DOC_FILES_REQUIRED=
DOC_FILES_UPDATED=
CURRENT_MILESTONE_UPDATE_REQUIRED=
PUBLIC_CONTRACT_UPDATE_REQUIRED=
ADR_REQUIRED=
RISK_REGISTER_UPDATE_REQUIRED=
FRONTEND_PIN_IMPACT=
```

A WIP push cannot predeclare a formal `PASS`. A status transition requires the
implementation merge and all required checks. Internal Core documentation changes do
not mechanically require a Frontend pin update.

## 8. Closed boundaries

```text
M13_BASE_BACKEND_COMPLETE=true
M13_BASE_CLOSEOUT_ACCEPTED=true
M13_PRODUCT_CAPABILITY_COMPLETE=false
M13_EXTENSION_G0_AUTHORIZED=false
M12_RUNTIME_G0=NOT_COMPLETE
M12_C3_READY_TO_START=false
A100_START_AUTHORIZED=false
PUBLICATION_ALLOWED=false
```

This policy does not authorize a UI, route, adapter, dependency, runtime or product
behavior change.
