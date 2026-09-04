"use client";

import { useCallback, useEffect, useState } from "react";
import {
  creatorRequest,
  CreatorClientError,
  useCreatorIntegration,
  type CreatorError,
  type CreatorProject,
  type ProjectsEnvelope,
} from "@/features/core-integration";

export type V3ProjectCollectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; projects: CreatorProject[] }
  | { status: "empty" }
  | { status: "disconnected"; error: CreatorError }
  | { status: "error"; error: CreatorError };

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isCreatorProject(value: unknown): value is CreatorProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<CreatorProject>;
  return (
    typeof project.schemaVersion === "string" &&
    typeof project.projectRef === "string" &&
    project.projectRef.length > 0 &&
    typeof project.projectType === "string" &&
    typeof project.title === "string" &&
    typeof project.description === "string" &&
    typeof project.targetPlatform === "string" &&
    typeof project.aspectRatio === "string" &&
    typeof project.defaultDurationSec === "number" &&
    typeof project.plannedEpisodeCount === "number" &&
    typeof project.status === "string" &&
    isStringArray(project.seriesRefs) &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string" &&
    typeof project.version === "number"
  );
}

function isProjectsEnvelope(value: unknown): value is ProjectsEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<ProjectsEnvelope>;
  return envelope.ok === true && Array.isArray(envelope.projects) && envelope.projects.every(isCreatorProject);
}

function sortProjectsByUpdatedAt(projects: CreatorProject[]) {
  return [...projects].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

export function useV3ProjectCollection() {
  const { state: connection, refresh: refreshConnection } = useCreatorIntegration();
  const [requestState, setRequestState] = useState<V3ProjectCollectionState>({ status: "idle" });
  const [requestRevision, setRequestRevision] = useState(0);

  useEffect(() => {
    if (connection.status !== "connected") return;

    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) setRequestState({ status: "loading" });
    });
    void creatorRequest<ProjectsEnvelope>("projects", { signal: controller.signal })
      .then((payload) => {
        if (!isProjectsEnvelope(payload)) {
          throw new CreatorClientError(502, {
            code: "project_collection_contract_mismatch",
            message: "项目集合返回了无法识别的数据。",
          });
        }
        if (payload.projects.length === 0) {
          setRequestState({ status: "empty" });
          return;
        }
        setRequestState({
          status: "ready",
          projects: sortProjectsByUpdatedAt(payload.projects),
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const detail = error instanceof CreatorClientError
          ? error.detail
          : {
              code: "project_collection_unavailable",
              message: "项目集合无法读取，请稍后重试。",
            };
        setRequestState({ status: "error", error: detail });
      });

    return () => controller.abort();
  }, [connection.status, requestRevision]);

  const refresh = useCallback(() => {
    if (connection.status === "connected") {
      setRequestRevision((value) => value + 1);
      return;
    }
    refreshConnection();
  }, [connection.status, refreshConnection]);

  if (connection.status === "loading") {
    return { state: { status: "loading" } as V3ProjectCollectionState, refresh };
  }
  if (connection.status === "disconnected") {
    return {
      state: { status: "disconnected", error: connection.error } as V3ProjectCollectionState,
      refresh,
    };
  }
  if (connection.status === "error") {
    return {
      state: { status: "error", error: connection.error } as V3ProjectCollectionState,
      refresh,
    };
  }
  return { state: requestState, refresh };
}
