# Frontend ↔ Core Domain Alignment Standard

> Status: `NORMATIVE GOVERNANCE CANDIDATE UNDER FE-G0-R1 / NO IMPLEMENTATION AUTHORITY`
>
> Date: `2026-08-14`
>
> Frontend verification base: `1cf2515ceec6c6415cae2e21360782174525d3a5`
>
> Core verification base: `5c656992d9fade3683b70e3c57f8b8ba7d26c7f7`
>
> Reviewed proposal SHA-256:
> `9cd23faeffcaea5745b79b23226f317e178459cf583edf5b4eee4d590d10e731`
>
> Proposal disposition: `REVISION REQUIRED / CORRECTED BY THIS STANDARD`
>
> Ownership: Frontend Page Owner authors; relevant Core Domain Owner verifies domain
> claims; Repository Governance Owner verifies evidence and authorization state.

## 1. Purpose

A page can build, pass component tests and look complete while its data model has no
authoritative source or cannot carry the authoritative Core shape. This standard
prevents presentation completeness from being reported as Domain or integration
completeness.

This document does not authorize an Experience Adapter, Creator Public HTTP/API
consumer, M6 binding, real Project/Series/Episode state, Cross-Repo Gate C or page
implementation.

## 2. Canonical record location

Per-page records, when separately authorized, live only under:

```text
governance/domain-alignment/<route-key>.md
```

They do not live beside `page.tsx` and are not duplicated across component folders.
Examples of route keys are `creator-home`, `creator-ai-director`,
`creator-project-new`, `project-bible` and `project-characters`.

The record must identify:

- Frontend commit and route;
- Core commit;
- every data-bearing page region;
- Core owner, module and authoritative field when one exists;
- the Domain-fit class;
- the delivery stage;
- evidence and unresolved mismatch;
- the responsible reviewer and last verification date.

Adding or changing a per-page record requires an explicit file allowlist. This
standard does not silently authorize those future files.

## 3. Two-axis classification

Every region receives one Domain-fit class and one delivery stage. Neither axis may
be omitted.

### 3.1 Domain-fit class

#### A — domain-backed, lossless shape

An authoritative Core fact exists and the Frontend representation can carry its
identity, cardinality, version and semantics without inference or loss.

Record the owning milestone, Core module, field and stable Ref/Version lineage.

#### B — domain-backed, shape mismatch

The authoritative fact exists, but the Frontend shape is incomplete or lossy. Common
examples include:

- display label instead of stable Ref;
- local ID instead of authoritative identity;
- one value instead of an interval;
- missing category, version or exclusivity rule;
- flattened text replacing structured fields;
- missing Core fields within the intended page scope.

A B region is not integration-ready even if its labels resemble the Core model.

#### C — no authoritative Core fact

No current Core fact can back the region. Record the planned owning milestone, or
state that no accepted milestone owns it.

C regions must not use fixtures that read as current production facts. They are not
counted as completed capability.

### 3.2 Delivery stage

The delivery stage records the highest independently verified boundary reached:

| Stage | Meaning |
| --- | --- |
| `I0_INTERNAL_CORE_ONLY` | The fact exists only behind internal Core/Application boundaries, or no accepted public projection has been verified. Frontend cannot consume it. |
| `I1_PUBLIC_CONTRACT_PRESENT_NOT_AUTHORIZED` | An accepted Creator HTTP/API contract or projection exists, but Frontend consumption and Experience Adapter implementation are not authorized. |
| `I2_FRONTEND_CONSUMPTION_AUTHORIZED` | The Project Lead has authorized an exact Experience Adapter/API integration scope, but Gate C has not yet verified it. |
| `I3_GATE_C_VERIFIED` | The served Frontend has been verified against the real Creator Public HTTP/API through Cross-Repo Gate C at recorded commits. |

Domain A does not imply I1, I2 or I3. A region classified `A + I0` is backed by a
real internal fact but is not connectable by Frontend.

The current FE-G0-R1 authorization permits no I2 or I3 classification.

## 4. Completion and presentation rules

1. A page cannot be marked Domain-complete while any data-bearing region is
   unclassified.
2. A page cannot be marked integration-complete unless all required regions are at
   `I3_GATE_C_VERIFIED` against exact Frontend and Core commits.
3. A and B regions at I0/I1 must not be described as "只差接 API".
4. C regions must be hidden, explicitly unavailable or shown as honest design-forward
   structure; they must not present mock values as production facts.
5. Existing fixture-backed page bodies remain presentation evidence only.
6. Route or shell relocation never changes Domain-fit or delivery stage.
7. Display names, titles, episode numbers, array positions and route strings are not
   authoritative identity.
8. AI candidate, confirmed Domain fact and approval state remain separate.

## 5. Required matrix format

Each per-page record uses this minimum table:

| Region | Frontend shape | Domain class | Delivery stage | Core owner/path/field | Mismatch or evidence | Next authorized gate |
| --- | --- | --- | --- | --- | --- | --- |

The record also reports counts, not an undefined percentage:

```text
TOTAL_DATA_REGIONS
A_COUNT
B_COUNT
C_COUNT
I0_COUNT
I1_COUNT
I2_COUNT
I3_COUNT
UNCLASSIFIED_COUNT
```

No weighted "Tier C share" is reported unless a later accepted measurement contract
defines weights. Raw region counts are the canonical metric.

