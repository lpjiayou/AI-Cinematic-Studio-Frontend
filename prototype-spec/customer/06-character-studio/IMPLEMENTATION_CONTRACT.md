# Character Studio — Implementation Contract

Version: `V4.1`

## 1. Shared Presentation Types

```ts
export type CharacterStudioPageState =
  | "empty"
  | "editing"
  | "preview-ready"
  | "consistency-preview-ready"
  | "confirmed-preview"
  | "stale-preview"
  | "local-error"
  | "next-route-unavailable";

export type CharacterContextStatus =
  | "等待设计"
  | "设计中"
  | "预览完成"
  | "本地确认"
  | "预览已过期";

export type CharacterContext = {
  characterName: string;
  roleLabel: string;
  stageLabel: "角色设计";
  statusLabel: CharacterContextStatus;
  seriesTitle: string;
  worldContextLabel: string;
};

export type IdentityPreview = {
  background: string;
  motivation: string;
  belief: string;
  conflict: string;
  goal: string;
  forbiddenBehaviors: readonly string[];
  continuityNotes: readonly string[];
};

export type PersonalityPreview = {
  traits: readonly string[];
  behaviorRules: readonly string[];
  speechStyle: string;
  emotionalPattern: string;
  dialogueRules: readonly string[];
};

export type CharacterAssetKind =
  | "main"
  | "face"
  | "costume"
  | "props";

export type CharacterAssetPreview = {
  id: string;
  kind: CharacterAssetKind;
  src: string;
  alt: string;
  label: string;
  selected: boolean;
};

export type AppearancePreview = {
  faceDirection: string;
  hairDirection: string;
  costumeDirection: string;
  bodyDirection: string;
  propsDirection: string;
  assets: readonly CharacterAssetPreview[];
};

export type CharacterNode = {
  id: string;
  name: string;
  roleLabel: string;
  isPrimary: boolean;
};

export type CharacterRelation = {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  emotionalDirection: string;
  description: string;
  continuityNotes: readonly string[];
};

export type CharacterStatePreview = {
  arcStage: string;
  effectiveEpisodeLabel: string;
  personalityDelta: string;
  relationshipDelta: string;
  appearanceNotes: string;
  continuityNotes: readonly string[];
};

export type VisualConsistencyPreview = {
  status: "empty" | "ready" | "stale";
  mainAssetId: string | null;
  referenceAssetIds: readonly string[];
  paletteLabel: string;
  styleLabel: string;
  identityRules: readonly string[];
  consistencyNotes: readonly string[];
};

export type CharacterPreview = {
  name: string;
  role: string;
  summary: string;
  identity: IdentityPreview;
  appearance: AppearancePreview;
  personality: PersonalityPreview;
  state: CharacterStatePreview;
  nodes: readonly CharacterNode[];
  relationships: readonly CharacterRelation[];
  visualConsistency: VisualConsistencyPreview;
};
```

## 2. Update Payloads

```ts
export type IdentityField =
  | "background"
  | "motivation"
  | "belief"
  | "conflict"
  | "goal";

export type CharacterUpdatePayload =
  | { area: "identity"; field: IdentityField; value: string }
  | { area: "personality"; field: "speechStyle"; value: string }
  | { area: "personality"; field: "emotionalPattern"; value: string }
  | { area: "appearance"; field: "faceDirection"; value: string }
  | { area: "appearance"; field: "hairDirection"; value: string }
  | { area: "appearance"; field: "costumeDirection"; value: string }
  | { area: "appearance"; field: "bodyDirection"; value: string }
  | { area: "appearance"; field: "propsDirection"; value: string };
```

Arrays/rules are read-only in Phase 1 unless a later spec defines an editor.

## 3. CharacterStudioWorkspace

