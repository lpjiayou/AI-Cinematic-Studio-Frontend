import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { UnifiedAppHeader } from "./unified-app-header";

const navigationState = vi.hoisted(() => ({ pathname: "/creator" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

function renderHeader(mode: "auto" | "editor" = "auto") {
  return render(
    <ThemeProvider>
      <UnifiedAppHeader editorLabel="剧本工作台" mode={mode} />
    </ThemeProvider>,
  );
}

describe("UnifiedAppHeader", () => {
  beforeEach(() => {
    navigationState.pathname = "/creator";
  });

  it("renders the global navigation only on global routes", () => {
    renderHeader();
    expect(screen.getByRole("navigation", { name: "Creator 全局导航" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "项目工作区导航" })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Creator 数据连接" })).toBeInTheDocument();
  });

  it("renders exactly the six project destinations and no global navigation", () => {
    navigationState.pathname = "/creator/projects/future-city/planning/bible";
    renderHeader();

    const navigation = screen.getByRole("navigation", { name: "项目工作区导航" });
    expect(within(navigation).getAllByRole("listitem")).toHaveLength(6);
    expect(within(navigation).getAllByText(/概览|策划|内容|制作|后期|交付/)).toHaveLength(6);
    expect(within(navigation).getAllByRole("link")).toHaveLength(2);
    expect(within(navigation).getByRole("link", { name: "策划" })).toHaveAttribute(
      "href",
      "/creator/projects/future-city/planning/bible",
    );
    expect(within(navigation).getByRole("link", { name: "内容" })).toHaveAttribute(
      "href",
      "/creator/projects/future-city/content/script",
    );
    expect(screen.queryByRole("navigation", { name: "Creator 全局导航" })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Creator 数据连接" })).not.toBeInTheDocument();
  });

  it("renders a minimal editor identity without primary navigation", () => {
    navigationState.pathname = "/script-studio";
    renderHeader("editor");
    expect(screen.getByLabelText("当前编辑器")).toHaveTextContent("剧本工作台");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
