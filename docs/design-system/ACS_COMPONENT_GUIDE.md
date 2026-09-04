# ACS Component Guide

**Status:** Official

**Version:** V2.3

**Public entry point:** `src/components/index.ts`

## 1. Component principles

ACS components are presentation primitives. They may display supplied content and status, but they do not fetch data, own navigation, call backend services, or create authoritative production facts.

Consumers should import from the public barrel:

```tsx
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSModal,
  ACSDrawer,
} from "@/components";
```

Use component props and slots before adding local wrappers. Existing component APIs are stable and should only change for accessibility, correctness, or an approved design-system capability.

## 2. ACSButton

Purpose: standard button interaction.

| Prop | Type | Default |
| --- | --- | --- |
| `variant` | `primary \| secondary \| ghost \| danger` | `primary` |
| `size` | `small \| medium \| large` | `medium` |
| `loading` | `boolean` | `false` |
| `leadingIcon` | `ReactNode` | none |
| `trailingIcon` | `ReactNode` | none |
| `fullWidth` | `boolean` | `false` |

All native button attributes are supported. The default native `type` is `button`. Loading sets `aria-busy` and disables interaction.

Use `primary` once per immediate action context, `secondary` for ordinary actions, `ghost` for low-emphasis utilities, and `danger` only for destructive intent.

## 3. ACSCard

Purpose: bounded content grouping with predictable hierarchy.

| Prop | Type | Default |
| --- | --- | --- |
| `title` | `ReactNode` | none |
| `description` | `ReactNode` | none |
| `headerAction` | `ReactNode` | none |
| `footer` | `ReactNode` | none |
| `tone` | `default \| raised \| selected \| ai` | `default` |
| `padding` | `compact \| default \| spacious` | `default` |
| `interactive` | `boolean` | `false` |

The root element is an `article`. `interactive` changes hover presentation only; it does not make the card a button or add keyboard behavior. Consumers that require an action must place a real control inside the card or supply valid interaction semantics themselves.

## 4. ACSBadge

Purpose: compact semantic status or classification.

| Prop | Type | Default |
| --- | --- | --- |
| `tone` | `neutral \| primary \| ai \| success \| warning \| danger \| info` | `neutral` |
| `dot` | `boolean` | `false` |

All native span attributes are supported. Badge color never replaces visible status text.

## 5. ACSModal

Purpose: blocking decision or focused task overlay.

| Prop | Type | Default |
| --- | --- | --- |
| `open` | `boolean` | required |
| `onClose` | `() => void` | required |
| `title` | `ReactNode` | required |
| `description` | `ReactNode` | none |
| `children` | `ReactNode` | required |
| `footer` | `ReactNode` | none |
| `size` | `small \| medium \| large` | `medium` |
| `closeLabel` | `string` | Chinese close label |
| `dismissOnBackdrop` | `boolean` | `true` |
| `className` | `string` | none |

The modal portals to `document.body`, exposes `role="dialog"` and `aria-modal="true"`, locks body scrolling, moves focus inside, traps Tab, closes on Escape, and restores prior focus.

Use a modal for interruption that requires a decision. Use a drawer for extended context or inspection.

## 6. ACSDrawer

Purpose: contextual overlay from a screen edge.

| Prop | Type | Default |
| --- | --- | --- |
| `open`, `onClose`, `title`, `children` | overlay contract | required |
| `description`, `footer` | `ReactNode` | none |
| `side` | `left \| right \| bottom` | `right` |
| `size` | `narrow \| medium \| wide` | `medium` |
| `closeLabel` | `string` | Chinese close label |
| `dismissOnBackdrop` | `boolean` | `true` |

Narrow side drawers use the canonical inspector width. Bottom drawers use a bounded viewport height. Drawer accessibility behavior matches `ACSModal`.

## 7. AIAssistantPanel

Purpose: visually identifies AI assistance without implying that AI output is authoritative.

