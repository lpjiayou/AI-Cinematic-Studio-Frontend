# Character Studio — Implementation Readiness Checklist

Version: `V4.1`

Before Codex starts implementation, verify every item below.

## Page / Components
- [ ] `/character-studio` route is specified.
- [ ] CharacterStudioWorkspace Props compile as written.
- [ ] CharacterContextBar Props compile as written.
- [ ] CharacterOverviewCard Props compile as written.
- [ ] IdentityCanvas Props compile as written.
- [ ] AppearanceBoard Props compile as written.
- [ ] PersonalityCard Props compile as written.
- [ ] RelationshipGraph Props compile as written.
- [ ] VisualConsistencyPanel Props compile as written.
- [ ] CharacterAssetViewer Props compile as written.
- [ ] AICharacterAssistantPanel Props compile as written.
- [ ] ContinueScriptButton Props compile as written.

## Events
- [ ] Identity field update payload is discriminated.
- [ ] Appearance selection emits asset id only.
- [ ] Relationship selection emits node/edge selection intent only.
- [ ] Confirm callback does not imply Domain persistence.
- [ ] Back/navigation callbacks are separate from write callbacks.

## Domain / API
- [ ] DOMAIN_ALIGNMENT does not invent milestone names.
- [ ] M6 is the primary Character Intelligence alignment.
- [ ] Identity Lock is a V5 Identity Engine boundary.
- [ ] Asset registration remains behind V5 Asset Engine.
- [ ] M9/M10 only describe future asset requirement/generation work.
- [ ] M3 Script remains downstream Script authority.
- [ ] Future real refs come from Creator Application responses, never from UI.

## Visual / UX
- [ ] Character identity is unchanged between Light and Dark.
- [ ] Media uses ACS media-stage semantics.
- [ ] No game character creator appearance.
- [ ] No avatar-generator UI.
- [ ] No technical Inspector or backend metadata.
- [ ] CTA remains a single primary action.

## Verification
- [ ] Tests pass.
- [ ] Lint passes.
- [ ] Build passes.
- [ ] diff check passes.
- [ ] ten viewport browser QA passes.
- [ ] console/page errors are zero.
- [ ] horizontal overflow is zero.

## V4.1 Required Compile-Surface Checks

- [ ] `CharacterRelation` exposes `continuityNotes: readonly string[]`.
- [ ] `CharacterStateCardProps` exposes `state: CharacterStatePreview`.
- [ ] `CharacterOverviewCardProps` exposes `mainVisual: CharacterAssetPreview`.
- [ ] `CharacterOverviewCardProps` exposes optional typed `arcStage`.
- [ ] Relationship detail renders continuity notes or an explicit empty state.
- [ ] Asset implementation consumes numeric crop contracts for all six files.
