import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/theme";
import { CreateProjectPage } from "./create-project";

function renderCreateProject() {
  return render(
    <ThemeProvider>
      <CreateProjectPage />
    </ThemeProvider>,
  );
}

describe("CreateProjectPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
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
    expect(screen.getByRole("status")).toHaveTextContent("尚未保存为正式项目");
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
