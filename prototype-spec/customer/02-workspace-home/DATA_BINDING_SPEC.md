# Workspace Home — Data Binding Specification

Version: `V1.0`

---

## 1. Phase 1 Rule

Initial implementation uses approved local mock data.

No backend connection.

The page architecture keeps data behind an injected presentation adapter so approved
application data can replace mocks later. This specification does not define a
backend client, API contract, persistence layer, or Domain model.

---

## 2. Presentation DTOs

```ts
export type WorkspaceHomeDTO = {
  user: WorkspaceUserDTO;
  hero: WorkspaceHeroDTO;
  quickActions: QuickActionDTO[];
  aiAssistant: AIAssistantDTO;
  recentProjects: ProjectSummaryDTO[];
  workspaceStatus: WorkspaceStatusDTO;
  productionOverview: ProductionOverviewDTO;
  activity: ProjectActivityDTO[];
  inspiration: InspirationDTO;
  tools: WorkspaceToolDTO[];
};
```

### WorkspaceUserDTO

```ts
export type WorkspaceUserDTO = {
  displayName: string;
  avatarUrl?: string;
  workspaceName: string;
  planLabel?: string;
};
```

### ProjectSummaryDTO

```ts
export type ProjectSummaryDTO = {
  presentationKey: string;
  title: string;
  categoryLabel: string;
  coverUrl: string;
  stageLabel: string;
  progressPercent: number;
  collaboratorAvatars: string[];
  updatedLabel: string;
  nextActionLabel: string;
};
```

`presentationKey` is a local list-rendering key only. It is not routing or Domain
identity and must not be displayed as customer-facing text. An approved destination,
when available, is supplied separately by the application boundary.

### WorkspaceStatusDTO

```ts
export type WorkspaceStatusDTO = {
  processingLabel: string;
  storageUsedGb: number;
  storageTotalGb: number;
  membersOnline: number;
  membersTotal: number;
  planLabel: string;
  planExpiryLabel?: string;
};
```

---

## 3. Approved Mock Content

User:

- displayName: `张导`
- workspaceName: `张艺谋导演工作室`
- planLabel: `专业版`

Projects:

1. 未来之城 — 科幻 · 长片 — 78% — 进入动画预演
2. 雪落无声 — 悬疑 · 院线电影 — 42% — 开始分镜设计
3. 追光者 — 青春 · 院线电影 — 65% — 素材收集与整理
4. 星际回响 — 科幻 · 短片 — 100% — 查看项目交付包

The examples are visual prototype content only and must not be written to Domain storage.

---

## 4. Future Presentation Boundary

Future integration boundary:

```text
Workspace Home UI
↓
Injected presentation adapter
↓
Approved application boundary (outside this specification)
```

Potential future interfaces:

```ts
interface WorkspaceHomePresentationAdapter {
  getWorkspaceHome(): Promise<WorkspaceHomeDTO>;
}
```

The adapter is replaceable presentation infrastructure. Do not define direct
Provider, database, Creator Application, or V5/V4/V3 clients in this page package.

---

## 5. Error Mapping

Technical errors are converted at the presentation adapter boundary.

Example:

```ts
type WorkspaceHomeError =
  | "PROJECTS_UNAVAILABLE"
  | "ASSISTANT_UNAVAILABLE"
  | "WORKSPACE_RESTRICTED"
  | "OFFLINE";
```

User interface displays approved Chinese copy from `STATE_SPEC.md`.

---

## 6. Identity Rule

Never create or infer:

- projectRef；
- seriesRef；
- episodeRef；
- assetRef；
- version identity。

Phase 1 mock identity is local presentation identity only.

Real identities remain outside the Frontend Experience Layer and are supplied only
by an approved application boundary.

---

## 7. Analytics Rule

Workspace Home may later emit interaction analytics, but must not fabricate production performance.

Allowed:

- CTA clicked；
- project opened；
- assistant suggestion opened；
- theme toggled。

Not allowed:

- fake customer success metrics；
- AI predictions shown as real production data。
