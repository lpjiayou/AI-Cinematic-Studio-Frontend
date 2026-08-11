# Character Studio — Interaction and Accessibility Specification

Version: `V4.1`

## 1. Semantic Identity Form

IdentityCanvas uses one semantic form region.

Every editable field:
- `<label htmlFor>`;
- textarea/input id;
- `aria-describedby` for helper/error;
- `aria-invalid` when error;
- no automatic submit;
- no Domain write.

## 2. Appearance Asset Selector

Group:

```html
<div role="group" aria-labelledby="appearance-assets-label">
```

Each asset:

```html
<button
  type="button"
  aria-pressed="true|false"
>
```

Roving focus:
- selected enabled asset: `tabIndex=0`;
- if none selected, first enabled asset: `tabIndex=0`;
- others: `tabIndex=-1`;
- disabled assets use `disabled` and are not focusable.

Keyboard:
- Left/Up previous enabled;
- Right/Down next enabled;
- wraps first ↔ last;
- Home first enabled;
- End last enabled;
- Enter/Space selects;
- visible ACS focus ring;
- minimum 44×44px.

Selection uses visible indicator/text, not color alone.

## 3. Relationship Graph Semantics

Visual lines are decorative:
`aria-hidden="true"`.

Every character node is a real button.

Graph container:
```html
<section aria-labelledby="character-relationships-title">
```

A parallel accessible relation list is mandatory:

```html
<ul aria-label="角色关系列表">
```

Each relation list item provides:
- source name;
- relation type;
- target name;
- concise description;
- open detail button.

Keyboard:
- Tab navigates node/detail buttons;
- Enter/Space opens detail;
- no spatial arrow-key contract is required for graph geometry;
- focus visible;
- touch target >=44px.

This avoids pretending the visual graph is an accessible graph-database widget.

## 4. Relationship Detail

Desktop:
ACSModal.

Mobile:
ACSDrawer allowed.

Required:
- focus trap;
- Escape close when safe;
- semantic title;
- close button;
- return focus to originating node/relation control.

## 5. Asset Viewer

Desktop:
ACSModal.

Mobile:
ACSDrawer/full-screen approved overlay.

Required controls:
- previous;
- next;
- close;
- asset label.

Keyboard:
- Left previous;
- Right next;
- Home first;
- End last;
- Escape close;
- focus trapped;
- return focus.

Viewer never edits Asset identity.

## 6. AI Character Suggestions

Local deterministic suggestions in Phase 1.

No:
- fake typing;
- fake countdown;
- Provider/model;
- quality score.

`AIThinkingState` only uses supported label/detail/compact Props.

## 7. Continue Script

On activation:
1. validate local page conditions;
2. set local confirmed-preview;
3. invoke onContinue;
4. navigate only to an approved route;
5. otherwise show guided next-route-unavailable state.

No Script Entity creation.

## 8. Theme

Uses global theme toggle.

No page-local theme state.
