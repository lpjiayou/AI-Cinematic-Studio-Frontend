import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CreatorLayout from "./layout";

describe("CreatorLayout", () => {
  it("renders the shared brand, navigation, and route content", () => {
    render(
      <CreatorLayout>
        <section aria-label="Creator route content">Creator child</section>
      </CreatorLayout>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "镜构智能 Creator 首页" }),
    ).toHaveAttribute("href", "/creator");
    expect(
      screen.getByRole("region", { name: "Creator route content" }),
    ).toHaveTextContent("Creator child");
  });

  it("links only available destinations and exposes unavailable items as disabled", () => {
    render(
      <CreatorLayout>
        <div>Creator child</div>
      </CreatorLayout>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Creator 全局导航",
    });

    expect(within(navigation).getAllByRole("link")).toHaveLength(3);
    expect(within(navigation).getByRole("link", { name: "首页" })).toHaveAttribute(
      "href",
      "/creator",
    );
    expect(
      within(navigation).getByRole("link", { name: "AI导演" }),
    ).toHaveAttribute("href", "/creator/ai-director");
    expect(within(navigation).getByRole("link", { name: "项目" })).toHaveAttribute(
      "href",
      "/creator/projects",
    );

    for (const label of ["资产库", "创作中心", "作品"]) {
      const item = within(navigation).getByText(label);
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item.closest("a")).toBeNull();
      expect(item.closest("button")).toBeNull();
    }
  });
});
