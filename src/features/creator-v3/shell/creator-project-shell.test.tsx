import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthorityLayerView, EvidenceFieldView } from "@/components";
import type { CreatorProject } from "@/features/core-integration";
import { ThemeProvider } from "@/theme";
import { CreatorProjectShell } from "./creator-project-shell";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

const project: CreatorProject = {
  schemaVersion: "creator.project.v1",
  projectRef: "project / one",
  projectType: "SERIES",
  title: "北岸计划",
  description: "Project description",
  targetPlatform: "Streaming",
  aspectRatio: "16:9",
  defaultDurationSec: 60,
  plannedEpisodeCount: 8,
  status: "ACTIVE",
  seriesRefs: ["series-one"],
  createdAt: "2026-09-01T00:00:00Z",
  updatedAt: "2026-09-03T00:00:00Z",
  version: 3,
};

const layers: readonly AuthorityLayerView[] = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "页面可用" },
  { id: "runtime", label: "运行时", state: "unverified", stateLabel: "尚未核验", message: "未执行" },
  { id: "authority", label: "授权", state: "unverified", stateLabel: "尚未核验", message: "未读取" },
  { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "未读取" },
];

const fields: readonly EvidenceFieldView[] = [
  { id: "project-ref", label: "项目引用", value: project.projectRef, sensitivity: "restricted", copyAllowed: true },
];

function renderShell(onRequestNavigation?: (href: string, trigger: HTMLElement | null) => void) {
  return render(
    <ThemeProvider>
      <CreatorProjectShell
        project={project}
        projectRef={project.projectRef}
        activeDestinationId="overview"
        primaryCanvas={<h1>项目概览</h1>}
        inspector={<p>项目检查器</p>}
        onRequestNavigation={onRequestNavigation}
        authorityEvidence={{ layers, summary: "四层独立", fields, evidenceSummary: "受限证据" }}
      />
    </ThemeProvider>,
  );
}

describe("CreatorProjectShell", () => {
  beforeEach(() => navigation.push.mockReset());
  it("composes the project context and ten transitional destinations", () => {
    renderShell();
    expect(screen.getByRole("region", { name: "V3 项目上下文" })).toHaveTextContent("北岸计划");
    expect(screen.getByRole("region", { name: "V3 项目上下文" })).toHaveTextContent("已绑定 1 个系列");
    const navigation = screen.getByRole("navigation", { name: "V3 项目导航" });
    const links = within(navigation).getAllByRole("link");
    expect(links).toHaveLength(10);
    expect(links.map((link) => link.getAttribute("data-destination-id"))).toEqual([
      "overview", "story", "script", "characters", "storyboard", "generation", "audio", "timeline", "review", "delivery",
    ]);
    expect(within(navigation).getByText("概览").closest("a")).toHaveAttribute("aria-current", "page");
    expect(within(navigation).getByText("故事").closest("a")?.getAttribute("href")?.endsWith("/story")).toBe(true);
  });

  it("opens project navigation as a single drawer and restores focus", async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = screen.getByRole("button", { name: "打开项目导航" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "项目导航" });
    expect(within(dialog).getByRole("navigation", { name: "移动端项目导航" })).toBeVisible();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each([false, true])("delegates the %s mobile Job Center to its caller with the exact trigger", async (mobile) => {
    const user = userEvent.setup();
    const request = vi.fn();
    renderShell(request);
    if (mobile) await user.click(screen.getByRole("button", { name: "打开任务" }));
    const scope = mobile ? within(screen.getByRole("dialog", { name: "任务" })) : screen;
    const trigger = scope.getByRole("button", { name: "打开任务中心" });
    await user.click(trigger);
    expect(request).toHaveBeenCalledExactlyOnceWith("/creator/jobs", trigger);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it.each([false, true])("retains the %s mobile Job Center push when no caller owns navigation", async (mobile) => {
    const user = userEvent.setup(); renderShell();
    if (mobile) await user.click(screen.getByRole("button", { name: "打开任务" }));
    const scope = mobile ? within(screen.getByRole("dialog", { name: "任务" })) : screen;
    await user.click(scope.getByRole("button", { name: "打开任务中心" }));
    expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/creator/jobs");
  });

  it("does not request navigation when opening an Inspector", async () => {
    const user = userEvent.setup(); const request = vi.fn(); renderShell(request);
    await user.click(screen.getByRole("button", { name: "打开检查器" }));
    expect(screen.getByRole("dialog", { name: "检查器" })).toBeVisible();
    expect(request).not.toHaveBeenCalled(); expect(navigation.push).not.toHaveBeenCalled();
  });
});
