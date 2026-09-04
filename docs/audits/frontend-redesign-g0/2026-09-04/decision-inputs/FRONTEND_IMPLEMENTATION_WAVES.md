# Frontend implementation waves

Status: `SERIAL PROPOSAL / EACH WAVE REQUIRES SEPARATE AUTHORIZATION`

Every PR preserves the closed-world adapter boundary and must be independently rollbackable. Wave numbers express merge order, not current authority.

## Wave 0 — IA and Design System V3 decision freeze

- **PR count:** 1 docs-only decision checkpoint.
- **Frontend files:** design/IA docs and registries only; no `src/**`.
- **Core / API / runtime dependencies:** frozen contracts only / none / none.
- **Migration:** approve target navigation, lifecycle vocabulary and legacy compatibility disposition.
- **Tests:** documentation governance and link checks.
- **Browser gates:** none; current evidence linked.
- **Rollback:** revert the decision doc; no behavior impact.
- **Stop:** unresolved product-owner decision, Core/Frontend baseline drift, or any proposal that lets the browser choose authority/method.

## Wave 1 — Global navigation, Project Overview and workbench shells

- **PR count:** 2 serial PRs: (1) presentation primitives/shell; (2) routes/navigation/Overview.
- **Frontend files:** `src/components/**`, `src/layouts/**`, `src/lib/navigation.ts`, project chrome, new overview page, tests and design-system docs.
- **Core / API / runtime dependencies:** capability/project/state reads / current adapter plus any separately approved read routes / none.
- **Migration:** keep old URLs as redirects/aliases; no project-data migration.
- **Tests:** component contracts, navigation closed-world tests, overview empty/disconnected/blocked states.
- **Browser gates:** 1440, 1920, exact 390; keyboard and drawer focus.
- **Rollback:** feature flag or route-level revert to current shell without touching Core.
- **Stop:** new shell requires source-of-truth duplication, hides blockers, or breaks existing Script/Bible/Character routes.

## Wave 2 — M7–M11 method-aware Storyboard and Generation

- **PR count:** 3 serial PRs: adapter/contracts; read-only Storyboard/method plan; candidate/revision/admission workflow.
- **Frontend files:** core-integration adapter/client/contracts; storyboard and generation routes/features; ShotNavigator, AssetPicker, GenerationHistory, MediaCompare, CapabilityBlocker; tests.
- **Core dependency:** frozen M7–M11 public cutover and exact replay/currentness behavior.
- **API dependency:** `execution-method-plan`, `method-aware-input-plan`, `method-aware-video-route`, preflight/revision/selection resources.
- **Runtime dependency:** none for read-only UI; execution remains gated by current runtime/policy.
- **Migration:** legacy G4/G5 view remains read-only under History; no write migration or replay rewrite.
- **Tests:** allowlist/DTO closed-world tests; stale/foreign/conflict; five execution classes; Contact/Gait no-fallback; lifecycle state tests.
- **Browser gates:** shot → plan → blocker; Micro Motion blocked/executable variants; candidate compare/select/admit; exact 390 review.
- **Rollback:** disable successor routes and return to compatibility read view; never re-enable legacy writes.
- **Stop:** Core contract drift, client-side method/provider selection, unconditional video/audio request, or Contact/Gait fallback.

## Wave 3 — M12 Audio Studio blocked-first surface

- **PR count:** 2 serial PRs: explicit requirement read; runtime execution controls only after separate authorization.
- **Frontend files:** audio route/features, AudioInspector, Waveform, requirements/jobs contracts and tests.
- **Core dependency:** explicit M9→M12 requirement bridge.
- **API dependency:** `explicit-audio-requirement-route` and approved audio result routes when they exist.
- **Runtime dependency:** read-only none; execution requires M12 Runtime G0 plus C3/C4 authorization.
- **Migration:** represent `SILENCE` explicitly; no inferred or backfilled requests.
- **Tests:** silence zero-request, requirement lineage/currentness, rights, blocked Runtime G0, no voice-profile mutation routes.
- **Browser gates:** read-only requirement, silence, runtime blocker, rights blocker and exact 390 playback.
- **Rollback:** hide execution action while retaining requirement reads.
- **Stop:** Runtime G0 incomplete, C3/C4 unauthorized, voice cloning authority absent, or any direct Provider/GPU call.

