"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreatorClientError,
  creatorRequest,
  type CreatorEpisodeProductionRun,
  type EpisodeProductionRunsEnvelope,
} from "@/features/core-integration";

type RunCollectionState =
  | { status: "loading"; runs: CreatorEpisodeProductionRun[]; error: "" }
  | { status: "ready"; runs: CreatorEpisodeProductionRun[]; error: "" }
  | { status: "error"; runs: CreatorEpisodeProductionRun[]; error: string };

export function readableCreatorError(error: unknown) {
  if (error instanceof CreatorClientError) return `${error.detail.message}（${error.detail.code}）`;
  return error instanceof Error ? error.message : "Core 返回了无法识别的错误。";
}

export function productionResourcePath(runRef: string, resource: string) {
  return `episode-production-runs/${encodeURIComponent(runRef)}/${resource}`;
}

export function useProjectProductionRuns(projectRef: string) {
  const [state, setState] = useState<RunCollectionState>({ status: "loading", runs: [], error: "" });
  const [selectedRunRef, setSelectedRunRef] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setState(current => ({ status: "loading", runs: current.runs, error: "" }));
      }
    });
    void creatorRequest<EpisodeProductionRunsEnvelope>("episode-production-runs", {
      method: "GET",
      signal: controller.signal,
    }).then(envelope => {
      const runs = envelope.runs
        .filter(run => run.projectRef === projectRef)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      setState({ status: "ready", runs, error: "" });
      setSelectedRunRef(current => runs.some(run => run.productionRunRef === current)
        ? current
        : runs[0]?.productionRunRef ?? "");
    }).catch(error => {
      if (controller.signal.aborted) return;
      setState({ status: "error", runs: [], error: readableCreatorError(error) });
      setSelectedRunRef("");
    });
    return () => controller.abort();
  }, [projectRef, revision]);

  const selectedRun = useMemo(
    () => state.runs.find(run => run.productionRunRef === selectedRunRef) ?? null,
    [selectedRunRef, state.runs],
  );

  return {
    ...state,
    selectedRun,
    selectedRunRef,
    selectRun: setSelectedRunRef,
    refresh,
  };
}
