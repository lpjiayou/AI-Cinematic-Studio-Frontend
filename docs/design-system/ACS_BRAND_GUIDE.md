# ACS Brand Guide

**Status:** Official

**Version:** V2.3

**Scope:** AI Cinematic Studio Experience Layer

This document defines the visual and verbal foundation for ACS frontend surfaces. It governs presentation only. It does not define navigation, product behavior, domain models, production facts, or backend contracts.

## 1. Brand position

AI Cinematic Studio is a professional AI film-production environment. The experience should feel:

- cinematic, precise, and production-oriented;
- enterprise-grade rather than experimental;
- calm and low-noise rather than decorative;
- traceable, version-aware, and state-aware;
- Chinese-first in product UI, with established names such as AI Cinematic Studio and ACS retained in English.

The visual balance is approximately 90% neutral surfaces, 8% teal interaction emphasis, and 2% amber or purple atmosphere.

## 2. Source-of-truth contract

The official design-system contract is synchronized across:

1. the five guides in `docs/design-system/`;
2. the executable tokens in `src/styles/tokens.css`;
3. the components exported from `src/components/`;
4. the layouts exported from `src/layouts/`;
5. the theme runtime in `src/theme/`.

A reviewed change to one layer must update every affected layer and its tests in the same change. Business pages must consume this system; they must not redefine it.

## 3. Brand palette

Dark cinematic mode is the default ACS baseline.

| Role | Token | Dark value | Intended use |
| --- | --- | --- | --- |
| Application background | `--acs-bg` | `#0F1318` | Global page and workspace background |
| Global sidebar | `--acs-sidebar` | `#161C23` | Persistent global shell |
| Surface | `--acs-surface` | `#1E252D` | Cards, toolbars, panels |
| Deep surface | `--acs-surface-deep` | `#11171D` | Recessed panels and navigators |
| Hover surface | `--acs-surface-hover` | `#252E37` | Hover and elevated interaction feedback |
| Selected surface | `--acs-surface-selected` | `#193B39` | Selected controls and cards |
| Standard border | `--acs-border` | `#2C353F` | Ordinary separation |
| Strong border | `--acs-border-strong` | `#3A4652` | Focused or elevated separation |
| Primary | `--acs-primary` | `#22D1B6` | Primary actions and active state |
| Primary hover | `--acs-primary-hover` | `#4EE2CB` | Hover for primary actions |
| Amber accent | `--acs-accent` | `#E8A868` | Warnings and limited cinematic emphasis |
| AI accent | `--acs-ai-accent` | `#8F79DF` | AI candidates and AI activity |
| Media stage | `--acs-media-stage` | `#090C0F` | Editor and preview canvases |
| Primary text | `--acs-text-primary` | `#F4F7FA` | Headings and primary content |
| Secondary text | `--acs-text-secondary` | `#CBD5E1` | Supporting content |
| Muted text | `--acs-text-muted` | `#8894A3` | Metadata and quiet labels |
| Danger | `--acs-danger` | `#E55959` | Destructive or blocked state |
| Success | `--acs-success` | `#36D399` | Completed or successful state |
| Information | `--acs-info` | `#5DADE2` | Informational state |

Soft color tokens are the only approved tinted backgrounds for primary, amber, AI, danger, success, and information states. Do not create ad hoc alpha values in feature code.

## 4. Typography

ACS uses a system-first multilingual stack:

```css
Inter, "Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif
```

| Style | Size / line height | Typical use |
| --- | --- | --- |
| Display | `26px / 1.2` | High-level product context only |
| Title | `20px / 1.3` | Page, modal, and drawer titles |
| Section | `16px / 1.4` | Panel and card headings |
| Body | `14px / 1.5` | Standard product content |
| Caption | `12px / 1.4` | Metadata, badges, timestamps |

Weights are limited to regular `400`, medium `500`, semibold `600`, and bold `700`. Long-form body copy should remain regular. Control labels should normally use medium or semibold.

## 5. Surface and emphasis rules

- Ordinary cards use surface plus border, not heavy shadow.
- Deep surfaces indicate recessed navigation or inspector regions.
- Strong shadows are reserved for modal and drawer overlays.
- Gradients and glow are limited to AI candidates, focus, active generation, timeline playheads, and rare critical calls to action.
- Teal communicates interaction and active selection. Purple communicates AI provenance. Amber communicates warning or constrained attention.
- Media and editor canvases use `--acs-media-stage`; they must not reuse ordinary card backgrounds.
- Empty space is structural. Do not fill every region with cards or dividers.

## 6. Shape and motion

| Category | Approved values |
| --- | --- |
| Control radius | `6px` |
| Card radius | `8px` |
| Panel radius | `10px` |
| Fast motion | `120ms` |
| Base motion | `180ms` |
| Slow motion | `240ms` |

Motion communicates continuity or state change. It must never delay work, loop decoratively, or obscure status. Reduced-motion preferences are honored globally.

## 7. Naming and language

- Product UI is Chinese-first.
- ACS, AI, QC, BGM, SFX, API, and established technical abbreviations may remain in English.
- Do not expose repository names, providers, workers, queues, stack traces, or raw internal references in ordinary UI.
- Prefer production language such as version, candidate, source, status, and impact.
- Never use visual success styling to imply creative approval, rights approval, or publication eligibility.

## 8. Brand assets

This foundation does not include an approved logo, wordmark asset, illustration system, or marketing imagery. Do not invent one. Until an approved asset is supplied, use the product name typographically.

## 9. Accessibility baseline

- Preserve visible focus with `--acs-primary` and `--acs-focus-ring`.
- Never rely on color alone; pair status color with text and, when helpful, a dot or icon.
- Muted text is for secondary information, not essential instructions.
- Maintain keyboard access for all interactive elements.
- Modal and drawer surfaces must preserve focus, support Escape, and expose accessible labels.

## 10. Prohibited changes

- Do not add feature-specific colors to the global palette.
- Do not introduce a second visual language for light mode.
- Do not use AI purple as the primary action color.
- Do not turn presentation states into authoritative domain states.
- Do not place backend, persistence, or provider semantics in this design system.
