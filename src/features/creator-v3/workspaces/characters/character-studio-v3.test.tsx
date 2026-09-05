import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreatorClientError,
  type CreatorProject,
} from "@/features/core-integration";
import { CharacterStudioV3 } from "./character-studio-v3";

const core = vi.hoisted(() => ({
  request: vi.fn(),
  refresh: vi.fn(),
  connection: { status: "connected", capabilities: [] } as unknown,
}));

vi.mock("@/features/core-integration", async () => {
  const actual = await vi.importActual<typeof import("@/features/core-integration")>(
    "@/features/core-integration",
  );
  return {
    ...actual,
    creatorRequest: core.request,
    useCreatorIntegration: () => ({ state: core.connection, refresh: core.refresh }),
  };
});

vi.mock("../../shell", () => ({
  CreatorProjectShell: ({
    primaryCanvas,
    authorityEvidence,
  }: {
    primaryCanvas: ReactNode;
    authorityEvidence: { layers: Array<{ id: string; message: string }> };
  }) => (
    <div data-testid="project-shell">
      {primaryCanvas}
      <aside aria-label="authority layers">
        {authorityEvidence.layers.map((layer) => <p key={layer.id}>{layer.message}</p>)}
      </aside>
    </div>
  ),
}));

const project: CreatorProject = {
  schemaVersion: "creator.project.v1",
  projectRef: "private-project-ref",
  projectType: "SERIES",
  title: "北岸计划",
  description: "真实项目",
  targetPlatform: "Streaming",
  aspectRatio: "16:9",
  defaultDurationSec: 60,
  plannedEpisodeCount: 8,
  status: "ACTIVE",
  seriesRefs: ["private-series-ref"],
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-03T00:00:00Z",
  version: 3,
};

const plan = {
  seriesPlanRef: "private-plan-ref",
  currentSeriesPlanVersionRef: "private-plan-version-ref",
  confirmedSeriesPlanVersionRef: "private-plan-version-ref",
  status: "CONFIRMED",
  version: 2,
};

const planningReady = {
  schemaVersion: "creator.series-planning.workspace.v1",
  context: {},
  plan,
  versions: [],
};

const planningMissing = { ...planningReady, plan: null };

function intelligence(characterContinuityVersions: Array<Record<string, unknown>>) {
  return {
    schemaVersion: "creator.series-intelligence.workspace.v1",
    scope: {},
    seriesBible: null,
    seriesBibleVersions: [{ content: {} }],
    characterContinuity: null,
    characterContinuityVersions,
    activeBaseline: null,
    baselineHistory: [],
    sourceCompatibility: "compatible",
  };
}

function installReads({
  planning = planningReady,
  intelligenceValue = intelligence([{ content: { stateIntervals: [{}, {}], relationships: [{}] } }]),
}: {
  planning?: typeof planningReady | typeof planningMissing;
  intelligenceValue?: ReturnType<typeof intelligence>;
} = {}) {
  core.request.mockImplementation(async (path: string) => {
    if (path === "projects/private-project-ref") return { ok: true, project };
    if (path.startsWith("series-planning-workspaces?")) return { ok: true, workspace: planning };
    if (path.startsWith("series-intelligence-workspaces?")) return { ok: true, workspace: intelligenceValue };
    throw new Error(`Unexpected request: ${path}`);
  });
}

