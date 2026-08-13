import { describe, expect, it } from "vitest";
import { PRIMARY_NAVIGATION } from "./navigation";

describe("PRIMARY_NAVIGATION", () => {
  it("freezes the six global destinations in product order", () => {
    expect(PRIMARY_NAVIGATION).toEqual([
      { label: "首页", href: "/creator", available: true },
      { label: "AI导演", href: "/creator/ai-director", available: true },
      { label: "项目", href: "/creator/projects", available: true },
      { label: "资产库", href: "/creator/assets", available: false },
      { label: "创作中心", href: "/creator/create", available: false },
      { label: "作品", href: "/creator/works", available: false },
    ]);
  });

  it("keeps only the currently authorized destinations available", () => {
    expect(
      PRIMARY_NAVIGATION.filter((item) => item.available).map((item) => item.href),
    ).toEqual(["/creator", "/creator/ai-director", "/creator/projects"]);
  });
});
