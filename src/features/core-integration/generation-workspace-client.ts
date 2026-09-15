import { creatorRequest } from "./browser-client";

export type GenerationScope = { projectRef: string; seriesRef: string; episodeRef: string; productionRunRef: string };
export type GenerationView = GenerationScope & {
  schemaVersion: "creator.generation-workspace.v1"; workspaceRef: string;
  mediaJobRef: string; jobRevision: number; approvedPlanDigest: string;
  creativeShotVersionRef: string; beatRef: string;
  state: "QUEUED" | "LEASED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "UNKNOWN";
  attemptCount: number; activity: "IDLE" | "PREPARING" | "EXECUTING";
  errorCode: string | null; canPrepare: boolean; canExecute: boolean;
  publicationAllowed: false; automaticRetryAllowed: false;
  artifact: null | { sha256: string; byteSize: number; mediaType: "video/mp4"; width: number; height: number; durationFrames: number; frameRate: number };
};
const fields = ["schemaVersion", "workspaceRef", "projectRef", "seriesRef", "episodeRef", "productionRunRef", "mediaJobRef", "jobRevision", "approvedPlanDigest", "creativeShotVersionRef", "beatRef", "state", "attemptCount", "activity", "errorCode", "artifact", "canPrepare", "canExecute", "publicationAllowed", "automaticRetryAllowed"];
function record(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }
function ref(v: unknown): v is string { return typeof v === "string" && v.length > 0 && v.length <= 512 && v.trim() === v; }
function digest(v: unknown) { return typeof v === "string" && /^[a-f0-9]{64}$/.test(v); }
function integer(v: unknown, min = 0) { return typeof v === "number" && Number.isSafeInteger(v) && v >= min; }
export function parseGenerationWorkspace(value: unknown, scope?: GenerationScope): GenerationView {
  if (!record(value) || Object.keys(value).sort().join() !== "generation,ok" || value.ok !== true || !record(value.generation)) throw new Error("生成状态响应无效。");
  const g = value.generation;
  if (Object.keys(g).length !== fields.length || fields.some(k => !Object.hasOwn(g, k)) ||
      g.schemaVersion !== "creator.generation-workspace.v1" ||
      ["workspaceRef", "projectRef", "seriesRef", "episodeRef", "productionRunRef", "mediaJobRef", "creativeShotVersionRef", "beatRef"].some(k => !ref(g[k])) ||
      !digest(g.approvedPlanDigest) || !integer(g.jobRevision) || !integer(g.attemptCount) || (g.attemptCount as number) > 1 ||
      !["QUEUED", "LEASED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED", "UNKNOWN"].includes(String(g.state)) ||
      !["IDLE", "PREPARING", "EXECUTING"].includes(String(g.activity)) ||
      !(g.errorCode === null || (typeof g.errorCode === "string" && /^[A-Za-z0-9_]{1,80}$/.test(g.errorCode))) ||
      typeof g.canPrepare !== "boolean" || typeof g.canExecute !== "boolean" || g.publicationAllowed !== false || g.automaticRetryAllowed !== false ||
      ((g.canPrepare || g.canExecute) && (g.state !== "QUEUED" || g.activity !== "IDLE" || g.attemptCount !== 0)) ||
      (scope && (["projectRef", "seriesRef", "episodeRef", "productionRunRef"] as const).some(k => g[k] !== scope[k]))) throw new Error("生成状态或项目血缘不匹配。");
  if (g.artifact !== null) {
    const a = g.artifact;
    if (!record(a) || Object.keys(a).sort().join() !== ["sha256", "byteSize", "mediaType", "width", "height", "durationFrames", "frameRate"].sort().join() ||
        g.state !== "SUCCEEDED" || !digest(a.sha256) || a.mediaType !== "video/mp4" ||
        ["byteSize", "width", "height", "durationFrames", "frameRate"].some(k => !integer(a[k], 1))) throw new Error("视频结果响应无效。");
  }
  return g as GenerationView;
}
export function generationPath(scope: GenerationScope) {
  return `episode-production-runs/${encodeURIComponent(scope.productionRunRef)}/generation`;
}
export function generationQuery(scope: GenerationScope) {
  return new URLSearchParams({ projectRef: scope.projectRef, seriesRef: scope.seriesRef, episodeRef: scope.episodeRef });
}
export async function readGeneration(scope: GenerationScope, signal?: AbortSignal) {
  return parseGenerationWorkspace(await creatorRequest<unknown>(`${generationPath(scope)}?${generationQuery(scope)}`, { signal }), scope);
}
export async function startGeneration(view: GenerationView, operation: "PREPARE" | "EXECUTE_APPROVED", signal?: AbortSignal) {
  const result = await creatorRequest<{ ok: true; accepted: boolean }>(generationPath(view), { method: "POST", signal, body: {
    projectRef: view.projectRef, seriesRef: view.seriesRef, episodeRef: view.episodeRef,
    operation, mediaJobRef: view.mediaJobRef, expectedJobRevision: view.jobRevision, approvedPlanDigest: view.approvedPlanDigest,
  } });
  if (result.accepted !== true) throw new Error("操作未被接受，请刷新状态；不要重复提交。");
}
export function generationContentUrl(view: GenerationView) {
  if (!view.artifact) return undefined;
  const query = generationQuery(view);
  query.set("mediaJobRef", view.mediaJobRef); query.set("sha256", view.artifact.sha256);
  return `/api/creator/${generationPath(view)}/content?${query}`;
}
