"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  creatorRequest,
  useCreatorIntegration,
  type CreatorError,
  type CreatorProject,
  type ProjectEnvelope,
  type SeriesIntelligenceWorkspaceEnvelope,
  type SeriesPlanningWorkspaceEnvelope,
} from "@/features/core-integration";
import {
  isWorkspaceAbsent,
  isWorkspaceDisconnected,
  resolveProjectSeriesScope,
  workspaceErrorFromUnknown,
  type WorkspaceReadState,
} from "../shared";

export type CharacterIntelligenceRead =
  | {
      status: "ready";
      workspace: SeriesIntelligenceWorkspaceEnvelope["workspace"];
    }
  | { status: "blocked"; error: CreatorError }
  | { status: "source-missing" };

type CharacterReadyState = {
  project: CreatorProject;
  seriesRef: string;
  planning: SeriesPlanningWorkspaceEnvelope["workspace"];
  intelligence: CharacterIntelligenceRead;
};

type CharacterScopeBlocker = {
  code: string;
  message: string;
  project?: CreatorProject;
};

export type CharacterWorkspaceV3State = WorkspaceReadState<
  CharacterReadyState,
  CharacterScopeBlocker
>;

function scopedPath(resource: string, projectRef: string, seriesRef: string) {
  return `${resource}?${new URLSearchParams({ projectRef, seriesRef }).toString()}`;
}

function failedRead(error: unknown): CharacterWorkspaceV3State {
  const detail = workspaceErrorFromUnknown(error);
  if (isWorkspaceAbsent(error)) return { status: "absent", error: detail };
  if (isWorkspaceDisconnected(error)) return { status: "disconnected", error: detail };
  return { status: "error", error: detail };
}

export function useCharacterWorkspaceV3(projectRef: string) {
  const { state: connection, refresh: refreshConnection } = useCreatorIntegration();
  const [requestState, setRequestState] = useState<CharacterWorkspaceV3State>({
    status: "loading",
  });
  const [revision, setRevision] = useState(0);

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
            blocker: {
              code: scope.code,
              message: scope.message,
              project,
            },
          };
        }

        const planning = await creatorRequest<SeriesPlanningWorkspaceEnvelope>(
          scopedPath("series-planning-workspaces", projectRef, scope.seriesRef),
          { signal: controller.signal },
        );
        if (!planning.workspace.plan) {
          return {
            status: "ready" as const,
            project,
            seriesRef: scope.seriesRef,
            planning: planning.workspace,
            intelligence: { status: "source-missing" as const },
          };
        }

        let intelligence: CharacterIntelligenceRead;
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

  const state = useMemo<CharacterWorkspaceV3State>(() => {
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
    if (connection.status === "connected") {
      setRevision((value) => value + 1);
    } else {
      refreshConnection();
    }
  }, [connection.status, refreshConnection]);

  return { state, refresh };
}
