# ACS Design System V3 Decision

Status: ACCEPTED

Document class: ACCEPTED_DECISION

Decision date: 2026-09-04

Implementation authority: NONE

## Decision

Design System V3 reuses the V2.3 visual, token, theme, accessibility, and layout
foundation. It adds a presentation-only production-object layer and refactors shell
composition. It does not create a second palette, domain model, route map, adapter, or
authority system.

CURRENT_DESIGN_SYSTEM_REUSABLE=YES_FOUNDATION_ONLY

DESIGN_SYSTEM_FOUNDATION_REUSED=true

DESIGN_SYSTEM_V3_NEW_OBJECT_COUNT=21

## Foundation retained

The following existing components remain direct inputs to V3:

- ACSButton
- ACSCard
- ACSBadge
- ACSModal
- ACSDrawer
- AIAssistantPanel
- AIThinkingState
- AICandidateCard
- VersionTimeline
- WorkflowMap
- WorkspaceLayout
- EditorLayout
- InspectorDrawer

Existing semantic tokens, dark/light themes, focus behavior, and reduced-motion
baseline remain authoritative. DEFAULT_THEME=DARK_CINEMATIC and
LIGHT_THEME_SUPPORTED=true. Components must use semantic tokens, never feature-local
raw colors as state authority.

## Shell geometry

GlobalRail uses --acs-sidebar-collapsed-width at 72 px. Its expanded navigation is a
temporary 240 px overlay using --acs-sidebar-width. ProjectNavigatorV3 uses
--acs-project-nav-width at 220 px. ProjectContextBar uses --acs-topbar-min-height at a
minimum 56 px. Selection inspectors use --acs-inspector-width at 22.5 rem / 360 px.
JobShelf is 48 px collapsed and no more than --acs-bottom-drawer-height / 280 px
expanded. PrimaryCanvas is min-width zero and consumes remaining flexible width;
media/editing canvases use --acs-media-stage and never a marketing-page maximum width.

## Visual and semantic rules

The target balance is 90% neutral, 8% teal interaction, and 2% amber or AI-purple
emphasis. Purple communicates AI source, not approval. Green communicates technical
completion or explicit success, not creative approval, rights approval, or publication
authority. Red remains failure/rejection/danger and amber remains warning/restriction.
All state has a text or icon-plus-text signal and never relies on color alone.

Chinese-first workbenches have at most one primary action per task region, no giant
hero, no marketing feature grid, and no decorative fake-data empty state. Raw refs,
digests, queue/worker/Provider names, and stack traces appear only in EvidenceDisclosure.

## New presentation-object contracts

### GlobalRail

- **props:** ordered destinations, active route id, collapsed/overlay state, theme/account presentation, supplied badges
- **slots:** brand, primary destinations, utility footer, overlay header
- **keyboard behavior:** Arrow-key roving within the rail; Enter/Space invokes supplied link handlers; Escape closes overlay and restores trigger focus.
- **responsive behavior:** 72 px rail at desktop; 240 px temporary overlay when expanded; named navigation drawer below 768 px.
- **empty state:** Render the six canonical destinations without fabricated badges; omit absent utilities.
- **blocked state:** A blocked destination uses supplied disabled reason and a real blocker route or disclosure, never a dead click.
- **accessible name:** Required navigation landmark label and accessible label for every icon-only destination.
- **public barrel export:** Export from the V3 presentation barrel as GlobalRail and its view-model types.
- **non-responsibility:** Does not own route definitions, call router navigation, fetch data, infer permissions, or create authority.

### ProjectContextBar

- **props:** project title, Series/Episode labels, user-readable version state, readiness summary, supplied collaboration affordance
- **slots:** project identity, context trail, readiness, actions
- **keyboard behavior:** Logical tab order; disclosure/action controls support Enter/Space; Escape closes any supplied menu.
- **responsive behavior:** Minimum 56 px desktop/tablet bar; fixed 56 px contextual header at phone widths with progressive disclosure.
- **empty state:** Explicit missing-project-context label with safe route supplied by the feature.
- **blocked state:** Shows supplied readiness/blocker summary without changing its classification.
- **accessible name:** Required project-context landmark label; state text is programmatically associated with the project title.
- **public barrel export:** Export as ProjectContextBar with presentation-only props.
- **non-responsibility:** Does not read ProjectContext, expose raw refs, navigate, calculate readiness, or merge Series/Episode authority.

### ProjectNavigatorV3

