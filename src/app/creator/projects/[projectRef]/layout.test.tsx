import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProjectContextLayout from "./layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/creator/projects/future-city/planning/bible",
}));

describe("ProjectContextLayout", () => {
  it("renders a plain-language local project bar before route content", async () => {
    render(
      await ProjectContextLayout({
        children: <section aria-label="Project route content">Project child</section>,
        params: Promise.resolve({ projectRef: "future-city" }),
      }),
    );

    expect(screen.getByRole("region", { name: "项目上下文" })).toBeInTheDocument();
    expect(screen.getByText("本地演示")).toBeInTheDocument();
    expect(screen.getByText("非权威演示数据")).toBeInTheDocument();
    expect(screen.getByText("当前项目")).toBeInTheDocument();
    expect(screen.getByText("未来之城")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Project route content" })).toHaveTextContent(
      "Project child",
    );
  });

  it("does not expose empty technical context dimensions", async () => {
    render(
      await ProjectContextLayout({
        children: <div>Project child</div>,
        params: Promise.resolve({ projectRef: "future-city" }),
      }),
    );

    for (const label of ["单集", "阶段", "对象", "版本", "本地工作区键", "future-city"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/Ref|示例项目|演示项目/)).not.toBeInTheDocument();
  });

  it("shows the current project name and links only implemented planning pages", async () => {
    render(
      await ProjectContextLayout({
        children: <div>Project child</div>,
        params: Promise.resolve({ projectRef: "future-city" }),
      }),
    );

    expect(screen.getByText("当前项目")).toBeInTheDocument();
    expect(screen.getByText("未来之城")).toBeInTheDocument();
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
