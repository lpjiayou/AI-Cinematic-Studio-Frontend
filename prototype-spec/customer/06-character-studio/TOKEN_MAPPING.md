# Character Studio — ACS Token Mapping

Version: `V4.1`

## Ownership

ACS owns colors, typography, spacing, radius, motion, focus, media stage, overlay and status semantics.

Character Studio references only existing ACS roles.

## Component-to-Token Mapping

| Visual Role | Token |
|---|---|
| Page background | `--acs-bg` |
| Overview / identity / personality / relation card | `--acs-surface` |
| Character Overview media | `--acs-media-stage` |
| Appearance media | `--acs-media-stage` |
| Consistency media | `--acs-media-stage` |
| Asset Viewer | `--acs-media-stage` |
| Normal border | `--acs-border` |
| AI activity/origin | `--acs-ai-accent` |
| Image/modal overlay | `--acs-overlay` |
| Primary CTA | `--acs-primary` |
| Selected asset/node | `--acs-surface-selected` |
| Primary text | `--acs-text-primary` |
| Secondary text | `--acs-text-secondary` |
| Muted metadata | `--acs-text-muted` |

## Rules

- Media stage must not be mapped to `--acs-surface-deep`.
- AI origin must not be expressed only through `--acs-primary`.
- Use current ACS focus-ring implementation.
- Use existing typography/spacing/radius/motion token families.
- No raw color.
- No `--character-*` custom design tokens.

Missing token → STOP and report.
