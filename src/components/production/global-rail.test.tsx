import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GlobalRail, type GlobalRailDestinationView } from "./global-rail";

const destinations: readonly GlobalRailDestinationView[] = [
  { id: "home", label: "首页", description: "返回首页", icon: "首", availability: "available", href: "#home" },
  { id: "projects", label: "项目", description: "查看项目", icon: "项", availability: "available", href: "#projects" },
  { id: "quick-create", label: "快速创作", description: "快速入口", icon: "快", availability: "available", href: "#create" },
  { id: "assets", label: "资产", description: "资产入口", icon: "资", availability: "blocked", blockedReason: "尚未开放", explanationHref: "#assets-blocked" },
  { id: "jobs", label: "任务", description: "任务入口", icon: "任", availability: "available", href: "#jobs" },
  { id: "works", label: "作品", description: "作品入口", icon: "作", availability: "not_open", blockedReason: "等待后续阶段", explanationHref: "#works-blocked" },
];

describe("GlobalRail", () => {
  it("renders six ordered destinations with exact link and availability semantics", () => {
    render(
      <GlobalRail
        destinations={destinations}
        activeDestinationId="home"
        expanded={false}
        onExpandedChange={() => undefined}
        brand="ACS"
        navigationLabel="全局导航"
      />,
    );

    const navigation = screen.getByRole("navigation", { name: "全局导航" });
    const links = within(navigation).getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(links.map((link) => link.getAttribute("aria-label"))).toEqual([
      "首页", "项目", "快速创作", "资产", "任务", "作品",
    ]);
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links[0]).toHaveAttribute("href", "#home");
    expect(links[3]).toHaveAttribute("href", "#assets-blocked");
    expect(links[3]).toHaveAttribute("data-availability", "blocked");
  });

  it("supports roving arrows, Home, End and accessible collapsed labels", () => {
    render(
      <GlobalRail
        destinations={destinations}
        expanded={false}
        onExpandedChange={() => undefined}
        brand="ACS"
        navigationLabel="全局导航"
      />,
    );

    const links = screen.getAllByRole("link");
    links[0].focus();
    fireEvent.keyDown(links[0], { key: "ArrowDown" });
    expect(links[1]).toHaveFocus();
    fireEvent.keyDown(links[1], { key: "End" });
    expect(links[5]).toHaveFocus();
    fireEvent.keyDown(links[5], { key: "Home" });
    expect(links[0]).toHaveFocus();
    fireEvent.keyDown(links[0], { key: "ArrowUp" });
    expect(links[5]).toHaveFocus();
  });

  it("requests overlay closure with Escape and restores the toggle focus", async () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(
      <GlobalRail
        destinations={destinations}
        expanded
        onExpandedChange={onExpandedChange}
        brand="ACS"
        navigationLabel="全局导航"
      />,
    );

    const firstLink = screen.getAllByRole("link")[0];
    firstLink.focus();
    fireEvent.keyDown(firstLink, { key: "Escape" });
    expect(onExpandedChange).toHaveBeenCalledWith(false);

    rerender(
      <GlobalRail
        destinations={destinations}
        expanded={false}
        onExpandedChange={onExpandedChange}
        brand="ACS"
        navigationLabel="全局导航"
      />,
    );
    const toggle = screen.getByRole("button", { name: "展开全局导航" });
    expect(toggle).toHaveFocus();
  });
});