```ts
export type CharacterStudioWorkspaceProps = {
  context: CharacterContext;
  character: CharacterPreview;
  pageState: CharacterStudioPageState;
  onUpdate: (payload: CharacterUpdatePayload) => void;
  onSelectAsset: (assetId: string) => void;
  onSelectCharacterNode: (nodeId: string) => void;
  onSelectRelationship: (relationId: string) => void;
  onRebuildPreview: () => void;
  onConfirmPreview: () => void;
};
```

## 4. CharacterContextBar

```ts
export type CharacterContextBarProps = {
  context: CharacterContext;
  onBack: () => void;
};
```

## 5. CharacterOverviewCard

```ts
export type CharacterOverviewCardProps = {
  character: Pick<CharacterPreview, "name" | "role" | "summary">;
  mainVisual: CharacterAssetPreview;
  statusLabel: CharacterContextStatus;
  arcStage?: Pick<CharacterStatePreview, "arcStage" | "effectiveEpisodeLabel">;
  readOnly?: boolean;
};
```

## 6. IdentityCanvas

```ts
export type IdentityCanvasProps = {
  value: IdentityPreview;
  disabled?: boolean;
  onChange: (payload: Extract<CharacterUpdatePayload, { area: "identity" }>) => void;
};
```

## 7. AppearanceBoard

```ts
export type AppearanceBoardProps = {
  value: AppearancePreview;
  activeAssetId: string | null;
  disabled?: boolean;
  onChange: (payload: Extract<CharacterUpdatePayload, { area: "appearance" }>) => void;
  onSelectAsset: (assetId: string) => void;
  onOpenViewer: (assetId: string) => void;
};
```

## 8. PersonalityCard

```ts
export type PersonalityCardProps = {
  value: PersonalityPreview;
  disabled?: boolean;
  onChange: (payload: Extract<CharacterUpdatePayload, { area: "personality" }>) => void;
};
```

## 9. CharacterStateCard

```ts
export type CharacterStateCardProps = {
  state: CharacterStatePreview;
  readOnly?: boolean;
};
```

`CharacterStateCard` is a page-level `ACSCard` composition. It displays arc stage, episode applicability, personality/relationship deltas, appearance notes and continuity notes. It never persists CharacterState in Phase 1.

## 10. RelationshipGraph

```ts
export type RelationshipGraphProps = {
  nodes: readonly CharacterNode[];
  relations: readonly CharacterRelation[];
  selectedNodeId: string | null;
  selectedRelationId: string | null;
  onSelectNode: (nodeId: string) => void;
  onSelectRelation: (relationId: string) => void;
};
```

## 11. VisualConsistencyPanel

```ts
export type VisualConsistencyPanelProps = {
  preview: VisualConsistencyPreview;
  assets: readonly CharacterAssetPreview[];
  onOpenAsset: (assetId: string) => void;
};
```

## 12. CharacterAssetViewer

```ts
export type CharacterAssetViewerProps = {
  open: boolean;
  assets: readonly CharacterAssetPreview[];
  activeAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onClose: () => void;
};
```

## 13. AICharacterAssistantPanel

```ts
export type AICharacterAssistantPanelProps = {
  status: "empty" | "thinking" | "ready" | "error";
  summary: string;
  suggestions: readonly string[];
  onRebuild: () => void;
};
```

If `AIThinkingState` is rendered, only the current ACS-supported Props are used:

```ts
type SupportedAIThinkingStateProps = {
  label: string;
  detail: string;
  compact?: boolean;
};
```

## 14. ContinueScriptButton

```ts
export type ContinueScriptButtonProps = {
  disabled: boolean;
  loading: boolean;
  onContinue: () => void;
};
```

Mapping:

```tsx
<ACSButton
  variant="primary"
  disabled={disabled || loading}
  aria-busy={loading}
  onClick={onContinue}
>
  进入剧本设计
</ACSButton>
```

## 15. Defaults

- `readOnly` defaults to `false`.
- `disabled` defaults to `false`.
- `loading` is required for primary CTA.
- no component manufactures Domain refs.
- no callback name may imply persistence unless a later connected API spec explicitly defines it.
