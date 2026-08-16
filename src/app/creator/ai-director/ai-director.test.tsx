import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import {
  AIDirectorPage,
  DirectorSelector,
  type SelectorOption,
} from "./ai-director";

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
    expect(screen.getByRole("button", { name: "确认本地导演方案" })).toBeDisabled();

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
    expect(screen.getByRole("button", { name: "确认本地导演方案" })).toBeDisabled();
  });

  it("uses only local presentation state while reorganizing analysis", async () => {
    const user = userEvent.setup();
    renderDirectorPage();

    await user.click(screen.getByRole("button", { name: "使用示例摘要" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "重新检查输入" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "重新检查输入" }));

    expect(screen.getByRole("status")).toHaveTextContent("正在检查当前输入");
    expect(screen.getByRole("status")).toHaveTextContent(
      "正在重新检查故事意图、观众、情绪和参考风格。",
    );
    await waitFor(
      () => expect(screen.queryByRole("status")).not.toBeInTheDocument(),
      { timeout: 1200 },
    );
  });

  it("confirms only the local director-plan preview and shows the guided next step", async () => {
    const user = userEvent.setup();
    renderDirectorPage();

    await user.click(screen.getByRole("button", { name: "使用示例摘要" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "确认本地导演方案" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "确认本地导演方案" }));

    expect(
      await screen.findByRole("dialog", { name: "导演方案预览已确认" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("本地预览已确认").length).toBeGreaterThan(0);
    expect(screen.getByText(/不会自动带入故事世界/)).toBeInTheDocument();
    expect(screen.getByText(/不会创建正式项目/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回本地创意方案" })).toHaveAttribute("href", "/creator/projects/new");
    expect(screen.getByRole("link", { name: "前往项目中心" })).toHaveAttribute("href", "/creator/projects");
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
