# Workspace Home — Visual Asset Specification

Version: `V1.0`

---

## 1. Required Assets

Canonical local paths:

```text
public/assets/acs/brand/
└── jinggou-mark.webp                 # existing official mark

public/assets/workspace-home/
├── hero/
│  ├── workspace-hero-light.webp
│  └── workspace-hero-dark.webp
├── projects/
│  ├── future-city.webp
│  ├── silent-snow.webp
│  ├── light-chaser.webp
│  └── stellar-echo.webp
├── assistant/
│  └── jinggou-assistant.svg
├── icons/
│  ├── action-new-project.svg
│  ├── action-ai-director.svg
│  ├── action-upload-script.svg
│  ├── action-import-assets.svg
│  ├── action-storyboard.svg
│  ├── action-template.svg
│  ├── tool-virtual-production.svg
│  ├── tool-smart-edit.svg
│  ├── tool-sound-design.svg
│  ├── tool-insights.svg
│  ├── utility-search.svg
│  ├── utility-theme-light.svg
│  ├── utility-theme-dark.svg
│  ├── utility-notification.svg
│  ├── utility-help.svg
│  └── utility-menu.svg
└── avatars/
   ├── user-director.webp
   ├── member-01.webp
   ├── member-02.webp
   └── member-03.webp
```

---

## 2. Hero Asset

### Light

Visual:

- mountains / cinematic landscape；
- professional cinema camera silhouette；
- pale blue atmospheric perspective；
- premium enterprise visual；
- enough empty space for text。

### Dark

Visual:

- same or related composition；
- low-light production environment；
- clear subject；
- restrained teal/blue highlights；
- no pure black empty region。

Ratio:

- wide landscape；
- recommended 2.4:1 crop-safe source；
- minimum 2400px width。

---

## 3. Logo

Use official 镜构智能 logo source.

Verified repository source:

`public/assets/acs/brand/jinggou-mark.webp`

Header requires:

- the verified mark asset；
- Chinese wordmark `镜构智能` rendered beside the mark until a separately approved
  wordmark asset is supplied；
- optional small product label。

Do not replace the verified logo mark with a generic `ACS` box or text-only brand.
Do not invent another logo or image wordmark.

---

## 4. AI Assistant Visual

Assistant visual should be:

- small；
- friendly but professional；
- consistent with enterprise AI；
- not childish；
- no large mascot dominating the workspace。

An abstract orb or restrained robot icon is acceptable.

---

## 5. Icons

Use one icon family only.

The current ACS Foundation has no public icon component or icon dependency. This
page must not invent one or modify the Foundation. Use a single approved local SVG
set through page-local presentational wrappers, with accessible labels inherited
from the visible action text.

Rules:

- utility icons: `--acs-space-5` (`20px`)；
- primary action icons: `--acs-space-6` (`24px`)；
- no emoji as production icons；
- semantic labels remain visible。
- no remote icon package or external asset URL is required。

---

## 6. Avatars

- circular；
- consistent crop；
- `--acs-space-6` to `--acs-space-8` (`24–32px`) in project cards；
- avoid stock-photo inconsistency；
- use approved local demo avatars。

---

## 7. Charts

Production overview chart is a UI visualization, not an image asset.

The current Foundation has no dedicated chart token family. Use only existing
semantic tokens: `--acs-primary` and `--acs-info` for series,
`--acs-border` for guides, `--acs-text-muted` for optional labels, and ACS surface
tokens for the chart region. Do not add page-specific global chart tokens.

No gradients that reduce readability.

No 3D charts.

---

## 8. Asset Loading

Use Next.js image optimization where appropriate.

Preserve stable card dimensions during loading.

Do not load random external images.

---

## 9. Dark/Light Compatibility

Project covers may remain the same across themes.

Hero may use theme-specific assets.

Any overlay must derive from ACS tokens and maintain contrast.

---

## 10. Missing Asset Policy

- Official brand mark: required；do not substitute or regenerate。
- Hero: use the theme-specific canonical file；during implementation review only,
  an ACS-token cinematic gradient may preserve layout but cannot be accepted as the
  final frozen visual。
- Project covers: follow `PROJECT_COVER_SPEC.md` exactly。
- Assistant: a restrained token-based abstract orb may be used until the approved
  local SVG is available。
- Avatars: use token-based initials with accessible names until approved local demo
  avatars are available。
- Icons: use only the canonical local SVG family above；a missing icon must not cause
  a broken image or remote fetch。
- No required asset may be downloaded from a random external URL at runtime。
