# Production Workspace Usability and Layout Contract

> Status: `AUTHORIZED / IMPLEMENTATION BASELINE`
>
> Repository: `AI-Cinematic-Studio-Frontend`
>
> Baseline tree: `886078724f1a5373b4ede16f335812359768b291`
>
> Sequence: complete this workspace correction before FE-G5 feature expansion.

## 0. Product objective

Production pages must help a creator select an object, understand its state, perform
the primary edit or review, resolve validation issues, and deliberately advance the
result. Visual quality supports those jobs; it does not replace them.

The governing principle is:

> The object being judged or edited occupies the centre. Object selection stays on
> the left. Properties, constraints, validation, and secondary actions stay on the
> right. A candidate tray exists only while the active task actually has candidate
> results to inspect.

The same principle applies to future production interfaces. It does not require every
page to use the same visual composition.

## 1. Frozen boundaries

This implementation must not:

- change `PRIMARY_NAVIGATION`, `PROJECT_NAVIGATION`, or route paths;
- add a page, route, HTTP client, `fetch`, `axios`, or fabricated server capability;
- fabricate authoritative refs, asset counts, GPU state, queue state, or save state;
- change the accepted project presentation ViewModel merely to fill a layout;
- replace existing layouts with a second competing application shell;
- present local fixture data as authoritative or production-saved data;
- convert browse pages into production workspaces;
- add a new colour system or bypass the existing `--acs-*` tokens.

The following may change where needed for usability:

- content hierarchy, concise helper copy, and local-action labels;
- page-local composition and responsive presentation;
- layout tests and accessibility assertions;
- shared layout APIs, when backward compatible with existing consumers.

## 2. Existing primitives are authoritative

- `UnifiedAppHeader` owns global and project navigation.
- `ProjectWorkspaceChrome` owns the current local project context disclosure until a
  real project context selector exists.
- `WorkspaceLayout` is the shared primitive for object/canvas/inspector workspaces.
- `EditorLayout` remains authoritative for Script Studio.
- Page components own task state and decide which workspace regions are present.

Do not create another global header or a second layout with overlapping ownership.

## 3. Workspace archetypes

### 3.1 Character Studio — visual identity workspace

Primary jobs:

1. inspect the current character and its reference assets;
2. edit identity, appearance, personality, state, relationship, and continuity rules;
3. compare current direction with local candidates;
4. adopt or reject a candidate without silently replacing the current direction;
5. detect stale previews and interval conflicts before progression.

Composition:

- left: current character/reference/task navigation using only available local data;
- centre: the active identity, relationship, appearance, or consistency task;
- right: task-aware guidance, conflicts, provenance, and next action;
- bottom: candidate results only while a candidate-capable task is active.

There is currently no authoritative `characters[]` collection. The page must not
fabricate one or sort by a null `characterRef`.

### 3.2 Story World — knowledge and relationship workspace

Primary jobs:

1. navigate the world premise, rules, timeline, locations, factions, catalogues, and
   visual language;
2. edit the selected domain object;
3. understand cross-object constraints and missing authoritative references;
4. validate whether the local world baseline is complete enough to progress.

Composition:

- left: only collections and items that exist in the accepted presentation model;
- centre: the selected structured editor, map, timeline, relationship view, or visual
  reference;
- right: selection summary, validation, provenance, and progression state;
- no permanent candidate tray.

Missing Core collections must be disclosed as unavailable instead of represented by
fabricated empty data.

### 3.3 Script Studio — text editing workspace

Primary jobs:

1. select and edit a scene;
2. maintain dirty-state and recovery safeguards;
3. inspect character/world constraints and narrative findings;
4. generate, compare, adopt, reject, or regenerate a rewrite candidate.

`EditorLayout` remains in use. The script document is the primary centre artifact.
The candidate/history/finding drawer is task-controlled and must not permanently
reduce editor height.

## 4. Shared region behaviour

### 4.1 Object navigation

- The navigation represents real selectable objects or task sections.
- Selected state must be conveyed in text/semantics, not colour alone.
- Rows use native buttons or links and expose `aria-current`, `aria-selected`, or
  `aria-pressed` as appropriate.
- Empty collections show a factual reason and a valid next action. They do not show
  placeholder rows.
- Long labels wrap or truncate without widening the page root.

### 4.2 Primary task area

- Use `minmax(0, 1fr)` for flexible grid columns.
- The area can be an image stage, structured editor, map, timeline, graph, or text
  editor according to the current job.
- Empty and unavailable states must explain why work cannot proceed.
- An unavailable capability is never represented by `0`, a permanent spinner, or a
  fabricated result.

### 4.3 Inspector

- The inspector contains properties, constraints, validation, provenance, and
  secondary actions that relate to the current object.
- Object identity, version/dirty state, and task validation remain near the task;
  they are not overloaded into global navigation.
- Unset refs render as `未设置` or `未连接` using the existing monospace token.

### 4.4 Local and authoritative state

- Local-only actions use explicit wording such as `保存本地草稿`, `本地确认`, or
  `采用（LOCAL）`.
- A control that requires an unavailable Core capability is disabled and provides a
  visible or focusable reason.
- No action may display production success when it only changed component state.

## 5. CandidateStrip ownership

`CandidateStrip` is a controlled view. The page controller is the single source of
truth and derives its mode from the active task:

