# Workspace Home — State Specification

Version: `V1.0`

---

## 1. First-Time User

When no project exists:

Hero copy:

`欢迎来到镜构智能创作云`

Supporting copy:

`从一个创意开始，创建你的第一部 AI 影片。`

Primary CTA:

`新建项目`

Recent Projects region becomes a single guided empty state.

Do not display zero-value KPI cards.

---

## 2. Normal Workspace

Display:

- active/ recent projects；
- AI suggestions；
- workspace status；
- production overview；
- project activity；
- supporting tools。

---

## 3. Projects Loading

Use:

- cover skeleton；
- text skeleton；
- stable card dimensions。

User-visible copy may be:

`正在准备你的创作空间…`

Forbidden:

- `Loading API`
- endpoint or HTTP wording。

---

## 4. Partial Failure

If project list fails but AI assistant works:

- retain remaining page；
- Recent Projects shows localized error card；
- provide `重新加载`；
- do not replace the whole page with an error screen。

Copy:

`项目暂时无法加载，请稍后重试。`

---

## 5. AI Assistant Unavailable

Keep project experience available.

AI panel copy:

`AI 助理暂时离线，不影响你继续制作项目。`

Action:

`稍后重试`

Do not expose Provider errors.

---

## 6. No Recent Activity

Copy:

`开始创作后，项目的重要进展会显示在这里。`

Action:

`新建项目`

---

## 7. Project Status Labels

Allowed customer-facing labels:

- 草稿
- 进行中
- 待确认
- 分镜中
- 生成中
- 后期制作
- 待交付
- 已交付
- 已归档
- 阻塞

Canonical `ACSBadge` tone mapping:

| Label | Tone |
|---|---|
| 草稿 | `neutral` |
| 进行中 | `primary` |
| 待确认 | `warning` |
| 分镜中 | `primary` |
| 生成中 | `info` |
| 后期制作 | `primary` |
| 待交付 | `warning` |
| 已交付 | `success` |
| 已归档 | `neutral` |
| 阻塞 | `danger` |

Tone 仅表达传入的 presentation state，不创建或确认 Domain 状态。

---

## 8. Theme State

- Light
- Dark

Persist as user preference.

First-use fallback follows the current ACS runtime default: `Dark`. Workspace Home
does not infer system preference and does not override the root provider.

Theme is not a Domain fact.

Hydration must be safe.

---

## 9. Offline State

Header shows restrained offline badge.

Copy:

`当前处于离线状态，部分内容可能不是最新版本。`

Do not allow silent destructive action.

---

## 10. Notification State

Notification count may show a small badge.

Do not turn Header into a notification dashboard.

---

## 11. Access Restricted

When a workspace or tool is unavailable:

Copy:

`当前套餐暂未包含此功能。`

Action:

`查看套餐`

Do not use technical authorization errors.
