import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("renders the frozen Workspace Home experience with approved mock projects", () => {
    renderWorkspace();

    expect(
      screen.getByRole("heading", { level: 1, name: "欢迎回来，张导" }),
    ).toBeInTheDocument();
    expect(screen.getByText("CREATOR WORKSPACE")).toBeInTheDocument();
    expect(screen.getByText("镜构智能创作云，让每一次创作都更有想象力")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "快速开始" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI 助理 · 镜构小构" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "最近项目" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "制作进度总览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "项目状态时间线" })).toBeInTheDocument();

    for (const project of ["未来之城", "雪落无声", "追光者", "星际回响"]) {
      expect(screen.getByRole("heading", { name: project })).toBeInTheDocument();
    }

    expect(screen.getAllByRole("progressbar")).toHaveLength(4);
    expect(screen.queryByText(/GPU|Queue ID|Provider|Hash|Ref/)).not.toBeInTheDocument();
  });

  it("keeps guided actions local without rendering page-owned shell controls", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(screen.queryByRole("button", { name: /切换至.*模式/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "工作台主要导航" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /新建项目/ })[0]);
    expect(await screen.findByRole("dialog", { name: "新建项目" })).toBeInTheDocument();
  });

  it("moves an AI suggestion into the compact assistant input without submitting", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "帮我分析剧本的情绪曲线" }));

    expect(screen.getByRole("textbox", { name: "输入创意或制作需求" })).toHaveValue(
      "帮我分析剧本的情绪曲线",
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
