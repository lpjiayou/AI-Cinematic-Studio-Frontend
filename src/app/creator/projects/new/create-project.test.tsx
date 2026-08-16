import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { CreateProjectPage } from "./create-project";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  request: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/features/core-integration", async () => {
  const actual = await vi.importActual<typeof import("@/features/core-integration")>(
    "@/features/core-integration",
  );
  return {
    ...actual,
    creatorRequest: mocks.request,
    useCreatorIntegration: () => ({
      state: { status: "connected", capabilities: [] },
      refresh: mocks.refresh,
    }),
  };
});

function renderCreateProject(creativePlanRef?: string) {
  return render(
    <ThemeProvider>
      <CreateProjectPage creativePlanRef={creativePlanRef} />
    </ThemeProvider>,
  );
}

describe("CreateProjectPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
    mocks.push.mockReset();
    mocks.request.mockReset();
    mocks.refresh.mockReset();
  });

  it("renders the complete creative launch experience", () => {
    renderCreateProject();

    expect(
      screen.getByRole("heading", { level: 1, name: "让一个创意，成为一部电影" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创意简报" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创意方向检查" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "故事方向" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "人物方向" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "视觉方向" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "制作建议" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创作摘要" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认本地导演方案预览" })).toBeDisabled();

    expect(screen.queryByText(/Provider|Queue ID|GPU|projectRef|seriesRef|episodeRef/)).not.toBeInTheDocument();
  });

  it("associates the creative idea label and description with its textarea", () => {
    renderCreateProject();

    const ideaInput = screen.getByRole("textbox", { name: "你的创意" });
    expect(ideaInput).toHaveAttribute("aria-describedby", "creative-idea-description");
    expect(document.getElementById("creative-idea-description")).toHaveTextContent(
      "至少输入 20 个字符",
    );
  });

  it("supports roving arrow focus and explicit keyboard selection", async () => {
    const user = userEvent.setup();
    renderCreateProject();

    const scienceFiction = screen.getByRole("button", { name: /科幻影片/ });
    const commercial = screen.getByRole("button", { name: /品牌影片/ });

    expect(scienceFiction).toHaveAttribute("type", "button");
    expect(scienceFiction).toHaveAttribute("aria-pressed", "true");

    scienceFiction.focus();
    await user.keyboard("{ArrowRight}");
    expect(commercial).toHaveFocus();
    expect(commercial).toHaveAttribute("aria-pressed", "false");

    await user.keyboard("{Enter}");
    expect(commercial).toHaveAttribute("aria-pressed", "true");

    const animation = screen.getByRole("button", { name: /动画短片/ });
    await user.keyboard("{ArrowRight}");
    expect(animation).toHaveFocus();
    await user.keyboard(" ");
    expect(animation).toHaveAttribute("aria-pressed", "true");
  });

  it("creates only the local Director-Ready Preview State", async () => {
    const user = userEvent.setup();
    renderCreateProject();

    await user.type(
      screen.getByRole("textbox", { name: "你的创意" }),
      "一位仿生人在未来城市寻找失落的记忆，并决定公开创造者留下的真相。",
    );
    await user.click(screen.getByRole("button", { name: "确认本地导演方案预览" }));

    expect(screen.getAllByText("本地预览已确认").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("status").some((item) => item.textContent?.includes("尚未保存为正式项目"))).toBe(true);
  });

  it("shows the four-step contract and exposes only explicit real next routes", async () => {
    const user = userEvent.setup();
    renderCreateProject();

    const workflow = screen.getByRole("list", { name: "本地创意方案流程" });
    expect(within(workflow).getAllByRole("listitem")).toHaveLength(4);
    expect(within(workflow).getByText("选择下一工作区")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "你的创意" }),
      "一位档案修复师在未来城市发现一段无人认领的记忆，并决定寻找它真正的主人。",
    );
    await user.click(screen.getByRole("button", { name: "确认本地导演方案预览" }));

    expect(screen.getByRole("heading", { name: "保存为真实制作项目" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "先去完善导演简报" })).toHaveAttribute("href", "/creator/ai-director");
    expect(screen.getByText(/先建立系列承载身份/)).toBeInTheDocument();
  });

  it("commits series, project, and first episode through the public adapter contract", async () => {
    const user = userEvent.setup();
    mocks.request
      .mockResolvedValueOnce({ ok: true, series: { seriesRef: "series-core-1" } })
      .mockResolvedValueOnce({ ok: true, project: { projectRef: "project-core-1" } })
      .mockResolvedValueOnce({ ok: true, episode: { episodeRef: "episode-core-1" } });
    renderCreateProject("creative-plan-core-1");

    await user.type(
      screen.getByRole("textbox", { name: "你的创意" }),
      "一位档案修复师在未来城市发现一段无人认领的记忆，并决定寻找它真正的主人。",
    );
    await user.click(screen.getByRole("button", { name: "确认本地导演方案预览" }));
    await user.type(screen.getByRole("textbox", { name: "项目名称" }), "记忆之城");
    await user.click(screen.getByRole("button", { name: "创建并进入项目" }));

    await waitFor(() => expect(mocks.request).toHaveBeenCalledTimes(3));
    expect(mocks.request.mock.calls.map(([path]) => path)).toEqual([
      "series",
      "projects",
      "episodes",
    ]);
    expect(mocks.request.mock.calls[2]?.[1]?.body).toMatchObject({
      seriesRef: "series-core-1",
      creativePlanRef: "creative-plan-core-1",
      episodeNumber: 1,
    });
    expect(mocks.push).toHaveBeenCalledWith(
      "/creator/projects/project-core-1/content/script",
    );
  });

  it("keeps preview theme reads without rendering a page-owned theme control", async () => {
    window.localStorage.setItem("acs-theme", "light");
    renderCreateProject();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(screen.queryByRole("button", { name: /切换至.*模式/ })).not.toBeInTheDocument();
    expect(
      screen.getByAltText("明亮专业的AI影视创作工作室中摆放摄影机与视觉设计屏幕"),
    ).toBeInTheDocument();
  });
});
