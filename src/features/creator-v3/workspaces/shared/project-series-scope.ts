export type ProjectSeriesScope =
  | { status: "ready"; seriesRef: string }
  | {
      status: "blocked";
      code:
        | "series_binding_required"
        | "series_context_selection_required"
        | "series_context_invalid";
      message: string;
    };

export function resolveProjectSeriesScope(seriesRefs: unknown): ProjectSeriesScope {
  if (
    !Array.isArray(seriesRefs) ||
    !seriesRefs.every(
      (seriesRef) =>
        typeof seriesRef === "string" &&
        seriesRef.length > 0 &&
        seriesRef === seriesRef.trim(),
    )
  ) {
    return {
      status: "blocked",
      code: "series_context_invalid",
      message: "项目返回了无法识别的系列上下文，当前工作台保持阻断。",
    };
  }

  if (seriesRefs.length === 0) {
    return {
      status: "blocked",
      code: "series_binding_required",
      message: "当前项目尚未绑定系列，不能进入后续工作区。",
    };
  }

  if (seriesRefs.length > 1) {
    return {
      status: "blocked",
      code: "series_context_selection_required",
      message: "当前项目绑定了多个系列，需要显式选择系列上下文后才能继续。",
    };
  }

  return { status: "ready", seriesRef: seriesRefs[0] };
}
