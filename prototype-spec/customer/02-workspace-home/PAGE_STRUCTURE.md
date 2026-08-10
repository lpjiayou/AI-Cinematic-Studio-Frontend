# Workspace Home — Page Structure

Version: `V1.0 High Fidelity`

---

## 1. Global Shell

```text
Global Header
↓
Workspace Main Canvas
├─ Top Experience Grid
│  ├─ Welcome Hero
│  ├─ Quick Start
│  └─ AI Assistant
├─ Production Grid
│  ├─ Recent Projects
│  └─ Workspace Side Rail
└─ Insight Grid
   ├─ Production Overview
   └─ Project Activity Timeline
```

页面不得使用永久左侧后台菜单。

客户 Workspace Home 使用顶部产品导航。

---

## 2. Global Header

Height: `--acs-header-height` (`72px`)

Left:

- official 镜构智能 logo；
- brand name `镜构智能`；
- optional product line `AI Cinematic Studio`。

Center navigation，顺序固定：

1. 工作台首页
2. AI导演
3. 项目工坊
4. 系列规划
5. 剧本与分镜
6. 资产库
7. 成片交付

Right:

- global search；
- theme toggle；
- notification；
- help；
- user/workspace menu。

Primary action:

- `新建项目`，仅在宽屏显示；
- 窄屏收纳到用户菜单或浮动主操作。

禁止在 Header 展示：

- 任务队列数量墙；
- GPU/Provider；
- 调试入口；
- 原始 Ref。

---

## 3. Page Container

Desktop maximum width: `--acs-content-max-width` (`1440px`)

使用 `CustomerLayout contained` 的既有水平内边距，不在页面层覆盖：

- Desktop / tablet: `--acs-space-6` (`24px`)
- Mobile (`<= 48rem`): `--acs-space-4` (`16px`)

Vertical section gap: `--acs-space-6` (`24px`)。

---

## 4. Top Experience Grid

Desktop grid:

```text
Welcome Hero      Quick Start      AI Assistant
约 54%            约 20%           约 26%
```

Recommended CSS concept:

```css
grid-template-columns:
  minmax(0, 1.7fr)
  minmax(280px, 0.72fr)
  minmax(320px, 0.82fr);
```

不得压缩任意列到不可读宽度。

---

## 5. Welcome Hero

Hero 必须是第一视觉。

Content:

- Eyebrow: `CREATOR WORKSPACE`
- Greeting: `欢迎回来，张导 👋`
- Supporting copy: `镜构智能创作云，让每一次创作都更有想象力`
- Product label: `镜构智能创作云`
- Plan badge: `专业版`

Primary CTA:

- `继续制作`

Secondary CTA:

- `查看项目`

Hero status strip 可展示四个业务级状态：

1. 今日创作时长
2. 制作处理中
3. 存储空间
4. 团队成员

禁止形成 KPI 墙；状态条仅作为当前工作空间背景信息。

---

## 6. Quick Start Panel

Title: `快速开始`

Actions 固定为六项：

1. 新建项目
2. AI导演助手
3. 上传脚本
4. 导入素材
5. 智能分镜
6. 项目模板

每项包含：

- icon；
- title；
- one-line description。

必须以任务语言描述，不得使用技术模块名。

---

## 7. AI Assistant Panel

Title: `AI 助理 · 镜构小构`

Status: `在线`

Greeting:

`你好，张导 👋`

Supporting copy:

`我是你的 AI 创作搭档，随时为你提供专业支持。`

Suggested actions:

- 帮我分析剧本的情绪曲线
- 生成《未来之城》的分镜建议
- 推荐适合科幻题材的镜头语言
- 检查当前项目的潜在风险

Input placeholder:

`输入你的创意或制作需求…`

Footer note:

`内容由 AI 生成，仅供参考`

---

## 8. Production Grid

Main area:

- Recent Projects，跨度为前两列；
- Workspace Side Rail，使用第三列。

### 8.1 Recent Projects

Title: `最近项目`

Right action: `全部项目 →`

Desktop:

- 4 个项目卡 + 1 个 Create Card；
- 卡片等高；
- 支持横向滚动或响应式换行。

每个 Project Card 展示：

- approved cover；
- production status；
- project title；
- type；
- progress；
- collaborators；
- last updated；
- next action。

禁止展示 Ref、Schema、Hash。

### 8.2 Workspace Side Rail

按顺序：

1. WorkspaceStatusPanel
2. CreativeInspirationCard
3. MoreToolsGrid

该侧栏是辅助，不得与 Recent Projects 抢夺视觉焦点。

---

## 9. Insight Grid

Two columns:

1. `制作进度总览`
2. `项目状态时间线`

### 9.1 Production Overview

展示项目级趋势，不展示基础设施数据。

Summary:

- 项目总数
- 进行中
- 即将交付
- 已完成

Chart:

- 近 7 天创作活动趋势；
- 使用简洁折线图；
- 不显示复杂分析工具。

### 9.2 Project Activity Timeline

Sample events:

- 《未来之城》更新了分镜版本 v3.2
- 《雪落无声》AI 分镜生成完成
- 《追光者》成片制作完成
- 《星际回响》项目已交付

只显示业务动作和相对时间。

---

## 10. Footer

Workspace Home 不需要大型营销 Footer。

可使用轻量底部信息：

- copyright；
- privacy；
- help；
- service status。

在内容不足一屏时仍位于内容流底部，不固定遮挡。
