"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CreatorClientError, creatorRequest, useCreatorIntegration,
  type CreatorEpisode, type CreatorError, type CreatorProject, type CreatorScriptVersion,
  type CreatorSeries, type EpisodeEnvelope, type ProjectEnvelope, type ScriptMutationEnvelope,
  type ScriptWorkspaceEnvelope, type SeriesEnvelope,
} from "@/features/core-integration";
import {
  isWorkspaceAbsent, isWorkspaceDisconnected, resolveProjectSeriesScope,
  workspaceErrorFromUnknown, type WorkspaceReadState,
} from "../shared";
import { WorkspaceRequestScope } from "../shared/workspace-request-scope";
import {
  applySavedScript, captureScriptSave, editScriptDraft, initialScriptDraft, scriptDraftDirty,
  type ScriptDraftState,
} from "./script-draft-state";

type ScriptReadyState = {
  project: CreatorProject;
  series: CreatorSeries;
  episodeRef: string | null;
  workspace: ScriptWorkspaceEnvelope["workspace"] | null;
};
type ScriptScopeBlocker = { code: string; message: string; project?: CreatorProject };
export type ScriptWorkspaceV3State = WorkspaceReadState<ScriptReadyState, ScriptScopeBlocker>;
export type ScriptWorkspaceOperation = "idle" | "creating-episode" | "generating" | "saving" | "confirming";
const initialMessage = "剧本操作只使用当前真实 Episode 与 ScriptVersion。";

function workspacePath(seriesRef: string, episodeRef: string) {
  return `script-workspaces?${new URLSearchParams({ seriesRef, episodeRef }).toString()}`;
}
function scopeKey(projectRef: string, seriesRef: string, episodeRef: string | null) {
  return JSON.stringify([projectRef, seriesRef, episodeRef]);
}
function failedRead(error: unknown): ScriptWorkspaceV3State {
  const detail = workspaceErrorFromUnknown(error);
  if (isWorkspaceAbsent(error)) return { status: "absent", error: detail };
  if (isWorkspaceDisconnected(error)) return { status: "disconnected", error: detail };
  return { status: "error", error: detail };
}

