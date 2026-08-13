import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

const REDIRECTS = [
  { source: "/workspace", destination: "/creator", permanent: false },
  { source: "/director", destination: "/creator/ai-director", permanent: false },
  { source: "/create", destination: "/creator/projects/new", permanent: false },
  { source: "/story-world", destination: "/creator/projects", permanent: false },
  { source: "/character-studio", destination: "/creator/projects", permanent: false },
] as const;

function routeFileExists(path: string) {
  return existsSync(resolve(process.cwd(), path));
}

describe("Creator route contract", () => {
  it("defines exactly the five temporary redirects without synthesizing context", async () => {
    expect(nextConfig.redirects).toBeTypeOf("function");
    await expect(nextConfig.redirects?.()).resolves.toEqual(REDIRECTS);
  });

  it("relocates all five route entries and removes the flat route entries", () => {
    const migratedRouteFiles = [
      "src/app/creator/page.tsx",
      "src/app/creator/ai-director/page.tsx",
      "src/app/creator/projects/new/page.tsx",
      "src/app/creator/projects/[projectRef]/planning/bible/page.tsx",
      "src/app/creator/projects/[projectRef]/planning/characters/page.tsx",
    ];
    const legacyRouteFiles = [
      "src/app/workspace/page.tsx",
      "src/app/director/page.tsx",
      "src/app/create/page.tsx",
      "src/app/story-world/page.tsx",
      "src/app/character-studio/page.tsx",
    ];

    for (const path of migratedRouteFiles) {
      expect(routeFileExists(path), path).toBe(true);
    }
    for (const path of legacyRouteFiles) {
      expect(routeFileExists(path), path).toBe(false);
    }
  });

  it("keeps deferred destinations absent and Script Studio unmigrated", () => {
    for (const path of [
      "src/app/creator/create/page.tsx",
      "src/app/creator/assets/page.tsx",
      "src/app/creator/works/page.tsx",
    ]) {
      expect(routeFileExists(path), path).toBe(false);
    }

    expect(routeFileExists("src/app/script-studio/page.tsx")).toBe(true);
    expect(routeFileExists("src/app/creator/projects/page.tsx")).toBe(true);
  });
});
