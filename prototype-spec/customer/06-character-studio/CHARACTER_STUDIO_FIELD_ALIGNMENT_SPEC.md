# Character Studio — Field-Level Alignment and Page Correction

> Status: `AUTHORIZED / IMPLEMENTATION ACTIVE`
>
> Page: `/creator/projects/[projectRef]/planning/characters`
>
> Frontend baseline: `main@b4997ec`
>
> Core reference: `main@5976263f`

## 1. Classification

| Class | Meaning | Action |
| --- | --- | --- |
| `A` | accepted Core fact is carried correctly | keep |
| `A-` | accepted fact is present but authoritative identity is omitted | add nullable Ref without inventing a value |
| `B` | accepted fact exists but the page shape cannot carry it | change the page shape |
| `C` | design-forward presentation with no accepted domain fact | retain, mark as exploration, exclude from completion claims |
| `M` | accepted fact is missing from the page | add |
| `V` | accepted fact is intentionally view-only in this pass | render read-only with provenance |
| `X` | duplicate or invalid concept | remove from persisted/editable shape; preserve only as explanatory copy if useful |

## 2. Identity

Background, motivation, belief, conflict, goal, forbidden behaviours and continuity
notes are `A`.

`characterRef` is `A-`. The view model must carry `characterRef: string | null`, while
`clientKey` remains a separate required local key. Name and role are display labels,
not identity. Fixtures leave `characterRef` unset.

## 3. State intervals

The single `CharacterStatePreview` snapshot is `B` and becomes a list of typed
intervals:

```ts
type CharacterStateIntervalViewModel = {
  clientKey: string;
  intervalRef: string | null;
  characterRef: string | null;
  category: "Location" | "Health" | "Appearance" | "PrimaryGoal";
  startEpisodePlanItemRef: string | null;
  endEpisodePlanItemRef: string | null;
  valueRef: string | null;
  annotation: string;
  continuityNotes: readonly string[];
};
```

Episode bounds use an `EpisodePlanItemSelector`, not an episode selector. Options are
real catalog values supplied by Story World/Series planning data. Fixtures may show
local labels, but a selected authoritative Ref remains `null` unless explicitly
present in the source.

Semantics are start-inclusive/end-exclusive. An unset end is open-ended. The page
must explain those semantics and flag same-character, same-category overlaps before
submission. Location intervals require a real `valueRef`; without one they remain
incomplete local drafts.

`personalityDelta` is `X` as a state category. `relationshipDelta` is `X` because
relationships have their own time-bounded model. Their useful prose may move to the
non-authoritative annotation, but must not masquerade as Core fields. `arcStage` is
`C` display grouping.

## 4. Relationships

Relationships carry:

- `relationshipRef: string | null` (`A-`);
- local `clientKey`;
- nullable `fromCharacterRef` and `toCharacterRef` (`A-`);
- relation type, emotional direction, description and continuity notes (`A`);
- nullable `startEpisodePlanItemRef` and `endEpisodePlanItemRef` (`B`).

Relationship ranges use the same start-inclusive/end-exclusive semantics and the
same shared plan-item catalog. Local node IDs must not be presented as character
Refs.

## 5. Missing accepted collections

The following accepted reference collections are `M` and appear as nullable,
read-only/local-draft selectors until an authoritative catalog is connected:

- `locationRefs[]`;
- `propRefs[]`;
- `timelineEventRefs[]`.

Story World must supply the visible location, prop and timeline catalogs before these
controls are considered complete. Unknown values are never synthesized.

## 6. Appearance and visual consistency

Appearance direction, image boards and the visual consistency panel are `C`. They
remain visible and are marked `设计探索 · 非权威数据`. They are excluded from domain
completion claims and are not described as merely awaiting API wiring.

The GPU work supplies a feasibility signal only:

- G2 completed technical result validation;
- independent blind visual review was still pending;
- `validationAccepted=false` and `productionReady=false` at formal closeout;
- subsequent G3 remediation is a separate gate.

Therefore no text may claim that a specific adapter/ControlNet recipe proved
production identity consistency. Execution weights belong to rendering/identity
authority decisions, not to M6 `CharacterDefinition`. No Core field addition is
authorized.

`identityRules[]` may only become authoritative by referencing an accepted
series-level `visualConstraintRef`; free text remains local exploration.

## 7. Personality

Traits, behaviour rules, dialogue rules, speech style and emotional pattern are `A`
and remain unchanged.

## 8. Data and interaction boundary

- Character Studio receives a typed page view model from the project data provider.
- The presentation module imports no fixture module.
- `clientKey` is always distinct from nullable authoritative refs.
- `dataOrigin=LOCAL_FIXTURE` and `authoritative=false` remain visible.
- No fetch, HTTP client, persistence or Core call is introduced.
- Invalid or incomplete local drafts are explained inline and are not submitted.

## 9. Acceptance

- Identity, interval and relationship models separate `clientKey` from nullable Refs.
- State is a typed list using the four accepted exclusive categories.
- State and relationship ranges use the shared `EpisodePlanItemSelector` semantics.
- Same-category overlap detection is covered by unit tests.
- Location intervals without a real `valueRef` are visibly incomplete.
- `locationRefs`, `propRefs` and `timelineEventRefs` are surfaced without invented
  values.
- `C` regions display the exploration marker and make no production-readiness claim.
- Story World catalogs are the only local source for location, prop, timeline and
  plan-item options.
- Existing personality behaviour and accessibility interactions remain intact.
- `npm run typecheck`, `npm test`, `npm run build` and `npm run lint` pass.

