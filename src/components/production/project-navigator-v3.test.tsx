import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ProjectNavigatorV3,
  type ProjectDestinationView,
} from "./project-navigator-v3";

const ids = [
  "overview", "story", "script", "characters", "storyboard",
  "generation", "audio", "timeline", "review", "delivery",
] as const;

const labels = ["概览", "故事", "剧本", "角色", "分镜", "生成", "音频", "剪辑", "审片", "交付"];

const destinations: readonly ProjectDestinationView[] = ids.map((id, index) => (
  index < 2
    ? { id, label: labels[index], description: `${labels[index]}说明`, availability: "available", href: `#${id}` }
    : { id, label: labels[index], description: `${labels[index]}说明`, availability: index === 2 ? "blocked" : "not_open", blockedReason: "等待实施", explanationHref: `#${id}-blocked` }
)) as readonly ProjectDestinationView[];

describe("ProjectNavigatorV3", () => {
  it("keeps all ten destinations ordered and routes unavailable items to explanations", () => {
    render(
      <ProjectNavigatorV3
        destinations={destinations}
        activeDestinationId="overview"
        mode="full"
        navigationLabel="项目导航"
      />,
    );
    const navigation = screen.getByRole("navigation", { name: "项目导航" });
    const links = within(navigation).getAllByRole("link");
    expect(links).toHaveLength(10);
    expect(links.map((link) => link.textContent?.includes(labels[links.indexOf(link)]))).not.toContain(false);
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links[0]).toHaveAttribute("href", "#overview");
    expect(links[2]).toHaveAttribute("href", "#script-blocked");
    expect(links[2]).toHaveAttribute("data-availability", "blocked");
    expect(links[9]).toHaveTextContent("等待实施");
  });

  it("supports roving focus and closes only overlay mode with Escape", () => {
    const onRequestClose = vi.fn();
    render(
      <ProjectNavigatorV3
        destinations={destinations}
        mode="overlay"
        navigationLabel="项目导航"
        onRequestClose={onRequestClose}
      />,
    );
    const links = screen.getAllByRole("link");
    links[0].focus();
    fireEvent.keyDown(links[0], { key: "ArrowDown" });
    expect(links[1]).toHaveFocus();
    fireEvent.keyDown(links[1], { key: "End" });
    expect(links[9]).toHaveFocus();
    fireEvent.keyDown(links[9], { key: "Home" });
    expect(links[0]).toHaveFocus();
    fireEvent.keyDown(links[0], { key: "Escape" });
    expect(onRequestClose).toHaveBeenCalledOnce();
  });
});