- `hidden`: no candidate-capable active task, or the task is idle, cancelled, failed,
  stale for the selected object, or no longer in scope;
- `progress`: a candidate-capable task is running; render a compact progress region;
- `results`: the task succeeded and returned multiple candidates.

When hidden, the strip is unmounted and its grid row is removed. It must not remain
transparent, off-screen, or keyboard-focusable. One candidate may be shown directly
in the primary task area without opening a strip.

Component-local state may include expansion, scroll position, and temporary focus.
Candidate results, selected candidate, adopted/rejected state, and receipts belong to
the page task state and must survive strip unmounting.

Each active task is scoped by the available combination of project client key,
page/feature id, object client key, and task id. Switching object or page unmounts any
strip whose scope no longer matches. Stale results must never appear under another
object.

## 6. Responsive behaviour

- Use `100dvh` rather than `100vh` for viewport-height workspaces.
- At wide desktop sizes, object navigation and inspector may be fixed columns.
- At narrower sizes, the inspector becomes a right drawer and object navigation a
  left drawer. The primary task area remains available.
- Drawers require focus trapping, Escape close, a visible close control, and focus
  restoration to the trigger.
- A hidden region must remain available through a labelled control; responsive CSS
  must not make required work unreachable.
- Candidate and media containers may scroll internally. They must not create root
  horizontal overflow.

Breakpoints should reuse the established layout system unless a measured task failure
justifies another semantic breakpoint.

## 7. Visual system

- Reuse existing colour, spacing, radius, typography, shadow, and motion tokens.
- Introduce semantic layout variables only when an existing token cannot express a
  reusable workspace dimension.
- Do not use emoji, ASCII, text glyphs, CSS drawings, or handcrafted inline SVGs as
  production icons. Use existing assets or an explicitly authorised icon library.
- Media uses a real source asset with accurate alternative text and provenance.
- Decoration must not compete with the active task, validation, or primary action.

## 8. Accessibility acceptance

Automated checks:

- run `axe-core` on the main states of Character Studio, Story World, and Script
  Studio when the dependency is introduced under an authorised test-only scope;
- allow no `critical` or `serious` violations;
- allow no known, undocumented WCAG 2.2 Level A/AA violation;
- use Lighthouse Accessibility >= 95 as a supporting signal, not a replacement for
  manual verification.

Manual keyboard checks:

- every primary task is completable without a pointer;
- tab order follows the visible workflow;
- every interactive control has a visible focus indicator;
- no keyboard trap exists;
- Escape closes drawers, popovers, and dialogs;
- closing an overlay restores focus to its trigger;
- state, selection, warning, and error meaning is not colour-only.

Zoom and reflow checks:

- test a 1280px browser viewport at 200% and 400% zoom;
- also test 640px and 320px CSS viewports directly;
- require
  `document.documentElement.scrollWidth <= document.documentElement.clientWidth`;
- CandidateStrip may scroll horizontally only inside its labelled container;
- a media viewer may scroll in two dimensions only in an explicit zoom/pan mode.

## 9. Functional acceptance by page

### Character Studio

- active task and current character are always identifiable;
- candidate controls appear only in a matching candidate task;
- candidate adoption marks dependent consistency output stale;
- state interval conflicts remain visible and actionable;
- local versus authoritative refs remain explicit.

### Story World

- real accepted catalogues remain reachable;
- selecting timeline/location/faction state has non-colour feedback;
- premise validation and progression conditions remain intact;
- missing authoritative refs are explicit;
- no candidate strip is mounted in the default world-building task.

### Script Studio

- scene navigation, editing, compare, recovery, and unsaved guard remain intact;
- candidate/history/finding content opens only when requested or required by the
  active task;
- editing remains available when the candidate region is closed;
- existing responsive navigator and inspector drawers remain accessible.

## 10. Engineering acceptance

- reuse `WorkspaceLayout` and `EditorLayout` rather than duplicating their grids;
- no new hex colours in page CSS;
- no `fetch` or `axios` in `src/`;
- existing tests pass without reducing coverage;
- add focused tests for candidate unmounting, task scoping, and page archetypes;
- `npm run typecheck`, `npm test`, `npm run build`, and `npm run lint` pass;
- if repository CI is configured, it also passes; no CI result may be fabricated.

Raw test count is not an acceptance criterion. Behavioural coverage and regression
protection are.

## 11. Verification matrix

Verify at minimum:

- widths 2560, 1440, 1280, 1024, 640, 390, and 320 CSS pixels;
- light and dark themes;
- long project/object labels and null refs;
- normal, empty, unavailable, dirty, loading, stale, conflict, error, and confirmed
  states that the page actually supports;
- keyboard-only operation and focus restoration;
- 200% and 400% zoom without root horizontal scrolling.

## 12. Implementation sequence

1. Extend the accepted shared layouts without replacing them.
2. Apply the controlled candidate contract to Character Studio and Script Studio.
3. Add task navigation and validation context to Story World without fabricating
   unsupported collections.
4. Run automated checks after each bounded code change.
5. Perform one consolidated visual, responsive, and keyboard audit before FE-G5.

Intermediate manual approval is not required while implementation remains inside this
contract. Any route, data authority, business-state, or dependency expansion stops
fail-closed and is reported separately.
