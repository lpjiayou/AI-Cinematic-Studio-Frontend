import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Wave1AShellFixture } from "./wave-1a-shell-fixture";

describe("Wave1AShellFixture", () => {
  it("labels the explicit evidence boundary and renders the full shell fixture", () => {
    const requestSpy = vi.spyOn(globalThis, "fetch");
    render(<Wave1AShellFixture />);
    const note = screen.getByRole("note", { name: "证据环境边界" });
    expect(note).toHaveTextContent("LOCAL_FIXTURE");
    expect(note).toHaveTextContent("EVIDENCE ONLY");
    expect(note).toHaveTextContent("NOT PRODUCT DATA");
    expect(note).toHaveTextContent("NO AUTHORITY");
    expect(note).toHaveTextContent("NO RUNTIME EXECUTION");
    expect(screen.getByRole("main", { name: "Wave 1A 主要画布" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Wave 1A 选择检查器" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Wave 1A 授权与证据" })).toBeVisible();
    expect(requestSpy).not.toHaveBeenCalled();
    requestSpy.mockRestore();
  });

  it("renders six global and ten project destinations in their frozen order", () => {
    render(<Wave1AShellFixture />);
    const globalLinks = within(screen.getByRole("navigation", { name: "V3 全局导航" })).getAllByRole("link");
    expect(globalLinks).toHaveLength(6);
    expect(globalLinks.map((link) => link.getAttribute("aria-label"))).toEqual([
      "首页", "项目", "快速创作", "资产", "任务", "作品",
    ]);
    const projectLinks = within(screen.getByRole("navigation", { name: "V3 项目导航" })).getAllByRole("link");
    expect(projectLinks).toHaveLength(10);
    expect(projectLinks.map((link) => link.getAttribute("data-destination-id"))).toEqual([
      "overview",
      "story",
      "script",
      "characters",
      "storyboard",
      "generation",
      "audio",
      "timeline",
      "review",
      "delivery",
    ]);
  });

  it("keeps all five named overlay triggers accessible and restores focus", async () => {
    const user = userEvent.setup();
    render(<Wave1AShellFixture />);
    const triggerNames = ["打开全局导航", "打开项目导航", "打开检查器", "查看技术证据", "查看任务"];
    for (const name of triggerNames) {
      const trigger = screen.getByRole("button", { name });
      await user.click(trigger);
      expect(await screen.findByRole("dialog")).toBeVisible();
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    }
  });

  it("switches theme locally without changing product data", async () => {
    const user = userEvent.setup();
    render(<Wave1AShellFixture />);
    const fixture = document.querySelector("[data-wave-fixture]");
    expect(fixture).toHaveAttribute("data-theme", "dark");
    await user.click(screen.getByRole("button", { name: "切换为浅色主题" }));
    expect(fixture).toHaveAttribute("data-theme", "light");
    expect(screen.getByText("V3 Shell 验证项目")).toBeVisible();
  });
});
