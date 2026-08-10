# ACS Theme Guide

**Status:** Official

**Version:** V2.3

**Runtime:** `src/theme/theme-provider.tsx`

**Tokens:** `src/styles/tokens.css`

## 1. Theme model

ACS supports two explicit themes:

- `dark`: default Enterprise Cinematic Workstation baseline;
- `light`: an isolated presentation theme using the same semantic token names and component structure.

Light mode is not a separate product UI. Components, spacing, information hierarchy, status meaning, and layout remain identical across themes.

The active theme is written to `document.documentElement.dataset.theme` and the browser `color-scheme` property.

## 2. Token layers

### Theme-dependent semantic tokens

These tokens change value between dark and light mode:

| Token | Dark | Light |
| --- | --- | --- |
| `--acs-bg` | `#0F1318` | `#F3F1EC` |
| `--acs-sidebar` | `#161C23` | `#FFFDFA` |
| `--acs-surface` | `#1E252D` | `#FFFDFA` |
| `--acs-surface-deep` | `#11171D` | `#F5F3EE` |
| `--acs-surface-hover` | `#252E37` | `#F3F4F3` |
| `--acs-surface-selected` | `#193B39` | `#E8F3F1` |
| `--acs-border` | `#2C353F` | `#E3E2DC` |
| `--acs-border-strong` | `#3A4652` | `#C8CBC6` |
| `--acs-primary` | `#22D1B6` | `#176D70` |
| `--acs-primary-hover` | `#4EE2CB` | `#11595C` |
| `--acs-accent` | `#E8A868` | `#936423` |
| `--acs-ai-accent` | `#8F79DF` | `#596BA8` |
| `--acs-media-stage` | `#090C0F` | `#E9E7E1` |
| `--acs-on-primary` | `#071412` | `#F7FFFD` |
| `--acs-text-primary` | `#F4F7FA` | `#17201F` |
| `--acs-text-secondary` | `#CBD5E1` | `#53605E` |
| `--acs-text-muted` | `#8894A3` | `#7C8886` |
| `--acs-danger` | `#E55959` | `#C23B32` |
| `--acs-success` | `#36D399` | `#16845B` |
| `--acs-info` | `#5DADE2` | `#2F6F9F` |

Overlay, soft-background, focus-ring, and shadow tokens also have theme-specific values. Consumers must reference the token, never reproduce its raw value.

### Theme-independent foundation tokens

Typography, spacing, radius, motion, and layout dimensions remain stable between themes. They are defined in the final `:root` block of `tokens.css`.

## 3. Runtime API

Import from the official theme entry point:

```tsx
import { ThemeProvider, useACSTheme } from "@/theme";
```

`ThemeProvider` accepts:

| Prop | Type | Default | Contract |
| --- | --- | --- | --- |
| `children` | `ReactNode` | required | Application subtree |
| `defaultTheme` | `"light" \| "dark"` | `"dark"` | SSR and first-use fallback |
| `storageKey` | `string` | `"acs-theme"` | Local preference key |

`useACSTheme()` returns:

| Field | Contract |
| --- | --- |
| `theme` | Current explicit theme |
| `setTheme(theme)` | Select light or dark |
| `toggleTheme()` | Switch between light and dark |

The hook must be used inside `ThemeProvider`.

## 4. Startup and persistence

The root layout provides a small pre-hydration script that reads `acs-theme`, applies `data-theme`, and sets `color-scheme`. This prevents a dark-to-light flash for the default storage key.

After hydration, `ThemeProvider` is authoritative and persists every explicit selection to local storage. If a custom `storageKey` is used, the provider honors it after hydration; applications that require flash-free custom-key startup must supply a matching bootstrap strategy at their own root boundary.

ACS does not infer a theme from system preference. Product theme is explicit and persistent.

## 5. Tailwind bridge

Tailwind v4 mappings are declared inside `@theme inline` in `tokens.css`.

Examples:

```tsx
<section className="bg-acs-surface text-acs-text-primary" />
<p className="text-acs-body text-acs-text-secondary" />
<div className="p-acs-4 rounded-acs-card shadow-acs-soft" />
```

Available Tailwind namespaces include:

- `bg-acs-*`, `text-acs-*`, `border-acs-*` for semantic colors;
- `text-acs-display|title|section|body|caption` for type scale;
- `font-acs-regular|medium|semibold|bold` for weights;
- `p-acs-*`, `m-acs-*`, and `gap-acs-*` for ACS spacing;
- `rounded-acs-none|control|card|panel|full`;
- `shadow-acs-soft|overlay`;
- `ease-acs-standard|enter|exit`.

Component-specific details remain in CSS Modules. Global Tailwind and token imports stay in `src/app/globals.css`.

## 6. Theme usage rules

- Apply themes only at the document root.
- Do not add nested light or dark islands inside a screen.
- Never branch component markup based on theme when a semantic token can express the difference.
- Never use Tailwind's generic `dark:` variant for ACS colors; use ACS semantic tokens.
- Do not add a third theme without an approved system-level revision.
- Keep the Enterprise Dark Cinematic baseline as the default.

## 7. Focus, motion, and contrast

- Global `:focus-visible` uses `--acs-primary` plus `--acs-focus-ring`.
- Body background and text transition with the base motion token.
- Components use the approved fast, base, and slow durations.
- `prefers-reduced-motion: reduce` collapses animations and transitions globally.
- Essential text must use primary or secondary text tokens. Muted text is reserved for nonessential metadata.

## 8. Change procedure

A theme change is complete only when:

1. dark and light semantic values are updated together where applicable;
2. this guide and `tokens.css` agree exactly;
3. Tailwind mappings still expose the intended token families;
4. theme tests pass;
5. the production build passes;
6. no component contains a raw replacement for the changed semantic value.
