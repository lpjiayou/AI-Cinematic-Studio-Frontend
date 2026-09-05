import type { MouseEventHandler, ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CreatorProject,
  CreatorScriptVersion,
  CreatorSeries,
} from "@/features/core-integration";
import { ScriptStudioV3 } from "./script-studio-v3";

const core = vi.hoisted(() => ({
  request: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: core.push }),
}));

vi.mock("../../shell", () => ({
  CreatorProjectShell: ({
    primaryCanvas,
    authorityEvidence,
    onNavigationCapture,
  }: {
    primaryCanvas: ReactNode;
    authorityEvidence: { layers: Array<{ id: string; message: string }> };
    onNavigationCapture?: MouseEventHandler<HTMLDivElement>;
  }) => (
    <div data-testid="project-shell" onClickCapture={onNavigationCapture}>
      <nav aria-label="mock project navigation">
        <a href="/creator/projects/private-project-ref/story">故事</a>
      </nav>
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

const episodes = [
  {
    schemaVersion: "creator.episode.v1",
    seriesRef: "private-series-ref",
    episodeRef: "private-episode-one",
    episodeNumber: 1,
    seasonNumber: 1,
    volumeNumber: 1,
    title: "雾线",
    status: "ACTIVE",
    canonicalProjectRef: "private-project-ref",
    creativePlanRef: "private-creative-plan",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    version: 1,
  },
  {
    schemaVersion: "creator.episode.v1",
    seriesRef: "private-series-ref",
    episodeRef: "private-episode-two",
    episodeNumber: 2,
    seasonNumber: 1,
    volumeNumber: 1,
    title: "回声",
    status: "ACTIVE",
    canonicalProjectRef: "private-project-ref",
    creativePlanRef: "private-creative-plan-two",
    createdAt: "2026-09-02T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    version: 1,
  },
];

const series: CreatorSeries = {
  schemaVersion: "creator.series.v1",
  seriesRef: "private-series-ref",
  title: "北岸系列",
  description: "真实系列",
  status: "ACTIVE",
  plannedEpisodeCount: 8,
  episodes,
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-03T00:00:00Z",
  version: 2,
};

const firstVersion: CreatorScriptVersion = {
  scriptRef: "private-script-ref",
  scriptVersionRef: "private-script-version-one",
  versionNumber: 1,
  title: "第一集：雾线",
  logline: "船员穿过无法测量的海雾。",
  synopsis: "原始故事梗概",
  targetDurationSec: 60,
  scenes: [{
    scriptSceneRef: "private-scene-ref",
    sceneNumber: 1,
    heading: "外景 · 船首",
    location: "北岸海域",
    timeOfDay: "黎明",
    characters: ["船长"],
    action: "船首进入浓雾。",
    dialogue: [{ speaker: "船长", text: "保持航向。" }],
    narration: [],
    subtitleText: [],
    estimatedDurationSec: 20,
    scenePurpose: "建立危机",
    continuityNotes: [],
    productionNotes: [],
  }],
  changeKind: "GENERATED",
  createdAt: "2026-09-03T00:00:00Z",
};

const secondVersion: CreatorScriptVersion = {
  ...firstVersion,
  scriptVersionRef: "private-script-version-two",
  versionNumber: 2,
  synopsis: "第二版故事梗概",
  changeKind: "MANUAL",
};

function scriptWorkspace(versions: CreatorScriptVersion[] = [firstVersion]) {
  return {
    bootstrap: {},
    script: {
      scriptRef: "private-script-ref",
      title: "第一集：雾线",
      currentScriptVersionRef: versions.at(-1)?.scriptVersionRef ?? "",
      confirmedScriptVersionRef: null,
      version: versions.length,
    },
    versions,
  };
}

function installReads({
  seriesValue = series,
  workspace = scriptWorkspace(),
}: {
  seriesValue?: CreatorSeries;
  workspace?: ReturnType<typeof scriptWorkspace> | { bootstrap: Record<string, unknown>; script: null; versions: [] };
} = {}) {
  core.request.mockImplementation(async (path: string, init?: { method?: string; body?: { content?: { synopsis: string } } }) => {
    if (path === "projects/private-project-ref") return { ok: true, project };
    if (path === "series/private-series-ref") return { ok: true, series: seriesValue };
    if (path.startsWith("script-workspaces?")) return { ok: true, workspace };
    if (path === "episodes" && init?.method === "POST") return { ok: true, episode: episodes[0] };
    if (path === "script-versions/manual" && init?.method === "POST") {
      workspace = scriptWorkspace([...workspace.versions, { ...secondVersion, synopsis: init.body!.content!.synopsis }]);
      return { ok: true, script: workspace.script };
    }
    if (path.startsWith("script-versions/") && init?.method === "POST") {
      return { ok: true, script: scriptWorkspace().script, scriptVersion: firstVersion };
    }
    throw new Error(`Unexpected request: ${path}`);
  });
}

describe("ScriptStudioV3", () => {
  beforeEach(() => {
    core.request.mockReset();
    core.refresh.mockReset();
    core.push.mockReset();
    core.connection = { status: "connected", capabilities: [] };
    window.history.replaceState({}, "", "/creator/projects/private-project-ref/script");
  });

  it("distinguishes loading, disconnected, and ambiguous series scope", async () => {
    core.connection = { status: "loading" };
    const loading = render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(screen.getByRole("status")).toHaveTextContent("正在读取剧本工作区");
    loading.unmount();

    core.connection = { status: "disconnected", error: { code: "core_disconnected", message: "连接失败" } };
    const disconnected = render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(screen.getByRole("heading", { name: "Creator Core 未连接" })).toBeVisible();
    disconnected.unmount();

    core.connection = { status: "connected", capabilities: [] };
    core.request.mockResolvedValue({ ok: true, project: { ...project, seriesRefs: [] } });
    const zero = render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "需要绑定系列" })).toBeVisible();
    expect(core.request).toHaveBeenCalledTimes(1);
    zero.unmount();

    core.request.mockReset();
    core.request.mockResolvedValue({ ok: true, project: { ...project, seriesRefs: ["one", "two"] } });
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "需要选择系列上下文" })).toBeVisible();
    expect(core.request).toHaveBeenCalledTimes(1);
  });

  it("keeps advanced Episode creation collapsed and posts the exact bounded body", async () => {
    const user = userEvent.setup();
    installReads({ seriesValue: { ...series, episodes: [] } });
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "当前系列还没有分集" })).toBeVisible();
    expect(screen.getByRole("link", { name: "打开 AI 导演" })).toHaveAttribute("href", "/creator/ai-director");
    const advanced = screen.getByText("高级：使用已确认导演方案引用").closest("details");
    expect(advanced).not.toHaveAttribute("open");
    expect(screen.getByRole("textbox", { name: "creativePlanRef" })).not.toBeVisible();

    await user.click(screen.getByText("高级：使用已确认导演方案引用"));
    await user.type(screen.getByRole("textbox", { name: "creativePlanRef" }), "confirmed-plan-input");
    await user.clear(screen.getByRole("spinbutton", { name: "episodeNumber" }));
    await user.type(screen.getByRole("spinbutton", { name: "episodeNumber" }), "3");
    await user.clear(screen.getByRole("textbox", { name: "episodeTitle" }));
    await user.type(screen.getByRole("textbox", { name: "episodeTitle" }), "第三集");
    await user.click(screen.getByRole("button", { name: "建立 Episode" }));
    await waitFor(() => expect(core.request).toHaveBeenCalledWith("episodes", {
      method: "POST",
      signal: expect.any(AbortSignal),
      body: {
        seriesRef: "private-series-ref",
        creativePlanRef: "confirmed-plan-input",
        episodeNumber: 3,
        seasonNumber: 1,
        volumeNumber: 1,
        title: "第三集",
      },
    }));
  });

  it("generates a first script with only the real Series and Episode", async () => {
    const user = userEvent.setup();
    installReads({ workspace: { bootstrap: {}, script: null, versions: [] } });
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "当前分集可以建立第一版剧本" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "生成第一版剧本" }));
    await waitFor(() => expect(core.request).toHaveBeenCalledWith("script-versions/generate", {
      method: "POST",
      signal: expect.any(AbortSignal),
      body: { seriesRef: "private-series-ref", episodeRef: "private-episode-one" },
    }));
  });

  it("renders scenes, tracks synopsis dirtiness, and saves the exact manual version", async () => {
    const user = userEvent.setup();
    installReads();
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    expect(await screen.findByRole("heading", { name: "剧本", level: 1 })).toBeVisible();
    expect(screen.getByRole("option", { name: "第 1 集 · 雾线" })).toBeInTheDocument();
    expect(screen.getAllByText("外景 · 船首").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("heading", { name: "Reviewed Import 尚未接入当前 Frontend Adapter" })).toBeVisible();
    expect(screen.getByLabelText("authority layers").querySelectorAll("p")).toHaveLength(4);

    const synopsis = screen.getByRole("textbox", { name: "故事梗概" });
    await user.clear(synopsis);
    await user.type(synopsis, "人工修订后的故事梗概");
    expect(screen.getByText("有未保存修改", { selector: "[data-script-dirty]" })).toBeVisible();
    expect(screen.getByRole("button", { name: "确认版本" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "保存修订" }));

    await waitFor(() => expect(core.request).toHaveBeenCalledWith("script-versions/manual", {
      method: "POST",
      signal: expect.any(AbortSignal),
      body: {
        seriesRef: "private-series-ref",
        episodeRef: "private-episode-one",
        scriptRef: "private-script-ref",
        baseScriptVersionRef: "private-script-version-one",
        content: {
          title: firstVersion.title,
          logline: firstVersion.logline,
          synopsis: "人工修订后的故事梗概",
          targetDurationSec: firstVersion.targetDurationSec,
          scenes: firstVersion.scenes,
        },
      },
    }));
    expect(screen.queryByText("private-project-ref")).not.toBeInTheDocument();
    expect(screen.queryByText("private-series-ref")).not.toBeInTheDocument();
  });

  it("confirms only a clean latest version with the exact request", async () => {
    const user = userEvent.setup();
    installReads();
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    const confirm = await screen.findByRole("button", { name: "确认版本" });
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(core.request).toHaveBeenCalledWith("script-versions/confirm", {
      method: "POST",
      signal: expect.any(AbortSignal),
      body: {
        seriesRef: "private-series-ref",
        episodeRef: "private-episode-one",
        scriptRef: "private-script-ref",
        scriptVersionRef: "private-script-version-one",
        humanConfirmed: true,
      },
    }));
  });

  it("shows an honest one-version empty comparison and real multi-version comparison", async () => {
    const user = userEvent.setup();
    installReads();
    const one = render(<ScriptStudioV3 projectRef="private-project-ref" />);
    await user.click(await screen.findByRole("tab", { name: "对比" }));
    expect(screen.getByRole("heading", { name: "当前没有可对比的历史版本" })).toBeVisible();
    one.unmount();

    installReads({ workspace: scriptWorkspace([firstVersion, secondVersion]) });
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    await user.click(await screen.findByRole("tab", { name: "对比" }));
    expect(screen.getByRole("combobox", { name: "选择对比版本" })).toHaveValue("1");
    expect(screen.getByText("此处只并排展示真实版本，不声称提供自动语义差异分析。")).toBeVisible();
    expect(screen.getByText("第二版故事梗概")).toBeVisible();
  });

  it("guards internal navigation and unload, then restores focus when staying", async () => {
    const user = userEvent.setup();
    installReads();
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    const synopsis = await screen.findByRole("textbox", { name: "故事梗概" });
    await user.type(synopsis, " 已修改");
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);

    const storyLink = screen.getByRole("link", { name: "故事" });
    await user.click(storyLink);
    const dialog = await screen.findByRole("dialog", { name: "离开前保存修改？" });
    expect(within(dialog).getByRole("button", { name: "保存并继续" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "放弃修改并继续" })).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "留在当前页面" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(storyLink).toHaveFocus();
    expect(core.request.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });

  it("supports discard-and-continue and save-and-continue without silent navigation", async () => {
    const user = userEvent.setup();
    installReads();
    const discardPage = render(<ScriptStudioV3 projectRef="private-project-ref" />);
    await user.type(await screen.findByRole("textbox", { name: "故事梗概" }), " discard");
    await user.click(screen.getByRole("link", { name: "故事" }));
    await user.click(await screen.findByRole("button", { name: "放弃修改并继续" }));
    expect(core.push).toHaveBeenCalledWith("/creator/projects/private-project-ref/story");
    discardPage.unmount();

    core.push.mockReset();
    core.request.mockReset();
    installReads();
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    await user.type(await screen.findByRole("textbox", { name: "故事梗概" }), " save");
    await user.click(screen.getByRole("link", { name: "故事" }));
    await user.click(await screen.findByRole("button", { name: "保存并继续" }));
    await waitFor(() => expect(core.push).toHaveBeenCalledWith("/creator/projects/private-project-ref/story"));
    expect(core.request.mock.calls.some(([path, init]) => path === "script-versions/manual" && init?.method === "POST")).toBe(true);
  });

  it("requires the three-operation modal before switching Episode while dirty", async () => {
    const user = userEvent.setup();
    installReads();
    render(<ScriptStudioV3 projectRef="private-project-ref" />);
    await user.type(await screen.findByRole("textbox", { name: "故事梗概" }), " dirty");
    await user.selectOptions(screen.getByRole("combobox", { name: "选择分集" }), "private-episode-two");
    const dialog = await screen.findByRole("dialog", { name: "切换分集前保存修改？" });
    expect(within(dialog).getByRole("button", { name: "保存并切换" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "放弃修改并切换" })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "留在当前分集" })).toBeVisible();
  });
});
