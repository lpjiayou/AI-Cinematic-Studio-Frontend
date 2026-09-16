import "server-only";

import { getCreatorServerConfig } from "./server-config";
import { AUDIO_TYPES, EXECUTION_METHOD_BY_CLASS, METHOD_AWARE_RESOURCES, METHOD_INPUT_ROLES, type MethodAwareResource } from "./method-aware-contracts";
import { parseExecutionMethodPlan, parseExplicitAudioRequirementRoute, parseMethodAwareInputPlan, parseMethodAwareVideoRoute } from "./method-aware-validators";
import { CreatorClientError } from "./browser-client";
import { parseGenerationWorkspace } from "./generation-workspace-client";
import { IMAGE_VIDEO_MAX_BYTES, parseImageVideoGeneration, parseImageVideoWorkspace, validImageVideoCommand } from "./image-video-client";

const MAX_REQUEST_BYTES = 512_000;
const CORE_PREFIX = "/creator/api/v1";

const exactMethods = new Map<string, ReadonlySet<string>>([
  ["capabilities", new Set(["GET"])],
  ["ai-director/candidates", new Set(["POST"])],
  ["creative-plans/confirm", new Set(["POST"])],
  ["series", new Set(["GET", "POST"])],
  ["projects", new Set(["GET", "POST"])],
  ["project-contexts", new Set(["GET"])],
  ["episodes", new Set(["POST"])],
  ["script-workspaces", new Set(["GET"])],
  ["script-workspaces/storyboard-bootstrap", new Set(["GET"])],
  ["script-versions/generate", new Set(["POST"])],
  ["script-versions/manual", new Set(["POST"])],
  ["script-versions/rewrite-scene", new Set(["POST"])],
  ["script-versions/confirm", new Set(["POST"])],
  ["series-planning-workspaces", new Set(["GET"])],
  ["series-planning-workspaces/m6-bootstrap", new Set(["GET"])],
  ["series-plan-candidates", new Set(["POST"])],
  ["series-plans/confirm-candidate", new Set(["POST"])],
  ["series-plan-versions/manual", new Set(["POST"])],
  ["series-plan-versions/confirm", new Set(["POST"])],
  ["series-intelligence-workspaces", new Set(["GET"])],
  ["series-intelligence/bible-versions", new Set(["POST"])],
  ["series-intelligence/bible-candidates", new Set(["POST"])],
  ["series-intelligence/bible-confirmations", new Set(["POST"])],
  ["series-intelligence/character-versions", new Set(["POST"])],
  ["series-intelligence/character-candidates", new Set(["POST"])],
  ["series-intelligence/character-confirmations", new Set(["POST"])],
  ["series-intelligence/baseline-activations", new Set(["POST"])],
  ["episode-production-runs", new Set(["GET", "POST"])],
]);

const detailResources = new Map<string, ReadonlySet<string>>([
  ["projects", new Set(["GET"])],
  ["series", new Set(["GET", "DELETE"])],
  ["episodes", new Set(["GET", "DELETE"])],
]);

