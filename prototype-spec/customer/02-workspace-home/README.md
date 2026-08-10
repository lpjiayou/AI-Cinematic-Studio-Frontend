# AI Cinematic Studio — Workspace Home

Prototype Specification

Version: `V1.0 High Fidelity`

Status: `Frozen for implementation`

Verified source baseline: `464f6ce416602d55264762e6ea9a645119843053`

Product: `AI Cinematic Studio`

Brand: `镜构智能 / JINGGOU AI`

Owner: `镜构人工智能科技有限公司`

Experience Layer: `Customer SaaS Experience`

Target Route: `/workspace`

Suggested Next.js Entry: `src/app/workspace/page.tsx`

---

## 1. Purpose

Workspace Home 是客户登录 AI Cinematic Studio 后看到的第一生产空间。

它必须让用户快速完成三件事：

1. 继续当前作品；
2. 创建新的影视项目；
3. 查看 AI 制作助手给出的下一步建议。

Workspace Home 的产品定位是：

> 我的 AI 影视工作室。

它不是：

- 运营数据后台；
- 项目管理数据库；
- ERP 仪表盘；
- GPU、任务队列或 Provider 监控页面。

---

## 2. Target Users

- 企业内容团队；
- 影视工作室；
- 导演、编剧和制片人；
- 品牌内容团队；
- 独立创作者。

---

## 3. Primary User Flow

```text
Landing Page
↓
Workspace Home
├─ 新建项目 → approved create-project destination
├─ 继续制作 → Project Workspace
├─ AI 建议 → 对应制作页面
└─ 查看全部项目 → Project Workshop
```

---

## 4. Design Position

页面应同时具备：

- Apple 的清晰与留白；
- Figma 的工作空间感；
- Adobe Creative Cloud 的创作入口感；
- Runway 的 AI 制作氛围。

不得照搬任何单一产品。

---

## 5. Theme

Default: inherit the ACS root theme. On first use, the current ACS runtime defaults to `Dark`.

Supported:

- Light Mode
- Dark Mode

Light Mode 用于客户日常工作和企业展示。

Dark Mode 用于长时间影视创作和沉浸式制作。

Workspace Home 不得建立页面级主题默认值或嵌套主题区域。主题选择由
`ThemeProvider` 的显式、持久化偏好统一管理。

---

## 6. Specification Priority

Codex 实现时按以下顺序读取：

1. `visual-spec/VISUAL_DIRECTION.md`
2. `visual-spec/HERO_SECTION_SPEC.md`
3. `visual-spec/CONTENT_SECTION_SPEC.md`
4. `PAGE_STRUCTURE.md`
5. `STYLE_SPEC.md`
6. `COMPONENT_MAP.md`
7. `INTERACTION_SPEC.md`
8. `RESPONSIVE_SPEC.md`
9. `STATE_SPEC.md`
10. `DATA_BINDING_SPEC.md`
11. `assets-spec/WORKSPACE_VISUAL_SPEC.md`
12. `assets-spec/PROJECT_COVER_SPEC.md`

如文件发生冲突，停止实现并报告，不得自行选择。

`README.md`、`PACKAGE_MANIFEST.md` 与 `CODEX_VERIFY_PROMPT.txt` 是 package
governance files；除本节 priority contract 外，不参与视觉或组件规则覆盖。

---

## 7. Required Components

- WorkspaceHeader
- WelcomeHero
- QuickStartPanel
- AIAssistantPanel
- RecentProjectsSection
- ProjectCard
- CreateProjectCard
- WorkspaceStatusPanel
- ProductionOverview
- ProjectActivityTimeline
- CreativeInspirationCard
- MoreToolsGrid

优先复用已冻结 ACS 组件：

- `CustomerLayout`
- `ACSButton`
- `ACSCard`
- `ACSBadge`
- `ACSModal`
- `AIAssistantPanel`
- `ACSDrawer`

---

## 8. Implementation Boundary

Phase 1 implementation is presentation-first.

Allowed:

- approved mock data;
- local approved assets;
- guided local placeholder states for unavailable destinations;
- Light/Dark theme;
- responsive behavior;
- accessible interactions.

Not allowed:

- Browser → Provider；
- Browser → Database；
- Domain identity creation；
- Project/Series/Episode 事实写入；
- 修改 V5/V4/V3；
- 暴露 Ref、Hash、Job ID、GPU、Queue、Provider 等技术信息。

---

## 9. Acceptance Summary

页面必须达到：

- 一眼看出这是 AI 影视创作 SaaS；
- 主行动“新建项目”明确；
- 最近作品和下一步制作清晰；
- AI 助手是制作伙伴，不是聊天机器人；
- 无后台管理感；
- Light/Dark 都是完整产品体验；
- 1920、1600、1366、1280、1024 和移动端无横向溢出。
