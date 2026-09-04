# Design System V3 delta

Status: `PROPOSED DELTA / PRESENTATION ONLY`

## Executive disposition

`CURRENT_DESIGN_SYSTEM_REUSABLE=YES_FOUNDATION_ONLY`

The V2.3 brand, themes, semantic tokens, accessibility baseline, overlays and geometry shells are sound. V3 should be an additive production-object layer plus a shell refactor—not a new palette or a second domain model. No component in this delta fetches data, calls Core, owns routes, creates authority, selects an execution method or interprets backend success.

## Existing-system audit

| Area | Disposition | Evidence | V3 action |
| --- | --- | --- | --- |
| ACS Brand Guide | `REUSE_UNCHANGED` | Calm, Chinese-first, production-oriented; explicitly forbids providers, queues, stack traces and raw refs in ordinary UI | Keep palette, typography, tone and 90/8/2 emphasis balance |
| Theme + tokens | `REUSE_UNCHANGED` | Complete dark/light semantic layers, spacing, radii, motion, focus and layout dimensions | Do not add feature colors; add tokens only if a cross-feature measured need is approved |
| ACS primitives | `REUSE_UNCHANGED` | Button, Card, Badge, Modal and Drawer have stable accessible contracts | Compose; do not add domain transitions to primitives |
| AI components | `EXTEND` | Candidate and thinking states correctly separate AI provenance from authority | Add slots for source/lineage and compare entry without changing approval semantics |
| WorkflowMap + VersionTimeline | `EXTEND` | Good presentation-only ordered state models | Support compact project overview and object-specific version summaries |
| WorkspaceLayout | `EXTEND` | Already models global sidebar, project navigator, content, inspector and bottom drawer | Adopt it as the target shell; add no route/data ownership |
| EditorLayout | `EXTEND` | Correct navigator/canvas/inspector/action/bottom geometry and responsive collapse | Reuse for Script, Storyboard, Generation, Audio and Timeline workspaces |
| InspectorDrawer | `EXTEND` | Canonical mobile/right inspection behavior with focus management | Use selection-scoped inspectors and an Evidence disclosure |
| UnifiedAppHeader/current global shell | `REFACTOR` | Current implementation is a wide horizontal multi-purpose header | Split compact global navigation from project context; preserve theme/account utilities |
| Page-local feature components | `REFACTOR` | 84 component-like exports are feature/page local | Extract only repeated production objects with stable presentation contracts |
| Generic K2 Production workspace | `DEPRECATE_AS_PRIMARY` | Legacy-compatible evidence/control plane; four method-aware resources absent | Keep historical read/replay route behind compatibility label; rebuild primary workflow |
| Omnibus inspector | `DEPRECATE` | State, action, readiness and evidence compete in one long panel | Separate selected-object Inspector, CapabilityBlocker and technical Evidence |
| Raw machine-state-first copy | `DEPRECATE` | Gate evidence surfaces uppercase states and refs prominently | User-readable label first; exact state/ref on disclosure/copy |

## Required V3 production objects

| Component | Disposition | Presentation contract | Explicit non-responsibility |
| --- | --- | --- | --- |
| `GenerationPromptBar` | `NEW / EXTEND SYSTEM` | Prompt, task intent, reference summary, disabled/blocked state, submit slot | Does not select model/method/provider or submit itself |
| `AssetPicker` | `NEW` | Search/filter supplied assets; show rights, lifecycle and selection intent | Does not upload, bind, select or admit assets |
| `GenerationHistory` | `NEW` | Groups supplied revisions/candidate batches with currentness | Does not infer canonical/current version |
| `JobQueue` | `NEW` | Supplied jobs in queued/running/blocked/failed/succeeded states | No direct queue access, cancellation or retry logic |
| `ShotNavigator` | `NEW` | Scene/shot hierarchy, status, keyboard selection and compact mode | Does not create or reorder authoritative shots |
| `MediaCompare` | `NEW` | A/B, overlay or before/after presentation for supplied media | Does not select/admit/approve either side |
| `Waveform` | `NEW` | Accessible supplied samples/peaks, time range and playhead | No decoding, recording or audio authority |
| `TimelineTrack` | `NEW` | Track header, lock/mute display, supplied clips and drop slots | Does not mutate timeline state |
| `TimelineClip` | `NEW` | Clip type, state, trim handles presentation, selected/conflicted state | Does not persist trim/reorder or imply asset admission |
| `EffectInspector` | `NEW` | Form slots for supplied effect schema/values and validation | Does not define deterministic effect semantics |
| `AudioInspector` | `NEW` | Requirement, rights, source, duration and blocked status | Does not clone voice, synthesize or dispatch runtime work |
| `RenderCandidateCard` | `NEW` | Candidate lifecycle, format, QC summary, preview action | Never labels a candidate as Master or publishable |
| `CapabilityBlocker` | `NEW` | Cause, consequence, next owner/action and evidence disclosure | Does not waive or reinterpret the blocker |
| `AuthorityStatus` | `NEW` | UI/runtime/authority/policy layers with supplied states | Does not create or grant authority |
| `EmptyProductState` | `NEW` | Distinguishes no data, disconnected, unauthorized and not implemented | No fabricated sample result or silent fixture fallback |

## State vocabulary

V3 should standardize display categories without cloning Core enums:

- **Work:** draft, unsaved, saving, current, stale, conflict.
- **Job:** queued, running, blocked, failed, succeeded, superseded.
- **Candidate lifecycle:** candidate, selected, admitted, timeline candidate, approved master.
- **Capability:** available, UI missing, runtime blocked, authority required, policy denied, not open.

Components accept a normalized presentation view model and an exact technical detail payload for disclosure. Feature adapters own the mapping and must fail closed for unknown values.

## Responsive/accessibility delta

- Add roving keyboard selection patterns for ShotNavigator, candidate grids and timeline objects.
- Define focus restoration across global/project drawers and the job shelf.
- Add `aria-live="polite"` summaries for job state changes; avoid announcing decorative progress.
- Establish 390 px contracts for prompt, queue, review and blocker views; declare timeline editing tablet/desktop-first.
- Add density modes only for production objects (`comfortable` / `compact`), using existing tokens.

## Governance tests required with any V3 code

1. Public-barrel export and component-contract tests.
2. No-fetch/no-navigation/no-domain-authority static contract for design-system modules.
3. Dark/light snapshot or semantic-token tests without raw feature colors.
4. Keyboard, focus trap/restore, accessible name and reduced-motion tests.
5. 1440, 1920 and exact 390 browser gates for representative shells.
6. Truth-boundary tests: blocked ≠ success, candidate ≠ admitted, PreviewCandidate ≠ Master.

`DESIGN_SYSTEM_V3_DELTA=REUSE_FOUNDATION_EXTEND_PRODUCTION_OBJECTS_REFACTOR_SHELL_DEPRECATE_LEGACY_PRIMARY_WORKSPACE`