function errorResponse(status: number, code: string, message: string) {
  return Response.json(
    { ok: false, error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function normalizePath(path: string[]) {
  if (!path.length || path.some((part) => !part || part === "." || part === "..")) {
    return null;
  }
  return path.map((part) => encodeURIComponent(part)).join("/");
}

function isAllowed(path: string, method: string) {
  const exact = exactMethods.get(path);
  if (exact) return exact.has(method);
  const parts = path.split("/");
  if (parts[0] === "episode-production-runs") {
    if (parts.length === 2) return method === "GET";
    if (parts.length === 3) {
      const resource = parts[2];
      if (resource === "generation") return method === "GET" || method === "POST";
      if (resource === "image-video-generations") return method === "GET" || method === "POST";
      if (METHOD_AWARE_RESOURCES.some((value) => value === resource)) {
        return method === "GET" || method === "POST";
      }
      if (
        resource === "delivery" ||
        resource === "production-readiness" ||
        resource === "state-projection" ||
        resource === "timeline-versions"
      ) {
        return method === "GET";
      }
      if (resource === "timeline") return method === "GET" || method === "POST";
      if (resource === "timeline-edits") return method === "POST";
      if (
        new Set([
          "real-image-candidates",
          "real-image-admission",
          "real-image-successor-admission",
          "real-video-candidates",
          "semantic-visual-qc",
          "media-selection",
          "real-video-admission",
        ]).has(resource)
      ) {
        return method === "GET" || method === "POST";
      }
      return new Set([
        "authority-identity",
        "shot-graph",
        "assets",
        "media",
        "preview",
        "finalize",
      ]).has(resource) && (method === "GET" || method === "POST");
    }
    if (
      parts[2] === "image-video-generations" &&
      (parts.length === 4 || (parts.length === 5 && parts[4] === "content"))
    ) return method === "GET";
    if (
      parts.length === 4 &&
      parts[2] === "generation" && parts[3] === "content"
    ) return method === "GET";
    if (
      parts.length === 4 &&
      parts[2] === "preview" &&
      parts[3] === "content"
    ) {
      return method === "GET";
    }
    if (
      parts.length === 5 &&
      parts[2] === "exports" &&
      parts[4] === "content"
    ) {
      return method === "GET";
    }
    return false;
  }
  const [resource, ref, ...rest] = path.split("/");
  if (!ref || rest.length) return false;
  return detailResources.get(resource)?.has(method) ?? false;
}

function shouldInjectContentProfile(path: string, method: string) {
  return method === "POST" && (path === "series" || path === "projects");
}

function timeoutFor(path: string) {
  if (
    path.startsWith("episode-production-runs/") &&
    ["/media", "/preview", "/finalize"].some((suffix) => path.endsWith(suffix))
  ) {
    return 300_000;
  }
  if (path.endsWith("/content")) return 120_000;
  return path.includes("generate") || path.includes("candidates") ? 90_000 : 12_000;
}

async function readMutationBody(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new AdapterInputError(415, "unsupported_media_type", "请求必须使用 JSON。")
  }
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new AdapterInputError(413, "request_too_large", "请求内容过大。")
  }
  const text = await request.text();
  if (!text || new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    throw new AdapterInputError(400, "invalid_request", "请求内容无效。")
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AdapterInputError(400, "invalid_request", "请求内容不是有效 JSON。")
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AdapterInputError(400, "invalid_request", "请求内容必须是对象。")
  }
  return value as Record<string, unknown>;
}

class AdapterInputError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

// This larger allowance belongs only to the closed image upload command. Never
// raise the general mutation limit or buffer an unbounded incoming stream.
async function readImageVideoBody(request: Request) {
  const maximum = Math.ceil(IMAGE_VIDEO_MAX_BYTES / 3) * 4 + 16_384;
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new AdapterInputError(415, "unsupported_media_type", "图片生成请求必须使用 JSON。");
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maximum)) throw new AdapterInputError(413, "request_too_large", "图片不得超过 8 MB。");
  const reader = request.body?.getReader();
  if (!reader) throw new AdapterInputError(400, "invalid_request", "缺少图片生成输入。");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0; let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new AdapterInputError(413, "request_too_large", "图片不得超过 8 MB。"); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const value: unknown = JSON.parse(text);
    if (!validImageVideoCommand(value)) throw new AdapterInputError(400, "invalid_request", "图片、描述或请求字段无效。");
    return value;
  } finally { reader.releaseLock(); }
}

