import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorNavigation } from "./creator-navigation";

const navigationState = vi.hoisted(() => ({ pathname: "/creator" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

describe("CreatorNavigation", () => {
  beforeEach(() => {
    navigationState.pathname = "/creator";
  });

  it.each([
    ["/creator", "首页"],
    ["/creator/ai-director", "AI导演"],
    ["/creator/projects", "项目"],
    ["/creator/projects/new", "项目"],
  ])("marks %s with the correct current destination", (pathname, label) => {
    navigationState.pathname = pathname;
    render(<CreatorNavigation />);

    const navigation = screen.getByRole("navigation", {
      name: "Creator 全局导航",
    });
    expect(within(navigation).getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(navigation).getAllByRole("link")).toHaveLength(3);
  });

  it("keeps unavailable destinations visibly disabled and non-interactive", () => {
    render(<CreatorNavigation />);

    for (const label of ["资产库", "创作中心", "作品"]) {
      const item = screen.getByText(label);
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item.closest("a")).toBeNull();
      expect(item.closest("button")).toBeNull();
    }
  });
});
