# Pull request

## Scope

Describe the bounded change and the authority that permits it.

## Verification

List the exact checks and evidence. WIP results must not be described as formal
acceptance.

## Document impact

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

If `DOC_IMPACT=NONE`, explain why no authoritative or current document changes.

## Boundary confirmation

- [ ] No caller-minted Core identity, version, workspace or approval fact was added.
- [ ] No historical failure or evidence was rewritten.
- [ ] Frontend pin impact is explicit and independently authorized when non-`NONE`.
- [ ] Product, production and publication claims match current evidence.
