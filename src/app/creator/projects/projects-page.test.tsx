import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "./page";

describe("ProjectsPage", () => {
  it("renders an honest empty project center without authoritative fixtures", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "项目" })).toBeInTheDocument();
    expect(screen.getByText("PROJECT CENTER")).toBeInTheDocument();
    expect(screen.getByText(/尚未连接权威项目数据/)).toBeInTheDocument();
    expect(screen.getByText("项目上下文未连接")).toBeInTheDocument();
  });

  it("offers New Project only at its frozen Project Center route", () => {
    render(<ProjectsPage />);

    expect(screen.getByRole("link", { name: "新建项目" })).toHaveAttribute(
      "href",
      "/creator/projects/new",
    );
    expect(screen.queryByRole("link", { name: "创作中心" })).not.toBeInTheDocument();
  });
});