- **props:** exact ten ordered destinations, active destination, supplied availability/blocker state, compact/overlay mode
- **slots:** header, destination list, footer
- **keyboard behavior:** Roving arrow navigation; Enter/Space invokes supplied link; Escape closes overlay and restores focus.
- **responsive behavior:** 220 px using --acs-project-nav-width on wide desktop; compact or overlay at 1152–1439; named drawer below 1152.
- **empty state:** All ten targets remain discoverable; unimplemented targets point to supplied EmptyProductState/CapabilityBlocker.
- **blocked state:** Disabled styling includes text reason and reachable explanation; no click-without-result.
- **accessible name:** Required project-navigation landmark and accessible destination names.
- **public barrel export:** Export as ProjectNavigatorV3 and destination view-model types.
- **non-responsibility:** Does not define routes, call a router, fetch projects, interpret milestone state, or authorize destinations.

### WorkbenchShell

- **props:** global/project chrome modes, inspector/job-shelf visibility, drawer state, density, supplied focus targets
- **slots:** global rail, context bar, project navigator, primary canvas, inspector, authority/evidence, job shelf
- **keyboard behavior:** Enforces landmark order and one overlay focus trap; closing an overlay restores its registered trigger.
- **responsive behavior:** Token-based desktop geometry; one primary canvas and mutually exclusive overlays at medium/phone widths.
- **empty state:** Keeps shell landmarks stable while the feature supplies its EmptyProductState.
- **blocked state:** Keeps primary blocker visible without substituting success content.
- **accessible name:** Named main region and named navigation/complementary regions supplied by the composing feature.
- **public barrel export:** Export as WorkbenchShell with layout-only region types.
- **non-responsibility:** Does not fetch, navigate, own feature state, choose active domain object, or interpret authority/runtime policy.

### GenerationPromptBar

- **props:** prompt value, task intent, reference summary, validation, disabled/blocked state, supplied submit handler
- **slots:** intent, prompt input, reference summary, compatible parameters, primary action
- **keyboard behavior:** Standard text editing; deterministic shortcut only when documented; submit never fires while blocked or composing text.
- **responsive behavior:** Inline composition on desktop; stacked full-width controls at 390 px with action remaining reachable.
- **empty state:** Instructional prompt label and lawful-reference guidance, not a fabricated result.
- **blocked state:** Input may remain editable while supplied blocker disables submit and exposes explanation.
- **accessible name:** Visible prompt label plus accessible name for task intent, reference summary, and submit.
- **public barrel export:** Export as GenerationPromptBar and presentation state types.
- **non-responsibility:** Does not submit itself, fetch, choose model/method/Provider, mint refs, validate Core authority, or create Jobs.

### AssetPicker

- **props:** supplied assets, search/filter view model, lifecycle/rights labels, selection intent, disabled reason
- **slots:** search, filters, asset results, selection summary, actions
- **keyboard behavior:** Roving grid/list selection, multi-select semantics when supplied, Escape cancels picker and restores trigger focus.
- **responsive behavior:** Grid/list desktop; two/one columns with filter and detail drawers on narrow widths.
- **empty state:** Distinguishes no assets, no filter matches, disconnected, and unauthorized from supplied state.
- **blocked state:** Rights/lifecycle-blocked assets remain inspectable but cannot be selected; reason is textual.
- **accessible name:** Named picker region and accessible asset name/lifecycle for each option.
- **public barrel export:** Export as AssetPicker and asset-option presentation types.
- **non-responsibility:** Does not upload, bind, select, admit, fetch, create AssetVersion facts, or infer rights.

### GenerationHistory

- **props:** supplied batches/revisions, currentness labels, selected id, filters, supplied open/compare handlers
- **slots:** filters, batch group, revision row, detail action
- **keyboard behavior:** Arrow-key list navigation; Enter opens supplied target; selection and currentness are announced.
- **responsive behavior:** Side rail on desktop; named drawer or replacement view on tablet/phone.
- **empty state:** Distinguishes no generations from filtered-out, disconnected, and unauthorized.
- **blocked state:** Blocked/stale revision remains visible and routes to its supplied explanation.
- **accessible name:** Named history region; every batch/revision has a programmatic label and state.
- **public barrel export:** Export as GenerationHistory and immutable history view types.
- **non-responsibility:** Does not fetch, infer the canonical/current revision, replay, revise, delete history, or navigate.

### JobQueue

