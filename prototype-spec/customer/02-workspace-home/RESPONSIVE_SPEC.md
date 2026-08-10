# Workspace Home — Responsive Specification

Version: `V1.0`

---

## 0. Breakpoint Authority

The viewport sizes below are acceptance targets, not competing breakpoint systems.
Page-local layout may transition when the stated minimum column widths stop fitting.
Foundation shell behavior remains authoritative at `72rem` and `48rem`, and the page
must not override `CustomerLayout` geometry.

---

## 1. 1920 × 1080 and Wider

- max content width uses `--acs-content-max-width` (`1440px`)；
- top experience grid uses 3 columns；
- recent projects show 4 project cards plus create card；
- side rail remains visible；
- insight grid uses 2 columns；
- full navigation visible。

No content should stretch excessively beyond the max width.

---

## 2. 1600 × 900

- top grid remains 3 columns when minimum widths are satisfied；
- recent project area may show 4 cards or 3 + partial scroll；
- side rail remains visible；
- Hero title and metrics must not wrap awkwardly。

---

## 3. 1366 × 768

Top layout becomes:

```text
Welcome Hero spans two columns
↓
Quick Start | AI Assistant
```

Production layout:

```text
Recent Projects
↓
Workspace Side Rail as horizontal/2-column supporting panels
```

Rules:

- do not squeeze AI Assistant below 300px；
- no horizontal overflow；
- project cards minimum useful width 250px；
- Header may hide the optional product line and low-priority utilities；navigation
  collapses only at the 1024 target defined below。

---

## 4. 1280 × 800

- Hero full width；
- Quick Start and AI Assistant use two columns；
- Recent Projects use 2–3 columns；
- Workspace side rail moves below projects；
- insight grid remains two columns if each column >= 480px, otherwise one column。

---

## 5. Above 48rem Through 1024px

Acceptance target: `1024 × 768`

- Header navigation collapses to menu；
- search becomes icon/drawer；
- page is one-column flow；
- Quick Start uses 2 columns；
- Project cards use 2 columns；
- AI Assistant becomes full-width panel or drawer；
- charts simplify labels；
- no text clipping。

---

## 6. At or Below 48rem

Acceptance target width: `390–430px`

Order:

```text
Header
↓
Welcome Hero (including Primary CTA)
↓
Quick Start
↓
Recent Projects
↓
AI Assistant
↓
Workspace Status
↓
Production Overview
↓
Creative Inspiration
↓
Project Activity
↓
More Tools
```

Rules:

- all sections one column；
- project cards may use horizontal snap carousel；
- minimum touch target 44px；
- title must not exceed 3 lines；
- hero background should remain legible；
- contextual hero metrics become 2×2；
- no persistent right rail；
- no hover-only controls；
- theme toggle remains reachable。
- required content remains in the document flow；width alone must not remove a
  required section。

---

## 7. Overflow and Scroll

Must pass:

- `overflow-x: hidden` must not conceal layout defects；
- no component wider than viewport；
- no fixed panel over content；
- horizontal carousel only where explicitly designed；
- body horizontal scroll = 0。

---

## 8. Responsive Evidence

Required screenshots:

- 1920×1080 Light
- 1920×1080 Dark
- 1366×768 Light
- 1024×768 Light
- 390×844 Light
- 390×844 Dark
