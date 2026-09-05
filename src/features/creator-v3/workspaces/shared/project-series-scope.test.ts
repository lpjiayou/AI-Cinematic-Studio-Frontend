import { describe, expect, it } from "vitest";
import { resolveProjectSeriesScope } from "./project-series-scope";

describe("resolveProjectSeriesScope", () => {
  it("requires a Series binding when none exists", () => {
    expect(resolveProjectSeriesScope([])).toEqual({
      status: "blocked",
      code: "series_binding_required",
      message: "当前项目尚未绑定系列，不能进入后续工作区。",
    });
  });

  it("returns the only real Series binding", () => {
    expect(resolveProjectSeriesScope(["series-one"])).toEqual({
      status: "ready",
      seriesRef: "series-one",
    });
  });

  it("requires explicit context selection for multiple Series bindings", () => {
    const result = resolveProjectSeriesScope(["series-one", "series-two"]);
    expect(result).toMatchObject({
      status: "blocked",
      code: "series_context_selection_required",
    });
    expect(result).not.toHaveProperty("seriesRef");
  });

  it.each([undefined, null, "series-one", [""], [" series-one"], [1]])(
    "fails closed for unknown input %#",
    (value) => {
      expect(resolveProjectSeriesScope(value)).toMatchObject({
        status: "blocked",
        code: "series_context_invalid",
      });
    },
  );
});
