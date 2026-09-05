import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
function files(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const filename = path.join(directory, item.name);
    return item.isDirectory() ? files(filename) : [filename];
  });
}
describe("method-aware product and transport boundaries", () => {
  it("contains no direct origin, credential access, selectors, storage or fabricated authority", () => {
    // Construct scanner needles so the scanner itself remains in the scanned set.
    const forbidden = [
      ["NEXT_PUBLIC", "CORE"].join("_"), ["CREATOR", "CORE", "TOKEN"].join("_"), ["CREATOR", "CORE", "BASE_URL"].join("_"),
      ["http", ":", "//"].join(""), ["https", ":", "//"].join(""), ["ax", "ios"].join(""),
      ["provider", "selector"].join(" "), ["executionMethod", "selector"].join(" "), ["local", "Storage"].join(""),
      ["session", "Storage"].join(""), ["LOCAL", "FIXTURE"].join("_"), ["fixture", "fallback"].join(" "),
      ["Math", "random"].join("."), ["crypto", "randomUUID"].join("."), ["Date", "now"].join("."),
    ];
    const sources = files(path.join(process.cwd(), "src/features/core-integration")).filter((f) => /^method-aware-.*\.ts$/.test(path.basename(f)));
    expect(sources.length).toBeGreaterThanOrEqual(7);
    for (const filename of sources) for (const needle of forbidden) expect(fs.readFileSync(filename, "utf8"), `${filename}: ${needle}`).not.toContain(needle);
  });
  it("keeps method-aware operations out of current product UI and the fixture out of the barrel", () => {
    const uiFiles = ["src/app", "src/features/creator-v3"].flatMap((dir) => files(path.join(process.cwd(), dir)));
    const imports = uiFiles.filter((file) => /\.[jt]sx?$/.test(file) && fs.readFileSync(file, "utf8").includes("method-aware-client"));
    expect(imports).toEqual([]);
    const barrel = fs.readFileSync(path.join(process.cwd(), "src/features/core-integration/index.ts"), "utf8");
    expect(barrel).not.toContain("method-aware-test-fixtures");
    for (const entry of ["contracts", "client", "validators"]) expect(barrel).toContain(`export * from "./method-aware-${entry}";`);
  });
});
