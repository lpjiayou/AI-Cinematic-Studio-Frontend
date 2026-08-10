# Workspace Home — Component Mapping

Version: `V1.0`

---

## 1. Existing ACS Components

### CustomerLayout

Use for:

- global header shell；
- page width constraints；
- theme integration。

### ACSButton

Variants:

- primary；
- secondary；
- ghost；
- danger（本页当前无 destructive action，不使用）。

Icon-only control 不是独立 variant。使用现有 `ghost` variant、`leadingIcon`
或 `trailingIcon` slot，并提供可访问名称。Size 仅使用现有
`small | medium | large`。

`ACSButton` 用于 command actions。Navigation 使用语义 link，不得把 link
与 button 相互嵌套，也不得假设 Foundation 存在 polymorphic button API。

### ACSCard

Foundation tones available to this page:

- default；
- raised；
- selected；
- ai。

Hero、project、utility、status、insight 是页面内容角色，不是 `ACSCard`
variant。页面局部组件通过现有 `tone`、`padding`、slots 和 token-based
layout 组合这些角色，不得扩展平行 Card API。`interactive` 只提供 hover
呈现，不赋予按钮或链接语义。

### ACSBadge

States:

- project statuses：按 `STATE_SPEC.md` 映射到现有 tone；
- 专业版：`neutral`；
- AI assistant 在线：由 `AIAssistantPanel.status` 使用内置 `ai` tone + dot，
  并保留 visible label。

### AIAssistantPanel

Use as the AI assistant container.

Do not replace with a generic chat UI.

### ACSModal

Use for guided local command placeholders such as upload/import when no approved
destination or integration is available. It must not simulate a completed business
operation.

### ACSDrawer

Use at narrow widths for:

- AI assistant；
- global search；
- notification details。

---

## 2. Page-Local Components

下列 props 仅是页面 presentation view types，不是 Domain models，不负责
持久化、身份创建、路由推导或后端映射。

### WorkspaceHeader

```ts
type WorkspaceHeaderProps = {
  brand: {
    name: string;
    productName: string;
    logoSrc: string;
  };
  navigation: NavigationItem[];
  user: WorkspaceUser;
  theme: "light" | "dark";
};
```

### WelcomeHero

```ts
type WelcomeHeroProps = {
  greeting: string;
  description: string;
  backgroundImage: string;
  primaryAction: Action;
  secondaryAction: Action;
  metrics: WorkspaceMetric[];
};
```

### QuickStartPanel

```ts
type QuickStartPanelProps = {
  actions: QuickStartAction[];
};
```

### ProjectCard

```ts
type ProjectCardProps = {
  presentationKey: string;
  title: string;
  category: string;
  coverSrc: string;
  stageLabel: string;
  progress: number;
  collaborators: AvatarItem[];
  updatedLabel: string;
  nextActionLabel: string;
};
```

`presentationKey` 仅用于本地列表渲染，不是项目、系列或版本身份，且不在
视觉主界面展示。导航目标必须由应用边界提供，页面不得由该 key 推导。

### CreateProjectCard

```ts
type CreateProjectCardProps = {
  label: "新建项目";
  onActivate: () => void;
};
```

### WorkspaceStatusPanel

```ts
type WorkspaceStatusPanelProps = {
  processingLabel: string;
  storageUsage: {
    usedGb: number;
    totalGb: number;
  };
  membersOnline: {
    online: number;
    total: number;
  };
  plan: {
    name: string;
    expiresAt?: string;
  };
};
```

### ProductionOverview

```ts
type ProductionOverviewProps = {
  summaries: ProductionSummary[];
  series: TrendPoint[];
  periodLabel: string;
};
```

### ProjectActivityTimeline

```ts
type ProjectActivityTimelineProps = {
  items: ProjectActivityItem[];
};
```

### CreativeInspirationCard

```ts
type CreativeInspirationCardProps = {
  quote: string;
  source: string;
};
```

### MoreToolsGrid

```ts
type MoreToolsGridProps = {
  tools: WorkspaceTool[];
};
```

---

## 3. Suggested React Tree

```text
WorkspaceHomePage
├── CustomerLayout
│  ├── WorkspaceHeader
│  └── WorkspaceHomeContent
│     ├── TopExperienceGrid
│     │  ├── WelcomeHero
│     │  ├── QuickStartPanel
│     │  └── AIAssistantPanel
│     ├── ProductionGrid
│     │  ├── RecentProjectsSection
│     │  │  ├── ProjectCard × N
│     │  │  └── CreateProjectCard
│     │  └── WorkspaceSideRail
│     │     ├── WorkspaceStatusPanel
│     │     ├── CreativeInspirationCard
│     │     └── MoreToolsGrid
│     └── InsightGrid
│        ├── ProductionOverview
│        └── ProjectActivityTimeline
```

---

## 4. Reuse Rules

- 不得为按钮、Badge、Card 重新创建平行组件；
- 页面局部组件只负责布局和内容组合；
- Design Token 缺失时必须报告，不得写 raw color；
- 当前冻结规范不要求修改任何 ACS Foundation API；实现若发现缺口必须停止
  并报告，不得在页面任务中自行修改共享组件；
- 不得把该页面的 mock data 写入共享组件；
- `CustomerLayout contained` 的最大宽度与水平内边距不得被页面覆盖；
- `ACSCard` 不负责导航语义；项目操作使用显式 link/button。