const methodAwareBrowserScope = new Set(["workspaceRef", "productionRunRef", "tenantId", "contentProfileRef"]);
const methodAwareQuery = new Set(["projectRef", "seriesRef", "episodeRef", "versionRef"]);
const commandFields = ["projectRef", "seriesRef", "episodeRef", "idempotencyKey"];
function objectFields(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    required.every((key) => Object.hasOwn(value, key)) && Object.keys(value).every((key) => required.includes(key) || optional.includes(key));
}
function inputRef(value: unknown): value is string { return typeof value === "string" && value.length > 0 && value.trim() === value; }
function inputInteger(value: unknown, minimum = 0): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum; }
function inputRefs(value: unknown) { return Array.isArray(value) && value.every(inputRef); }
function inputSpan(value: unknown, sourceField?: string) {
  return objectFields(value, ["scriptSceneRef", "sourceField", "sourceIndex", "startOffsetInclusive", "endOffsetExclusive"]) &&
    inputRef(value.scriptSceneRef) && typeof value.sourceField === "string" &&
    ["ACTION", "DIALOGUE", "NARRATION", "SUBTITLE_TEXT"].includes(value.sourceField) && (!sourceField || value.sourceField === sourceField) &&
    inputInteger(value.sourceIndex) && inputInteger(value.startOffsetInclusive) && inputInteger(value.endOffsetExclusive, 1) && value.endOffsetExclusive > value.startOffsetInclusive;
}
function inputTiming(value: unknown) {
  return objectFields(value, ["startFrameInclusive", "endFrameExclusive"]) && inputInteger(value.startFrameInclusive) &&
    inputInteger(value.endFrameExclusive, 1) && value.endFrameExclusive > value.startFrameInclusive;
}
function inputShot(value: unknown) {
  if (!objectFields(value, ["shotOrder", "shotFrameCount", "cameraInstruction", "actionExecutionBeats", "audioIntents"]) ||
      !inputInteger(value.shotOrder, 1) || !inputInteger(value.shotFrameCount, 1) ||
      !objectFields(value.cameraInstruction, ["framing", "movement"]) || !inputRef(value.cameraInstruction.framing) || !inputRef(value.cameraInstruction.movement) ||
      !Array.isArray(value.actionExecutionBeats) || !value.actionExecutionBeats.length || !Array.isArray(value.audioIntents)) return false;
  return value.actionExecutionBeats.every((beat: unknown) => {
    const event = beat !== null && typeof beat === "object" && (beat as { executionClass?: unknown }).executionClass === "DETERMINISTIC_EVENT";
    const fields = ["beatRef", "beatOrder", "sourceSpan", "subjectRefs", "targetRefs", "frameRangeStartInclusive", "frameRangeEndExclusive", "executionClass"];
    if (event) fields.push("postprocessRequirementKey");
    return objectFields(beat, fields) && (!event || inputRef(beat.postprocessRequirementKey)) &&
    inputRef(beat.beatRef) && inputInteger(beat.beatOrder, 1) && inputSpan(beat.sourceSpan) && inputRefs(beat.subjectRefs) && inputRefs(beat.targetRefs) &&
    inputInteger(beat.frameRangeStartInclusive) && inputInteger(beat.frameRangeEndExclusive, 1) && beat.frameRangeEndExclusive > beat.frameRangeStartInclusive &&
    typeof beat.executionClass === "string" && Object.hasOwn(EXECUTION_METHOD_BY_CLASS, beat.executionClass);
  }) &&
    value.audioIntents.every((intent: unknown) => {
      if (!intent || typeof intent !== "object" || Array.isArray(intent)) return false;
      const type = (intent as { audioType?: unknown }).audioType;
      const speech = type === "DIALOGUE" || type === "NARRATION";
      return objectFields(intent, speech ? ["audioType", "beatRef", "timingReference", "sourceSpan"] : ["audioType", "beatRef", "timingReference"]) &&
        AUDIO_TYPES.some((known) => known === type) && inputRef(intent.beatRef) && inputTiming(intent.timingReference) && (!speech || inputSpan(intent.sourceSpan, type));
    });
}
function validMethodAwareBody(resource: MethodAwareResource, value: Record<string, unknown>) {
  if (!commandFields.every((key) => inputRef(value[key]))) return false;
  switch (resource) {
    case "execution-method-plan":
      return objectFields(value, [...commandFields, "consistencyValidationVersionRef", "shots"]) && inputRef(value.consistencyValidationVersionRef) &&
        Array.isArray(value.shots) && value.shots.length > 0 && value.shots.every(inputShot);
    case "method-aware-input-plan":
      return objectFields(value, [...commandFields, "assetBindings"]) && Array.isArray(value.assetBindings) && value.assetBindings.every((binding: unknown) =>
        objectFields(binding, ["visualExecutionRequirementRef", "inputRequirementKey", "inputRole", "assetVersionRef"]) && inputRef(binding.visualExecutionRequirementRef) &&
        inputRef(binding.inputRequirementKey) && inputRef(binding.assetVersionRef) && METHOD_INPUT_ROLES.some((role) => role === binding.inputRole));
    case "method-aware-video-route": return objectFields(value, commandFields);
    case "explicit-audio-requirement-route":
      return objectFields(value, [...commandFields, "audioRequirementRef"], ["rightsBindingRef", "voiceAssetVersionRef"]) && inputRef(value.audioRequirementRef) &&
        (!Object.hasOwn(value, "rightsBindingRef") || inputRef(value.rightsBindingRef)) && (!Object.hasOwn(value, "voiceAssetVersionRef") || inputRef(value.voiceAssetVersionRef));
  }
}
const methodAwareParsers = {
  "execution-method-plan": parseExecutionMethodPlan,
  "method-aware-input-plan": parseMethodAwareInputPlan,
  "method-aware-video-route": parseMethodAwareVideoRoute,
  "explicit-audio-requirement-route": parseExplicitAudioRequirementRoute,
};

