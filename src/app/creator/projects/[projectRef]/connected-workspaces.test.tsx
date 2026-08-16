import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorClientError } from "@/features/core-integration";
import { ConnectedScriptStudio } from "./content/script/connected-script-studio";
import { ConnectedStoryWorld } from "./planning/bible/connected-story-world";

const coreMocks = vi.hoisted(() => ({ request: vi.fn(), refresh: vi.fn() }));

vi.mock("@/features/core-integration", async () => {
  const actual = await vi.importActual<typeof import("@/features/core-integration")>(
    "@/features/core-integration",
  );
  return {
    ...actual,
    creatorRequest: coreMocks.request,
    useCreatorIntegration: () => ({
      state: { status: "connected", capabilities: [] },
      refresh: coreMocks.refresh,
    }),
  };
});

const project = {
  schemaVersion: "v5.project.v1",
  projectRef: "project-core-1",
  projectType: "series",
  title: "权威项目",
  description: "来自 Creator Core",
  targetPlatform: "streaming",
  aspectRatio: "16:9",
  defaultDurationSec: 90,
  plannedEpisodeCount: 6,
  status: "active",
  seriesRefs: ["series-core-1"],
  createdAt: "2026-08-17T00:00:00Z",
  updatedAt: "2026-08-17T00:00:00Z",
  version: 1,
};

const series = {
  schemaVersion: "v5.series.v1",
  seriesRef: "series-core-1",
  title: "权威系列",
  description: "来自 Creator Core",
  status: "active",
  plannedEpisodeCount: 6,
  episodes: [],
  createdAt: "2026-08-17T00:00:00Z",
  updatedAt: "2026-08-17T00:00:00Z",
  version: 1,
};

describe("connected Creator workspaces", () => {
  beforeEach(() => {
    coreMocks.request.mockReset();
    coreMocks.refresh.mockReset();
  });

  it("loads M4 and M5 while rendering M6 authority failure as a gate", async () => {
    coreMocks.request.mockImplementation(async (path: string) => {
      if (path === "projects/project-core-1") return { ok: true, project };
      if (path.startsWith("series-planning-workspaces?")) {
        return {
          ok: true,
          workspace: {
            schemaVersion: "creator.series-planning.workspace.v1",
            context: {},
            plan: null,
            versions: [],
          },
        };
      }
      if (path.startsWith("series-intelligence-workspaces?")) {
        throw new CreatorClientError(403, {
          code: "authority_unavailable",
          message: "M6 scope authority is unavailable.",
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<ConnectedStoryWorld projectRef="project-core-1" />);

    expect(
      await screen.findByRole("heading", { name: "权威项目 · 故事世界" }),
    ).toBeInTheDocument();
    expect(screen.getByText("M6 外部权限尚未接入")).toBeInTheDocument();
    expect(screen.getByText("authority_unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成 M5 候选" })).toBeDisabled();
    expect(screen.queryByText(/未来之城|林澈/)).not.toBeInTheDocument();
    expect(coreMocks.request).toHaveBeenCalledWith(
      expect.stringContaining("projectRef=project-core-1&seriesRef=series-core-1"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("requires an exact confirmed creativePlanRef and preserves Core rejection", async () => {
    const user = userEvent.setup();
    coreMocks.request.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (path === "projects/project-core-1") return { ok: true, project };
      if (path === "series/series-core-1") return { ok: true, series };
      if (path === "episodes" && init?.method === "POST") {
        throw new CreatorClientError(409, {
          code: "unconfirmed_creative_plan",
          message: "该创意方案未由 Core 确认。",
        });
      }
      throw new Error(`Unexpected request: ${path}`);
    });

    render(<ConnectedScriptStudio projectRef="project-core-1" />);

    expect(
      await screen.findByRole("heading", { name: "权威项目 · 剧本工作区" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "用已确认导演方案建立首集" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "creativePlanRef" }), "guessed-plan");
    await user.click(screen.getByRole("button", { name: "建立 Episode" }));

    expect(await screen.findByText("该创意方案未由 Core 确认。")).toBeInTheDocument();
    await waitFor(() =>
      expect(coreMocks.request).toHaveBeenCalledWith(
        "episodes",
        expect.objectContaining({
          method: "POST",
          body: expect.objectContaining({
            seriesRef: "series-core-1",
            creativePlanRef: "guessed-plan",
          }),
        }),
      ),
    );
    const episodeCall = coreMocks.request.mock.calls.find(([path]) => path === "episodes");
    expect(episodeCall?.[1]?.body).not.toHaveProperty("workspaceRef");
  });
});
