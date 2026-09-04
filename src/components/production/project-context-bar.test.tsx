import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectContextBar } from "./project-context-bar";

describe("ProjectContextBar", () => {
  it("renders user-readable project, context, version and readiness", () => {
    render(
      <ProjectContextBar
        projectTitle="V3 Shell 验证项目"
        seriesLabel="测试系列"
        episodeLabel="EP-TEST"
        versionLabel="工作版本"
        versionStateText="草稿"
        readinessSummary="运行时尚未开放"
        readinessState="blocked"
        navigationTrigger={<button type="button" aria-label="打开项目导航">导航</button>}
        inspectorTrigger={<button type="button" aria-label="打开检查器">检查</button>}
        evidenceTrigger={<button type="button" aria-label="查看技术证据">证据</button>}
        jobTrigger={<button type="button" aria-label="查看任务">任务</button>}
        contextLabel="项目上下文"
      />,
    );

    expect(screen.getByRole("region", { name: "项目上下文" })).toHaveTextContent("V3 Shell 验证项目");
    expect(screen.getByText("测试系列 / EP-TEST")).toBeVisible();
    expect(screen.getByText("草稿")).toBeVisible();
    expect(screen.getByText("运行时尚未开放")).toBeVisible();
    expect(screen.getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "打开项目导航", "打开检查器", "查看技术证据", "查看任务",
    ]);
    expect(document.body).not.toHaveTextContent("workspaceRef");
  });

  it("renders explicit empty context instead of a fabricated project", () => {
    render(
      <ProjectContextBar
        projectTitle=""
        versionLabel="版本"
        versionStateText=""
        readinessSummary=""
        readinessState="unverified"
        contextLabel="项目上下文"
      />,
    );
    expect(screen.getByText("未选择项目")).toBeVisible();
    expect(screen.getByText("Series / Episode 未设置")).toBeVisible();
    expect(screen.getByText("版本状态未验证")).toBeVisible();
    expect(screen.getByText("尚未验证")).toBeVisible();
  });
});
