# AI Cinematic Studio — Character Studio Specification

Version: `V4.1`  
Package Type: `FULL REPLACEMENT / IMPLEMENTATION-READY SPECIFICATION`  
Target Route: `/character-studio`

## Purpose

Character Studio is the customer-facing character intelligence and identity-development workspace. It sits after Story World / IP Bible in the user experience and before Script Studio, but UI page order is not treated as a one-to-one milestone-number mapping.

The page helps a creator understand and refine:
- narrative character identity;
- motivation, belief, conflict and goal;
- personality and behavioral rules;
- dialogue/speech direction;
- relationships;
- episode-aware character state preview;
- visual identity direction;
- appearance references;
- local visual-consistency preview.

## Authoritative Product Alignment

Character Studio primarily aligns to the authoritative M1–M19 roadmap as follows:

- **M6 — Series IP Bible + Character Intelligence:** primary domain capability for CharacterDefinition, Character Identity, CharacterState, RelationshipContext, visual/behavioral rules, continuity and consistency.
- **V5 Identity Engine:** future owner of Character Profile, Character Reference Pack and Identity Lock execution/verification boundaries.
- **V5 Asset Engine:** future owner of registered immutable assets and asset versions.
- **M9 — Asset Requirement + Asset Intelligence:** future character-asset requirement/context production, not the owner of Character Intelligence.
- **M10 — Image Generation:** future generation of character visual candidates under identity/world constraints.
- **M3 — Script Studio:** existing downstream/peer consumer of M6 character/world constraints; ScriptVersion remains Script authority.
- **M7 — Narrative Closed Loop:** future closed-loop narrative integration.
- **M8 — Storyboard + Creative Shot Domain:** downstream consumer after narrative readiness.

The UI must never rename M9, M10 or M11 into fictional “Character Context / Identity Lock / Character Asset System” milestones.

## Experience Flow

```text
Story World / IP Bible
        ↓
Character Studio
        ↓
Script Studio
        ↓
Storyboard / Shot
```

This is an experience flow, not milestone execution order.

## Phase 1 Frontend Boundary

Allowed:
- local Presentation DTOs;
- local character editing;
- local relationship selection;
- local appearance asset viewing;
- local Identity Preview;
- local consistency preview;
- Light/Dark theme;
- responsive and accessible interactions.

Forbidden:
- Character Entity creation;
- Identity Lock persistence;
- CharacterState persistence;
- Asset Registry write;
- creation of characterRef / identityRef / assetRef;
- Browser → Database;
- Browser → Provider;
- direct V5 Identity Engine / Asset Engine calls;
- modification of V5/V4/V3;
- representing local preview as an approved/locked production fact.

## Theme

Theme is owned by the existing ACS Theme Provider. Character Studio must not introduce a page-local theme or fallback.

## Specification Priority

0. `docs/design-system/`
1. `TOKEN_MAPPING.md`
2. `DOMAIN_ALIGNMENT.md`
3. `IMPLEMENTATION_CONTRACT.md`
4. `ASSET_SPEC.md`
5. `visual-spec/`
6. `PAGE_STRUCTURE.md`
7. `COMPONENT_MAP.md`
8. `STYLE_SPEC.md`
9. `RESPONSIVE_SPEC.md`
10. `STATE_SPEC.md`
11. `INTERACTION_SPEC.md`
12. `DATA_BINDING_SPEC.md`
13. `assets-spec/`

If a conflict remains after applying this order, implementation stops and reports the conflict.
