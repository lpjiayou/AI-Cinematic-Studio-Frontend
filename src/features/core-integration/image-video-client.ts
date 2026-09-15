import { creatorRequest } from "./browser-client";
import { generationQuery, type GenerationScope } from "./generation-workspace-client";

export const IMAGE_VIDEO_MAX_BYTES = 8 * 1024 * 1024;
export const IMAGE_VIDEO_MAX_DESCRIPTION = 1000;
export type ImageVideoPolicy = {
  policyDigest: string; maxInputBytes: number; maxDescriptionChars: number;
  output: { width: 704; height: 1280; durationFrames: 48; frameRate: 24 };
  maxCostMinor: number; currency: "CNY"; executionTimeoutSeconds: number;
};
export type ImageVideoGeneration = GenerationScope & {
  schemaVersion: "creator.image-video-generation.v1"; generationRef: string;
  mediaJobRef: string | null; state: "PREPARING" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "UNKNOWN";
  attemptCount: 0 | 1; description: string; inputSha256: string; createdAt: string; errorCode: string | null;
  artifact: null | { sha256: string; byteSize: number; mediaType: "video/mp4"; width: number; height: number; durationFrames: number; frameRate: number };
  publicationAllowed: false; automaticRetryAllowed: false;
};
export type ImageVideoWorkspace = GenerationScope & {
  schemaVersion: "creator.image-video-workspace.v1"; policy: ImageVideoPolicy | null;
  available: boolean; reason: string | null; generations: ImageVideoGeneration[];
};
export type RuntimeEnvironment = GenerationScope & {
  schemaVersion: "creator.runtime-environment.v1";
  observedAt: string | null;
  core: "CONNECTED";
  operator: "READY" | "UNAVAILABLE";
  gpu: "CONNECTED" | "UNAVAILABLE";
  comfyui: "CONNECTED" | "UNAVAILABLE";
  queue: {
    state: "IDLE" | "BUSY" | "UNAVAILABLE";
    runningCount: number | null;
    pendingCount: number | null;
  };
  readOnly: true;
};
export type ImageVideoCommand = Pick<GenerationScope, "projectRef" | "seriesRef" | "episodeRef"> & {
  description: string; imageBase64: string; imageMediaType: "image/png" | "image/jpeg";
  idempotencyKey: string; expectedPolicyDigest: string;
};
const scopeFields = ["projectRef", "seriesRef", "episodeRef", "productionRunRef"] as const;
function fields(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function ref(value: unknown): value is string { return typeof value === "string" && value.trim() === value && value.length > 0 && value.length <= 512; }
function digest(value: unknown): value is string { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function integer(value: unknown, minimum = 0): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum; }
function matchesScope(value: Record<string, unknown>, scope: GenerationScope) { return scopeFields.every(key => ref(value[key]) && value[key] === scope[key]); }
function optionalCode(value: unknown) { return value === null || (typeof value === "string" && /^[A-Za-z0-9_]{1,100}$/.test(value)); }
export function validImageVideoCommand(value: unknown): value is ImageVideoCommand {
  if (!fields(value, ["projectRef", "seriesRef", "episodeRef", "description", "imageBase64", "imageMediaType", "idempotencyKey", "expectedPolicyDigest"]) ||
      ![value.projectRef, value.seriesRef, value.episodeRef].every(ref) ||
      typeof value.description !== "string" || !value.description.trim() || [...value.description].length > IMAGE_VIDEO_MAX_DESCRIPTION ||
      !["image/png", "image/jpeg"].includes(String(value.imageMediaType)) ||
      typeof value.idempotencyKey !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value.idempotencyKey) ||
      !digest(value.expectedPolicyDigest) || typeof value.imageBase64 !== "string" ||
      !value.imageBase64.length || value.imageBase64.length > Math.ceil(IMAGE_VIDEO_MAX_BYTES / 3) * 4 || value.imageBase64.length % 4 !== 0) return false;
  const padding = value.imageBase64.endsWith("==") ? 2 : value.imageBase64.endsWith("=") ? 1 : 0;
  // A repeated four-character regex group over an 8 MB image can exhaust the
  // JS regex stack. Use a linear invalid-character scan, after checking size.
  return value.imageBase64.length / 4 * 3 - padding <= IMAGE_VIDEO_MAX_BYTES &&
    !/[^A-Za-z0-9+/]/.test(value.imageBase64.slice(0, value.imageBase64.length - padding));
}
function parseGeneration(value: unknown, scope: GenerationScope): ImageVideoGeneration {
  if (!fields(value, ["schemaVersion", ...scopeFields, "generationRef", "mediaJobRef", "state", "attemptCount", "description", "inputSha256", "createdAt", "errorCode", "artifact", "publicationAllowed", "automaticRetryAllowed"]) ||
      value.schemaVersion !== "creator.image-video-generation.v1" || !matchesScope(value, scope) || !ref(value.generationRef) ||
      !(value.mediaJobRef === null || ref(value.mediaJobRef)) ||
      !["PREPARING", "QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "UNKNOWN"].includes(String(value.state)) ||
      (value.attemptCount !== 0 && value.attemptCount !== 1) ||
      typeof value.description !== "string" || !value.description.trim() || [...value.description].length > IMAGE_VIDEO_MAX_DESCRIPTION ||
      !digest(value.inputSha256) || typeof value.createdAt !== "string" || value.createdAt.length > 64 ||
      !/(?:Z|[+-]\d{2}:\d{2})$/.test(value.createdAt) || !Number.isFinite(Date.parse(value.createdAt)) ||
      !optionalCode(value.errorCode) || value.publicationAllowed !== false || value.automaticRetryAllowed !== false) throw new Error("图片视频作业响应或项目血缘无效。");
  if (value.artifact !== null) {
    const artifact = value.artifact;
    if (!fields(artifact, ["sha256", "byteSize", "mediaType", "width", "height", "durationFrames", "frameRate"]) ||
        value.state !== "SUCCEEDED" || !ref(value.mediaJobRef) || value.attemptCount !== 1 ||
        !digest(artifact.sha256) || !integer(artifact.byteSize, 1) || artifact.mediaType !== "video/mp4" ||
        artifact.width !== 704 || artifact.height !== 1280 || artifact.durationFrames !== 48 || artifact.frameRate !== 24) throw new Error("图片视频结果规格无效。");
  }
  if (value.state === "SUCCEEDED" && value.artifact === null) throw new Error("生成成功的作业缺少视频结果。");
  return value as ImageVideoGeneration;
}
export function parseImageVideoGeneration(value: unknown, scope: GenerationScope, generationRef?: string): ImageVideoGeneration {
  if (!fields(value, ["ok", "generation"]) || value.ok !== true) throw new Error("图片视频响应无效。");
  const generation = parseGeneration(value.generation, scope);
  if (generationRef && generation.generationRef !== generationRef) throw new Error("图片视频作业引用不匹配。");
  return generation;
}
export function parseImageVideoWorkspace(value: unknown, scope: GenerationScope): ImageVideoWorkspace {
  if (!fields(value, ["ok", "workspace"]) || value.ok !== true ||
      !fields(value.workspace, ["schemaVersion", ...scopeFields, "policy", "available", "reason", "generations"])) throw new Error("图片视频工作区响应无效。");
  const workspace = value.workspace;
  if (workspace.schemaVersion !== "creator.image-video-workspace.v1" || !matchesScope(workspace, scope) ||
      typeof workspace.available !== "boolean" || !optionalCode(workspace.reason) || !Array.isArray(workspace.generations)) throw new Error("图片视频工作区范围无效。");
  if (workspace.policy !== null) {
    const policy = workspace.policy;
    if (!fields(policy, ["policyDigest", "maxInputBytes", "maxDescriptionChars", "output", "maxCostMinor", "currency", "executionTimeoutSeconds"]) ||
        !digest(policy.policyDigest) || policy.maxInputBytes !== IMAGE_VIDEO_MAX_BYTES || policy.maxDescriptionChars !== IMAGE_VIDEO_MAX_DESCRIPTION ||
        !integer(policy.maxCostMinor, 1) || policy.currency !== "CNY" || !integer(policy.executionTimeoutSeconds, 1) ||
        !fields(policy.output, ["width", "height", "durationFrames", "frameRate"]) || policy.output.width !== 704 || policy.output.height !== 1280 ||
        policy.output.durationFrames !== 48 || policy.output.frameRate !== 24) throw new Error("图片视频费用与规格策略无效。");
  }
  if (workspace.available && (workspace.policy === null || workspace.reason !== null)) throw new Error("生成可用状态与服务策略不一致。");
  const generations = workspace.generations.map(generation => parseGeneration(generation, scope));
  if (new Set(generations.map(g => g.generationRef)).size !== generations.length) throw new Error("图片视频历史包含重复作业。");
  return { ...workspace, generations } as ImageVideoWorkspace;
}
export function parseRuntimeEnvironment(value: unknown, scope: GenerationScope): RuntimeEnvironment {
  if (!fields(value, ["ok", "environment"]) || value.ok !== true ||
      !fields(value.environment, ["schemaVersion", ...scopeFields, "observedAt", "core", "operator", "gpu", "comfyui", "queue", "readOnly"])) {
    throw new Error("运行环境响应无效。");
  }
  const environment = value.environment;
  if (environment.schemaVersion !== "creator.runtime-environment.v1" || !matchesScope(environment, scope) ||
      environment.core !== "CONNECTED" || !["READY", "UNAVAILABLE"].includes(String(environment.operator)) ||
      !["CONNECTED", "UNAVAILABLE"].includes(String(environment.gpu)) ||
      !["CONNECTED", "UNAVAILABLE"].includes(String(environment.comfyui)) || environment.readOnly !== true ||
      !(environment.observedAt === null || (typeof environment.observedAt === "string" && environment.observedAt.length <= 64 &&
        /(?:Z|[+-]\d{2}:\d{2})$/.test(environment.observedAt) && Number.isFinite(Date.parse(environment.observedAt)))) ||
      !fields(environment.queue, ["state", "runningCount", "pendingCount"]) ||
      !["IDLE", "BUSY", "UNAVAILABLE"].includes(String(environment.queue.state))) {
    throw new Error("运行环境状态或项目血缘无效。");
  }
  const queue = environment.queue;
  const unavailable = queue.state === "UNAVAILABLE";
  if (unavailable !== (queue.runningCount === null && queue.pendingCount === null) ||
      (!unavailable && (!integer(queue.runningCount) || !integer(queue.pendingCount))) ||
      (queue.state === "IDLE" && (queue.runningCount !== 0 || queue.pendingCount !== 0)) ||
      (queue.state === "BUSY" && Number(queue.runningCount) + Number(queue.pendingCount) < 1) ||
      ((environment.gpu === "CONNECTED" && environment.comfyui === "CONNECTED") !== (environment.observedAt !== null))) {
    throw new Error("运行环境队列状态无效。");
  }
  return environment as RuntimeEnvironment;
}
export function imageVideoPath(scope: GenerationScope) { return `episode-production-runs/${encodeURIComponent(scope.productionRunRef)}/image-video-generations`; }
export async function readImageVideoWorkspace(scope: GenerationScope, signal?: AbortSignal) {
  return parseImageVideoWorkspace(await creatorRequest<unknown>(`${imageVideoPath(scope)}?${generationQuery(scope)}`, { signal }), scope);
}
export async function readImageVideoGeneration(scope: GenerationScope, generationRef: string, signal?: AbortSignal) {
  return parseImageVideoGeneration(await creatorRequest<unknown>(`${imageVideoPath(scope)}/${encodeURIComponent(generationRef)}?${generationQuery(scope)}`, { signal }), scope, generationRef);
}
export async function readRuntimeEnvironment(scope: GenerationScope, signal?: AbortSignal) {
  return parseRuntimeEnvironment(await creatorRequest<unknown>(`${imageVideoPath(scope)}/runtime-environment?${generationQuery(scope)}`, { signal }), scope);
}
export async function createImageVideoGeneration(scope: GenerationScope, command: ImageVideoCommand, signal?: AbortSignal) {
  if (!validImageVideoCommand(command) || ["projectRef", "seriesRef", "episodeRef"].some(key => command[key as keyof ImageVideoCommand] !== scope[key as keyof GenerationScope])) throw new Error("图片视频输入无效。");
  return parseImageVideoGeneration(await creatorRequest<unknown>(imageVideoPath(scope), { method: "POST", body: command, signal }), scope);
}
export function imageVideoContentUrl(generation: ImageVideoGeneration) {
  if (generation.state !== "SUCCEEDED" || !generation.artifact) return undefined;
  const query = generationQuery(generation); query.set("sha256", generation.artifact.sha256);
  return `/api/creator/${imageVideoPath(generation)}/${encodeURIComponent(generation.generationRef)}/content?${query}`;
}
