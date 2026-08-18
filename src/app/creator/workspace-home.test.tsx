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
    expect(screen.getByRole("heading", { name: "M1–M19 前端映射" })).toBeInTheDocument();

    expect(screen.queryByText(/未来之城|雪落无声|追光者|星际回响/)).not.toBeInTheDocument();
    expect(screen.queryByText(/GB|团队成员|在线|专业版|项目总数/)).not.toBeInTheDocument();
  });

  it("exposes only real reachable task routes", () => {
    renderWorkspace();

    for (const link of screen.getAllByRole("link", { name: /开始新项目|新建制作项目/ })) {
      expect(link).toHaveAttribute("href", "/creator/projects/new");
    }
    expect(screen.getByRole("link", { name: "进入 AI 导演" })).toHaveAttribute(
      "href",
      "/creator/ai-director",
    );
    for (const link of screen.getAllByRole("link", { name: /打开项目中心|选择项目与集数/ })) {
      expect(link).toHaveAttribute("href", "/creator/projects");
    }
    expect(screen.queryByRole("link", { name: /资产库|作品|创作中心/ })).not.toBeInTheDocument();
  });

  it("keeps unverified production stages informative and non-interactive", () => {
    renderWorkspace();

    expect(screen.getByText("M7–M9 镜头图与资产解析")).toBeInTheDocument();
    expect(screen.getByText("M10–M15 媒体生产、合成与交付")).toBeInTheDocument();
    expect(screen.getByText("M16–M19 批量生产与商业化")).toBeInTheDocument();
    expect(screen.getAllByText("待核对").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /M7–M19|M10–M15|M16–M19/ })).not.toBeInTheDocument();
  });
});
