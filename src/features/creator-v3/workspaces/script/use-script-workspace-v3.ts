"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  creatorRequest,
  useCreatorIntegration,
  type CreatorEpisode,
  type CreatorError,
  type CreatorProject,
  type CreatorScriptVersion,
  type CreatorSeries,
  type EpisodeEnvelope,
  type ProjectEnvelope,
  type ScriptMutationEnvelope,
  type ScriptWorkspaceEnvelope,
  type SeriesEnvelope,
} from "@/features/core-integration";
import {
  isWorkspaceAbsent,
  isWorkspaceDisconnected,
  resolveProjectSeriesScope,
  workspaceErrorFromUnknown,
  type WorkspaceReadState,
} from "../shared";
import { isScriptSynopsisDirty } from "./script-unsaved-guard";

type ScriptReadyState = {
  project: CreatorProject;
  series: CreatorSeries;
  episodeRef: string | null;
  workspace: ScriptWorkspaceEnvelope["workspace"] | null;
};

type ScriptScopeBlocker = {
  code: string;
  message: string;
  project?: CreatorProject;
};

export type ScriptWorkspaceV3State = WorkspaceReadState<
  ScriptReadyState,
  ScriptScopeBlocker
>;

export type ScriptWorkspaceOperation =
  | "idle"
  | "creating-episode"
  | "generating"
  | "saving"
  | "confirming";

function workspacePath(seriesRef: string, episodeRef: string) {
  return `script-workspaces?${new URLSearchParams({ seriesRef, episodeRef }).toString()}`;
}

function failedRead(error: unknown): ScriptWorkspaceV3State {
  const detail = workspaceErrorFromUnknown(error);
  if (isWorkspaceAbsent(error)) return { status: "absent", error: detail };
  if (isWorkspaceDisconnected(error)) return { status: "disconnected", error: detail };
  return { status: "error", error: detail };
}

