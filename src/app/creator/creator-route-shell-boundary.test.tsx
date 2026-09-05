import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { CreatorRouteShellBoundary } from "./creator-route-shell-boundary";

const navigation = vi.hoisted(() => ({ pathname: "/creator" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("@/features/creator-v3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/creator-v3")>();
  return {
    ...actual,
    ProjectOverviewV3: ({ projectRef }: { projectRef: string }) => (
      <main aria-label="V3 overview">Overview {projectRef}</main>
    ),
    StoryWorkspaceV3: ({ projectRef }: { projectRef: string }) => (
      <main aria-label="V3 story">Story {projectRef}</main>
    ),
    ScriptStudioV3: ({ projectRef }: { projectRef: string }) => (
      <main aria-label="V3 script">Script {projectRef}</main>
    ),
    CharacterStudioV3: ({ projectRef }: { projectRef: string }) => (
      <main aria-label="V3 characters">Characters {projectRef}</main>
    ),
  };
});

function renderBoundary() {
  return render(
    <ThemeProvider>
      <CreatorRouteShellBoundary>
        <main aria-label="route child">Route child</main>
      </CreatorRouteShellBoundary>
    </ThemeProvider>,
  );
}

describe("CreatorRouteShellBoundary", () => {
  beforeEach(() => {
    navigation.pathname = "/creator";
  });

  it.each([
    "/creator",
    "/creator/projects",
    "/creator/create",
    "/creator/assets",
    "/creator/jobs",
    "/creator/works",
  ])("renders global V3 route %s without the legacy header", (pathname) => {
    navigation.pathname = pathname;
    renderBoundary();
    expect(screen.getByRole("main", { name: "route child" })).toBeVisible();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it.each([
    ["overview", "V3 overview"],
    ["story", "V3 story"],
    ["script", "V3 script"],
    ["characters", "V3 characters"],
  ])("renders encoded project %s directly without nested legacy content", (destination, label) => {
    navigation.pathname = `/creator/projects/project%20one/${destination}`;
    renderBoundary();
    expect(screen.getByRole("main", { name: label })).toHaveTextContent("project one");
    expect(screen.queryByRole("main", { name: "route child" })).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it.each([
    "/creator/projects/new",
    "/creator/projects/project-one/planning/bible",
    "/creator/projects/project-one/content/script",
    "/creator/projects/project-one/production",
    "/creator/projects/project-one/post",
    "/creator/projects/project-one/delivery",
    "/creator/projects/project-one/overview-extra",
    "/creator/unknown",
  ])("fails closed to the legacy shell for %s", (pathname) => {
    navigation.pathname = pathname;
    renderBoundary();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "route child" })).toBeVisible();
    expect(screen.queryByRole("navigation", { name: "V3 全局导航" })).not.toBeInTheDocument();
  });
});
