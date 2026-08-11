# Character Studio — Style Specification

Version: `V4.1`

## Product Feeling

Character Studio is a cinematic character-development room, not:
- a game character creator;
- an avatar generator;
- a profile database;
- a parameter-heavy AI image page.

Visual priority:
1. character identity;
2. appearance;
3. personality/state;
4. relationship;
5. consistency preview;
6. AI suggestions.

## Theme

Owned by ACS Theme Provider.

Light:
- film development office;
- clean archival surfaces;
- readable character notes;
- character imagery supplies depth.

Dark:
- cinematic character room;
- deep elevated surfaces;
- restrained AI accent;
- media remains visible;
- no black voids.

The represented character must not change identity across themes.

## Token Use

- page background → `--acs-bg`
- cards → `--acs-surface`
- media → `--acs-media-stage`
- AI origin/activity → `--acs-ai-accent`
- overlay → `--acs-overlay`
- primary CTA → `--acs-primary`
- selected → `--acs-surface-selected`

No raw colors or page-local design tokens.

## Media

Character Overview, Appearance Board, Visual Consistency and Asset Viewer use media-stage semantics.

No `--acs-surface-deep` for media canvas.

## Motion

Use ACS motion tokens only.

Allowed:
- asset selection transition;
- subtle image scale;
- local preview fade;
- modal/drawer transition;
- restrained AI pulse.

Forbidden:
- 3D spin;
- game idle animation;
- automatic avatar rotation;
- fake generation progress;
- particle effects.

## Acceptance

PASS when:
- character is the visual focus;
- identity, appearance and narrative rules are distinguishable;
- page does not resemble backend administration;
- page does not imply real Identity Lock;
- theme switch preserves the same character.
