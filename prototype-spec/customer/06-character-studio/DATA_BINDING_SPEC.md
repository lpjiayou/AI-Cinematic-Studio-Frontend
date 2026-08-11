# Character Studio — Data Binding Specification

Version: `V4.1`

## Phase 1

Presentation DTOs only.

No backend / Provider / Domain integration.

## DTOs

```ts
export type CharacterContextDTO = CharacterContext;
export type IdentityPreviewDTO = IdentityPreview;
export type PersonalityPreviewDTO = PersonalityPreview;
export type AppearancePreviewDTO = AppearancePreview;
export type CharacterStatePreviewDTO = CharacterStatePreview;
export type CharacterRelationDTO = CharacterRelation;
export type VisualConsistencyPreviewDTO = VisualConsistencyPreview;

export type CharacterStudioViewModel = {
  context: CharacterContextDTO;
  character: CharacterPreview;
  pageState: CharacterStudioPageState;
  selectedAssetId: string | null;
  selectedNodeId: string | null;
  selectedRelationId: string | null;
  theme: "light" | "dark";
};
```

Theme comes from ThemeProvider.

## Local Experience Service

```ts
export interface CharacterStudioExperienceService {
  rebuildPreview(
    character: CharacterPreview
  ): Promise<CharacterPreview>;

  buildSuggestions(
    character: CharacterPreview
  ): Promise<readonly string[]>;
}
```

Phase 1 implementation is local/deterministic.

It does not:
- fetch Provider;
- write database;
- mint refs;
- create Domain versions.

## Future Connected Boundary

```text
Browser
↓
Frontend Experience Adapter
↓
Creator Application
↓
M6 public application contract
↓
V5 Identity Engine / V5 Asset Engine / other public capability as appropriate
```

M9/M10 are later asset requirement/generation stages, not direct browser dependencies.

## Identity Rule

Frontend never creates:
- characterRef;
- seriesBibleRef;
- characterStateRef;
- identityRef;
- assetRef;
- versionRef.

Local `id` is only UI selection/list identity.

## Future Script Bridge

Future UI may receive a backend-provided character constraint/readiness projection for M3 Script Studio.

It must not duplicate ScriptVersion or Script authority.

## Errors

Presentation error union:

```ts
export type CharacterStudioPresentationError =
  | "PREVIEW_UNAVAILABLE"
  | "ASSET_UNAVAILABLE"
  | "LOCAL_STATE_ERROR"
  | "NEXT_ROUTE_UNAVAILABLE";
```

Customer copy comes from STATE_SPEC.
