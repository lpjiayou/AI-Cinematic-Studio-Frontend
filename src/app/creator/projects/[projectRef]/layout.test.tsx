import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectContextLayout from "./layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/creator/projects/future-city/planning/bible",
}));

describe("ProjectContextLayout", () => {
  it("renders the compact Context-null bar before route content", async () => {
    render(
      await ProjectContextLayout({
        children: <section aria-label="Project route content">Project child</section>,
        params: Promise.resolve({ projectRef: "future-city" }),
      }),
    );

    expect(screen.getByRole("region", { name: "项目上下文" })).toBeInTheDocument();
    expect(screen.getByText("本地演示")).toBeInTheDocument();
    expect(screen.getByText("非权威项目数据")).toBeInTheDocument();
    expect(screen.getAllByText("未连接")).toHaveLength(6);
    expect(screen.getByRole("region", { name: "Project route content" })).toHaveTextContent(
      "Project child",
    );
  });

  it("keeps every project context dimension explicitly empty", async () => {
    render(
      await ProjectContextLayout({
        children: <div>Project child</div>,
        params: Promise.resolve({ projectRef: "future-city" }),
      }),
    );

    for (const label of ["项目", "系列", "单集", "阶段", "对象", "版本"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Ref|示例项目|演示项目/)).not.toBeInTheDocument();
  });

  it("separates the local workspace key from empty authoritative context and links only implemented planning pages", async () => {
    render(
      await ProjectContextLayout({
        children: <div>Project child</div>,
        params: Promise.resolve({ projectRef: "future-city" }),
      }),
    );

    expect(screen.getByText("本地工作区键")).toBeInTheDocument();
    expect(screen.getByText("future-city")).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "项目策划导航" });
    expect(navigation.querySelectorAll("a")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "故事世界" })).toHaveAttribute(
      "href",
      "/creator/projects/future-city/planning/bible",
    );
    expect(screen.getByRole("link", { name: "角色工作室" })).toHaveAttribute(
      "href",
      "/creator/projects/future-city/planning/characters",
    );
    expect(navigation.querySelectorAll("[aria-disabled='true']")).toHaveLength(3);
    expect(screen.getByText("身份、外观与连续性")).toBeInTheDocument();
  });
});