export function useScriptWorkspaceV3(projectRef: string) {
  const { state: connection, refresh: refreshConnection } = useCreatorIntegration();
  const [session] = useState(() => new WorkspaceRequestScope());
  const [owner, setOwner] = useState(projectRef);
  const [requestState, setRequestState] = useState<ScriptWorkspaceV3State>({ status: "loading" });
  const [requestedEpisodeRef, setRequestedEpisodeRef] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState(initialScriptDraft);
  const draftRef = useRef(draft);
  const [creativePlanRef, setCreativePlanRef] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [episodeTitle, setEpisodeTitle] = useState("第 1 集");
  const [operation, setOperation] = useState<ScriptWorkspaceOperation>("idle");
  const [operationMessage, setOperationMessage] = useState(initialMessage);
  const [operationError, setOperationError] = useState<CreatorError | null>(null);

  // React retries this render before committing children with another project's data.
  if (owner !== projectRef) {
    setOwner(projectRef);
    setRequestState({ status: "loading" });
    setRequestedEpisodeRef(null);
    setDraft(initialScriptDraft());
    setCreativePlanRef(""); setEpisodeNumber(1); setEpisodeTitle("第 1 集");
    setOperation("idle"); setOperationError(null); setOperationMessage(initialMessage);
  }

  const updateDraft = useCallback((next: ScriptDraftState) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  useLayoutEffect(() => {
    session.activate(projectRef);
    draftRef.current = initialScriptDraft();
    return () => session.dispose();
  }, [projectRef, session]);

  useEffect(() => {
    if (connection.status !== "connected") return;
    const read = session.beginRead();
    void (async () => {
      const { project } = await creatorRequest<ProjectEnvelope>(`projects/${encodeURIComponent(projectRef)}`, { signal: read.signal });
      if (!read.current()) return;
      const scope = resolveProjectSeriesScope(project.seriesRefs);
      if (scope.status === "blocked") {
        session.bind(null); updateDraft(initialScriptDraft());
        setRequestState({ status: "blocked", blocker: { code: scope.code, message: scope.message, project } });
        return;
      }
      const { series } = await creatorRequest<SeriesEnvelope>(`series/${encodeURIComponent(scope.seriesRef)}`, { signal: read.signal });
      if (!read.current()) return;
      const episodeRef = series.episodes.some((episode) => episode.episodeRef === requestedEpisodeRef)
        ? requestedEpisodeRef : series.episodes[0]?.episodeRef ?? null;
      const key = scopeKey(projectRef, scope.seriesRef, episodeRef);
      if (session.bind(key)) {
        updateDraft(initialScriptDraft());
        setRequestState({ status: "loading" });
        setOperation("idle"); setOperationError(null); setOperationMessage(initialMessage);
      }
      const workspace = episodeRef
        ? (await creatorRequest<ScriptWorkspaceEnvelope>(workspacePath(scope.seriesRef, episodeRef), { signal: read.signal })).workspace
        : null;
      if (!read.current()) return;
      const latest = workspace?.versions.at(-1) ?? null;
      const current = draftRef.current;
      if (current.scopeKey !== key || current.scriptVersionRef !== (latest?.scriptVersionRef ?? null)) {
        updateDraft(initialScriptDraft(key, latest?.scriptVersionRef ?? null, latest?.synopsis ?? ""));
      }
      setRequestState({ status: "ready", project, series, episodeRef, workspace });
    })().catch((error: unknown) => {
      if (read.current()) setRequestState(failedRead(error));
    }).finally(read.finish);
    return read.abort;
  }, [connection.status, projectRef, requestedEpisodeRef, revision, session, updateDraft]);

  const state: ScriptWorkspaceV3State = connection.status === "connected" ? requestState
    : connection.status === "loading" ? { status: "loading" }
      : { status: connection.status, error: connection.error };
  const latest: CreatorScriptVersion | null = state.status === "ready" ? state.workspace?.versions.at(-1) ?? null : null;
  const dirty = scriptDraftDirty(draft);
  const confirmed = Boolean(state.status === "ready" && latest && state.workspace?.script?.confirmedScriptVersionRef === latest.scriptVersionRef);
  const readyScopeKey = state.status === "ready" ? scopeKey(projectRef, state.series.seriesRef, state.episodeRef) : null;
  const canConfirm = Boolean(latest && readyScopeKey === draft.scopeKey && latest.scriptVersionRef === draft.scriptVersionRef && !dirty && !confirmed && operation === "idle");

  function setSynopsis(value: string) {
    if (!session.owns(projectRef) || draft.scopeKey !== draftRef.current.scopeKey) return;
    updateDraft(editScriptDraft(draftRef.current, value));
  }
  function refresh() {
    if (!session.owns(projectRef) || session.mutating) return;
    if (connection.status === "connected") setRevision((value) => value + 1);
    else refreshConnection();
  }
  function selectEpisode(episodeRef: string) {
    if (!session.owns(projectRef) || state.status !== "ready" || state.episodeRef === episodeRef ||
      !state.series.episodes.some((episode) => episode.episodeRef === episodeRef)) return;
    session.reset(); updateDraft(initialScriptDraft());
    setRequestState({ status: "loading" }); setRequestedEpisodeRef(episodeRef);
    setOperation("idle"); setOperationError(null); setOperationMessage(initialMessage);
  }
  function showError(error: unknown) {
    const detail = workspaceErrorFromUnknown(error);
    setOperationError(detail); setOperationMessage(detail.message);
  }

  async function saveManualVersion() {
    const snapshot = captureScriptSave(draftRef.current);
    if (state.status !== "ready" || !state.episodeRef || !state.workspace?.script || !latest ||
      !snapshot || snapshot.saveScopeKey !== readyScopeKey || snapshot.scriptVersionRef !== latest.scriptVersionRef ||
      !scriptDraftDirty(draftRef.current) || !snapshot.saveSnapshot || operation !== "idle") return false;
    const request = session.beginMutation(projectRef, snapshot.saveScopeKey);
    if (!request) return false;
    setOperation("saving"); setOperationError(null); setOperationMessage("正在追加人工修订版本。");
    try {
      // The public mutation's ScriptVersion is optional. Always verify the scoped GET.
      await creatorRequest<ScriptMutationEnvelope>("script-versions/manual", {
        method: "POST", signal: request.signal,
        body: { seriesRef: state.series.seriesRef, episodeRef: state.episodeRef,
          scriptRef: state.workspace.script.scriptRef, baseScriptVersionRef: snapshot.scriptVersionRef,
          content: { title: latest.title, logline: latest.logline, synopsis: snapshot.saveSnapshot,
            targetDurationSec: latest.targetDurationSec, scenes: latest.scenes } },
      });
      if (!request.current()) return false;
      const { workspace } = await creatorRequest<ScriptWorkspaceEnvelope>(workspacePath(state.series.seriesRef, state.episodeRef), { signal: request.signal });
      if (!request.current()) return false;
      const saved = workspace.versions.at(-1);
      if (!saved || saved.scriptRef !== latest.scriptRef || workspace.script?.scriptRef !== latest.scriptRef ||
        saved.synopsis.trim() !== snapshot.saveSnapshot) {
        throw new CreatorClientError(409, { code: "saved_script_read_unverified",
          message: "保存回读尚未确认提交的梗概，已保留当前修改，请重新读取后核对。" });
      }
      const nextDraft = applySavedScript(draftRef.current, snapshot, saved.scriptVersionRef, saved.synopsis);
      updateDraft(nextDraft);
      setRequestState({ ...state, workspace });
      const clean = !scriptDraftDirty(nextDraft);
      setOperationMessage(clean ? "人工修订版本已保存；确认仍是独立操作。" : "保存期间还有新的未保存修改。");
      return clean;
    } catch (error: unknown) {
      if (request.current()) showError(error);
      return false;
    } finally {
      if (request.current()) setOperation("idle");
      request.finish();
    }
  }

  async function createEpisode() {
    if (state.status !== "ready" || state.episodeRef || !readyScopeKey || operation !== "idle" ||
      !creativePlanRef.trim() || !episodeTitle.trim() || !Number.isInteger(episodeNumber) || episodeNumber < 1) return false;
    const request = session.beginMutation(projectRef, readyScopeKey);
    if (!request) return false;
    setOperation("creating-episode"); setOperationError(null); setOperationMessage("正在核对已确认导演方案并建立分集。");
    try {
      const response = await creatorRequest<EpisodeEnvelope>("episodes", {
        method: "POST", signal: request.signal,
        body: { seriesRef: state.series.seriesRef, creativePlanRef: creativePlanRef.trim(), episodeNumber,
          seasonNumber: 1, volumeNumber: 1, title: episodeTitle.trim() },
      });
      if (!request.current()) return false;
      setCreativePlanRef(""); setEpisodeNumber(1); setEpisodeTitle("第 1 集");
      setRequestedEpisodeRef(response.episode.episodeRef);
      setOperationMessage("分集已建立，可以生成第一版剧本。");
      return true;
    } catch (error: unknown) { if (request.current()) showError(error); return false; }
    finally { if (request.current()) setOperation("idle"); request.finish(); }
  }

  async function generateScript() {
    if (state.status !== "ready" || !state.episodeRef || state.workspace?.script || !readyScopeKey || operation !== "idle") return false;
    const request = session.beginMutation(projectRef, readyScopeKey);
    if (!request) return false;
    setOperation("generating"); setOperationError(null); setOperationMessage("正在用当前分集已绑定的确认方案建立第一版剧本。");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/generate", {
        method: "POST", signal: request.signal, body: { seriesRef: state.series.seriesRef, episodeRef: state.episodeRef },
      });
      if (!request.current()) return false;
      setOperationMessage("剧本 v1 已建立，正在读取当前版本。"); setRevision((value) => value + 1);
      return true;
    } catch (error: unknown) { if (request.current()) showError(error); return false; }
    finally { if (request.current()) setOperation("idle"); request.finish(); }
  }

  async function confirmVersion() {
    if (!canConfirm || state.status !== "ready" || !state.episodeRef || !state.workspace?.script || !latest || !readyScopeKey ||
      draftRef.current.scopeKey !== readyScopeKey || draftRef.current.scriptVersionRef !== latest.scriptVersionRef || scriptDraftDirty(draftRef.current)) return false;
    const request = session.beginMutation(projectRef, readyScopeKey);
    if (!request) return false;
    setOperation("confirming"); setOperationError(null); setOperationMessage("正在提交当前剧本版本的人工确认。");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/confirm", {
        method: "POST", signal: request.signal,
        body: { seriesRef: state.series.seriesRef, episodeRef: state.episodeRef, scriptRef: state.workspace.script.scriptRef,
          scriptVersionRef: latest.scriptVersionRef, humanConfirmed: true },
      });
      if (!request.current()) return false;
      setOperationMessage("当前剧本版本已确认，可作为后续分镜可信输入。分镜工作台尚未在本波次开放。");
      setRevision((value) => value + 1);
      return true;
    } catch (error: unknown) { if (request.current()) showError(error); return false; }
    finally { if (request.current()) setOperation("idle"); request.finish(); }
  }

  function discardDraft() {
    if (!session.owns(projectRef) || readyScopeKey !== draftRef.current.scopeKey || session.mutating) return;
    updateDraft(editScriptDraft(draftRef.current, draftRef.current.savedBaseline));
    setOperationError(null); setOperationMessage("未保存的梗概修改已放弃。");
  }
  const selectedEpisode: CreatorEpisode | null = state.status === "ready"
    ? state.series.episodes.find((episode) => episode.episodeRef === state.episodeRef) ?? null : null;
  return { state, refresh, selectEpisode, selectedEpisode, latest,
    synopsis: draft.currentDraft, savedBaseline: draft.savedBaseline, draftRevision: draft.draftRevision,
    scopeKey: draft.scopeKey, setSynopsis, dirty, confirmed, canConfirm, operation, operationMessage, operationError,
    creativePlanRef, setCreativePlanRef, episodeNumber, setEpisodeNumber, episodeTitle, setEpisodeTitle,
    createEpisode, generateScript, saveManualVersion, confirmVersion, discardDraft };
}
