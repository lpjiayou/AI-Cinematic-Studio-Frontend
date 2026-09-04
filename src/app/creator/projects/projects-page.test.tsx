import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ProjectsPage route entry", () => {
  it("atomically renders Project Center V3 without retaining the legacy page body", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/creator/projects/page.tsx"),
      "utf8",
    );
    expect(source).toContain("ProjectCenterV3");
    expect(source).not.toContain("ConnectedProjectBrowser");
    expect(source).not.toContain("LOCAL_PROJECT_CLIENT_KEYS");
    expect(source).not.toContain("getLocalProjectPresentation");
  });
});
