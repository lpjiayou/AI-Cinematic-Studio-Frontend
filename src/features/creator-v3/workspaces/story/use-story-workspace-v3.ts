"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  creatorRequest,
  useCreatorIntegration,
  type ConfirmedSeriesPlanEnvelope,
  type CreatorError,
  type CreatorProject,
  type CreatorSeriesPlanCandidate,
  type ProjectEnvelope,
  type SeriesIntelligenceWorkspaceEnvelope,
  type SeriesPlanCandidateEnvelope,
  type SeriesPlanningWorkspaceEnvelope,
} from "@/features/core-integration";
import {
  isWorkspaceAbsent,
  isWorkspaceDisconnected,
  resolveProjectSeriesScope,
  workspaceErrorFromUnknown,
  type WorkspaceReadState,
} from "../shared";

export type StoryIntelligenceRead =
  | {
      status: "ready";
      workspace: SeriesIntelligenceWorkspaceEnvelope["workspace"];
    }
  | { status: "blocked"; error: CreatorError };

type StoryReadyState = {
  project: CreatorProject;
  seriesRef: string;
  planning: SeriesPlanningWorkspaceEnvelope["workspace"];
  intelligence: StoryIntelligenceRead;
};

type StoryScopeBlocker = {
  code: string;
  message: string;
  project?: CreatorProject;
};

export type StoryWorkspaceV3State = WorkspaceReadState<
  StoryReadyState,
  StoryScopeBlocker
>;

export type StoryWorkspaceOperation = "idle" | "generating" | "confirming";

function scopedPath(resource: string, projectRef: string, seriesRef: string) {
  return `${resource}?${new URLSearchParams({ projectRef, seriesRef }).toString()}`;
}

function failedRead(error: unknown): StoryWorkspaceV3State {
  const detail = workspaceErrorFromUnknown(error);
  if (isWorkspaceAbsent(error)) return { status: "absent", error: detail };
  if (isWorkspaceDisconnected(error)) return { status: "disconnected", error: detail };
  return { status: "error", error: detail };
}

export function useStoryWorkspaceV3(projectRef: string) {
  const { state: connection, refresh: refreshConnection } = useCreatorIntegration();
  const [requestState, setRequestState] = useState<StoryWorkspaceV3State>({
    status: "loading",
  });
  const [revision, setRevision] = useState(0);
  const [creativeInput, setCreativeInput] = useState("");
  const [candidate, setCandidate] = useState<CreatorSeriesPlanCandidate | null>(null);
  const [operation, setOperation] = useState<StoryWorkspaceOperation>("idle");
  const [operationMessage, setOperationMessage] = useState(
    "系列规划候选只有经过明确人工确认才会成为版本。",
  );
  const [operationError, setOperationError] = useState<CreatorError | null>(null);

  useEffect(() => {
    if (connection.status !== "connected") return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setRequestState({ status: "loading" });
    });

    void creatorRequest<ProjectEnvelope>(`projects/${encodeURIComponent(projectRef)}`, {
      signal: controller.signal,
    })
      .then(async ({ project }) => {
        const scope = resolveProjectSeriesScope(project.seriesRefs);
        if (scope.status === "blocked") {
          return {
            status: "blocked" as const,
            blocker: { ...scope, project },
          };
        }

        const planning = await creatorRequest<SeriesPlanningWorkspaceEnvelope>(
          scopedPath("series-planning-workspaces", projectRef, scope.seriesRef),
          { signal: controller.signal },
        );

        let intelligence: StoryIntelligenceRead;
        try {
          const response = await creatorRequest<SeriesIntelligenceWorkspaceEnvelope>(
            scopedPath("series-intelligence-workspaces", projectRef, scope.seriesRef),
            { signal: controller.signal },
          );
          intelligence = { status: "ready", workspace: response.workspace };
        } catch (error: unknown) {
          if (isWorkspaceDisconnected(error)) throw error;
          intelligence = {
            status: "blocked",
            error: workspaceErrorFromUnknown(error),
          };
        }

        return {
          status: "ready" as const,
          project,
          seriesRef: scope.seriesRef,
          planning: planning.workspace,
          intelligence,
        };
      })
      .then((nextState) => {
        if (!controller.signal.aborted) setRequestState(nextState);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setRequestState(failedRead(error));
      });

    return () => controller.abort();
  }, [connection.status, projectRef, revision]);

  const state = useMemo<StoryWorkspaceV3State>(() => {
    if (connection.status === "loading") return { status: "loading" };
    if (connection.status === "disconnected") {
      return { status: "disconnected", error: connection.error };
    }
    if (connection.status === "error") {
      return { status: "error", error: connection.error };
    }
    return requestState;
  }, [connection, requestState]);

  const refresh = useCallback(() => {
    setOperationError(null);
    if (connection.status === "connected") {
      setRevision((value) => value + 1);
    } else {
      refreshConnection();
    }
  }, [connection.status, refreshConnection]);

  const generateCandidate = useCallback(async () => {
    if (
      state.status !== "ready" ||
      state.planning.plan ||
      creativeInput.trim().length < 10 ||
      operation !== "idle"
    ) {
      return false;
    }

    setOperation("generating");
    setOperationError(null);
    setCandidate(null);
    setOperationMessage("正在生成系列规划候选；此操作不会建立规划版本。");
    try {
      const response = await creatorRequest<SeriesPlanCandidateEnvelope>(
        "series-plan-candidates",
        {
          method: "POST",
          body: {
            projectRef,
            seriesRef: state.seriesRef,
            creativeInput: creativeInput.trim(),
          },
        },
      );
      setCandidate(response.candidate);
      setOperationMessage("候选已返回，尚未写入系列规划，需要人工确认。");
      return true;
    } catch (error: unknown) {
      const detail = workspaceErrorFromUnknown(error);
      setOperationError(detail);
      setOperationMessage(detail.message);
      return false;
    } finally {
      setOperation("idle");
    }
  }, [creativeInput, operation, projectRef, state]);

  const confirmCandidate = useCallback(async () => {
    if (
      state.status !== "ready" ||
      state.planning.plan ||
      !candidate ||
      operation !== "idle"
    ) {
      return false;
    }

    setOperation("confirming");
    setOperationError(null);
    setOperationMessage("正在提交人工确认并建立系列规划版本。");
    try {
      await creatorRequest<ConfirmedSeriesPlanEnvelope>(
        "series-plans/confirm-candidate",
        {
          method: "POST",
          body: {
            projectRef,
            seriesRef: state.seriesRef,
            humanConfirmed: true,
            candidate,
          },
        },
      );
      setCandidate(null);
      setOperationMessage("系列规划已确认，正在重新读取当前版本和故事权威状态。");
      setRevision((value) => value + 1);
      return true;
    } catch (error: unknown) {
      const detail = workspaceErrorFromUnknown(error);
      setOperationError(detail);
      setOperationMessage(detail.message);
      return false;
    } finally {
      setOperation("idle");
    }
  }, [candidate, operation, projectRef, state]);

  const discardCandidate = useCallback(() => {
    if (operation !== "idle") return;
    setCandidate(null);
    setOperationError(null);
    setOperationMessage("未确认候选已在本地放弃，没有发送删除请求。");
  }, [operation]);

  return {
    state,
    refresh,
    creativeInput,
    setCreativeInput,
    candidate,
    operation,
    operationMessage,
    operationError,
    generateCandidate,
    confirmCandidate,
    discardCandidate,
  };
}
