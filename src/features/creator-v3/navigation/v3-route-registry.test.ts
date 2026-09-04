import { describe, expect, it } from "vitest";
import {
  GLOBAL_V3_DESTINATIONS,
  buildProjectV3Destinations,
  classifyCreatorRoute,
} from "./v3-route-registry";

describe("V3 route registry", () => {
  it("freezes the six global destinations in the authorized order", () => {
    expect(GLOBAL_V3_DESTINATIONS.map((item) => item.label)).toEqual([
      "首页", "项目", "快速创作", "资产", "任务", "作品",
    ]);
    expect(GLOBAL_V3_DESTINATIONS.map((item) => item.id)).not.toContain("ai-director");
    for (const item of GLOBAL_V3_DESTINATIONS) {
      if (item.availability === "available") expect(item.href).toMatch(/^\/creator/);
      else {
        expect("href" in item).toBe(false);
        expect(item.explanationHref).toMatch(/^\/creator/);
        expect(item.blockedReason).not.toBe("");
      }
    }
  });

  it("classifies only the seven exact V3 route shapes", () => {
    for (const pathname of [
      "/creator",
      "/creator/projects",
      "/creator/create",
      "/creator/assets",
      "/creator/jobs",
      "/creator/works",
      "/creator/projects/project%20one/overview",
    ]) {
      expect(classifyCreatorRoute(pathname).shell).toBe("v3");
    }
    for (const pathname of [
      "/creator/projects/new",
      "/creator/projects/project-one/overview-extra",
      "/creator/projects/project-one/planning/bible",
      "/creator/projects/project-one/content/script",
      "/creator/projects/project-one/production",
      "/creator/projects/project-one/post",
      "/creator/projects/project-one/delivery",
      "/creator/unknown",
      "/creator/projects/%E0%A4%A/overview",
    ]) {
      expect(classifyCreatorRoute(pathname)).toEqual({ shell: "legacy" });
    }
    expect(classifyCreatorRoute("/creator/projects/project%20one/overview")).toEqual({
      shell: "v3",
      route: { kind: "project-overview", destinationId: "projects", projectRef: "project one" },
    });
  });

  it("builds ten transitional project destinations and encodes the project reference", () => {
    const destinations = buildProjectV3Destinations("项目 / one");
    expect(destinations.map((item) => item.label)).toEqual([
      "概览", "故事", "剧本", "角色", "分镜", "生成", "音频", "剪辑", "审片", "交付",
    ]);
    expect(destinations.map((item) => item.id)).toEqual([
      "overview", "story", "script", "characters", "storyboard", "generation", "audio", "timeline", "review", "delivery",
    ]);
    expect(destinations[0]).toMatchObject({
      availability: "available",
      href: "/creator/projects/%E9%A1%B9%E7%9B%AE%20%2F%20one/overview",
    });
    expect(destinations[1].availability === "available" && destinations[1].href.endsWith("/planning/bible")).toBe(true);
    expect(destinations[2].availability === "available" && destinations[2].href.endsWith("/content/script")).toBe(true);
    expect(destinations[3].availability === "available" && destinations[3].href.endsWith("/planning/characters")).toBe(true);
    expect(destinations[4]).not.toHaveProperty("href");
    expect(destinations[8].availability === "available" && destinations[8].href.endsWith("/post")).toBe(true);
    expect(destinations[9].availability === "available" && destinations[9].href.endsWith("/delivery")).toBe(true);
  });
});
