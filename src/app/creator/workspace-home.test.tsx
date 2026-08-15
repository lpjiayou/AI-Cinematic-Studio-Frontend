import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "@/theme";
import { WorkspaceHomePage } from "./workspace-home";

function renderWorkspace() {
  return render(
    <ThemeProvider>
      <WorkspaceHomePage />
    </ThemeProvider>,
  );
}

describe("WorkspaceHomePage", () => {
  it("renders a truthful task launchpad without fictional operational data", () => {
    renderWorkspace();

    expect(
      screen.getByRole("heading", { level: 1, name: "从明确任务开始创作" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "现在可以完成的工作" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "数据与能力边界" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "制作路径" })).toBeInTheDocument();

    expect(screen.queryByText(/未来之城|雪落无声|追光者|星际回响/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GB|团队成员|在线|专业版|项目总数/)).not.toBeInTheDocument();
  });

  it("exposes only real reachable task routes", () => {
    renderWorkspace();

    for (const link of screen.getAllByRole("link", { name: "新建本地方案" })) {
      expect(link).toHaveAttribute("href", "/creator/projects/new");
    }
    expect(screen.getByRole("link", { name: "进入 AI 导演" })).toHaveAttribute(
      "href",
      "/creator/ai-director",
    );
    expect(screen.getByRole("link", { name: "打开项目中心" })).toHaveAttribute(
      "href",
      "/creator/projects",
    );
    expect(screen.getByRole("link", { name: "打开剧本工作室" })).toHaveAttribute(
      "href",
      "/script-studio",
    );
    expect(screen.queryByRole("link", { name: /资产库|作品|创作中心/ })).not.toBeInTheDocument();
  });

  it("keeps unavailable production stages informative and non-interactive", () => {
    renderWorkspace();

    expect(screen.getByText("分镜、资产与渲染")).toBeInTheDocument();
    expect(screen.getByText("尚未开放")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /分镜、资产与渲染/ })).not.toBeInTheDocument();
  });
});
