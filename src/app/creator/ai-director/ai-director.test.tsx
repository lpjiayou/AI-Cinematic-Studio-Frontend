import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import {
  AIDirectorPage,
  DirectorSelector,
  type SelectorOption,
} from "./ai-director";

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

const directorCandidate = {
  schemaVersion: "creator.ai-director.plan.v1",
  creativeInterpretation: {
    logline: "记忆修复师在永夜城追查一段被抹去的真相。",
    coreTheme: "记忆与责任",
    targetEmotion: "希望",
    narrativeArc: "逃避到承担",
  },
  storyDirection: {
    title: "记忆之城",
    synopsis: "林澈修复城市档案，也重新选择自己的身份。",
    keyBeats: ["发现异常", "追查来源", "公开真相"],
  },
  scriptDraft: {
    opening: "永夜城市。",
    development: "林澈开始追查。",
    climax: "档案被公开。",
    ending: "城市重新记起。",
    captionsOrDialogue: ["记住，才有选择。"],
  },
  storyboardPlan: [{
    shotNo: 1,
    durationSec: 10,
    shotSize: "全景",
    cameraMovement: "推进",
    visualDescription: "永夜城市",
    narrativePurpose: "建立世界",
  }],
  visualStyle: {
    lighting: "冷色环境与暖色人物光",
    palette: "深蓝与琥珀",
    composition: "纵深构图",
    atmosphere: "克制",
    continuityRules: ["林澈服装保持一致"],
  },
  productionPlan: {
    shotCount: 1,
    characters: ["林澈"],
    scenes: ["档案城"],
    visualAssets: ["城市参考"],
    audioNeeds: ["低频环境声"],
    productionNotes: ["所有结果需人工确认"],
  },
} as const;

function renderDirectorPage() {
  return render(
    <ThemeProvider>
      <AIDirectorPage />
    </ThemeProvider>,
  );
}

