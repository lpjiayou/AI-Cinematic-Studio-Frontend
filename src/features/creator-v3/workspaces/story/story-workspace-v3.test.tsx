import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CreatorClientError,
  type CreatorProject,
  type CreatorSeriesPlanCandidate,
  type SeriesPlanningWorkspaceEnvelope,
} from "@/features/core-integration";
import { StoryWorkspaceV3 } from "./story-workspace-v3";

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

const candidate: CreatorSeriesPlanCandidate = {
  schemaVersion: "creator.series-plan.candidate.v1",
  seriesConcept: "海雾中的归航",
  premise: "失散船员寻找回家的路",
  logline: "一支船队在记忆与海雾之间寻找真相。",
  mainNarrativeDirection: "逐步揭开航线秘密",
  mainArcs: [{
    arcNumber: 1,
    title: "离岸",
    episodeStart: 1,
    episodeEnd: 4,
    objective: "建立归航目标",
    turningPoint: "航图被证明错误",
  }],
  subArcs: [],
  characterArcIntents: [],
  episodePlanItems: [{
    episodeNumber: 1,
    title: "雾线",
    logline: "船员越过第一道雾线。",
    arcNumber: 1,
    narrativePurpose: "开启旅程",
    continuityNotes: [],
    foreshadowing: [],
  }],
  narrativeRhythm: "渐进",
  worldIntent: "海上未知",
  continuityIntent: [],
  foreshadowingContext: [],
  productionAssumptions: [],
};

const planningMissing: SeriesPlanningWorkspaceEnvelope["workspace"] = {
  schemaVersion: "creator.series-planning.workspace.v1",
  context: {},
  plan: null,
  versions: [],
};

const planningReady: SeriesPlanningWorkspaceEnvelope["workspace"] = {
  ...planningMissing,
  plan: {
    seriesPlanRef: "private-plan-ref",
    currentSeriesPlanVersionRef: "private-plan-version-ref",
    confirmedSeriesPlanVersionRef: "private-plan-version-ref",
    status: "CONFIRMED",
    version: 2,
  },
  versions: [{
    ...candidate,
    schemaVersion: "creator.series-plan.version.v1",
    seriesPlanRef: "private-plan-ref",
    seriesPlanVersionRef: "private-plan-version-ref",
    versionNumber: 2,
    changeKind: "CONFIRMED",
  }],
};

const intelligence = {
  schemaVersion: "creator.series-intelligence.workspace.v1",
  scope: {},
  seriesBible: null,
  seriesBibleVersions: [{ content: {} }],
  characterContinuity: null,
  characterContinuityVersions: [{ content: {} }, { content: {} }],
  activeBaseline: null,
  baselineHistory: [],
  sourceCompatibility: "compatible",
};

function successfulReads(planning = planningMissing) {
  core.request.mockImplementation(async (path: string, init?: { method?: string }) => {
    if (path === "projects/private-project-ref") return { ok: true, project };
    if (path.startsWith("series-planning-workspaces?")) return { ok: true, workspace: planning };
    if (path.startsWith("series-intelligence-workspaces?")) return { ok: true, workspace: intelligence };
    if (path === "series-plan-candidates" && init?.method === "POST") {
      return { ok: true, kind: "candidate-series-plan", confirmationRequired: true, candidate };
    }
    if (path === "series-plans/confirm-candidate" && init?.method === "POST") {
      return { ok: true, plan: planningReady.plan, version: planningReady.versions[0] };
    }
    throw new Error(`Unexpected request: ${path}`);
  });
}

