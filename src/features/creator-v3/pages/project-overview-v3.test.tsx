import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorProject } from "@/features/core-integration";
import { ThemeProvider } from "@/theme";
import { ProjectOverviewV3 } from "./project-overview-v3";

const collection = vi.hoisted(() => ({ state: { status: "loading" } as unknown, refresh: vi.fn() }));
vi.mock("../data", () => ({ useV3ProjectCollection: () => collection }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const project: CreatorProject = {
  schemaVersion: "creator.project.v1",
  projectRef: "private-project-ref",
  projectType: "SERIES",
  title: "北岸计划",
  description: "一部真实 Core 项目",
  targetPlatform: "Streaming",
  aspectRatio: "16:9",
  defaultDurationSec: 60,
  plannedEpisodeCount: 8,
  status: "ACTIVE",
  seriesRefs: ["private-series-ref"],
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-03T00:00:00Z",
  version: 3,
};

function renderPage(projectRef = project.projectRef) {
  return render(<ThemeProvider><ProjectOverviewV3 projectRef={projectRef} /></ThemeProvider>);
}

describe("ProjectOverviewV3", () => {
  beforeEach(() => {
    collection.state = { status: "loading" };
    collection.refresh.mockReset();
  });

  it("renders a found project, exact migration navigation, and four honest blockers", async () => {
    const user = userEvent.setup();
    collection.state = { status: "ready", projects: [project] };
    renderPage();
    expect(screen.getByRole("heading", { name: "北岸计划", level: 1 })).toBeVisible();
    const navigation = screen.getByRole("navigation", { name: "V3 项目导航" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(10);
    expect(within(navigation).getByText("故事").closest("a")).toHaveAttribute("href", "/creator/projects/private-project-ref/planning/bible");
    expect(within(navigation).getByText("剧本").closest("a")).toHaveAttribute("href", "/creator/projects/private-project-ref/content/script");
    expect(within(navigation).getByText("角色").closest("a")).toHaveAttribute("href", "/creator/projects/private-project-ref/planning/characters");
    expect(within(navigation).getByText("审片").closest("a")).toHaveAttribute("href", "/creator/projects/private-project-ref/post");
    expect(within(navigation).getByText("交付").closest("a")).toHaveAttribute("href", "/creator/projects/private-project-ref/delivery");
    for (const id of ["destination-storyboard", "destination-generation", "destination-audio", "destination-timeline"]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    expect(screen.getByRole("link", { name: /查看历史兼容生产记录/ })).toHaveAttribute("href", "/creator/projects/private-project-ref/production");
    expect(screen.getByRole("link", { name: /查看历史兼容生产记录/ })).toHaveTextContent("不是新的 Generation Studio");
    expect(screen.queryByText(project.projectRef)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "查看技术证据" }));
    expect(screen.getByText(project.projectRef)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "收起技术证据" }));
    expect(screen.queryByText(project.projectRef)).not.toBeInTheDocument();
    expect(screen.getAllByText("状态未验证").length).toBeGreaterThanOrEqual(3);
    expect(screen.queryByText(/100%|全部通过|可发布/)).not.toBeInTheDocument();
    expect(screen.queryByText(/排队验证项|运行验证项/)).not.toBeInTheDocument();
  });

  it("distinguishes absent, disconnected, and error states", () => {
    collection.state = { status: "ready", projects: [project] };
    const absent = renderPage("missing-project");
    expect(screen.getByRole("heading", { name: "未找到该项目" })).toBeVisible();
    absent.unmount();

    collection.state = { status: "disconnected", error: { code: "core_disconnected", message: "连接失败" } };
    const disconnected = renderPage();
    expect(screen.getByRole("heading", { name: "Core 未连接" })).toBeVisible();
    disconnected.unmount();

    collection.state = { status: "error", error: { code: "bad_contract", message: "合同错误" } };
    renderPage();
    expect(screen.getByRole("heading", { name: "项目集合无法读取" })).toBeVisible();
    expect(screen.getByText("合同错误")).toBeVisible();
  });
});
