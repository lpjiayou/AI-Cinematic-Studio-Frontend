"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  creatorRequest, useCreatorIntegration, type ConfirmedSeriesPlanEnvelope, type CreatorError,
  type CreatorProject, type CreatorSeriesPlanCandidate, type ProjectEnvelope,
  type SeriesIntelligenceWorkspaceEnvelope, type SeriesPlanCandidateEnvelope,
  type SeriesPlanningWorkspaceEnvelope,
} from "@/features/core-integration";
import {
  isWorkspaceAbsent, isWorkspaceDisconnected, resolveProjectSeriesScope,
  workspaceErrorFromUnknown, type WorkspaceReadState,
} from "../shared";
import { WorkspaceRequestScope } from "../shared/workspace-request-scope";

export type StoryIntelligenceRead =
  | { status: "ready"; workspace: SeriesIntelligenceWorkspaceEnvelope["workspace"] }
  | { status: "blocked"; error: CreatorError };
type StoryReadyState = {
  project: CreatorProject;
  seriesRef: string;
  planning: SeriesPlanningWorkspaceEnvelope["workspace"];
  intelligence: StoryIntelligenceRead;
};
type StoryScopeBlocker = { code: string; message: string; project?: CreatorProject };
export type StoryWorkspaceV3State = WorkspaceReadState<StoryReadyState, StoryScopeBlocker>;
export type StoryWorkspaceOperation = "idle" | "generating" | "confirming";