export function useScriptWorkspaceV3(projectRef: string) {
  const { state: connection, refresh: refreshConnection } = useCreatorIntegration();
  const [requestState, setRequestState] = useState<ScriptWorkspaceV3State>({
    status: "loading",
  });
  const [requestedEpisodeRef, setRequestedEpisodeRef] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [synopsis, setSynopsis] = useState("");
  const [creativePlanRef, setCreativePlanRef] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [episodeTitle, setEpisodeTitle] = useState("第 1 集");
  const [operation, setOperation] = useState<ScriptWorkspaceOperation>("idle");
  const [operationMessage, setOperationMessage] = useState(
    "剧本操作只使用当前真实 Episode 与 ScriptVersion。",
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
            blocker: {
              code: scope.code,
              message: scope.message,
              project,
            },
          };
        }

        const { series } = await creatorRequest<SeriesEnvelope>(
          `series/${encodeURIComponent(scope.seriesRef)}`,
          { signal: controller.signal },
        );
        const requestedExists = series.episodes.some(
          (episode) => episode.episodeRef === requestedEpisodeRef,
        );
        const episodeRef = requestedExists
          ? requestedEpisodeRef
          : series.episodes[0]?.episodeRef ?? null;
        const workspace = episodeRef
          ? (
              await creatorRequest<ScriptWorkspaceEnvelope>(
                workspacePath(scope.seriesRef, episodeRef),
                { signal: controller.signal },
              )
            ).workspace
          : null;

        return {
          status: "ready" as const,
          project,
          series,
          episodeRef,
          workspace,
        };
      })
      .then((nextState) => {
        if (controller.signal.aborted) return;
        setRequestState(nextState);
        if (nextState.status === "ready") {
          setRequestedEpisodeRef(nextState.episodeRef);
          setSynopsis(nextState.workspace?.versions.at(-1)?.synopsis ?? "");
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setRequestState(failedRead(error));
      });

    return () => controller.abort();
  }, [connection.status, projectRef, requestedEpisodeRef, revision]);

  const state = useMemo<ScriptWorkspaceV3State>(() => {
    if (connection.status === "loading") return { status: "loading" };
    if (connection.status === "disconnected") {
      return { status: "disconnected", error: connection.error };
    }
    if (connection.status === "error") {
      return { status: "error", error: connection.error };
    }
    return requestState;
  }, [connection, requestState]);

  const latest: CreatorScriptVersion | null =
    state.status === "ready" ? state.workspace?.versions.at(-1) ?? null : null;
  const dirty = latest ? isScriptSynopsisDirty(synopsis, latest.synopsis) : false;
  const confirmed = Boolean(
    state.status === "ready" &&
      state.workspace?.script?.confirmedScriptVersionRef &&
      state.workspace.script.confirmedScriptVersionRef === latest?.scriptVersionRef,
  );

  const refresh = useCallback(() => {
    setOperationError(null);
    if (connection.status === "connected") {
      setRevision((value) => value + 1);
    } else {
      refreshConnection();
    }
  }, [connection.status, refreshConnection]);

  const selectEpisode = useCallback((episodeRef: string) => {
    setOperationError(null);
    setRequestedEpisodeRef(episodeRef);
  }, []);

  const createEpisode = useCallback(async () => {
    if (
      state.status !== "ready" ||
      state.episodeRef ||
      operation !== "idle" ||
      !creativePlanRef.trim() ||
      !episodeTitle.trim() ||
      !Number.isInteger(episodeNumber) ||
      episodeNumber < 1
    ) {
      return false;
    }

    setOperation("creating-episode");
    setOperationError(null);
    setOperationMessage("正在核对已确认导演方案并建立分集。");
    try {
      const response = await creatorRequest<EpisodeEnvelope>("episodes", {
        method: "POST",
        body: {
          seriesRef: state.series.seriesRef,
          creativePlanRef: creativePlanRef.trim(),
          episodeNumber,
          seasonNumber: 1,
          volumeNumber: 1,
          title: episodeTitle.trim(),
        },
      });
      setCreativePlanRef("");
      setEpisodeNumber(1);
      setEpisodeTitle("第 1 集");
      setRequestedEpisodeRef(response.episode.episodeRef);
      setOperationMessage("分集已建立，可以生成第一版剧本。");
      return true;
    } catch (error: unknown) {
      const detail = workspaceErrorFromUnknown(error);
      setOperationError(detail);
      setOperationMessage(detail.message);
      return false;
    } finally {
      setOperation("idle");
    }
  }, [creativePlanRef, episodeNumber, episodeTitle, operation, state]);

  const generateScript = useCallback(async () => {
    if (
      state.status !== "ready" ||
      !state.episodeRef ||
      state.workspace?.script ||
      operation !== "idle"
    ) {
      return false;
    }

    setOperation("generating");
    setOperationError(null);
    setOperationMessage("正在用当前分集已绑定的确认方案建立第一版剧本。");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/generate", {
        method: "POST",
        body: {
          seriesRef: state.series.seriesRef,
          episodeRef: state.episodeRef,
        },
      });
      setOperationMessage("剧本 v1 已建立，正在读取当前版本。");
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
  }, [operation, state]);

  const saveManualVersion = useCallback(async () => {
    if (
      state.status !== "ready" ||
      !state.episodeRef ||
      !state.workspace?.script ||
      !latest ||
      !dirty ||
      !synopsis.trim() ||
      operation !== "idle"
    ) {
      return false;
    }

    setOperation("saving");
    setOperationError(null);
    setOperationMessage("正在追加人工修订版本。");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/manual", {
        method: "POST",
        body: {
          seriesRef: state.series.seriesRef,
          episodeRef: state.episodeRef,
          scriptRef: state.workspace.script.scriptRef,
          baseScriptVersionRef: latest.scriptVersionRef,
          content: {
            title: latest.title,
            logline: latest.logline,
            synopsis: synopsis.trim(),
            targetDurationSec: latest.targetDurationSec,
            scenes: latest.scenes,
          },
        },
      });
      setOperationMessage("人工修订版本已保存；确认仍是独立操作。");
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
  }, [dirty, latest, operation, state, synopsis]);

  const confirmVersion = useCallback(async () => {
    if (
      state.status !== "ready" ||
      !state.episodeRef ||
      !state.workspace?.script ||
      !latest ||
      dirty ||
      confirmed ||
      operation !== "idle"
    ) {
      return false;
    }

    setOperation("confirming");
    setOperationError(null);
    setOperationMessage("正在提交当前剧本版本的人工确认。");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/confirm", {
        method: "POST",
        body: {
          seriesRef: state.series.seriesRef,
          episodeRef: state.episodeRef,
          scriptRef: state.workspace.script.scriptRef,
          scriptVersionRef: latest.scriptVersionRef,
          humanConfirmed: true,
        },
      });
      setOperationMessage(
        "当前剧本版本已确认，可作为后续分镜可信输入。分镜工作台尚未在本波次开放。",
      );
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
  }, [confirmed, dirty, latest, operation, state]);

  const discardDraft = useCallback(() => {
    setSynopsis(latest?.synopsis ?? "");
    setOperationError(null);
    setOperationMessage("未保存的梗概修改已放弃。");
  }, [latest]);

  const selectedEpisode: CreatorEpisode | null =
    state.status === "ready"
      ? state.series.episodes.find(
          (episode) => episode.episodeRef === state.episodeRef,
        ) ?? null
      : null;

  return {
    state,
    refresh,
    selectEpisode,
    selectedEpisode,
    latest,
    synopsis,
    setSynopsis,
    dirty,
    confirmed,
    operation,
    operationMessage,
    operationError,
    creativePlanRef,
    setCreativePlanRef,
    episodeNumber,
    setEpisodeNumber,
    episodeTitle,
    setEpisodeTitle,
    createEpisode,
    generateScript,
    saveManualVersion,
    confirmVersion,
    discardDraft,
  };
}
