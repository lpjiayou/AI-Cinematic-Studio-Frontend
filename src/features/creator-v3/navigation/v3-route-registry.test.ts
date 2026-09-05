import { readFileSync } from "node:fs";
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

  it("classifies only the ten exact V3 route shapes", () => {
    for (const pathname of [
      "/creator",
      "/creator/projects",
      "/creator/create",
      "/creator/assets",
      "/creator/jobs",
      "/creator/works",
      "/creator/projects/project%20one/overview",
      "/creator/projects/project%20one/story",
      "/creator/projects/project%20one/script",
      "/creator/projects/project%20one/characters",
    ]) {
      expect(classifyCreatorRoute(pathname).shell).toBe("v3");
    }
    for (const pathname of [
      "/creator/projects/new",
      "/creator/projects/project-one/overview-extra",
      "/creator/projects/project-one/story-extra",
      "/creator/projects/project-one/script/extra",
      "/creator/projects/project-one/characters/extra",
      "/creator/projects/new/story",
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
      route: { kind: "project", destinationId: "overview", projectRef: "project one" },
    });
    expect(classifyCreatorRoute("/creator/projects/project%20one/characters")).toEqual({
      shell: "v3",
      route: { kind: "project", destinationId: "characters", projectRef: "project one" },
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
    expect(destinations[1]).toMatchObject({ availability: "available", href: expect.stringMatching(/\/story$/), description: "系列规划、世界来源与连续性" });
    expect(destinations[2]).toMatchObject({ availability: "available", href: expect.stringMatching(/\/script$/), description: "分集、剧本版本、修订与确认" });
    expect(destinations[3]).toMatchObject({ availability: "available", href: expect.stringMatching(/\/characters$/), description: "角色连续性版本与权威来源" });
    expect(destinations[4]).not.toHaveProperty("href");
    expect(destinations[8].availability === "available" && destinations[8].href.endsWith("/post")).toBe(true);
    expect(destinations[9].availability === "available" && destinations[9].href.endsWith("/delivery")).toBe(true);
  });

  it.each([
    ["planning/bible", "story"],
    ["content/script", "script"],
    ["planning/characters", "characters"],
  ])("keeps the legacy %s entry as an exact server redirect", (legacyPath, canonicalPath) => {
    const source = readFileSync(
      `src/app/creator/projects/[projectRef]/${legacyPath}/page.tsx`,
      "utf8",
    );
    expect(source).toContain('import { redirect } from "next/navigation";');
    expect(source).toContain(
      `redirect(\`/creator/projects/\${encodeURIComponent(projectRef)}/${canonicalPath}\`);`,
    );
    expect(source).not.toMatch(/ConnectedStoryWorld|ConnectedScriptStudio|ConnectedCharacterStudio|useEffect/);
  });
});
