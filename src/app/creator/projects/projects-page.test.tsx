import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "./page";

describe("ProjectsPage", () => {
  it("renders an actionable disconnected project browser", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "项目" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "项目数据源" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "正在核对权威项目集合" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Frontend Experience Adapter/)).toBeInTheDocument();
    expect(screen.getAllByText("未连接").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "可浏览的本地演示工作区" })).toBeInTheDocument();
    expect(screen.getAllByText("非权威项目")).toHaveLength(2);
  });

  it("offers only valid next actions", () => {
    render(<ProjectsPage />);

    for (const link of screen.getAllByRole("link", { name: /新建项目|建立本地创意方案/ })) {
      expect(link).toHaveAttribute("href", "/creator/projects/new");
    }
    expect(screen.getByRole("link", { name: "返回创作入口" })).toHaveAttribute(
      "href",
      "/creator",
    );
    expect(screen.queryByRole("link", { name: "创作中心" })).not.toBeInTheDocument();
  });

  it("links each local fixture to its real story and character workspaces", () => {
    render(<ProjectsPage />);

    expect(screen.getAllByRole("link", { name: "打开故事世界" }).map((link) => link.getAttribute("href"))).toEqual([
      "/creator/projects/future-city/planning/bible",
      "/creator/projects/amber-archive/planning/bible",
    ]);
    expect(screen.getAllByRole("link", { name: "打开角色工作室" }).map((link) => link.getAttribute("href"))).toEqual([
      "/creator/projects/future-city/planning/characters",
      "/creator/projects/amber-archive/planning/characters",
    ]);
  });
});