export async function handleCreatorExperienceRequest(
  request: Request,
  pathParts: string[],
) {
  const path = normalizePath(pathParts);
  const method = request.method.toUpperCase();
  if (!path || !isAllowed(path, method)) {
    return errorResponse(404, "not_found", "没有找到对应的 Creator 接口。")
  }

  let config: ReturnType<typeof getCreatorServerConfig>;
  try {
    config = getCreatorServerConfig();
  } catch {
    return errorResponse(500, "adapter_configuration_error", "Creator 连接配置无效。")
  }

  const incomingUrl = new URL(request.url);
  const generation = pathParts[0] === "episode-production-runs" && pathParts[2] === "generation";
  const imageVideo = pathParts[0] === "episode-production-runs" && pathParts[2] === "image-video-generations";
  // Next may normalize request.url to its listener name (localhost). The actual
  // browser authority is Host; never trust caller-supplied forwarded-host values.
  const browserOrigin = `${incomingUrl.protocol}//${request.headers.get("host") ?? incomingUrl.host}`;
  if ((generation || imageVideo) && method === "POST" && ((request.headers.get("origin") && request.headers.get("origin") !== browserOrigin) || request.headers.get("sec-fetch-site") === "cross-site")) {
    return errorResponse(403, "origin_forbidden", "不允许跨站提交生成操作。");
  }
  const methodAwareResource = pathParts.length === 3 && pathParts[0] === "episode-production-runs"
    ? METHOD_AWARE_RESOURCES.find((resource) => resource === pathParts[2]) : undefined;
  const targetUrl = new URL(`${config.coreBaseUrl}${CORE_PREFIX}/${path}`);
  for (const [key, value] of incomingUrl.searchParams) {
    if (imageVideo) {
      const allowed = pathParts.length === 5 ? ["projectRef", "seriesRef", "episodeRef", "sha256"] : ["projectRef", "seriesRef", "episodeRef"];
      if (method !== "GET" || !allowed.includes(key) || !inputRef(value) || targetUrl.searchParams.has(key)) return errorResponse(400, "invalid_request", "图片视频查询字段无效。");
    }
    if (generation) {
      if (methodAwareBrowserScope.has(key)) continue;
      const allowed = pathParts.length === 4 ? ["projectRef", "seriesRef", "episodeRef", "mediaJobRef", "sha256"] : ["projectRef", "seriesRef", "episodeRef"];
      if (method !== "GET" || !allowed.includes(key) || !inputRef(value) || targetUrl.searchParams.has(key)) return errorResponse(400, "invalid_request", "生成查询字段无效。");
    }
    if (methodAwareResource) {
      // Strip browser scope before applying the closed query contract (task 14.1).
      if (methodAwareBrowserScope.has(key)) continue;
      if (method !== "GET" || !methodAwareQuery.has(key) || !inputRef(value) || targetUrl.searchParams.has(key)) {
        return errorResponse(400, "invalid_request", "方法规划查询字段无效。");
      }
    }
    if (key !== "workspaceRef" && key !== "contentProfileRef" && key !== "tenantId") {
      targetUrl.searchParams.append(key, value);
    }
  }
  if (methodAwareResource && method === "GET" && ["projectRef", "seriesRef", "episodeRef"].some((key) => !targetUrl.searchParams.has(key))) {
    return errorResponse(400, "invalid_request", "方法规划查询缺少项目范围。");
  }
  if (imageVideo && method === "GET" && (["projectRef", "seriesRef", "episodeRef"].some(key => !targetUrl.searchParams.has(key)) ||
      (pathParts.length === 5 && !/^[a-f0-9]{64}$/.test(targetUrl.searchParams.get("sha256") ?? "")))) return errorResponse(400, "invalid_request", "图片视频查询缺少准确项目范围或视频摘要。");

  const contentRequest = path.endsWith("/content");
  const headers = new Headers({
    Accept: contentRequest ? "video/mp4" : "application/json",
    Authorization: `Bearer ${config.coreToken}`,
  });
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    try {
      const input: Record<string, unknown> = imageVideo ? await readImageVideoBody(request) : await readMutationBody(request);
      delete input.workspaceRef;
      delete input.contentProfileRef;
      delete input.tenantId;
      if (path.startsWith("episode-production-runs/")) {
        delete input.productionRunRef;
      }
      if (methodAwareResource && !validMethodAwareBody(methodAwareResource, input)) {
        return errorResponse(400, "invalid_request", "方法规划请求字段无效。");
      }
      if (generation && (!objectFields(input, ["projectRef", "seriesRef", "episodeRef", "operation", "mediaJobRef", "expectedJobRevision", "approvedPlanDigest"]) ||
          !["PREPARE", "EXECUTE_APPROVED"].includes(String(input.operation)) ||
          !["projectRef", "seriesRef", "episodeRef", "mediaJobRef"].every(k => inputRef(input[k])) ||
          !inputInteger(input.expectedJobRevision) || typeof input.approvedPlanDigest !== "string" || !/^[a-f0-9]{64}$/.test(input.approvedPlanDigest))) {
        return errorResponse(400, "invalid_request", "生成请求只能引用当前已批准作业。");
      }
      const payload: Record<string, unknown> = { ...input };
      if (shouldInjectContentProfile(path, method)) {
        payload.contentProfileRef = config.contentProfileRef;
      }
      body = JSON.stringify(payload);
      headers.set("Content-Type", "application/json");
    } catch (error) {
      if (error instanceof AdapterInputError) {
        return errorResponse(error.status, error.code, error.message);
      }
      return errorResponse(400, "invalid_request", "请求内容无效。")
    }
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutFor(path)),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      return errorResponse(504, "core_timeout", "Core 处理超时，请稍后重试。")
    }
    return errorResponse(503, "core_disconnected", "当前无法连接 Creator Core。")
  }

  const responseContentType = response.headers.get("content-type") ?? "";
  if (response.ok && !responseContentType.toLowerCase().includes("application/json")) {
    if (!contentRequest || !responseContentType.toLowerCase().startsWith("video/") || (imageVideo && responseContentType.split(";")[0].trim().toLowerCase() !== "video/mp4")) {
      return errorResponse(502, "invalid_core_response", "Core 返回了无法识别的响应。")
    }
    const outgoingHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": responseContentType,
      "X-Content-Type-Options": "nosniff",
      "X-Creator-Data-Origin": "CORE",
    });
    for (const name of ["content-length", "content-disposition"]) {
      const value = response.headers.get(name);
      if (value) outgoingHeaders.set(name, value);
    }
    return new Response(response.body, {
      status: response.status,
      headers: outgoingHeaders,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return errorResponse(502, "invalid_core_response", "Core 返回了无法识别的响应。")
  }
  if (!payload || typeof payload !== "object" || typeof (payload as { ok?: unknown }).ok !== "boolean") {
    return errorResponse(502, "invalid_core_response", "Core 返回了无法识别的响应。")
  }

  if (methodAwareResource && response.ok && (payload as { ok: boolean }).ok) {
    try {
      payload = methodAwareParsers[methodAwareResource](payload);
    } catch (error) {
      if (error instanceof CreatorClientError) return errorResponse(error.status, error.detail.code, error.detail.message);
      return errorResponse(502, "invalid_method_aware_response", "Frontend 无法验证 Core 返回的方法规划数据。");
    }
  }
  if (generation && method === "GET" && response.ok && (payload as { ok: boolean }).ok) {
    try { parseGenerationWorkspace(payload, { productionRunRef: pathParts[1], projectRef: targetUrl.searchParams.get("projectRef") ?? "", seriesRef: targetUrl.searchParams.get("seriesRef") ?? "", episodeRef: targetUrl.searchParams.get("episodeRef") ?? "" }); }
    catch { return errorResponse(502, "invalid_generation_response", "无法验证生成状态及项目血缘。"); }
  }
  if (imageVideo && response.ok) {
    try {
      const command = body ? JSON.parse(body) : null;
      const scope = { productionRunRef: pathParts[1], projectRef: command?.projectRef ?? targetUrl.searchParams.get("projectRef") ?? "", seriesRef: command?.seriesRef ?? targetUrl.searchParams.get("seriesRef") ?? "", episodeRef: command?.episodeRef ?? targetUrl.searchParams.get("episodeRef") ?? "" };
      if (method === "GET" && pathParts.length === 3) parseImageVideoWorkspace(payload, scope);
      else parseImageVideoGeneration(payload, scope, pathParts.length === 4 ? pathParts[3] : undefined);
    } catch { return errorResponse(502, "invalid_image_video_response", "无法验证图片视频作业、策略或项目血缘。"); }
  }

  return Response.json(payload, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "X-Creator-Data-Origin": "CORE",
    },
  });
}