describe("AIDirectorPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
    coreMocks.request.mockReset();
    coreMocks.refresh.mockReset();
  });

  it("renders the complete director-room experience", () => {
    renderDirectorPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "建立可执行的导演简报" }),
    ).toBeInTheDocument();
    expect(screen.getByText("AI DIRECTOR STUDIO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创作方向" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "导演输入检查" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "故事分析" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "主题分析" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "角色方向" })).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "视觉语言" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "制作策略" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "导演方案" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成 Core 导演候选" })).toBeDisabled();

    expect(
      screen.getByAltText(
        "深色电影导演工作空间中展示分镜规划、电影监视器和摄影设备的 AI 影视制作场景",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "导演简报结构、角色方向、色彩和镜头语言的静态规划示意图",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Provider|Queue ID|GPU|projectRef|seriesRef|episodeRef|Job ID/),
    ).not.toBeInTheDocument();
  });

  it("associates the story-intent label, help, limit and validation copy", async () => {
    const user = userEvent.setup();
    renderDirectorPage();

    const input = screen.getByRole("textbox", {
      name: "你希望观众感受到什么？",
    });
    expect(input).toHaveAttribute("aria-describedby", "director-story-intent-help");
    expect(input).toHaveAttribute("maxlength", "600");

    await user.clear(input);
    await user.type(input, "孤独与希望");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "director-story-intent-help director-story-intent-error",
    );
    expect(screen.getByText(/至少需要 20 个字符/)).toBeInTheDocument();
  });

  it("supports roving focus, wrap, Home, End, Enter and Space selection", async () => {
    const user = userEvent.setup();
    renderDirectorPage();

    const group = screen.getByRole("group", { name: "目标观众" });
    const general = within(group).getByRole("button", { name: /大众观众/ });
    const young = within(group).getByRole("button", { name: /年轻用户/ });
    const professional = within(group).getByRole("button", { name: /专业行业观众/ });

    expect(general).toHaveAttribute("type", "button");
    expect(general).toHaveAttribute("aria-pressed", "true");
    expect(general).toHaveAttribute("tabindex", "0");

    general.focus();
    await user.keyboard("{ArrowLeft}");
    expect(professional).toHaveFocus();

    await user.keyboard("{Home}");
    expect(general).toHaveFocus();

    await user.keyboard("{ArrowRight}{Enter}");
    expect(young).toHaveFocus();
    expect(young).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{End} ");
    expect(professional).toHaveFocus();
    expect(professional).toHaveAttribute("aria-pressed", "true");
  });

  it("skips disabled selector options during keyboard navigation", async () => {
    const user = userEvent.setup();
    const options = [
      { value: "first", label: "第一项" },
      { value: "disabled", label: "不可用项", disabled: true },
      { value: "last", label: "最后一项" },
    ] as const satisfies readonly SelectorOption<"first" | "disabled" | "last">[];
    const onChange = vi.fn();

    render(
      <div>
        <h2 id="selector-test-label">测试选项</h2>
        <DirectorSelector
          groupLabelId="selector-test-label"
          onChange={onChange}
          options={options}
          value="first"
        />
      </div>,
    );

    const first = screen.getByRole("button", { name: "第一项" });
    const disabled = screen.getByRole("button", { name: "不可用项" });
    const last = screen.getByRole("button", { name: "最后一项" });

    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute("tabindex", "-1");
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(last).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("last");
  });

  it("reveals a semantic local input for custom reference style", async () => {
    const user = userEvent.setup();
    renderDirectorPage();

    await user.click(screen.getByRole("button", { name: /自定义参考/ }));

    const customInput = screen.getByRole("textbox", { name: "自定义参考方向" });
    expect(customInput).toHaveAttribute(
      "aria-describedby",
      "director-custom-reference-help",
    );
    expect(screen.getByRole("button", { name: "生成 Core 导演候选" })).toBeDisabled();
  });

  it("keeps local input checking separate from Core generation", async () => {
    const user = userEvent.setup();
    renderDirectorPage();

    await user.click(screen.getByRole("button", { name: "使用示例摘要" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "重新检查输入" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "重新检查输入" }));

    expect(screen.getAllByText("正在检查当前输入")).toHaveLength(2);
    expect(screen.getByText(
      "正在重新检查故事意图、观众、情绪和参考风格。",
    )).toBeInTheDocument();
    await waitFor(
      () => expect(screen.queryAllByText("正在检查当前输入")).toHaveLength(0),
      { timeout: 1200 },
    );
  });

  it("generates a Core candidate and requires explicit confirmation before saving", async () => {
    const user = userEvent.setup();
    coreMocks.request
      .mockResolvedValueOnce({
        ok: true,
        kind: "candidate-creative-plan",
        confirmationRequired: true,
        sourcePlanRef: "source-plan-core-1",
        sourcePlanVersion: 1,
        plan: directorCandidate,
      })
      .mockResolvedValueOnce({
        ok: true,
        confirmedPlan: {
          creativePlanRef: "creative-plan-core-1",
          sourcePlanRef: "source-plan-core-1",
          sourcePlanSchemaVersion: "creator.ai-director.plan.v1",
          sourcePlanVersion: 1,
          humanConfirmed: true,
        },
      });
    renderDirectorPage();

    await user.click(screen.getByRole("button", { name: "使用示例摘要" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "生成 Core 导演候选" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "生成 Core 导演候选" }));
    expect(await screen.findByRole("heading", { name: "记忆之城" })).toBeInTheDocument();
    expect(screen.getByText("待人工确认")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "人工确认并保存方案" }));

    expect(
      await screen.findByRole("dialog", { name: "导演方案已保存" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("权威方案已确认").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/creative-plan-core-1/).length).toBeGreaterThan(0);
    expect(screen.getByText(/不会由本页隐式生成/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "用当前方案创建项目" })).toHaveAttribute(
      "href",
      "/creator/projects/new?creativePlanRef=creative-plan-core-1",
    );
    expect(screen.getByRole("link", { name: "前往项目中心" })).toHaveAttribute("href", "/creator/projects");
    expect(coreMocks.request).toHaveBeenCalledTimes(2);
    expect(coreMocks.request.mock.calls[1]?.[1]?.body).toMatchObject({
      sourcePlanRef: "source-plan-core-1",
      sourcePlanVersion: 1,
      humanConfirmed: true,
    });
  });

  it("keeps body theme reads without rendering page-owned shell controls", async () => {
    window.localStorage.setItem("acs-theme", "light");
    renderDirectorPage();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(screen.queryByRole("button", { name: /切换至.*模式/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "返回创建页" })).not.toBeInTheDocument();
    expect(
      screen.getByAltText(
        "明亮现代的 AI 电影导演工作室中展示摄影机、分镜规划屏幕和创作桌面",
      ),
    ).toBeInTheDocument();
  });
});
