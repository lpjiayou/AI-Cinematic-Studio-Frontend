# Character Studio — Package Manifest

Version: `V4.1`
Package Type: `FULL REPLACEMENT / TARGETED READINESS CLOSURE`
Expected Markdown File Count: `21`

## Replacement Rule

This is a full replacement package based on the prior verified baseline.

It closes the remaining NOT READY items:
1. `CharacterRelation.continuityNotes`;
2. `CharacterStateCardProps`;
3. Character Overview main visual + optional arc-stage Props;
4. full six-asset focal/safe/mobile crop contracts.

Do not merge with older Character Studio specs.

## Integrity Table

Covers all 20 non-root-manifest Markdown files.

| File | SHA-256 | UTF-8 Bytes | Lines |
|---|---|---:|---:|
| `ASSET_SPEC.md` | `281f58bc8b7be5d0b9f1e8f41d6adeec8f8c7056e3371771f82cfa6af838c493` | 6089 | 296 |
| `COMPONENT_MAP.md` | `f02163317a00222f5b96d927d0c8a559f5a097799bcaffcf65c35bd7d60ba83a` | 2668 | 53 |
| `DATA_BINDING_SPEC.md` | `7c872da5f5ab4815302cfbda9efe953e8d028c6db940e0e5cf6cf7b7ea8d81fb` | 2201 | 103 |
| `DOMAIN_ALIGNMENT.md` | `fc408b2cbfca71939422025df5f846f510084fc5a2bc142f26ad9f1bcc680593` | 4196 | 165 |
| `FREEZE_CHECKLIST.md` | `4ac57f3f1f02711a417a34ce5f93e3f066cc2b60fedac0dfad4d3135556a5873` | 2873 | 74 |
| `IMPLEMENTATION_CONTRACT.md` | `dbd870c0e0be2ba2be4103f0578b63592b7656ce832097d1eba9f198baee8dc3` | 7249 | 315 |
| `IMPLEMENTATION_READINESS_CHECKLIST.md` | `08cb86119f30f57bfe38073e24e5f25a29b64e088c1ef3e429b24158f0970f94` | 2519 | 61 |
| `INTERACTION_SPEC.md` | `0d95919ca54b55e36158fe2851bd3da60f9f66ecc3e3fa131e1a67e109f5da81` | 2739 | 153 |
| `PAGE_STRUCTURE.md` | `131d707f1e2859111ef8089516cdfd0929941251b912d2f7f9fd652d2b257354` | 2657 | 168 |
| `README.md` | `b1e595c3632f2270c6a45f95bac6a35df0b4ba002725b0ab2c6ed22c9b0e0d13` | 3486 | 96 |
| `RESPONSIVE_SPEC.md` | `80e05515e8f602b8c90b6460795d94f8a26394570c3c0faba6326cd10cbccbca` | 2764 | 172 |
| `STATE_SPEC.md` | `23b3d99138180205d9b1c793fd2c0645eba4effdd9fa245337ab51063eaaf8e4` | 1940 | 101 |
| `STYLE_SPEC.md` | `e81447940dc76c0fbfbe50c5be0f3373f4ce6dd1d9293ebbe2d6b14e0703d3b0` | 1764 | 83 |
| `TOKEN_MAPPING.md` | `7c28f59e5e7bcd0bd9c0e50190c112f11bff4e5c5469d60158eec8ea3fc845d2` | 1245 | 39 |
| `assets-spec/CHARACTER_ASSET_SPEC.md` | `4b8beb46f5068d3fb27156b01d927906d029fda670a5aa4b63ad38d62bec9b3c` | 3586 | 99 |
| `assets-spec/PACKAGE_MANIFEST.md` | `5c9f064bed8a5c5ff4b246d3a6cc8ec60443ecd94554a75bf107473788b3a334` | 1136 | 47 |
| `visual-spec/CHARACTER_CANVAS_SPEC.md` | `b1dfbef106a60bad4ed3aed095343e2d6d2bd6fb8a7f5b477b4387cba91f2d94` | 1603 | 106 |
| `visual-spec/CHARACTER_RELATION_SPEC.md` | `99fca51e23b9fed8cef095c1a34943047bf3224f45c9c8c1ade65ad312fed59b` | 1375 | 65 |
| `visual-spec/IDENTITY_LOCK_VISUAL_SPEC.md` | `966053263f20cada8e07e2c7ceba30f387485a885f06f51b47d0b8e9686a6186` | 1380 | 68 |
| `visual-spec/VISUAL_DIRECTION.md` | `1c5e4e3803153ce789b4ed43a6af002a6a8e7f782c7a76a28e5ab1806b2fb40e` | 1344 | 65 |

## V4.1 Read-Only Gate

Must PASS all previously accepted gates plus:
- `CharacterRelation.continuityNotes` defined;
- `CharacterStateCardProps` defined;
- `CharacterOverviewCardProps.mainVisual` defined;
- optional typed `CharacterOverviewCardProps.arcStage` defined;
- relationship detail continuity-note rendering contract defined;
- all six assets have numeric focal X/Y;
- all six assets have numeric safe-zone X/Y;
- all six assets have numeric mobile crop source X/Y;
- all six assets have numeric mobile object-position X/Y;
- all six assets have numeric maximum zoom.

Only complete PASS may return READY.