type ScopedStoryCandidate = {
  sourceProjectRef: string;
  sourceSeriesRef: string;
  sourceInputRevision: number;
  requestGeneration: number;
  candidatePayload: CreatorSeriesPlanCandidate;
};
const initialMessage = "系列规划候选只有经过明确人工确认才会成为版本。";
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
  const [session] = useState(() => new WorkspaceRequestScope());
  const [owner, setOwner] = useState(projectRef);
  const [requestState, setRequestState] = useState<StoryWorkspaceV3State>({ status: "loading" });
  const [revision, setRevision] = useState(0);
  const [creativeInput, setInput] = useState("");
  const inputRevision = useRef(0);
  const [scopedCandidate, setCandidate] = useState<ScopedStoryCandidate | null>(null);
  const [operation, setOperation] = useState<StoryWorkspaceOperation>("idle");
  const [operationMessage, setOperationMessage] = useState(initialMessage);
  const [operationError, setOperationError] = useState<CreatorError | null>(null);

  // A project change must never commit the previous project's editable state.
  if (owner !== projectRef) {
    setOwner(projectRef); setRequestState({ status: "loading" });
    setInput(""); setCandidate(null); setOperation("idle");
    setOperationError(null); setOperationMessage(initialMessage);
  }
  useLayoutEffect(() => {
    session.activate(projectRef);
    inputRevision.current = 0;
    return () => session.dispose();
  }, [projectRef, session]);

  useEffect(() => {
    if (connection.status !== "connected") return;
    const read = session.beginRead();
    void (async () => {
      const { project } = await creatorRequest<ProjectEnvelope>(`projects/${encodeURIComponent(projectRef)}`, { signal: read.signal });
      if (!read.current()) return;
      const scope = resolveProjectSeriesScope(project.seriesRefs);
      const key = scope.status === "ready" ? JSON.stringify([projectRef, scope.seriesRef]) : null;
      if (session.bind(key)) {
        inputRevision.current = 0;
        setInput(""); setCandidate(null); setOperation("idle"); setOperationError(null);
        setOperationMessage(initialMessage); setRequestState({ status: "loading" });
      }
      if (scope.status === "blocked") {
        setRequestState({ status: "blocked", blocker: { ...scope, project } });
        return;
      }
      const planning = await creatorRequest<SeriesPlanningWorkspaceEnvelope>(scopedPath("series-planning-workspaces", projectRef, scope.seriesRef), { signal: read.signal });
      if (!read.current()) return;
      let intelligence: StoryIntelligenceRead;
      try {
        const response = await creatorRequest<SeriesIntelligenceWorkspaceEnvelope>(scopedPath("series-intelligence-workspaces", projectRef, scope.seriesRef), { signal: read.signal });
        intelligence = { status: "ready", workspace: response.workspace };
      } catch (error: unknown) {
        if (!read.current()) return;
        if (isWorkspaceDisconnected(error)) throw error;
        intelligence = { status: "blocked", error: workspaceErrorFromUnknown(error) };
      }
      if (read.current()) setRequestState({ status: "ready", project, seriesRef: scope.seriesRef, planning: planning.workspace, intelligence });
    })().catch((error: unknown) => {
      if (read.current()) setRequestState(failedRead(error));
    }).finally(read.finish);
    return read.abort;
  }, [connection.status, projectRef, revision, session]);

  const state: StoryWorkspaceV3State = connection.status === "connected" ? requestState
    : connection.status === "loading" ? { status: "loading" } : { status: connection.status, error: connection.error };
  const candidate = state.status === "ready" && scopedCandidate?.sourceProjectRef === projectRef &&
    scopedCandidate.sourceSeriesRef === state.seriesRef ? scopedCandidate.candidatePayload : null;

  function refresh() {
    if (!session.owns(projectRef)) return;
    if (connection.status === "connected") setRevision((value) => value + 1);
    else refreshConnection();
  }
  function setCreativeInput(value: string) {
    if (!session.owns(projectRef) || state.status !== "ready" || session.key !== JSON.stringify([projectRef, state.seriesRef])) return;
    inputRevision.current += 1;
    setInput(value); setCandidate(null);
  }
  function showError(error: unknown) {
    const detail = workspaceErrorFromUnknown(error);
    setOperationError(detail); setOperationMessage(detail.message);
  }

  async function generateCandidate() {
    if (state.status !== "ready" || state.planning.plan || creativeInput.trim().length < 10 || operation !== "idle") return false;
    const request = session.beginMutation(projectRef, JSON.stringify([projectRef, state.seriesRef]));
    if (!request) return false;
    const sourceInputRevision = inputRevision.current;
    setOperation("generating"); setOperationError(null); setCandidate(null);
    setOperationMessage("正在生成系列规划候选；此操作不会建立规划版本。");
    try {
      const response = await creatorRequest<SeriesPlanCandidateEnvelope>("series-plan-candidates", {
        method: "POST", signal: request.signal,
        body: { projectRef, seriesRef: state.seriesRef, creativeInput: creativeInput.trim() },
      });
      if (!request.current()) return false;
      if (inputRevision.current !== sourceInputRevision) {
        setOperationMessage("创意输入已修改，请根据当前输入重新生成候选。");
        return false;
      }
      setCandidate({ sourceProjectRef: projectRef, sourceSeriesRef: state.seriesRef, sourceInputRevision,
        requestGeneration: request.generation, candidatePayload: response.candidate });
      setOperationMessage("候选已返回，尚未写入系列规划，需要人工确认。");
      return true;
    } catch (error: unknown) { if (request.current()) showError(error); return false; }
    finally { if (request.current()) setOperation("idle"); request.finish(); }
  }

  async function confirmCandidate() {
    if (!session.owns(projectRef) || state.status !== "ready" || session.key !== JSON.stringify([projectRef, state.seriesRef]) ||
      state.planning.plan || !scopedCandidate || operation !== "idle") return false;
    if (scopedCandidate.sourceProjectRef !== projectRef || scopedCandidate.sourceSeriesRef !== state.seriesRef ||
      scopedCandidate.requestGeneration !== session.generation || scopedCandidate.sourceInputRevision !== inputRevision.current) {
      setCandidate(null); setOperationMessage("项目、系列或创意输入已变化，请重新生成当前范围的候选。");
      return false;
    }
    const request = session.beginMutation(projectRef, JSON.stringify([projectRef, state.seriesRef]));
    if (!request) return false;
    setOperation("confirming"); setOperationError(null); setOperationMessage("正在提交人工确认并建立系列规划版本。");
    try {
      await creatorRequest<ConfirmedSeriesPlanEnvelope>("series-plans/confirm-candidate", {
        method: "POST", signal: request.signal,
        body: { projectRef, seriesRef: state.seriesRef, humanConfirmed: true, candidate: scopedCandidate.candidatePayload },
      });
      if (!request.current()) return false;
      setCandidate(null); setOperationMessage("系列规划已确认，正在重新读取当前版本和故事权威状态。");
      setRevision((value) => value + 1);
      return true;
    } catch (error: unknown) { if (request.current()) showError(error); return false; }
    finally { if (request.current()) setOperation("idle"); request.finish(); }
  }

  function discardCandidate() {
    if (!session.owns(projectRef) || state.status !== "ready" || session.key !== JSON.stringify([projectRef, state.seriesRef]) || operation !== "idle") return;
    setCandidate(null); setOperationError(null);
    setOperationMessage("未确认候选已在本地放弃，没有发送删除请求。");
  }
  return { state, refresh, creativeInput, setCreativeInput, candidate, operation, operationMessage, operationError,
    generateCandidate, confirmCandidate, discardCandidate };
}