- **props:** supplied Jobs and normalized queued/running/blocked/failed/succeeded/superseded states, filters, selection
- **slots:** filters, job row/card, detail summary, recovery action
- **keyboard behavior:** Keyboard row/card selection and filter controls; aria-live polite summaries for meaningful supplied state changes.
- **responsive behavior:** Table/stream desktop; grouped status cards and detail drawer at phone widths.
- **empty state:** No jobs, no matches, disconnected, and unauthorized are separate supplied variants.
- **blocked state:** Blocked/failed rows persist with reason and supplied recovery action; unknown state fails closed.
- **accessible name:** Named jobs region and accessible job name, state, and progress text.
- **public barrel export:** Export as JobQueue and normalized Job presentation types.
- **non-responsibility:** Does not access an internal queue, poll/fetch, cancel/retry/replay, call Provider, or infer success.

### JobShelf

- **props:** supplied queued/running/blocked/failed summaries, collapsed/expanded state, open-center handler
- **slots:** summary, job items, blocker, footer action
- **keyboard behavior:** Toggle and items are keyboard reachable; Escape collapses; focus returns to the opening control.
- **responsive behavior:** 48 px collapsed and maximum 280 px expanded using --acs-bottom-drawer-height; bottom drawer on tablet/phone.
- **empty state:** Collapsed inactive label or omitted content; never invent a running job.
- **blocked state:** Blocked/failed summary remains visible and is not colored as success.
- **accessible name:** Named job-shelf region, state count summary, and labeled expand/collapse control.
- **public barrel export:** Export as JobShelf and compact Job summary types.
- **non-responsibility:** Does not access queues, fetch, mutate Jobs, navigate to a hard-coded route, or hide failures.

### ShotNavigator

- **props:** supplied Scene/Shot hierarchy, status/currentness, selected id, compact mode, supplied select/open handlers
- **slots:** scene header, Shot row, status, footer action
- **keyboard behavior:** Tree/treegrid semantics as appropriate; arrow-key hierarchy navigation, Home/End, Enter selection, announced state.
- **responsive behavior:** 220 px/local rail on desktop; compact overlay/drawer on medium; full-screen named drawer at 390 px.
- **empty state:** Explain missing confirmed script/bootstrap prerequisite from supplied copy.
- **blocked state:** Stale or unavailable Shot remains visible with supplied blocker and cannot trigger prohibited action.
- **accessible name:** Named Scene/Shot navigation and unique accessible Shot labels.
- **public barrel export:** Export as ShotNavigator with read-only hierarchy types.
- **non-responsibility:** Does not create/reorder Shots, bootstrap, fetch, navigate, derive executionClass, or resolve stale input.

### MediaCompare

- **props:** supplied left/right media, comparison mode, synchronized time, labels, QC/lifecycle state
- **slots:** left media, right media, controls, metadata, issue overlay
- **keyboard behavior:** Keyboard mode/side switching, synchronized playback controls, and accessible nonvisual comparison summary.
- **responsive behavior:** A/B or overlay on desktop/tablet; swipe or single-side toggle on phone.
- **empty state:** Names the missing comparison side without inserting placeholder media.
- **blocked state:** Unavailable media remains labeled and comparison controls disable with reason.
- **accessible name:** Required comparison label plus distinct accessible names for both media sides.
- **public barrel export:** Export as MediaCompare and media-side presentation types.
- **non-responsibility:** Does not fetch/decode, select/admit/approve media, infer QC, or treat either side as canonical.

### Waveform

- **props:** supplied samples/peaks, duration, time range, playhead, markers, disabled/read-only state
- **slots:** canvas/visual, controls, marker labels, accessible summary
- **keyboard behavior:** Keyboard seek/range navigation with documented increments and a nonvisual time/marker alternative.
- **responsive behavior:** Detailed desktop/tablet display; simplified playback/time summary on phone.
- **empty state:** Explicit no admitted audio/no samples state; SILENCE is a distinct supplied value.
- **blocked state:** Read-only or unavailable waveform preserves metadata and explains disabled editing.
- **accessible name:** Visible or programmatic audio/waveform label with current time, duration, and marker descriptions.
- **public barrel export:** Export as Waveform and immutable sample/marker types.
- **non-responsibility:** Does not decode/record/synthesize audio, fetch bytes, mutate Timeline, or infer audio requirements.

### TimelineTrack

