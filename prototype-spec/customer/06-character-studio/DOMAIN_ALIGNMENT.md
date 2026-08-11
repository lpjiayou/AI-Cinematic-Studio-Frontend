# Character Studio — Domain Alignment

Version: `V4.1`

## Purpose

This file prevents UI/domain drift. It is an alignment contract, not a Domain Schema.

## Authoritative Milestone Alignment

Character Studio is **primarily a UI facet of M6 — Series IP Bible + Character Intelligence**.

It is not mapped to fictional milestones named “M9 Character Context”, “M10 Identity Lock”, or “M11 Character Asset System”.

Relevant authoritative roadmap context:

- M1 — AI Director Core
- M2 — Series + Episode Foundation
- M3 — Script Studio
- M4 — Project Context Foundation
- M5 — Series Planning + Series Director
- **M6 — Series IP Bible + Character Intelligence**
- M7 — Narrative Closed Loop
- M8 — Storyboard + Creative Shot Domain
- M9 — Asset Requirement + Asset Intelligence
- M10 — Image Generation
- M11 — Video Production

## M6 Ownership

M6 owns or exposes the future application-facing character/world intelligence necessary for:

- Series Bible / SeriesBibleVersion;
- Character Identity / CharacterDefinition;
- stable characterRef supplied by backend;
- personality and behavior rules;
- dialogue style rules;
- visual identity rules;
- forbidden behaviors;
- RelationshipContext;
- CharacterState and arc stage;
- episode applicability;
- timeline/continuity notes;
- consistency validation/readiness.

Character Studio displays and edits Presentation models that will later map through Creator Application contracts to M6 public capabilities.

## V5 Identity Engine Boundary

Future Identity Engine owns:
- Character Profile;
- Character Reference Pack;
- Identity Lock;
- Face / Body / Voice / Costume / Style identity constraints;
- generation-time identity constraints;
- post-generation identity verification.

Character Studio does not call Identity Engine directly.

Correct future path:

```text
Character UI
↓
Frontend Experience Adapter
↓
Creator Application
↓
Accepted Public Identity/M6 Contract
↓
V5 Identity Engine
```

Phase 1:
`VisualConsistencyPreview` only.

## V5 Asset Engine Boundary

Future Asset Engine owns:
- Candidate Asset;
- Immutable Asset;
- Asset Registry;
- Asset Version Tree.

Character Studio only displays local prototype assets in Phase 1.

No Asset Registry write.

## M9 / M10 Future Asset Flow

Character appearance UI may later participate in:

```text
Character Identity / World Constraints
↓
M9 Asset Requirement + Asset Intelligence
↓
M10 Image Generation
↓
Candidate Character Visual
↓
Identity verification / human approval
↓
V5 Asset Engine registration
```

This does not make M9/M10 owners of CharacterDefinition.

## Script Studio Relationship

M3 Script Studio remains the authority for Script / ScriptVersion.

Character Studio / M6 supplies constraints to Script Studio:

```text
SeriesBibleVersion
+ CharacterDefinition
+ CharacterState
+ RelationshipContext
↓
Script Studio generation/rewrite constraints
↓
ScriptVersion
↓
M6 consistency validation
```

Character Studio must never silently rewrite a ScriptVersion.

## UI Mapping

| UI Area | Future Authoritative Capability | Direction |
|---|---|---|
| Character Overview | M6 CharacterDefinition read model | Query |
| Identity Canvas | M6 character rules + V5 Identity Engine future boundary | Query / future Command through Creator Application |
| Personality | M6 behavior/dialogue rules | Query / future update |
| Character State | M6 CharacterState resolution | Query |
| Relationship Graph | M6 RelationshipContext | Query |
| Visual Consistency Preview | M6 consistency + V5 Identity Engine future validation | Readiness/verification preview |
| Appearance Board | M6 visual identity constraints; later M9/M10 asset flow | Context / later generation request |
| Asset Viewer | future V5 Asset Engine read model | Query |
| Continue Script | M3 Script Studio experience | Navigation / constraint projection |

## Forbidden Architecture

Never:

```text
React
→ Character table

React
→ Identity Engine private adapter

React
→ Asset Registry SQL

React
→ Provider

Local asset id
→ characterRef
```

Frontend may receive opaque refs later from Creator Application, but never manufactures them.
