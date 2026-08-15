import { describe, expect, it } from "vitest";
import { PRIMARY_NAVIGATION } from "./navigation";
import { PROJECT_NAVIGATION } from "./project-navigation";

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

describe("PROJECT_NAVIGATION", () => {
  it("freezes the six project destinations in product order", () => {
    expect(PROJECT_NAVIGATION.map((item) => item.label)).toEqual([
      "概览",
      "策划",
      "内容",
      "制作",
      "后期",
      "交付",
    ]);
  });

  it("links only the planning route that currently exists", () => {
    expect(PROJECT_NAVIGATION.filter((item) => item.available).map((item) => item.segment)).toEqual([
      "planning",
    ]);
  });
});
