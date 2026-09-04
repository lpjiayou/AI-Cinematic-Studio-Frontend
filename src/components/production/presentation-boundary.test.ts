import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const sourceRoots = [
  path.join(repositoryRoot, "src/components/production"),
  path.join(repositoryRoot, "src/layouts/v3"),
  path.join(repositoryRoot, "src/features/creator-v3/evidence"),
];

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

const sourceFiles = sourceRoots
  .flatMap(walk)
  .filter((file) => /\.(?:ts|tsx)$/.test(file) && !/\.test\.(?:ts|tsx)$/.test(file));

const styleFiles = sourceRoots.flatMap(walk).filter((file) => file.endsWith(".module.css"));

const prohibitedSourcePatterns: ReadonlyArray<[string, RegExp]> = [
  ["network request ownership", /\bfetch\s*\(/],
  ["creator request ownership", /\bcreatorRequest\b/],
  ["axios ownership", /\baxios\b/],
  ["router hook ownership", /\buse(?:Router|Pathname)\b/],
  ["redirect ownership", /\bredirect\s*\(/],
  ["imperative router ownership", /\brouter\.(?:push|replace)\b/],
  ["Next navigation import", /["']next\/navigation["']/],
  ["Core integration import", /@\/features\/core-integration/],
  ["Creator API path", /\/(?:creator\/api|api\/creator)\//],
  ["execution method authority", /executionMethod/],
  ["workspace authority reference", /workspaceRef/],
  ["production authority reference", /productionRunRef/],
  ["provider credential", /(?:Provider\s+token|providerToken)/i],
  ["local persistence", /(?:local|session)Storage/],
];

describe("Wave 1A presentation boundary", () => {
  it("keeps the new production and layout trees presentation-only", () => {
    const violations = sourceFiles.flatMap((file) => {
      const content = fs.readFileSync(file, "utf8");
      return prohibitedSourcePatterns
        .filter(([, pattern]) => pattern.test(content))
        .map(([label]) => `${path.relative(repositoryRoot, file)}: ${label}`);
    });
    expect(violations).toEqual([]);
  });

  it("uses semantic tokens instead of raw colors", () => {
    const rawColor = /#[0-9a-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i;
    const violations = styleFiles
      .filter((file) => rawColor.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(repositoryRoot, file));
    expect(violations).toEqual([]);
  });

  it("publishes Wave 1A only through the approved barrels", () => {
    const componentBarrel = fs.readFileSync(path.join(repositoryRoot, "src/components/index.ts"), "utf8");
    const layoutBarrel = fs.readFileSync(path.join(repositoryRoot, "src/layouts/index.ts"), "utf8");
    expect(componentBarrel).toContain('export * from "./production";');
    expect(layoutBarrel).toContain('export * from "./v3";');
  });

  it("keeps the evidence page dynamic, fail-closed and unindexable", () => {
    const pageSource = fs.readFileSync(
      path.join(repositoryRoot, "src/app/frontend-v3-evidence/wave-1a/page.tsx"),
      "utf8",
    );
    expect(pageSource).toContain('export const dynamic = "force-dynamic";');
    expect(pageSource).toContain("export const revalidate = 0;");
    expect(pageSource).toContain('process.env.ACS_FRONTEND_V3_EVIDENCE_MODE !== "1"');
    expect(pageSource).toContain("notFound();");
    expect(pageSource).toMatch(/robots:\s*\{[\s\S]*?index:\s*false,[\s\S]*?follow:\s*false/);
    for (const prohibited of ["fetch(", "localStorage", "/api/creator/", "@/features/core-integration"]) {
      expect(pageSource).not.toContain(prohibited);
    }
  });
});
