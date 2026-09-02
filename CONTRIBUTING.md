# Contributing

## 1. Authority and scope

Read [`AGENTS.md`](AGENTS.md), the
[documentation governance policy](docs/governance/DOCUMENTATION_GOVERNANCE_POLICY.md),
the [cross-repository baseline](docs/status/CROSS_REPOSITORY_BASELINE.md) and the
applicable design/integration contracts before changing the repository.

Frontend code may consume only accepted Core public contracts through the same-origin
Experience Adapter. It must not mint Core facts, call internal Core routes or turn
fixtures into a fallback for a Core failure.

## 2. Pull-request document impact

Every pull request completes the repository template and chooses exactly one:

```text
DOC_IMPACT=NONE|STATUS|PUBLIC_CONTRACT|ARCHITECTURE|RUNTIME
```

Also declare:

```text
DOC_FILES_REQUIRED=
DOC_FILES_UPDATED=
CURRENT_MILESTONE_UPDATE_REQUIRED=
PUBLIC_CONTRACT_UPDATE_REQUIRED=
ADR_REQUIRED=
RISK_REGISTER_UPDATE_REQUIRED=
FRONTEND_PIN_IMPACT=
```

- `NONE` requires a short reason.
- `STATUS` updates only the current status source proven by the merged change.
- `PUBLIC_CONTRACT`, `ARCHITECTURE` or `RUNTIME` requires the applicable owner and Core
  authority review.
- `FRONTEND_PIN_IMPACT` is `NONE`, `REVIEW_REQUIRED` or an explicitly authorized pin
  move. A Core internal/docs change does not mechanically move the pin.

A WIP commit or pull request must not write formal completion as `PASS`. Status changes
are made only after merge and all required checks succeed. Do not rewrite historical
evidence when current truth changes.

## 3. Verification

Run the checks applicable to the changed paths. Existing product changes require the
repository's tests, build, lint, typecheck and browser gates. Documentation-only work
must at minimum verify UTF-8 Markdown structure, local links, registry coverage and
current-state invariants once those checks are installed in the existing CI job.

Do not weaken or add a bypass around a required check. Do not change
`CORE_PIN_SHA`/`CORE_PIN_TREE` without a separate authorized compatibility task.
