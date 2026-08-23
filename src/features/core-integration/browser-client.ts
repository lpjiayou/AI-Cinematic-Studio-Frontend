import {
  EPISODE_PRODUCTION_STATES,
  creatorErrorFromUnknown,
  type CreatorError,
  type K2ProductionStateProjectionEnvelope,
  type K2RealImageRevisionEnvelope,
  type K2RealVideoRevisionEnvelope,
} from "./contracts";

export const K2_REAL_IMAGE_READ_RESOURCES = [
  "real-image-candidates",
  "real-image-admission",
  "real-image-successor-admission",
] as const;

export type K2RealImageReadResource = (typeof K2_REAL_IMAGE_READ_RESOURCES)[number];

export const K2_REAL_VIDEO_READ_RESOURCES = [
  "real-video-candidates",
  "semantic-visual-qc",
  "media-selection",
  "real-video-admission",
] as const;

export type K2RealVideoReadResource = (typeof K2_REAL_VIDEO_READ_RESOURCES)[number];
type CreatorReadRequestInit = Omit<RequestInit, "body" | "method">;

export class CreatorClientError extends Error {
  constructor(
    readonly status: number,
    readonly detail: CreatorError,
  ) {
    super(detail.message);
  }
}

export async function creatorRequest<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: Record<string, unknown> },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body: string | undefined;
  if (init?.body) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }
  const response = await fetch(`/api/creator/${path.replace(/^\/+/, "")}`, {
    ...init,
    body,
    headers,
    cache: "no-store",
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CreatorClientError(response.status, {
      code: "invalid_adapter_response",
      message: "前端适配层返回了无法识别的响应。",
    });
  }
  if (!response.ok || !payload || typeof payload !== "object" || (payload as { ok?: unknown }).ok !== true) {
    throw new CreatorClientError(
      response.status,
      creatorErrorFromUnknown(payload),
    );
  }
  return payload as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isProductionState(value: unknown) {
  return typeof value === "string" && EPISODE_PRODUCTION_STATES.some((state) => state === value);
}

function isStateProjection(value: unknown): value is K2ProductionStateProjectionEnvelope {
  if (!isRecord(value)) return false;
  const rootState = value.rootState;
  const productionProjection = value.productionProjection;
  const runtimeState = value.runtimeState;
  const visualQcState = value.visualQcState;
  const activeRevision = value.activeRevision;
  const invariants = value.invariants;
  const candidateLifecycle = value.candidateLifecycle;
  return (
    value.ok === true &&
    value.schemaVersion === "v5.k2-production-state-projection.v1" &&
    typeof value.productionRunRef === "string" &&
    isProductionState(value.state) &&
    isProductionState(value.productionState) &&
    value.state === value.productionState &&
    isRecord(rootState) &&
    typeof rootState.state === "string" &&
    isRecord(productionProjection) &&
    isProductionState(productionProjection.state) &&
    productionProjection.state === value.productionState &&
    isRecord(runtimeState) &&
    typeof runtimeState.state === "string" &&
    isRecord(visualQcState) &&
    typeof visualQcState.state === "string" &&
    isRecord(activeRevision) &&
    typeof activeRevision.state === "string" &&
    (typeof activeRevision.revisionRef === "string" || activeRevision.revisionRef === null) &&
    isRecord(invariants) &&
    typeof invariants.runtimeDoesNotAdvanceProduction === "boolean" &&
    typeof invariants.assetVersionAuthority === "string" &&
    value.publicationAllowed === false &&
    (candidateLifecycle === undefined ||
      (isRecord(candidateLifecycle) && Array.isArray(candidateLifecycle.candidates)))
  );
}

function isRealVideoRevision(value: unknown): value is K2RealVideoRevisionEnvelope {
  if (!isRecord(value)) return false;
  return (
    value.ok === true &&
    isProductionState(value.state) &&
    (value.publicationAllowed === undefined || value.publicationAllowed === false) &&
    (value.videoGenerationRequests === undefined || Array.isArray(value.videoGenerationRequests)) &&
    (value.videoAssetVersions === undefined || Array.isArray(value.videoAssetVersions))
  );
}

function isRealImageRevision(value: unknown): value is K2RealImageRevisionEnvelope {
  if (!isRecord(value)) return false;
  const candidateLifecycle = value.candidateLifecycle;
  return (
    value.ok === true &&
    isProductionState(value.state) &&
    isRecord(value.realImagePlan) &&
    Array.isArray(value.generationRequests) &&
    (value.realImageAdmissionManifest === undefined ||
      isRecord(value.realImageAdmissionManifest)) &&
    (value.candidates === undefined || Array.isArray(value.candidates)) &&
    (value.technicalValidations === undefined || Array.isArray(value.technicalValidations)) &&
    (value.selectionDecisions === undefined || Array.isArray(value.selectionDecisions)) &&
    (value.assetAdmissions === undefined || Array.isArray(value.assetAdmissions)) &&
    (value.assetVersions === undefined || Array.isArray(value.assetVersions)) &&
    (candidateLifecycle === undefined ||
      (isRecord(candidateLifecycle) && Array.isArray(candidateLifecycle.candidates))) &&
    (value.publicationAllowed === undefined || value.publicationAllowed === false)
  );
}

export function k2EpisodeProductionResourcePath(
  productionRunRef: string,
  resource: "state-projection" | K2RealImageReadResource | K2RealVideoReadResource,
) {
  const normalizedRunRef = productionRunRef.trim();
  if (!normalizedRunRef) {
    throw new TypeError("productionRunRef is required");
  }
  return `episode-production-runs/${encodeURIComponent(normalizedRunRef)}/${resource}`;
}

export async function getK2ProductionStateProjection(
  productionRunRef: string,
  init?: CreatorReadRequestInit,
) {
  const payload = await creatorRequest<unknown>(
    k2EpisodeProductionResourcePath(productionRunRef, "state-projection"),
    { ...init, method: "GET" },
  );
  if (!isStateProjection(payload)) {
    throw new CreatorClientError(502, {
      code: "state_projection_contract_mismatch",
      message: "Core 返回的 K2 状态投影不符合当前公开契约。",
    });
  }
  return payload;
}

export async function getK2RealImageRevision(
  productionRunRef: string,
  resource: K2RealImageReadResource,
  init?: CreatorReadRequestInit,
) {
  const payload = await creatorRequest<unknown>(
    k2EpisodeProductionResourcePath(productionRunRef, resource),
    { ...init, method: "GET" },
  );
  if (!isRealImageRevision(payload)) {
    throw new CreatorClientError(502, {
      code: "real_image_revision_contract_mismatch",
      message: "Core 返回的 K2 真实图片修订投影不符合当前公开契约。",
    });
  }
  return payload;
}

export async function getK2RealVideoRevision(
  productionRunRef: string,
  resource: K2RealVideoReadResource,
  init?: CreatorReadRequestInit,
) {
  const payload = await creatorRequest<unknown>(
    k2EpisodeProductionResourcePath(productionRunRef, resource),
    { ...init, method: "GET" },
  );
  if (!isRealVideoRevision(payload)) {
    throw new CreatorClientError(502, {
      code: "real_video_revision_contract_mismatch",
      message: "Core 返回的 K2 真实视频修订投影不符合当前公开契约。",
    });
  }
  return payload;
}
