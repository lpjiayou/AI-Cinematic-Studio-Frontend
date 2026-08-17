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

  it("keeps every primary page shell fluid on wide production displays", () => {
    const tokens = readFileSync(resolve(repositoryRoot, "src", "styles", "tokens.css"), "utf8");
    const fluidShellStyles = [
      "src/app/landing-page.module.css",
      "src/app/creator/global-shell.module.css",
      "src/app/creator/ai-director/ai-director.module.css",
      "src/app/creator/projects/projects-page.module.css",
      "src/app/creator/projects/new/create-project.module.css",
      "src/app/creator/projects/[projectRef]/planning/connected-workspace.module.css",
      "src/app/creator/projects/[projectRef]/content/script/script-workspace.module.css",
      "src/app/script-studio/script-studio.module.css",
    ] as const;

    expect(tokens).toContain("--acs-content-max-width: 100%;");

    for (const stylePath of fluidShellStyles) {
      const styles = readFileSync(resolve(repositoryRoot, stylePath), "utf8");
      expect(styles, stylePath).toContain("var(--acs-content-max-width)");
    }

    for (const stylePath of [
      "src/app/creator/projects/[projectRef]/planning/bible/story-world.module.css",
      "src/app/creator/projects/[projectRef]/planning/characters/character-studio.module.css",
    ]) {
      const styles = readFileSync(resolve(repositoryRoot, stylePath), "utf8");
      expect(styles, stylePath).toMatch(/\.page\s*\{[\s\S]*?width:\s*100%;/);
    }

    const characterStudioStyles = readFileSync(
      resolve(
        repositoryRoot,
        "src/app/creator/projects/[projectRef]/planning/characters/character-studio.module.css",
      ),
      "utf8",
    );
    expect(characterStudioStyles).not.toContain("118rem");
  });
});
