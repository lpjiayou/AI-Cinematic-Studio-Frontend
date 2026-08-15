import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "./page";

describe("ProjectsPage", () => {
  it("renders an actionable disconnected project browser", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "项目" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "项目数据源" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "还没有可显示的权威项目" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/这不代表项目数量为零/)).toBeInTheDocument();
    expect(screen.getByText("未连接")).toBeInTheDocument();
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
});
