# Workspace Home — Style Specification

Version: `V1.0 High Fidelity`

---

## 1. Design System

MUST use:

- ACS tokens；
- ACS typography；
- ACS spacing；
- ACS radius；
- ACS motion；
- ACS status colors。

No raw colors outside the canonical token source.

Forbidden:

```css
background: #xxxxxx;
color: #xxxxxx;
box-shadow: arbitrary;
```

---

## 2. Theme Strategy

Default theme: inherit the ACS root theme. Current first-use default is `Dark`.

不得在 Workspace Home 内覆盖 `ThemeProvider` 默认值，也不得创建嵌套主题
区域。Light 与 Dark 使用相同语义 token 和布局。

### Light Mode

Purpose:

- enterprise clarity；
- daily workspace；
- comfortable long-session use。

Visual character:

- warm-white / neutral canvas；
- pure or near-white cards；
- teal primary action；
- soft blue-gray dividers；
- cinematic imagery supplies visual depth。

### Dark Mode

Purpose:

- immersive creation；
- low-light editing environment。

Visual character:

- deep cinematic background；
- elevated dark panels；
- restrained teal glow；
- cover imagery remains visually dominant。

Theme switching must not replace content or change layout.

---

## 3. Typography

Font stack:

```text
Inter,
"Noto Sans SC",
"Microsoft YaHei",
"PingFang SC",
system-ui,
sans-serif
```

Use the frozen ACS type scale:

- Page greeting: `--acs-type-display-size` / `--acs-type-display-line-height`,
  weight `--acs-weight-bold`；
- Section title: `--acs-type-title-size` / `--acs-type-title-line-height`,
  weight `--acs-weight-semibold`；
- Card title: `--acs-type-section-size` / `--acs-type-section-line-height`,
  weight `--acs-weight-semibold`；
- Body: `--acs-type-body-size` / `--acs-type-body-line-height`,
  weight `--acs-weight-regular`；
- Supporting / metadata: `--acs-type-caption-size` /
  `--acs-type-caption-line-height`, muted token only for nonessential content；
- Numeric contextual highlight: title or display type token only；no raw intermediate
  size or unsupported weight。

---

## 4. Spacing

Use ACS spacing tokens.

Recommended composition:

- Page top: `--acs-space-6` (`24px`)；
- Main section gap: `--acs-space-6` (`24px`)；
- Card internal padding: `--acs-space-5` to `--acs-space-6`
  (`20–24px`)；
- Card content gap: `--acs-space-3` to `--acs-space-4`
  (`12–16px`)；
- Dense utility item gap: `--acs-space-2` (`8px`)。

Do not use oversized empty spaces that break work continuity.

---

## 5. Radius

- Controls and inputs: `--acs-radius-control` (`6px`)；
- Cards, including project and utility cards: `--acs-radius-card` (`8px`)；
- Welcome Hero and large panels: `--acs-radius-panel` (`10px`)；
- Avatars and circular icon containers: `--acs-radius-full`。

不得为页面角色引入超出 ACS radius scale 的 raw radius。

---

## 6. Border and Shadow

Normal cards:

- 1px token border；
- no thick shadow。

Floating layers:

- AI drawer；
- notification；
- menu；
- modal。

Welcome Hero may use `--acs-shadow-soft`. Floating overlays use
`--acs-shadow-overlay`. Ordinary cards remain border-only.

Project card hover:

- border emphasis；
- translateY up to 3px；
- subtle image scale up to 1.02。

---

## 7. Visual Hierarchy

Priority:

1. Welcome Hero
2. Recent Projects
3. Primary Create Action
4. AI Assistant
5. Workspace Status
6. Production Overview
7. Activity / supporting tools

The page must not feel like a metrics dashboard.

---

## 8. Primary Actions

One dominant CTA per visual region.

Canonical create-action label:

- `新建项目`；不得在同一页面混用 `创建新影片`、`创建新项目` 等同义主操作。

返回用户的 Hero 可将 `继续制作` 作为该区域主操作；创建入口不得在同一
视觉区域出现多个同权重按钮。

Secondary:

- 查看项目；
- 导入素材；
- 查看全部。

Danger actions are not present on Workspace Home.

---

## 9. Image Treatment

- real local cinematic cover assets；
- consistent 16:9 crop；
- no black/gray empty frames；
- no text baked into image；
- overlay badge must remain readable；
- gradient overlay may be used only to preserve text contrast。

---

## 10. Motion

Allowed:

- `--acs-motion-fast` (`120ms`) button feedback；
- `--acs-motion-base` (`180ms`) card feedback；
- `--acs-motion-slow` (`240ms`) drawer or deliberate state transition；
- gentle cover image scale；
- AI status soft pulse；
- skeleton shimmer；
- drawer transition。

Forbidden:

- particle overload；
- large looping animations；
- game-like neon effects；
- layout-shifting motion。

Respect `prefers-reduced-motion`.

---

## 11. Language

User-visible interface defaults to Chinese.

Allowed English:

- official product name；
- approved labels such as `AI`；
- file formats；
- brand marks。

Avoid customer-facing raw English module titles when a clear Chinese label exists.
