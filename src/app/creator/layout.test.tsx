import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import CreatorLayout from "./layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/creator/ai-director",
}));

describe("CreatorLayout legacy regression", () => {
  it("retains the shared brand, navigation, and route content on legacy routes", () => {
    render(
      <ThemeProvider>
        <CreatorLayout>
          <section aria-label="Creator route content">Creator child</section>
        </CreatorLayout>
      </ThemeProvider>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "镜构智能 Creator 首页" }),
    ).toHaveAttribute("href", "/creator");
    expect(
      screen.getByRole("region", { name: "Creator route content" }),
    ).toHaveTextContent("Creator child");
    expect(screen.getByRole("complementary", { name: "Creator 数据连接" })).toHaveTextContent(
      /正在核对公共 API 与 M1–M19 能力合同/,
    );
  });

  it("retains legacy navigation semantics outside the V3 route set", () => {
    render(
      <ThemeProvider>
        <CreatorLayout>
          <div>Creator child</div>
        </CreatorLayout>
      </ThemeProvider>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Creator 全局导航",
    });

    expect(within(navigation).getAllByRole("link")).toHaveLength(3);
    expect(within(navigation).getByRole("link", { name: "首页" })).toHaveAttribute(
      "href",
      "/creator",
    );
    expect(within(navigation).getByRole("link", { name: "AI导演" })).toHaveAttribute(
      "aria-current",
      "page",
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
      expect(item.closest("span[aria-disabled='true']")).not.toBeNull();
      expect(item.closest("a")).toBeNull();
      expect(item.closest("button")).toBeNull();
    }

    expect(within(navigation).getByText("任务入口与能力边界")).toBeInTheDocument();
    expect(within(navigation).getAllByText("尚未开放")).toHaveLength(3);
  });
});