| Prop | Contract |
| --- | --- |
| `title` | Optional title; defaults to `AI 助手` |
| `description` | Supporting explanation |
| `status` | Status content rendered as an AI badge |
| `actions` | Header action slot |
| `footer` | Footer action or context slot |
| `children` | Assistant content |

The panel is an `aside`. Purple AI styling communicates provenance, not approval.

## 8. AIThinkingState

Purpose: polite, nonblocking indication of active AI reasoning.

| Prop | Contract |
| --- | --- |
| `label` | Defaults to `AI 正在思考` |
| `detail` | Optional supporting detail |
| `compact` | Reduces padding |

It exposes `role="status"` with `aria-live="polite"`. The animated dots are hidden from assistive technology and honor reduced-motion settings.

## 9. AICandidateCard

Purpose: displays AI-originated candidate content before confirmation.

| Prop | Contract |
| --- | --- |
| `title` | Required candidate title |
| `description` | Optional summary |
| `selected` | Visual selected state; defaults to `false` |
| `label` | Defaults to `AI 候选` |
| `metadata` | Candidate metadata slot |
| `actions` | Footer actions |
| `children` | Candidate content |

`selected` is a presentational state exposed with `data-selected`. The component does not define a listbox, radio group, confirmation action, or authoritative domain transition.

## 10. VersionTimeline

Purpose: ordered presentation of versions.

Each item contains `id`, `label`, optional `description`, optional `meta`, and optional state:

- `pending`
- `current`
- `complete`

`emptyLabel` defaults to `暂无版本`. Items are view data, not domain models; authoritative version lineage remains outside the component.

## 11. WorkflowMap

Purpose: ordered visualization of workflow stages.

Each stage contains `id`, `label`, optional `description`, and optional state:

- `idle`
- `active`
- `complete`
- `blocked`

`orientation` is `horizontal` by default and may be `vertical`. `ariaLabel` defaults to `工作流`. The component does not navigate or mutate workflow state.

## 12. InspectorDrawer

Purpose: canonical inspector specialization of `ACSDrawer`.

It fixes the drawer to the right side, narrow size, and canonical inspector width. It accepts `open`, `onClose`, `title`, `description`, `children`, `footer`, and `closeLabel`. The default title is `检查器`.

## 13. Composition rules

- Prefer slots for actions and content; do not encode feature-specific copy in shared components.
- Do not pass raw backend exceptions or provider payloads into ordinary UI.
- Do not treat `selected`, `complete`, or a success tone as human confirmation.
- Do not nest modal overlays.
- Do not make an entire card clickable when a named button or link is clearer.
- Preserve native HTML attributes and accessible labels when wrapping components.

## 14. Frontend V3 Wave 1A production presentation

Wave 1A adds eight presentation components under `src/components/production/`:

- `GlobalRail`
- `ProjectContextBar`
- `ProjectNavigatorV3`
- `CapabilityBlocker`
- `AuthorityStatus`
- `EvidenceDisclosure`
- `EmptyProductState`
- `JobShelf`

Together with `WorkbenchShell` from the V3 layout barrel, these are the nine
implemented objects from the accepted 21-object V3 contract. They are
presentation-only: callers supply all destinations, view data, state, labels,
callbacks, and content. The objects do not fetch, call a router, own domain
authority, poll jobs, persist evidence, or create production facts. Unknown external
states fail closed, blocked reasons remain textual, and redacted evidence never
renders a hidden value.

GenerationPromptBar, AssetPicker, GenerationHistory, JobQueue, ShotNavigator,
MediaCompare, Waveform, TimelineTrack, TimelineClip, EffectInspector,
AudioInspector, and RenderCandidateCard remain unimplemented.

The Wave 1A evidence fixture is a non-canonical, environment-gated CI route. It is not
a reusable production component or a product screen. None of the sixteen canonical
V3 screens is implemented or cut over by this component release.
