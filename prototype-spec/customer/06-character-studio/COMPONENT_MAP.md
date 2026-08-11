# Character Studio — ACS Component Mapping

Version: `V4.1`

## Mapping Table

| Feature Component | ACS Foundation | Token/Role | Future Capability |
|---|---|---|---|
| Page shell | `CustomerLayout` | global theme/layout | Experience layer |
| CharacterContextBar | `ACSCard` + `ACSBadge` | `--acs-surface` | M6 read model |
| CharacterOverviewCard | `ACSCard` + media stage + `ACSBadge` | `--acs-surface`, `--acs-media-stage` | M6 Character Intelligence |
| IdentityCanvas | `ACSCard` + semantic form controls | `--acs-surface` | M6 + V5 Identity Engine boundary |
| AppearanceBoard | `ACSCard` + media stage | `--acs-media-stage` | M6 constraints; later M9/M10 asset flow |
| PersonalityCard | `ACSCard` | `--acs-surface` | M6 CharacterDefinition |
| CharacterStateCard | `ACSCard` | `--acs-surface` | M6 CharacterState |
| RelationshipGraph | `ACSCard` + `ACSModal`/`ACSDrawer` | selected/focus roles | M6 RelationshipContext |
| VisualConsistencyPanel | `ACSCard` + media stage + `ACSBadge` | media/AI status | M6 preview + Identity Engine future boundary |
| CharacterAssetViewer | `ACSModal` desktop / `ACSDrawer` mobile + media stage | overlay/media | future V5 Asset Engine read/view |
| AICharacterAssistantPanel | `AIAssistantPanel` + optional `AIThinkingState` | `--acs-ai-accent` | local suggestions / future Creator Application |
| ContinueScriptButton | `ACSButton variant="primary"` | `--acs-primary` | enters M3 Script Studio experience |
| Theme | existing `ThemeProvider` | global theme | not Domain state |

## Required Page-Level Props Ownership

`CharacterStateCard` must implement `CharacterStateCardProps` from `IMPLEMENTATION_CONTRACT.md`.

`CharacterOverviewCard` must consume:
- `mainVisual: CharacterAssetPreview`;
- optional typed `arcStage`;
- character name/role/summary;
- local status.

These are required page-content inputs, not implementation suggestions.

## Foundation Rules

- Do not add a second Card/Button/Modal/Drawer system.
- Do not create a page-local theme provider.
- Do not modify ACS shared APIs unless an actual reusable missing contract is demonstrated.
- `AIThinkingState` may only use `label`, `detail`, `compact`.
- Media containers use `--acs-media-stage`, not `--acs-surface-deep`.

## Character State Card

This page requires a page-level `CharacterStateCard` even though it was not part of the earlier simplified component list.

It is a thin `ACSCard` composition and does not become a new ACS Foundation component.

## Technical Inspector

Character Studio V4.1 has no permanent technical Inspector.

Future provenance/version/identity details may use an approved Drawer only after real API integration.
