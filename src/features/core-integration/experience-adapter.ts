import "server-only";

import { getCreatorServerConfig } from "./server-config";

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
  const [resource, ref, ...rest] = path.split("/");
  if (!ref || rest.length) return false;
  return detailResources.get(resource)?.has(method) ?? false;
}

function shouldInjectContentProfile(path: string, method: string) {
  return method === "POST" && (path === "series" || path === "projects");
}

function timeoutFor(path: string) {
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
  const targetUrl = new URL(`${config.coreBaseUrl}${CORE_PREFIX}/${path}`);
  for (const [key, value] of incomingUrl.searchParams) {
    if (key !== "workspaceRef" && key !== "contentProfileRef" && key !== "tenantId") {
      targetUrl.searchParams.append(key, value);
    }
  }
  if (method === "GET" || method === "DELETE") {
    if (path !== "capabilities") targetUrl.searchParams.set("workspaceRef", config.workspaceRef);
  }

  const headers = new Headers({ Accept: "application/json" });
  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE") {
    try {
      const input = await readMutationBody(request);
      delete input.workspaceRef;
      delete input.contentProfileRef;
      delete input.tenantId;
      const payload: Record<string, unknown> = {
        ...input,
        workspaceRef: config.workspaceRef,
      };
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

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return errorResponse(502, "invalid_core_response", "Core 返回了无法识别的响应。")
  }
  if (!payload || typeof payload !== "object" || typeof (payload as { ok?: unknown }).ok !== "boolean") {
    return errorResponse(502, "invalid_core_response", "Core 返回了无法识别的响应。")
  }

  return Response.json(payload, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "X-Creator-Data-Origin": "CORE",
    },
  });
}
