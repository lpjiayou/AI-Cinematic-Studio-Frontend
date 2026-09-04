# Frontend V3 Wave 1A Acceptance — 2026-09-04

Status: CURRENT

Document class: CURRENT_STATUS

## Acceptance result

FRONTEND_V3_WAVE_1A=IMPLEMENTED_AND_VERIFIED

WAVE_1A_OBJECT_COUNT=9

WAVE_1A_OBJECTS=GlobalRail,ProjectContextBar,ProjectNavigatorV3,WorkbenchShell,CapabilityBlocker,AuthorityStatus,EvidenceDisclosure,EmptyProductState,JobShelf

The nine Wave 1A objects are exported presentation components and layout primitives.
They accept caller-supplied view data, destinations, state, callbacks, and content.
They do not fetch, own routes, persist state, infer authority, or create domain facts.

The remaining twelve V3 production objects are not implemented: GenerationPromptBar,
AssetPicker, GenerationHistory, JobQueue, ShotNavigator, MediaCompare, Waveform,
TimelineTrack, TimelineClip, EffectInspector, AudioInspector, and RenderCandidateCard.

## Route and product boundary

CANONICAL_PRODUCT_ROUTE_CUTOVER_COUNT=0

CANONICAL_PRODUCT_PAGE_REBUILT_COUNT=0

LEGACY_PAGE_SOURCE_DIFF=0

EVIDENCE_ROUTE=NON_CANONICAL_ENV_GATED_TEST_ONLY

EVIDENCE_ROUTE_DEFAULT_STATE=404

CURRENT_PRODUCT_UI_UNCHANGED=true

The `/frontend-v3-evidence/wave-1a` route is an unlinked CI evidence harness. It is
available only when `ACS_FRONTEND_V3_EVIDENCE_MODE=1`, declares `noindex, nofollow`,
uses local neutral fixtures, and performs no Core, Experience Adapter, persistence,
mutation, runtime, Provider, or GPU operation. It is not a product route or one of the
sixteen accepted canonical screens.

## Implemented contracts

- GlobalRail presents the six caller-supplied global destinations in collapsed,
  expanded-overlay, and mobile-drawer modes without owning navigation.
- ProjectContextBar presents caller-supplied project, series, and episode context.
- ProjectNavigatorV3 presents ten caller-supplied destinations with closed
  availability states and visible blocked reasons.
- WorkbenchShell composes stable, named regions and one active mobile drawer while
  leaving all feature and route state with its consumer.
- CapabilityBlocker requires an explicit blocker code, title, summary, recovery, and
  evidence reference.
- AuthorityStatus fails unknown external state closed to `unverified` and requires all
  four presentation layers.
- EvidenceDisclosure distinguishes visible, restricted, and redacted evidence and
  never reconstructs hidden values.
- EmptyProductState suppresses executable primary actions for `not_implemented` and
  `unknown` states.
- JobShelf presents supplied job state, preserves visible failure counts when
  collapsed, and performs no polling or routing.

All nine contracts use semantic design tokens, visible state text, keyboard-accessible
controls, and reduced-motion-safe presentation.

## Frozen boundaries

FRONTEND_V3_IMPLEMENTATION=IN_PROGRESS

FRONTEND_V3_REDESIGN_COMPLETE=false

FRONTEND_V3_CANONICAL_SCREEN_IMPLEMENTED_COUNT=0

FRONTEND_V3_CANONICAL_ROUTE_CUTOVER_COUNT=0

M12_FRONTEND_EXECUTION=BLOCKED

M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE

A100_START_AUTHORIZED=false

No legacy page, current navigation source, Experience Adapter, Core pin, dependency,
lockfile, or workflow definition changes are part of Wave 1A. Browser evidence proves
only this bounded shell and truth-presentation fixture at the specified viewports.

## Next boundary

NEXT_TASK=ACS-FRONTEND-WAVE-1B-GLOBAL-ROUTES-PROJECT-OVERVIEW-AND-V3-NAVIGATION

Wave 1B remains separately authorized work. Wave 1A does not cut over any canonical
route or implement a product page.
