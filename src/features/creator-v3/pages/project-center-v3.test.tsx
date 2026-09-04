import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorProject } from "@/features/core-integration";
import { ThemeProvider } from "@/theme";
import { ProjectCenterV3 } from "./project-center-v3";

const collection = vi.hoisted(() => ({ state: { status: "loading" } as unknown, refresh: vi.fn() }));
vi.mock("../data", () => ({ useV3ProjectCollection: () => collection }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function project(projectRef: string, title: string, status: string, projectType: string): CreatorProject {
  return {
    schemaVersion: "creator.project.v1",
    projectRef,
    projectType,
    title,
    description: `${title} 说明`,
    targetPlatform: "Streaming",
    aspectRatio: "16:9",
    defaultDurationSec: 60,
    plannedEpisodeCount: 8,
    status,
    seriesRefs: [],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-03T00:00:00Z",
    version: 2,
  };
}

function renderPage() {
  return render(<ThemeProvider><ProjectCenterV3 /></ThemeProvider>);
}

describe("ProjectCenterV3", () => {
  beforeEach(() => {
    collection.state = { status: "loading" };
  });

  it("renders only real Core projects and opens their overview", () => {
    collection.state = {
      status: "ready",
      projects: [
        project("private-a", "北岸计划", "ACTIVE", "SERIES"),
        project("private-b", "远山短片", "UNRECOGNIZED", "SHORT_FILM"),
      ],
    };
    renderPage();
    expect(screen.getByText("Creator Core 项目集合")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "打开项目" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "打开项目" })[0]).toHaveAttribute("href", "/creator/projects/private-a/overview");
    expect(screen.getAllByText("状态未验证").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/private-a|private-b|LOCAL_FIXTURE/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "新建项目" })).toHaveLength(1);
  });

  it("filters only the loaded collection and distinguishes no results", async () => {
    const user = userEvent.setup();
    collection.state = {
      status: "ready",
      projects: [
        project("private-a", "北岸计划", "ACTIVE", "SERIES"),
        project("private-b", "远山短片", "DRAFT", "SHORT_FILM"),
      ],
    };
    renderPage();
    await user.type(screen.getByRole("textbox", { name: "搜索当前集合" }), "不存在");
    expect(screen.getByRole("heading", { name: "当前筛选没有匹配项目" })).toBeVisible();
    await user.clear(screen.getByRole("textbox", { name: "搜索当前集合" }));
    expect(screen.getByText("北岸计划")).toBeVisible();
    await user.selectOptions(screen.getByRole("combobox", { name: "状态" }), "DRAFT");
    expect(screen.queryByText("北岸计划")).not.toBeInTheDocument();
    expect(screen.getByText("远山短片")).toBeVisible();
    expect(screen.getByText("筛选作用于当前已加载项目")).toBeVisible();
  });

  it.each([
    [{ status: "empty" }, "尚无项目"],
    [{ status: "disconnected", error: { code: "core_disconnected", message: "断开" } }, "Core 未连接"],
    [{ status: "error", error: { code: "bad_contract", message: "错误" } }, "项目集合无法读取"],
  ])("keeps collection state %# distinct", (state, heading) => {
    collection.state = state;
    renderPage();
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
  });
});