- **props:** track id/type/label, supplied clips, lock/mute display state, selection, supplied drop-preview state
- **slots:** header, controls, clip lane, drop indicator
- **keyboard behavior:** Roving clip navigation and labeled track controls; mutation shortcuts only through supplied enabled handlers.
- **responsive behavior:** Full track lane on desktop/tablet; read/playback summary rather than compressed multitrack editing on phone.
- **empty state:** Labeled empty track with authorized add affordance only when supplied.
- **blocked state:** Locked/policy-blocked track remains readable; mutation controls disable with text reason.
- **accessible name:** Named track with type, lock/mute state, and clip count.
- **public barrel export:** Export as TimelineTrack and presentation-only track types.
- **non-responsibility:** Does not persist drops/reorder, mutate Timeline, fetch assets, enforce domain ordering, or infer authority.

### TimelineClip

- **props:** clip id/type/label, supplied timing/trim presentation, lifecycle, selected/conflicted/blocked state
- **slots:** thumbnail/waveform, label, badges, trim handles, issue marker
- **keyboard behavior:** Roving selection and accessible trim/reorder controls only when supplied; current time range is announced.
- **responsive behavior:** Detailed handles on desktop/tablet; simplified read/reorder card on phone.
- **empty state:** Not applicable to an absent clip; missing media uses an explicit unavailable clip variant.
- **blocked state:** Conflict, unadmitted source, or lock disables mutation while preserving clip identity.
- **accessible name:** Clip label includes media type, time range, lifecycle, and conflict/blocked state.
- **public barrel export:** Export as TimelineClip and immutable clip view types.
- **non-responsibility:** Does not trim/reorder/persist, admit assets, decode media, infer lifecycle, or create Timeline facts.

### EffectInspector

- **props:** supplied effect schema, values, validation, read-only/blocked state, supplied change/submit handlers
- **slots:** effect identity, parameter fields, validation, actions, evidence link
- **keyboard behavior:** Schema-defined controls follow form order; errors are associated; Escape closes drawer and restores selection.
- **responsive behavior:** Selection inspector desktop; named drawer on medium/phone.
- **empty state:** No selected effect is distinct from unavailable effect schema.
- **blocked state:** Read-only/policy-blocked fields preserve values and state the reason.
- **accessible name:** Named selected-effect inspector and labels/descriptions for every parameter.
- **public barrel export:** Export as EffectInspector with presentation schema/value types.
- **non-responsibility:** Does not define deterministic semantics, execute/render effects, fetch schemas, persist values, or infer validity beyond supplied validation.

### AudioInspector

- **props:** supplied requirement, rights, source, duration, lifecycle, runtime/authority state
- **slots:** requirement summary, source, rights/lineage, properties, blocker, actions
- **keyboard behavior:** Logical property/action order; playback controls labeled; drawer Escape restores selected Audio item.
- **responsive behavior:** Selection inspector desktop; full-screen named drawer on phone.
- **empty state:** No item, no requirement, and SILENCE are distinct supplied states.
- **blocked state:** Rights/runtime/authority blocker is persistent and disables supplied actions.
- **accessible name:** Named audio-item inspector with requirement and lifecycle summary.
- **public barrel export:** Export as AudioInspector and audio presentation types.
- **non-responsibility:** Does not clone voice, synthesize, bind sources, dispatch work, fetch, infer rights, or create audio facts.

### RenderCandidateCard

- **props:** supplied Candidate identity, lifecycle, format, QC summary, preview availability, selected state
- **slots:** preview, metadata, QC, badges, actions
- **keyboard behavior:** Card and real supplied actions are keyboard reachable; selection is announced without implying approval.
- **responsive behavior:** Grid/list card desktop; one-column review card on phone.
- **empty state:** No Candidate uses an owning page EmptyProductState, not a fabricated card.
- **blocked state:** QC/authority/runtime blocker remains visible; prohibited action is absent or disabled.
- **accessible name:** Candidate label includes lifecycle, format, and QC state.
- **public barrel export:** Export as RenderCandidateCard and Candidate view types.
- **non-responsibility:** Does not create/render/select/approve a Candidate, fetch preview, label it Master, or infer publishability.

### CapabilityBlocker

- **props:** supplied blocker class, cause, consequence, owner, next safe action, evidence summary, severity
- **slots:** icon, title, explanation, next action, evidence trigger
- **keyboard behavior:** Primary safe action and evidence trigger are keyboard reachable; no focus-stealing announcements.
- **responsive behavior:** Pinned compact summary desktop; inline card or named drawer on narrow widths.
- **empty state:** No blocker renders nothing or an explicit available state supplied by the feature; it never manufactures readiness.
- **blocked state:** Its canonical state; cause, consequence, owner, and next action are all required.
- **accessible name:** Programmatic blocker summary includes affected capability and severity without relying on color.
- **public barrel export:** Export as CapabilityBlocker and closed blocker-category types.
- **non-responsibility:** Does not waive/reinterpret blockers, grant authority, retry, navigate, fetch, or convert blocked to success.

