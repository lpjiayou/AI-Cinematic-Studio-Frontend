import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectContextLayout from "./layout";

describe("ProjectContextLayout", () => {
  it("renders the complete Context-null bar before route content", () => {
    render(
      <ProjectContextLayout>
        <section aria-label="Project route content">Project child</section>
      </ProjectContextLayout>,
    );

    expect(screen.getByRole("region", { name: "项目上下文" })).toBeInTheDocument();
    expect(screen.getByText("未连接可信上下文")).toBeInTheDocument();
    expect(screen.getAllByText("未连接")).toHaveLength(6);
    expect(screen.getByRole("region", { name: "Project route content" })).toHaveTextContent(
      "Project child",
    );
  });

  it("keeps every project context dimension explicitly empty", () => {
    render(
      <ProjectContextLayout>
        <div>Project child</div>
      </ProjectContextLayout>,
    );

    for (const label of ["项目", "系列", "单集", "阶段", "对象", "版本"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.queryByText(/Ref|示例项目|演示项目/)).not.toBeInTheDocument();
  });
});
