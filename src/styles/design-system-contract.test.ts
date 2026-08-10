import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const designSystemDirectory = resolve(repositoryRoot, "docs", "design-system");

const officialGuides = [
  "ACS_BRAND_GUIDE.md",
  "ACS_THEME_GUIDE.md",
  "ACS_COMPONENT_GUIDE.md",
  "ACS_LAYOUT_SYSTEM.md",
  "ACS_STATUS_SYSTEM.md",
] as const;

describe("ACS design-system contract", () => {
  it("publishes every official guide", () => {
    for (const guide of officialGuides) {
      const content = readFileSync(resolve(designSystemDirectory, guide), "utf8");
      expect(content).toContain("**Status:** Official");
      expect(content).toContain("**Version:** V2.3");
    }
  });

  it("exposes every global token family and both explicit themes", () => {
    const tokens = readFileSync(resolve(repositoryRoot, "src", "styles", "tokens.css"), "utf8");

    expect(tokens).toContain('[data-theme="dark"]');
    expect(tokens).toContain('[data-theme="light"]');

    for (const token of [
      "--acs-bg",
      "--acs-font-sans",
      "--acs-type-body-size",
      "--acs-space-4",
      "--acs-radius-card",
      "--acs-motion-base",
      "--acs-sidebar-width",
      "--acs-project-nav-width",
      "--acs-inspector-width",
    ]) {
      expect(tokens).toContain(token);
    }

    for (const tailwindBridge of [
      "--color-acs-primary",
      "--text-acs-body",
      "--spacing-acs-4",
      "--radius-acs-card",
      "--ease-acs-standard",
    ]) {
      expect(tokens).toContain(tailwindBridge);
    }
  });
});
