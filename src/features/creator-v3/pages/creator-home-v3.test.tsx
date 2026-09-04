import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorProject } from "@/features/core-integration";
import { ThemeProvider } from "@/theme";
import { CreatorHomeV3 } from "./creator-home-v3";

const collection = vi.hoisted(() => ({ state: { status: "loading" } as unknown, refresh: vi.fn() }));
vi.mock("../data", () => ({ useV3ProjectCollection: () => collection }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function project(index: number): CreatorProject {
  return {
    schemaVersion: "creator.project.v1",
    projectRef: `private-project-${index}`,
    projectType: "SERIES",
    title: `真实项目 ${index}`,
    description: `项目说明 ${index}`,
    targetPlatform: "Streaming",
    aspectRatio: "16:9",
    defaultDurationSec: 60,
    plannedEpisodeCount: 8,
    status: index === 4 ? "UNKNOWN_STATE" : "ACTIVE",
    seriesRefs: [],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: `2026-09-0${index}T00:00:00Z`,
    version: index,
  };
}

function renderPage() {
  return render(<ThemeProvider><CreatorHomeV3 /></ThemeProvider>);
}

describe("CreatorHomeV3", () => {
  beforeEach(() => {
    collection.state = { status: "loading" };
    collection.refresh.mockReset();
  });

  it("shows two honest creation modes and at most three real projects", () => {
    collection.state = { status: "ready", projects: [project(4), project(3), project(2), project(1)] };
    renderPage();
    expect(screen.getByRole("heading", { name: "创作首页", level: 1 })).toBeVisible();
    expect(screen.getByRole("heading", { name: "项目制作" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "快速创作" })).toBeVisible();
    expect(screen.getByText("受限")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "继续项目" })).toHaveLength(3);
    expect(screen.queryByText("真实项目 1")).not.toBeInTheDocument();
    expect(screen.queryByText(/private-project-/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "打开 AI 导演" })).toHaveAttribute("href", "/creator/ai-director");
    expect(screen.getAllByText("状态未验证").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/M1–M19/)).not.toBeInTheDocument();
  });

  it("distinguishes empty and disconnected collection states without fixtures", () => {
    collection.state = { status: "empty" };
    const empty = renderPage();
    expect(screen.getByRole("heading", { name: "还没有已保存的项目" })).toBeVisible();
    empty.unmount();

    collection.state = { status: "disconnected", error: { code: "core_disconnected", message: "连接失败" } };
    renderPage();
    expect(screen.getByRole("heading", { name: "暂时无法读取 Creator Core" })).toBeVisible();
    expect(screen.getByRole("button", { name: "重新连接" })).toBeVisible();
    expect(screen.queryByText(/LOCAL_FIXTURE/)).not.toBeInTheDocument();
  });
});