## 6. Re-verification triggers

Re-verification is required only when a relevant change occurs:

- an accepted Creator Public HTTP/API or DTO contract used by the page changes;
- a relevant Core authoritative field, Ref or Version contract changes;
- the Frontend page data model changes;
- an Experience Adapter scope is authorized or implemented;
- a page enters Gate C;
- a previously C region receives an accepted Domain owner.

Unrelated Core milestone acceptance does not require every page to be re-reviewed.

## 7. Corrected current gap snapshot

This section corrects the analysis that motivated the standard. It is not a
substitute for separately authorized per-page records.

### 7.1 Character Studio

Core evidence is in
`services/v5_core_os/series_intelligence/foundation.py` and
`tests/unit/test_series_intelligence_m6.py` at the recorded Core base.

| Region | Correct class | Current delivery | Evidence / mismatch |
| --- | --- | --- | --- |
| background, motivation, belief, conflict, goal, personality, behavior/dialogue/forbidden rules | A | `I0_INTERNAL_CORE_ONLY` | The individual field meanings map to M6 Character fields; Character identity and version context are classified separately below |
| Character identity | B | `I0_INTERNAL_CORE_ONLY` | UI uses name/local `id`; Core requires `characterRef` |
| Character state | B | `I0_INTERNAL_CORE_ONLY` | UI has a display episode label and loose deltas; Core uses `startEpisodePlanItemRef`, optional `endEpisodePlanItemRef`, category and overlap rules |
| Character relationship | B | `I0_INTERNAL_CORE_ONLY` | UI `id/sourceId/targetId` cannot losslessly carry `relationshipRef`, `fromCharacterRef`, `toCharacterRef` and applicability interval |
| Textual appearance / visual identity direction | B | `I0_INTERNAL_CORE_ONLY` | Core has `visualIdentityRules`; the UI shape and lineage are not equivalent |
| Identity-binding references | B | `I0_INTERNAL_CORE_ONLY` | Core has `identityBindings` with identity/version/digest references, but no authorized Frontend projection or resolved visual-asset model |
| Main/reference images and visual asset collections | C | `I0_INTERNAL_CORE_ONLY` | No current Character public asset/image projection can populate the region; future asset/image milestones own the missing production capability |

The entire Appearance/Visual Consistency surface is therefore not uniformly C.
Textual visual rules and identity-binding references are domain-backed but mismatched;
resolved image and asset presentation remains C.

### 7.2 Story World / Project Bible

| Region | Correct class | Current delivery | Evidence / mismatch |
| --- | --- | --- | --- |
| rules | B | `I0_INTERNAL_CORE_ONLY` | Core `worldRules` requires stable `worldRuleRef` |
| timeline | B | `I0_INTERNAL_CORE_ONLY` | Core `timelineEvents` requires `timelineEventRef` and validated cross-references |
| locations | B | `I0_INTERNAL_CORE_ONLY` | Core requires `locationRef` |
| factions | B | `I0_INTERNAL_CORE_ONLY` | Core requires `factionRef` |
| visual language | B | `I0_INTERNAL_CORE_ONLY` | Partial relationship to `visualConstraints`; not lossless |
| culture | C | `I0_INTERNAL_CORE_ONLY` | No verified authoritative field at the recorded Core base |
| rendered maps, faction boards and similar imagery | C | `I0_INTERNAL_CORE_ONLY` | No verified authoritative production-asset projection |
| glossary, props and prohibited narrative patterns absent from UI | B | `I0_INTERNAL_CORE_ONLY` | Core facts exist but the intended Bible surface omits them |

Any mapping that says "add ref" is B by definition, not A.

### 7.3 AI Director

| Region | Correct class | Current delivery | Evidence / mismatch |
| --- | --- | --- | --- |
| Creative interpretation | B | `I0_INTERNAL_CORE_ONLY` | The page flattens logline, core theme, target emotion and narrative arc into a single concept representation |
| Preliminary shot suggestions | B | `I0_INTERNAL_CORE_ONLY` | Structured shot fields are omitted from the page; they are not an M8 Storyboard fact |

`storyboardProductionAuthorized: false` is emitted by the Script Studio storyboard
bootstrap in `services/v5_core_os/script_studio/foundation.py`. It must not be
misattributed as a field owned directly by the M1 CreativePlan.

The current endpoint is an internal Creator runtime path, not independently verified
as an accepted Creator Public HTTP/API contract for Frontend. Its current delivery
classification therefore remains I0.

### 7.4 Workspace Home and Script Studio

No complete region-by-region audit is recorded here. Neither page may be declared
Domain-complete from this standard alone. Script Studio remains outside FE-G1 and
FE-G2 route migration.

## 8. Review outcomes

Each per-page review ends in one of these factual states:

- `ALIGNMENT PASS` — all required regions are classified and no unresolved B/C
  blocker contradicts the stated page milestone;
- `ALIGNMENT REVISION REQUIRED` — classification or page shape must be corrected;
- `INTEGRATION NOT AUTHORIZED` — alignment may be known, but delivery cannot begin;
- `GATE C CANDIDATE` — exact I2 implementation is ready for real cross-repo runtime
  verification;
- `GATE C VERIFIED` — exact Frontend/Core commits passed the real runtime gate.

Only the Project Lead may accept the associated milestone or authorize the next
implementation stage.
