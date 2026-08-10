import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/theme";
import { CustomerLandingPage } from "./landing-page";

describe("CustomerLandingPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("renders the complete static customer experience", () => {
    render(
      <ThemeProvider>
        <CustomerLandingPage />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "让一个人拥有完整的 AI 影视制作团队",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "主要导航" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "AI 影视生产流程" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "制作能力" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "创意作品" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "未来城市夜晚的电影片场，AI 角色正在等待下一组镜头",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Scene")).toBeInTheDocument();
    expect(screen.getByText("雨夜未来城")).toBeInTheDocument();
    expect(screen.getByText("Character")).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Render")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("从一句创意生成导演方案。")).toBeInTheDocument();
    expect(
      screen.getByText("让创意、叙事与视觉从第一步就保持一致。"),
    ).toBeInTheDocument();
    expect(screen.getByText("自动将剧本转换为电影分镜。")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "晚灯" })).toBeInTheDocument();
    expect(screen.getByText("AI 情绪短剧")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "让企业拥有完整的 AI 影视制作团队。" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入 AI Cinematic Studio" })).toBeInTheDocument();
  });

  it("switches and persists the ACS theme", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <CustomerLandingPage />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "切换至浅色模式" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(window.localStorage.getItem("acs-theme")).toBe("light");
    });
    expect(screen.getByRole("button", { name: "切换至深色模式" })).toBeInTheDocument();
  });
});