describe("CharacterStudioV3", () => {
  beforeEach(() => {
    core.request.mockReset();
    core.refresh.mockReset();
    core.connection = { status: "connected", capabilities: [] };
  });

  it("distinguishes loading, disconnected, zero-series, and multi-series states", async () => {
    core.connection = { status: "loading" };
    const loading = render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(screen.getByRole("status")).toHaveTextContent("正在读取角色连续性工作区");
    loading.unmount();

    core.connection = { status: "disconnected", error: { code: "core_disconnected", message: "连接失败" } };
    const disconnected = render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(screen.getByRole("heading", { name: "Creator Core 未连接" })).toBeVisible();
    disconnected.unmount();

    core.connection = { status: "connected", capabilities: [] };
    core.request.mockResolvedValue({ ok: true, project: { ...project, seriesRefs: [] } });
    const zero = render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "需要绑定系列" })).toBeVisible();
    expect(core.request).toHaveBeenCalledTimes(1);
    zero.unmount();

    core.request.mockReset();
    core.request.mockResolvedValue({ ok: true, project: { ...project, seriesRefs: ["one", "two"] } });
    render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "需要选择系列上下文" })).toBeVisible();
    expect(core.request).toHaveBeenCalledTimes(1);
  });

  it("stops at the M5 prerequisite and offers only the canonical Story route", async () => {
    installReads({ planning: planningMissing });
    render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "先建立系列规划" })).toBeVisible();
    expect(screen.getByText("角色连续性必须绑定已确认系列规划来源")).toBeVisible();
    expect(screen.getByRole("link", { name: "打开故事工作区" })).toHaveAttribute(
      "href",
      "/creator/projects/private-project-ref/story",
    );
    expect(core.request).toHaveBeenCalledTimes(2);
    expect(core.request.mock.calls.some(([path]) => String(path).startsWith("series-intelligence"))).toBe(false);
  });

  it("renders M6 authority rejection as a blocker rather than empty data", async () => {
    core.request.mockImplementation(async (path: string) => {
      if (path === "projects/private-project-ref") return { ok: true, project };
      if (path.startsWith("series-planning-workspaces?")) return { ok: true, workspace: planningReady };
      if (path.startsWith("series-intelligence-workspaces?")) {
        throw new CreatorClientError(403, { code: "authority_required", message: "需要准确的 M6 范围" });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "角色权威尚未开放" })).toBeVisible();
    expect(screen.getByText("需要准确的 M6 范围")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "当前还没有角色连续性版本" })).not.toBeInTheDocument();
  });

  it("renders the true M6 empty state without a write action", async () => {
    installReads({ intelligenceValue: intelligence([]) });
    render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "当前还没有角色连续性版本" })).toBeVisible();
    expect(screen.getByText("这是 Creator Core 返回的真实空状态；本页面不会使用本地角色样例替代")).toBeVisible();
    expect(screen.queryByRole("button", { name: /创建角色|AI 生成角色|确认角色/ })).not.toBeInTheDocument();
  });

  it("counts only declared arrays and exposes four independent authority layers", async () => {
    installReads();
    render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "角色", level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: "结构化区间摘要" }).closest("section")).toHaveTextContent("2");
    expect(screen.getByRole("heading", { name: "结构化关系摘要" }).closest("section")).toHaveTextContent("1");
    expect(screen.getByText("compatible")).toBeVisible();
    expect(screen.getByLabelText("authority layers").querySelectorAll("p")).toHaveLength(4);
    expect(screen.getByText("当前 M6 只读投影可读；不授予写入权限")).toBeVisible();
    expect(screen.queryByText("private-project-ref")).not.toBeInTheDocument();
    expect(screen.queryByText("private-series-ref")).not.toBeInTheDocument();
    expect(screen.queryByText(/AI 生成角色|林澈|角色卡/)).not.toBeInTheDocument();
  });

  it("fails closed on unknown continuity content without dumping or guessing it", async () => {
    installReads({
      intelligenceValue: intelligence([{ content: { stateIntervals: { guessed: true }, relationships: "unknown", secretName: "不应显示" } }]),
    });
    render(<CharacterStudioV3 projectRef="private-project-ref" />);
    expect((await screen.findAllByText("未提供结构化数据")).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("不应显示")).not.toBeInTheDocument();
    expect(document.body.textContent).not.toContain("secretName");
    expect(document.body.textContent).not.toContain("{\"");
  });
});
