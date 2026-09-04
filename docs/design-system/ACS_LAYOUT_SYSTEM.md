# ACS Layout System

**Status:** Official

**Version:** V2.3

**Public entry point:** `src/layouts/index.ts`

## 1. Layout hierarchy

ACS provides three composable presentation shells:

```text
CustomerLayout
└── customer-facing content surface

WorkspaceLayout
├── global sidebar
├── top bar
├── optional project navigator
├── main workspace content
├── optional inspector
└── optional bottom drawer

EditorLayout
├── toolbar
├── optional object navigator
├── editor canvas
├── optional inspector
├── optional bottom drawer
└── workflow action bar
```

The shells manage geometry only. They do not own routes, navigation state, project state, data fetching, or business actions.

## 2. Canonical dimensions

| Region | Token | Value |
| --- | --- | --- |
| Global sidebar | `--acs-sidebar-width` | `240px` |
| Collapsed sidebar | `--acs-sidebar-collapsed-width` | `72px` |
| Header / top bar | `--acs-header-height` | `72px` |
| Project navigator | `--acs-project-nav-width` | `220px` |
| Object navigator | `--acs-object-nav-width` | `15rem` |
| Inspector | `--acs-inspector-width` | `22.5rem` |
| Workspace/editor top bar minimum | `--acs-topbar-min-height` | `3.5rem` |
| Candidate results minimum | `--acs-candidate-strip-results-min-height` | `7.5rem` |
| Bottom drawer maximum | `--acs-bottom-drawer-height` | `280px` |
| Application content maximum | `--acs-content-max-width` | `100%` |

Feature code must not copy these values. Use the layout shell or the token.

## 3. CustomerLayout

Purpose: simple customer-facing shell without product navigation behavior.

| Prop | Contract |
| --- | --- |
| `children` | Main content |
| `header` | Optional header slot |
| `footer` | Optional footer slot |
| `announcement` | Optional full-width announcement |
| `contained` | Constrains content to the ACS maximum width; defaults to `true` |

The main region grows to fill the viewport. The `100%` application content token is
intentional: 2K/4K displays and browser zoom must keep a fluid production canvas.
Readable prose sets its own local measure. Announcement, header, and footer are
presentational slots supplied by the consumer.

## 4. WorkspaceLayout

Purpose: primary application workbench shell.

| Prop | Contract |
| --- | --- |
| `children` | Main workspace region |
| `sidebar` | Optional global sidebar |
| `projectNavigator` | Optional project-scoped navigator |
| `topbar` | Optional top bar |
| `inspector` | Optional inspector content |
| `bottomDrawer` | Optional bottom drawer content |
| `sidebarCollapsed` | Selects 72px sidebar geometry |
| `inspectorOpen` | Shows supplied inspector; defaults to `true` |
| `bottomDrawerOpen` | Shows supplied drawer; defaults to `false` |
| `contentLabel` | Accessible main-region label; defaults to `工作区内容` |

The consumer owns open and collapsed state. The layout does not add toggle buttons or
navigation logic. Supplied top bars use a minimum height and may grow when explanatory
or validation content wraps; they are not clipped to a fixed row.

## 5. EditorLayout

Purpose: dense professional editing framework inside a workspace.

| Prop | Contract |
| --- | --- |
| `children` | Editor canvas content |
| `navigator` | Optional object navigator |
| `toolbar` | Optional editor toolbar |
| `inspector` | Optional inspector content |
| `actionBar` | Optional workflow action bar |
| `bottomDrawer` | Optional version, job, or activity drawer |
| `navigatorOpen` | Shows supplied navigator; defaults to `true` |
| `inspectorOpen` | Shows supplied inspector; defaults to `true` |
| `bottomDrawerOpen` | Shows supplied drawer; defaults to `false` |
| `canvasLabel` | Accessible main-region label; defaults to `编辑器画布` |

The editor canvas uses the media-stage token. Navigation and inspector regions use
deep surfaces. Toolbars and action bars use standard surfaces. Candidate result areas
use a minimum height rather than a fixed height so comparison content can grow.

## 6. Responsive behavior

### Above 72rem

- All supplied regions may be visible.
- Workspace may show project navigator, content, and inspector together.
- Editor may show object navigator, canvas, and inspector together.

### At or below 72rem

- Global sidebar uses collapsed geometry.
- Workspace and editor inspectors are hidden from the fixed grid.
- Project and object navigators remain available while width permits.
- Consumers may present hidden inspector content through `InspectorDrawer`.

### At or below 48rem

- Global sidebar, project navigator, object navigator, and fixed inspector are removed from the grid.
- Main content becomes single-column.
- Consumers remain responsible for accessible controls that expose navigation or inspector content as overlays.

Responsive CSS changes presentation only. It does not change application state or imply that a region's data is unavailable.
Regions hidden at a breakpoint must be unmounted from the fixed grid or exposed through
an accessible overlay; invisible fixed-width tracks must not reserve empty space.

## 7. Composition patterns

Workspace with editor:

```tsx
<WorkspaceLayout
  sidebar={globalSidebar}
  topbar={topbar}
  projectNavigator={projectNavigator}
  inspector={workspaceInspector}
>
  <EditorLayout
    navigator={objectNavigator}
    toolbar={toolbar}
    inspector={editorInspector}
    actionBar={workflowActions}
  >
    {editorCanvas}
  </EditorLayout>
</WorkspaceLayout>
```

Only include one fixed inspector at a time. When `EditorLayout` owns the active-object inspector, omit the workspace inspector.

## 8. Layout prohibitions

- Do not add product navigation items inside layout components.
- Do not create route-aware behavior inside layout components.
- Do not place API calls, persistence, or domain stores in layouts.
- Do not invent project, episode, version, or asset facts to fill empty slots.
- Do not override canonical widths in feature CSS.
- Do not create a parallel global shell for a single feature.

## 9. WorkbenchShell V3 Wave 1A boundary

`WorkbenchShell`, exported from `src/layouts/v3/`, is the implemented V3 production
shell primitive. At desktop width it composes the caller-supplied GlobalRail,
ProjectContextBar, ProjectNavigatorV3, primary canvas, inspector, evidence, and
JobShelf regions with canonical token geometry. At smaller breakpoints, fixed regions
leave the grid and callers may expose exactly one of the supplied global navigation,
project navigation, inspector, evidence, or job-shelf drawers.

The shell owns only layout and accessible overlay mechanics. It does not define or
resolve routes, fetch projects, select a domain object, infer capabilities, persist
drawer state, or authorize an action. Escape closes the active overlay and restores
focus to its supplied trigger. Hidden fixed tracks do not reserve width, and reduced
motion preferences disable nonessential transition movement.

This implementation does not replace `WorkspaceLayout` or `EditorLayout`, change any
legacy product page, or cut over a canonical route. The environment-gated Wave 1A
evidence fixture is test-only; all sixteen canonical V3 pages remain unimplemented.