## Wave 4 — M13 Timeline, effects and preview candidates

- **PR count:** 3 serial PRs: timeline read/write adapter; editor objects; RenderCandidate/Preview handoff.
- **Frontend files:** timeline route/features; TimelineTrack/Clip, EffectInspector, RenderCandidateCard; adapter/client/contracts and tests.
- **Core dependency:** accepted M13 base tag and separately authorized extension scope.
- **API dependency:** timeline, versions, edits, deterministic-effects, render-candidates, preview.
- **Runtime dependency:** deterministic CPU path only as authorized; no GPU expansion.
- **Migration:** no candidate-to-master promotion; imported existing preview evidence remains historical/read-only.
- **Tests:** timeline version/currentness, effect schema, stale inputs, replay/conflict, candidate lifecycle.
- **Browser gates:** arrange admitted assets, save version, blocked render, candidate create, mobile read/review.
- **Rollback:** route-level disable with timeline data preserved in Core.
- **Stop:** M13 extension not authorized, unadmitted media accepted, or PreviewCandidate labeled Master.

## Wave 5 — Asset Library, Job Center and generation history

- **PR count:** 2 serial PRs: assets/lineage; jobs/history/recovery.
- **Frontend files:** global assets/jobs routes; AssetPicker/JobQueue/GenerationHistory; adapter mappings and tests.
- **Core dependency:** canonical AssetVersion stream and typed state projections.
- **API dependency:** canonical registration/preflight, selection/admission and a sanctioned job projection; never direct queue access.
- **Runtime dependency:** none for reads/recovery planning.
- **Migration:** index existing Core-backed objects; do not copy or invent canonical records.
- **Tests:** rights/lineage, candidate-selected-admitted separation, unknown state fail-closed, exact replay vs revision.
- **Browser gates:** filters, empty/disconnected states, failed-job recovery and 390 px job detail.
- **Rollback:** remove global pages while project workflows continue; Core objects unchanged.
- **Stop:** no sanctioned job resource, need for browser queue credentials, or asset identity ambiguity.

## Wave 6 — Review, delivery and M14/M15 wiring

- **PR count:** 2 serial PRs: Review/QC; Works/Delivery.
- **Frontend files:** post/review/delivery/works features, approval and evidence view models, tests.
- **Core dependency:** separately authorized M14/M15 contracts and approval identity.
- **API dependency:** preview/finalize/delivery plus approved correction/approval resources.
- **Runtime dependency:** upstream M13 candidate path; publication remains separate.
- **Migration:** preserve current QC failure and not-created delivery evidence; no implicit approval.
- **Tests:** QC fail/pass, approval absence, restricted export eligibility, candidate/master/publication separation.
- **Browser gates:** full failed-QC path, approved-path fixture only when authoritative, 390 px review.
- **Rollback:** return to read-only Post/Delivery without changing Core state.
- **Stop:** M14/M15 authority absent, publication conflated with delivery, or evidence displayed as production completion.

## Wave 7 — Mobile, accessibility, performance and complete E2E

- **PR count:** 2 serial PRs: accessibility/responsive closure; end-to-end/performance closure.
- **Frontend files:** responsive styles, focus/keyboard utilities, browser fixtures/gates, performance budgets and docs.
- **Core / API / runtime dependencies:** all previously merged bounded surfaces / no new API / no new runtime.
- **Migration:** none; this wave closes quality, not capability.
- **Tests:** unit/contract/integration plus axe-style accessibility, keyboard, reduced motion, hydration and performance budgets.
- **Browser gates:** 1920, 1440, 768 and exact 390 across create → plan → blocked/generate → review → delivery; no console/request errors.
- **Rollback:** split by quality PR; do not roll back truth-boundary tests.
- **Stop:** inaccessible critical action, hidden blocker, mobile loss of context, performance regression, or duplicate/silent fixture path.

## Sequence summary

`IMPLEMENTATION_WAVE_COUNT=8`

`FIRST_IMPLEMENTATION_WAVE=WAVE_1_GLOBAL_NAV_PROJECT_OVERVIEW_AND_WORKBENCH_SHELLS`

Wave 2 is the first method-aware capability wave. It must not start until Wave 0’s IA/Design System decision is accepted and Wave 1’s shell proves existing flows still work.
