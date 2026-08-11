# Character Studio — Responsive Specification

Version: `V4.1`

## Breakpoints

Desktop:
`>= 1440px`

Tablet:
`1024px–1439px`

Tablet Small:
`768px–1023px`

Mobile:
`< 768px`

Ranges are continuous.

## Desktop

Order:

```text
Context
Intro
Overview
Identity 46% | Appearance 54%
Personality 46% | Character State 54%
Relationship
Visual Consistency
AI Suggestions
CTA
```

Grid gap:
ACS 24px-equivalent spacing.

Character Overview media:
- stable 16:9;
- rendered height minimum 460px.

Appearance main media:
- stable 16:9;
- rendered height minimum 400px.

Asset thumbnails:
- 4 columns minimum 120px each.

Relationship:
- visual graph plus accessible list;
- full width.

CTA:
- centered;
- intrinsic width;
- not sticky.

## Tablet — 1024px–1439px

Order remains:
Overview → Identity/Appearance → Personality/State → Relationship → Consistency → AI → CTA.

Layout:
- Identity/Appearance: 50/50 only if each cell stays >= 420px;
- otherwise CSS grid must collapse to one column without a hidden intermediate breakpoint;
- Personality/State: 50/50 under same minimum-width rule;
- asset thumbnails: 3 columns;
- major media minimum height 360px.

CTA:
full width below AI suggestions.

## Tablet Small — 768px–1023px

Single-column mandatory:

```text
Context
Intro
Overview
Identity
Appearance
Personality
Character State
Relationship
Visual Consistency
AI Suggestions
CTA
```

Asset thumbnails:
2 columns.

Media:
- overview minimum 340px;
- appearance/consistency minimum 300px.

Relationship:
- graph may remain;
- accessible relation list mandatory;
- detail uses ACSDrawer if viewport height/width requires it.

CTA:
full width;
normal flow;
not sticky.

## Mobile — <768px

Single-column:

```text
Header
Context
Intro
Overview Visual
Overview Text
Identity
Appearance
Personality
Character State
Relationship List
Relationship Visual
Visual Consistency
AI Suggestions
CTA
```

Asset thumbnails:
1 or 2 columns depending on minimum 140px width.

CharacterAssetViewer:
uses ACSDrawer/full-screen approved mobile overlay behavior.

Media:
- stable aspect ratio;
- minimum rendered height 240px;
- exact mobile crop rules from ASSET_SPEC.

CTA:
full width;
not sticky.

## Accessibility / Overflow

All:
- touch target >= 44×44px;
- visible focus;
- no vertical Chinese-character wrapping;
- horizontal overflow = 0;
- no fixed panel hides CTA;
- no overflow-x hidden used to mask defects.

## Required Browser Validation — Exactly 10

1. `1920×1080 Light`
2. `1920×1080 Dark`
3. `1600×900 Light`
4. `1366×768 Light`
5. `1280×800 Light`
6. `1024×768 Light`
7. `800×800 Light`
8. `768×1024 Light`
9. `390×844 Light`
10. `390×844 Dark`

Required:
- console errors = 0;
- page errors = 0;
- horizontal overflow = 0.
