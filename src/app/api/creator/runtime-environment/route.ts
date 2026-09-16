import "server-only";

import { parseRuntimeEnvironment } from "@/features/core-integration/image-video-client";
import { getCreatorServerConfig } from "@/features/core-integration/server-config";
import type { GenerationScope } from "@/features/core-integration/generation-workspace-client";

const CORE_PREFIX = "/creator/api/v1";
const MAX_RESPONSE_BYTES = 64_000;
export const RUNTIME_ENVIRONMENT_TIMEOUT_MS = 120_000;
const scopeFields = ["projectRef", "seriesRef", "episodeRef", "productionRunRef"] as const;

function error(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function scopeFrom(request: Request): GenerationScope | null {
  const parameters = new URL(request.url).searchParams;
  const keys = [...parameters.keys()];
  if (keys.length !== scopeFields.length || keys.some((key) => !scopeFields.includes(key as typeof scopeFields[number]))) {
    return null;
  }
  const scope = Object.fromEntries(scopeFields.map((key) => [key, parameters.get(key)]));
  return scopeFields.every((key) => typeof scope[key] === "string" && /^\S{1,512}$/.test(scope[key] as string))
    ? scope as GenerationScope
    : null;
}

export async function GET(request: Request) {
  const scope = scopeFrom(request);
  if (!scope) return error(400, "invalid_runtime_environment_scope", "运行环境查询范围无效。");
  let config: ReturnType<typeof getCreatorServerConfig>;
  try {
    config = getCreatorServerConfig();
  } catch {
    return error(503, "creator_core_unavailable", "Creator Core 配置不可用。");
  }
  const query = new URLSearchParams({
    projectRef: scope.projectRef,
    seriesRef: scope.seriesRef,
    episodeRef: scope.episodeRef,
  });
  const target = `${config.coreBaseUrl}${CORE_PREFIX}/episode-production-runs/${encodeURIComponent(scope.productionRunRef)}/image-video-generations/runtime-environment?${query}`;
  try {
    const response = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${config.coreToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(RUNTIME_ENVIRONMENT_TIMEOUT_MS),
    });
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_RESPONSE_BYTES) return error(502, "runtime_environment_response_too_large", "运行环境响应过大。");
    const raw = await response.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_RESPONSE_BYTES) {
      return error(502, "runtime_environment_response_too_large", "运行环境响应过大。");
    }
    if (!response.ok) {
      const status = response.status >= 400 && response.status <= 599 ? response.status : 502;
      return error(status, "runtime_environment_unavailable", "运行环境现场状态暂不可读。");
    }
    const payload = JSON.parse(raw) as unknown;
    const environment = parseRuntimeEnvironment(payload, scope);
    return Response.json({ ok: true, environment }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return error(502, "runtime_environment_unavailable", "运行环境现场状态暂不可读。");
  }
}
