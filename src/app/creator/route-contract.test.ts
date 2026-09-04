import { existsSync, readFileSync } from "node:fs";
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

function routeFileSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
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
      "src/app/creator/projects/[projectRef]/production/page.tsx",
      "src/app/creator/projects/[projectRef]/post/page.tsx",
      "src/app/creator/projects/[projectRef]/delivery/page.tsx",
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

  it("exposes the Wave 1B canonical routes without changing legacy project routes", () => {
    for (const path of [
      "src/app/creator/create/page.tsx",
      "src/app/creator/assets/page.tsx",
      "src/app/creator/jobs/page.tsx",
      "src/app/creator/works/page.tsx",
      "src/app/creator/projects/[projectRef]/overview/page.tsx",
    ]) {
      expect(routeFileExists(path), path).toBe(true);
    }

    expect(routeFileExists("src/app/script-studio/page.tsx")).toBe(true);
    expect(routeFileExists("src/app/creator/projects/page.tsx")).toBe(true);
    expect(routeFileExists("src/app/creator/projects/[projectRef]/planning/bible/page.tsx")).toBe(true);
    expect(routeFileExists("src/app/creator/projects/[projectRef]/production/page.tsx")).toBe(true);
  });

  it("keeps blocked route configuration inside the client boundary", () => {
    const routeEntries = [
      ["src/app/creator/create/page.tsx", "quick-create"],
      ["src/app/creator/assets/page.tsx", "assets"],
      ["src/app/creator/jobs/page.tsx", "jobs"],
      ["src/app/creator/works/page.tsx", "works"],
    ] as const;

    for (const [path, destinationKey] of routeEntries) {
      const source = routeFileSource(path);
      expect(source, path).toContain("BlockedGlobalDestinationV3");
      expect(source, path).toContain(`destinationKey="${destinationKey}"`);
      expect(source, path).not.toContain("BLOCKED_GLOBAL_DESTINATIONS");
      expect(source, path).not.toContain('"use client"');
      expect(source, path).not.toContain("force-dynamic");
      expect(source, path).not.toMatch(/ssr:\s*false/);
      expect(source, path).not.toContain("config=");
      expect(source, path).toContain("export const metadata");
    }

    const pagesBarrel = routeFileSource("src/features/creator-v3/pages/index.ts");
    expect(pagesBarrel).not.toContain("BLOCKED_GLOBAL_DESTINATIONS");

    const clientSource = routeFileSource(
      "src/features/creator-v3/pages/blocked-global-destination-v3.tsx",
    );
    expect(clientSource.startsWith('"use client";')).toBe(true);
    expect(clientSource).toContain("destinationKey");
    expect(clientSource).toContain("const BLOCKED_GLOBAL_DESTINATIONS");
    expect(clientSource).not.toContain("export const BLOCKED_GLOBAL_DESTINATIONS");
    expect(clientSource).toContain(
      "const config = BLOCKED_GLOBAL_DESTINATIONS[destinationKey];",
    );
    expect(clientSource).toContain("Unknown blocked global destination");
    expect(clientSource).not.toContain("config?.");
    expect(clientSource).not.toMatch(
      /BLOCKED_GLOBAL_DESTINATIONS\[destinationKey\]\s*(?:\?\?|\|\|)/,
    );
  });
});
