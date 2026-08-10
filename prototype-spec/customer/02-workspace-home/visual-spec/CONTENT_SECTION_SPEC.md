# Workspace Home — Content Section Specification

Version: `V1.0 High Fidelity`

---

## 1. Quick Start

Card title: `快速开始`

Six actions:

| Action | Supporting copy |
|---|---|
| 新建项目 | 从空白开始创作 |
| AI导演助手 | 智能创意与构思 |
| 上传脚本 | 从文档生成项目 |
| 导入素材 | 视频 / 图片 / 音频 |
| 智能分镜 | AI 生成分镜头 |
| 项目模板 | 使用模板创建 |

Visual:

- 2-column utility grid；
- icon inside soft circular/square container；
- title uses `--acs-type-body-size` with `--acs-weight-semibold`；
- supporting copy uses `--acs-type-caption-size`；
- hover exposes direction arrow or border emphasis。

---

## 2. Recent Projects

Title: `最近项目`

Right action: `全部项目 →`

Approved prototype projects:

### 未来之城

- status: 进行中
- category: 科幻 · 长片
- progress: 78%
- next: 进入动画预演

### 雪落无声

- status: 分镜中
- category: 悬疑 · 院线电影
- progress: 42%
- next: 开始分镜设计

### 追光者

- status: 后期制作
- category: 青春 · 院线电影
- progress: 65%
- next: 素材收集与整理

### 星际回响

- status: 已交付
- category: 科幻 · 短片
- progress: 100%
- next: 查看项目交付包

Card layout:

```text
Cover
Status Badge
Title
Category
Progress
Collaborators
Updated time
Next action
```

Create Card:

- dashed border；
- plus icon；
- `新建项目`；
- same height as Project Card。

---

## 3. AI Assistant

The assistant must feel like a production partner.

Header:

`AI 助理 · 镜构小构`

Status:

`在线`

Suggested prompts are presented as actionable rows, not chat bubbles.

Input is compact and available at the bottom.

No bot-style conversational timeline by default.

---

## 4. Workspace Status

Title: `工作空间状态`

Rows:

- 制作处理中 — `2 项制作中`
- 存储使用 — `68.4 GB / 500 GB`
- 成员在线 — `3 / 8 在线`
- 当前套餐 — `专业版`

Use compact progress bars only for storage/usage.

No raw compute metrics.

---

## 5. Creative Inspiration

Title: `创作灵感`

Quote:

`电影不是生活的复制品，而是生活的升华和提炼。`

Source:

`侯孝贤`

Action:

`换一句`

This card is secondary and calm.

---

## 6. More Tools

Title: `更多创作工具`

Tools:

- 虚拟制片
- 智能剪辑
- 声音设计
- 数据洞察

Unavailable tools use a clear future-state badge.

---

## 7. Production Overview

Title: `制作进度总览`

Summary:

- 项目总数 12
- 进行中 5
- 即将交付 3
- 已完成 4

Chart:

- 近 7 天；
- one or two restrained lines；
- no noisy axes；
- theme-safe colors；
- tooltip optional。

---

## 8. Project Activity Timeline

Title: `项目状态时间线`

Events:

1. 未来之城 — 更新了分镜版本 v3.2 — 1 小时前
2. 雪落无声 — AI 分镜生成完成 — 3 小时前
3. 追光者 — 成片制作完成 — 昨天 18:30
4. 星际回响 — 项目已交付 — 2 天前

Use meaningful status icons and project accents.

---

## 9. Empty and Placeholder Rules

- never use empty gray/black rectangles；
- project cover unavailable → approved branded cinematic placeholder with project title initials and visual motif；
- assistant unavailable → guided state；
- chart unavailable → explanatory empty state, not fake data。
