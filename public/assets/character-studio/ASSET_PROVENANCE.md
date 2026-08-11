# Character Studio Runtime Asset Provenance

Creation date: `2026-08-11`

All files below are project-generated internal prototype assets. They depict original fictional characters, contain no celebrity likeness or commercial IP, and are cleared for use inside this repository's prototype implementation. The six images share the same original primary character identity: 林澈, a 32-year-old Chinese memory-archive restoration specialist with shoulder-length black hair, a silver streak at the right temple, and a small scar through the left eyebrow.

| Exact path | Source method | Prompt / reference id | Rights status | Internal prototype | Identity consistency |
|---|---|---|---|---|---|
| `public/assets/character-studio/hero/character-overview.webp` | OpenAI built-in ImageGen; converted locally to WebP | `exec-f707763a-823b-44b9-8a56-e5a4ae65653b` | Project-generated; repository use permitted | Yes | Establishes the canonical 林澈 face, costume, age and world context |
| `public/assets/character-studio/identity/identity-board.webp` | OpenAI built-in ImageGen using the overview as identity reference; converted locally to WebP | `exec-5b851e5d-77d6-4be9-acca-87604b20de3f` | Project-generated; repository use permitted | Yes | Preserves the canonical face, hair, scar, costume and archive-world context |
| `public/assets/character-studio/appearance/character-face.webp` | OpenAI built-in ImageGen using the identity board as identity reference; converted locally to WebP | `exec-84c5c057-44f5-411e-bbf3-19b8630f463d` | Project-generated; repository use permitted | Yes | Preserves canonical facial geometry, age, hair streak and eyebrow scar |
| `public/assets/character-studio/appearance/character-costume.webp` | OpenAI built-in ImageGen using the face study as identity reference; converted locally to WebP | `exec-1dd77483-a46a-4090-951d-db82680d475a` | Project-generated; repository use permitted | Yes | Preserves canonical face/body identity and approved archive-restorer costume |
| `public/assets/character-studio/appearance/character-props.webp` | OpenAI built-in ImageGen using the costume board as world/material reference; converted locally to WebP | `exec-f97fbabf-e13f-4ea6-b614-1823cec33547` | Project-generated; repository use permitted | Yes | Uses the same costume materials, archive lamp and memory-spool language |
| `public/assets/character-studio/relation/relationship-board.webp` | OpenAI built-in ImageGen using the preceding five assets as identity/reference set; converted locally to WebP | `exec-0eddb371-648f-4633-af06-bb79ce9371ea` | Project-generated; repository use permitted | Yes | Preserves canonical 林澈 identity while introducing distinct original supporting characters |

## Processing record

- Final format: WebP.
- Final dimensions: overview `1920×1080`; identity and relationship `1600×900`; face, costume and props `1024×768`.
- Conversion: local Sharp resize with aspect-ratio-preserving cover fit and WebP quality 88.
- The same files render in Light and Dark themes; theme changes only surrounding ACS presentation.
- Runtime rendering must use Next.js `Image`, intrinsic dimensions or a stable-ratio `fill` wrapper, exact specification Alt text, and zero-CLS containers.
