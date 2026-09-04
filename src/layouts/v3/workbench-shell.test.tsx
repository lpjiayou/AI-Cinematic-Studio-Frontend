import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "node:fs";
import path from "node:path";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";
import type { WorkbenchOverlay } from "@/components/production";
import { WorkbenchShell } from "./workbench-shell";

function OverlayHarness() {
  const [activeOverlay, setActiveOverlay] = useState<WorkbenchOverlay>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setActiveOverlay("inspector")}>
        打开检查器
      </button>
      <WorkbenchShell
        globalRail={<nav aria-label="全局导航">全局</nav>}
        projectContextBar={<section aria-label="项目上下文">上下文</section>}
        projectNavigator={<nav aria-label="项目导航">项目</nav>}
        primaryCanvas="主画布"
        inspector="固定检查器"
        authorityEvidence="授权与证据"
        jobShelf="任务摘要"
        activeOverlay={activeOverlay}
        onActiveOverlayChange={setActiveOverlay}
        overlayContent="抽屉检查器"
        overlayReturnFocusRef={triggerRef}
        contentLabel="主要工作画布"
        inspectorLabel="选择检查器"
        authorityLabel="授权与证据状态"
        density="comfortable"
      />
    </>
  );
}

describe("WorkbenchShell", () => {
  it("keeps one main landmark and separates inspector from authority evidence", () => {
    render(
      <WorkbenchShell
        globalRail={<nav aria-label="全局导航">全局</nav>}
        projectContextBar="上下文"
        projectNavigator={<nav aria-label="项目导航">项目</nav>}
        primaryCanvas="主画布"
        inspector="固定检查器"
        authorityEvidence="授权与证据"
        jobShelf="任务摘要"
        activeOverlay={null}
        onActiveOverlayChange={() => undefined}
        contentLabel="主要工作画布"
        inspectorLabel="选择检查器"
        authorityLabel="授权与证据状态"
        density="comfortable"
      />,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main", { name: "主要工作画布" })).toHaveTextContent("主画布");
    expect(screen.getByRole("complementary", { name: "选择检查器" })).toHaveTextContent("固定检查器");
    expect(screen.getByRole("complementary", { name: "授权与证据状态" })).toHaveTextContent("授权与证据");
    expect(document.querySelector('[data-wave-region="global-rail-fixed"]')?.compareDocumentPosition(
      document.querySelector('[data-wave-region="context-bar"]')!,
    )).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("does not render tracks or landmarks for missing optional slots", () => {
    render(
      <WorkbenchShell
        projectContextBar="上下文"
        primaryCanvas="主画布"
        activeOverlay={null}
        onActiveOverlayChange={() => undefined}
        contentLabel="主要工作画布"
        inspectorLabel="选择检查器"
        authorityLabel="授权与证据状态"
        density="compact"
      />,
    );
    const shell = document.querySelector("[data-wave-shell]");
    expect(shell).not.toHaveAttribute("data-has-project");
    expect(shell).not.toHaveAttribute("data-has-global");
    expect(shell).not.toHaveAttribute("data-has-side");
    expect(shell).not.toHaveAttribute("data-has-jobs");
    expect(document.querySelector('[data-wave-region="project-navigator-fixed"]')).toBeNull();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("moves jobs out of the fixed grid at the tablet drawer breakpoint", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "src/layouts/v3/workbench-shell.module.css"),
      "utf8",
    );
    expect(css).toContain("@media (max-width: 71.9375rem)");
    expect(css).toMatch(/@media \(max-width: 71\.9375rem\)[\s\S]*?\.jobShelf\s*\{\s*display: none;/);
  });

  it("maps one active overlay to the correct drawer and restores focus", async () => {
    const user = userEvent.setup();
    render(<OverlayHarness />);
    const trigger = screen.getByRole("button", { name: "打开检查器" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "检查器" });
    expect(dialog).toHaveAttribute("data-side", "right");
    expect(dialog).toHaveAttribute("data-size", "narrow");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