### AuthorityStatus

- **props:** supplied UI, runtime, authority, and policy layer states plus user-readable summary
- **slots:** layer list, summary, action, evidence trigger
- **keyboard behavior:** Layer details and supplied actions are keyboard reachable; changes use restrained polite announcements.
- **responsive behavior:** Compact right-side status desktop; summary trigger and named drawer on narrow widths.
- **empty state:** Unknown layer fails closed and is labeled unknown/unverified, never Ready.
- **blocked state:** Blocked layers remain distinct and identify the next owner/action.
- **accessible name:** Named authority status with text for every layer and no color-only meaning.
- **public barrel export:** Export as AuthorityStatus and closed presentation-state types.
- **non-responsibility:** Does not infer/create/grant authority, calculate runtime readiness, fetch policy, or authorize actions.

### EvidenceDisclosure

- **props:** supplied user summary, technical fields, sensitivity labels, copy permissions, open state
- **slots:** summary, technical table, provenance, copy actions
- **keyboard behavior:** Disclosure semantics, focus containment for drawer/modal mode, Escape close, and trigger focus restoration.
- **responsive behavior:** Inline disclosure/side panel desktop; named full-screen drawer at phone width.
- **empty state:** Explicit no evidence recorded/unavailable state; never creates example refs.
- **blocked state:** Sensitive/unauthorized fields are omitted or redacted by supplied policy with explanation.
- **accessible name:** Required evidence title and accessible names for copy controls and technical fields.
- **public barrel export:** Export as EvidenceDisclosure and immutable evidence-field types.
- **non-responsibility:** Does not fetch evidence, generate refs/digests, decide redaction, infer truth, grant authority, or expose secrets.

### EmptyProductState

- **props:** supplied variant, title, explanation, prerequisite, real primary/secondary actions, illustration policy
- **slots:** title, description, prerequisite, actions, optional approved asset
- **keyboard behavior:** Only real supplied actions enter tab order; focus starts at the heading/primary action according to context.
- **responsive behavior:** Uses the flexible canvas without giant hero; stacks compactly at 390 px.
- **empty state:** Its canonical variants are no data, no filter results, disconnected, unauthorized, and not implemented.
- **blocked state:** Not-implemented/unauthorized variants use CapabilityBlocker semantics and never an enabled fake action.
- **accessible name:** Heading identifies the empty condition and actions have explicit names.
- **public barrel export:** Export as EmptyProductState with a closed variant union.
- **non-responsibility:** Does not fabricate data, silently use fixtures, navigate, fetch, authorize, or turn empty/disconnected into success.

## Universal prohibited responsibilities

Every V3 design-system module is presentation-only. It must not:

- call fetch or Core/Provider endpoints;
- own router navigation or canonical route definitions;
- mint refs, digests, domain facts, Jobs, Candidates, Assets, or authority;
- select or override executionMethod or internal Provider;
- infer runtime readiness, rights, policy, approval, admission, Master, or publication;
- use success tone as a substitute for human/creative/rights approval;
- silently substitute LOCAL_FIXTURE or hide an unknown/blocked/error state.

Features supply immutable view models and handlers. Feature adapters own closed-world
mapping and must fail closed for unknown values.

## Required code-era governance tests

Any later authorized V3 component implementation must add:

1. public-barrel export and component-contract tests;
2. no-fetch, no-navigation-ownership, and no-domain-authority static contracts;
3. dark/light semantic-token tests with no raw feature colors;
4. keyboard, focus trap/restore, accessible-name, and reduced-motion tests;
5. representative shell browser gates at 1920×1080, 1440×900, and exact 390×844;
6. truth-boundary tests for blocked versus success, Candidate versus Admitted, and
   PreviewCandidate versus Master;
7. responsive tests that allow one primary canvas and one named drawer at phone width.

## Decision boundary

FRONTEND_V3_DESIGN_SYSTEM_DECISION=ACCEPTED

FRONTEND_V3_IMPLEMENTATION=NOT_STARTED

This decision defines component contracts only. It does not create components, modify
the public barrel, authorize runtime work, or start Wave 1A.