describe("StoryWorkspaceV3", () => {
  beforeEach(() => {
    core.request.mockReset();
    core.refresh.mockReset();
    core.connection = { status: "connected", capabilities: [] };
  });

  it("distinguishes loading, disconnected, and absent", async () => {
    core.connection = { status: "loading" };
    const loading = render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    expect(screen.getByRole("status")).toHaveTextContent("正在读取故事工作区");
    loading.unmount();

    core.connection = { status: "disconnected", error: { code: "core_disconnected", message: "连接失败" } };
    const disconnected = render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    expect(screen.getByRole("heading", { name: "Creator Core 未连接" })).toBeVisible();
    disconnected.unmount();

    core.connection = { status: "connected", capabilities: [] };
    core.request.mockRejectedValue(new CreatorClientError(404, { code: "project_not_found", message: "项目不存在" }));
    render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "未找到故事项目" })).toBeVisible();
  });

  it.each([
    [[], "需要绑定系列", "series_binding_required"],
    [["series-one", "series-two"], "需要选择系列上下文", "series_context_selection_required"],
  ])("blocks ambiguous series scope %j without downstream reads", async (seriesRefs, title, code) => {
    core.request.mockResolvedValue({ ok: true, project: { ...project, seriesRefs } });
    render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: title })).toBeVisible();
    expect(core.request).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("series-one")).not.toBeInTheDocument();
    expect(code).toMatch(/^series_/);
  });

  it("generates, labels, discards, and confirms a candidate with exact requests", async () => {
    const user = userEvent.setup();
    successfulReads();
    render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    const input = await screen.findByRole("textbox", { name: "系列规划创意输入" });
    const generate = screen.getByRole("button", { name: "生成规划候选" });
    expect(generate).toBeDisabled();
    await user.type(input, "太短");
    expect(generate).toBeDisabled();
    await user.type(input, "，继续补足系列主线与分集节奏");
    await user.click(generate);

    expect(await screen.findByText("候选 · 尚未写入系列规划 · 需要人工确认")).toBeVisible();
    expect(core.request).toHaveBeenCalledWith("series-plan-candidates", {
      method: "POST",
      signal: expect.any(AbortSignal),
      body: {
        projectRef: "private-project-ref",
        seriesRef: "private-series-ref",
        creativeInput: "太短，继续补足系列主线与分集节奏",
      },
    });
    const beforeDiscard = core.request.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "放弃候选" }));
    expect(screen.queryByText("候选 · 尚未写入系列规划 · 需要人工确认")).not.toBeInTheDocument();
    expect(core.request).toHaveBeenCalledTimes(beforeDiscard);

    await user.click(generate);
    await user.click(await screen.findByRole("button", { name: "人工确认并建立版本" }));
    await waitFor(() => expect(core.request).toHaveBeenCalledWith(
      "series-plans/confirm-candidate",
      {
        method: "POST",
        signal: expect.any(AbortSignal),
        body: {
          projectRef: "private-project-ref",
          seriesRef: "private-series-ref",
          humanConfirmed: true,
          candidate,
        },
      },
    ));
  });

  it("renders a confirmed plan and only the proven M6 summary", async () => {
    successfulReads(planningReady);
    render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    expect(await screen.findByText("当前系列规划已确认")).toBeVisible();
    expect(screen.getByText("海雾中的归航")).toBeVisible();
    expect(screen.getByText("compatible")).toBeVisible();
    expect(screen.getByText("当前 M6 只读投影可读取；不代表写入授权")).toBeVisible();
    expect(screen.getByLabelText("authority layers").querySelectorAll("p")).toHaveLength(4);
    expect(screen.queryByText("private-project-ref")).not.toBeInTheDocument();
    expect(screen.queryByText("private-series-ref")).not.toBeInTheDocument();
    expect(screen.queryByText(/LOCAL_FIXTURE|未来之城|林澈/)).not.toBeInTheDocument();
  });

  it("keeps M6 rejection distinct from an empty authority result", async () => {
    core.request.mockImplementation(async (path: string) => {
      if (path === "projects/private-project-ref") return { ok: true, project };
      if (path.startsWith("series-planning-workspaces?")) return { ok: true, workspace: planningReady };
      if (path.startsWith("series-intelligence-workspaces?")) {
        throw new CreatorClientError(403, { code: "authority_required", message: "需要 M6 范围授权" });
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<StoryWorkspaceV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "故事权威尚未开放" })).toBeVisible();
    expect(screen.getByText("需要 M6 范围授权")).toBeVisible();
    expect(screen.getByText("M6 Identity / Scope Authority")).toBeVisible();
  });
});
