# Character Studio — Asset Package Manifest

Version: `V4.1`

## Required Asset Specification Files

- `CHARACTER_ASSET_SPEC.md`
- `PACKAGE_MANIFEST.md`

## Required Runtime Files

- `public/assets/character-studio/hero/character-overview.webp`
- `public/assets/character-studio/identity/identity-board.webp`
- `public/assets/character-studio/appearance/character-face.webp`
- `public/assets/character-studio/appearance/character-costume.webp`
- `public/assets/character-studio/appearance/character-props.webp`
- `public/assets/character-studio/relation/relationship-board.webp`
- `public/assets/character-studio/ASSET_PROVENANCE.md`

## Implementation Verification

Report for each asset:
- path;
- format;
- dimensions;
- ratio;
- bytes;
- exact Alt;
- object-position/crop;
- rights status;
- identity consistency;
- mobile crop result;
- Light/Dark result;
- CLS result.

## Missing Asset Rule

Implementation may generate local prototype assets if absent.

Generated assets must follow ASSET_SPEC exactly.

Forbidden:
- random URL;
- unlicensed character;
- celebrity likeness;
- commercial IP replica;
- gray/black placeholder.
