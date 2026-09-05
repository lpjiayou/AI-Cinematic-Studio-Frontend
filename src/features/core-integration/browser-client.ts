import {
  EPISODE_PRODUCTION_STATES,
  creatorErrorFromUnknown,
  type CreatorError,
  type K2CandidateLifecycleProjection,
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

function productionStateRank(value: unknown) {
  return EPISODE_PRODUCTION_STATES.findIndex((state) => state === value);
}

function isNonEmptyRef(value: unknown) {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}

function isDigest(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}

function isTimestamp(value: unknown) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    value === value.trim() &&
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isRecordArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.every(isRecord);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyRef);
}

function arraysEqual(left: readonly unknown[], right: readonly unknown[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function assetVersionBindingsMatch(left: unknown, right: unknown) {
  if (!isRecordArray(left) || !isRecordArray(right) || left.length !== right.length) {
    return false;
  }
  return left.every(
    (binding, index) =>
      isNonEmptyRef(binding.assetVersionRef) &&
      isDigest(binding.assetVersionDigest) &&
      binding.assetVersionRef === right[index].assetVersionRef &&
      binding.assetVersionDigest === right[index].assetVersionDigest,
  );
}

function candidateViewsMatch(
  candidates: unknown,
  lifecycleCandidates: unknown,
  activeRevisionRef: unknown,
) {
  if (!isRecordArray(candidates) || !isRecordArray(lifecycleCandidates)) return false;
  if (candidates.length !== lifecycleCandidates.length) return false;
  return candidates.every((candidate, index) => {
    const lifecycle = lifecycleCandidates[index];
    return (
      isNonEmptyRef(candidate.candidateRef) &&
      candidate.candidateRef === lifecycle.candidateRef &&
      candidate.revisionRef === lifecycle.revisionRef &&
      (activeRevisionRef === null || candidate.revisionRef === activeRevisionRef)
    );
  });
}

function isActiveRevisionState(state: unknown, revisionRef: unknown, activationState: unknown) {
  return (
    (state === "ACTIVE" && isNonEmptyRef(revisionRef)) ||
    (state === "STALE_BLOCKED" && isNonEmptyRef(revisionRef) && activationState === "STALE") ||
    ((state === "NOT_RECORDED" || state === "BLOCKED_AMBIGUOUS") &&
      revisionRef === null)
  );
}

function isVisualQcState(value: unknown) {
  return ["BLOCKED_AMBIGUOUS", "NOT_RECORDED", "IN_PROGRESS", "FAIL", "PASS", "STALE", "STALE_BLOCKED"].includes(
    value as string,
  );
}

type ActiveCandidateContext = {
  lifecycle: Record<string, unknown>;
  candidate: Record<string, unknown>;
};

function activeCandidateContexts(
  topCandidates: unknown,
  lifecycleCandidates: unknown,
  activeRevisionRef: string,
  visualQcState: Record<string, unknown>,
  mediaKind: "IMAGE" | "VIDEO",
  requests?: Array<Record<string, unknown>>,
): ActiveCandidateContext[] | null {
  if (!isRecordArray(topCandidates) || !isRecordArray(lifecycleCandidates)) return null;
  if (
    topCandidates.length !== lifecycleCandidates.length ||
    ![0, 4].includes(lifecycleCandidates.length)
  ) {
    return null;
  }
  if (lifecycleCandidates.length === 0) {
    return visualQcState.state === "NOT_RECORDED" &&
      visualQcState.candidateCount === 0 &&
      visualQcState.decisionCount === 0
      ? []
      : null;
  }

  const topByRef = new Map(topCandidates.map((item) => [item.candidateRef, item]));
  const requestsByRef = new Map(
    (requests ?? []).map((item) => [item.generationRequestRef, item]),
  );
  const decisions = visualQcState.decisions;
  if (!isRecordArray(decisions)) return null;
  const decisionsByCandidateRef = new Map(
    decisions.map((item) => [item.candidateRef, item]),
  );
  const contexts: ActiveCandidateContext[] = [];
  const candidateRefs: string[] = [];
  const candidateDigests: string[] = [];
  const sourceRequestRefs: string[] = [];
  const visualStates: string[] = [];
  let semanticDecisionCount = 0;

  for (const lifecycle of lifecycleCandidates) {
    const candidate = lifecycle.candidate;
    const technical = lifecycle.technicalValidation;
    if (
      !isNonEmptyRef(lifecycle.candidateRef) ||
      lifecycle.revisionRef !== activeRevisionRef ||
      lifecycle.technicalState !== "TECHNICALLY_VERIFIED" ||
      !["NOT_STARTED", "SEMANTIC_QC_PASSED", "SEMANTIC_QC_FAILED"].includes(
        lifecycle.visualQcState as string,
      ) ||
      !["UNSELECTED", "REJECTED_BY_HUMAN", "SELECTED_BY_HUMAN"].includes(
        lifecycle.selectionState as string,
      ) ||
      !["NOT_ADMITTED", "ADMITTED"].includes(lifecycle.admissionState as string) ||
      !isRecord(candidate) ||
      candidate.schemaVersion !== "v5.k2-media-candidate.v1" ||
      candidate.candidateRef !== lifecycle.candidateRef ||
      !Number.isInteger(candidate.candidateVersion) ||
      (candidate.candidateVersion as number) < 1 ||
      candidate.revisionRef !== activeRevisionRef ||
      candidate.mediaKind !== mediaKind ||
      !isNonEmptyRef(candidate.slotRef) ||
      !isNonEmptyRef(candidate.sourceRequestRef) ||
      !isDigest(candidate.sourceRequestDigest) ||
      !isNonEmptyRef(candidate.artifactRef) ||
      !isDigest(candidate.artifactDigest) ||
      !Number.isInteger(candidate.artifactByteSize) ||
      (candidate.artifactByteSize as number) <= 0 ||
      !["SELF_HOSTED_AI_GENERATED", "LOCAL_EVIDENCE", "IMPORTED"].includes(
        candidate.provenance as string,
      ) ||
      candidate.lifecycleState !== "CANDIDATE_RECORDED" ||
      !isDigest(candidate.payloadDigest) ||
      !isRecordArray(candidate.sourceAssetVersions) ||
      candidate.sourceAssetVersions.length !== (mediaKind === "VIDEO" ? 1 : 0) ||
      candidate.publicationAllowed !== false ||
      !isRecord(technical) ||
      technical.schemaVersion !== "v5.k2-technical-validation.v1" ||
      !isNonEmptyRef(technical.technicalValidationRef) ||
      !Number.isInteger(technical.technicalValidationVersion) ||
      (technical.technicalValidationVersion as number) < 1 ||
      technical.candidateRef !== lifecycle.candidateRef ||
      technical.candidateVersion !== candidate.candidateVersion ||
      technical.candidateDigest !== candidate.payloadDigest ||
      technical.artifactDigest !== candidate.artifactDigest ||
      technical.result !== "PASS" ||
      technical.lifecycleState !== "TECHNICALLY_VERIFIED" ||
      technical.publicationAllowed !== false ||
      !isDigest(technical.payloadDigest)
    ) {
      return null;
    }

    const request = requestsByRef.get(candidate.sourceRequestRef);
    const topCandidate = topByRef.get(lifecycle.candidateRef);
    if (
      !topCandidate ||
      topCandidate.revisionRef !== lifecycle.revisionRef ||
      topCandidate.technicalState !== lifecycle.technicalState ||
      topCandidate.visualQcState !== lifecycle.visualQcState ||
      topCandidate.selectionState !== lifecycle.selectionState ||
      topCandidate.admissionState !== lifecycle.admissionState ||
      topCandidate.assetVersionRef !== lifecycle.assetVersionRef ||
      !isRecord(topCandidate.candidate) ||
      topCandidate.candidate.payloadDigest !== candidate.payloadDigest
    ) {
      return null;
    }
    if (mediaKind === "VIDEO") {
      const sourceAsset = candidate.sourceAssetVersions[0];
      if (
        !request ||
        candidate.sourceRequestDigest !== request.payloadDigest ||
        candidate.slotRef !== request.creativeShotVersionRef ||
        sourceAsset.assetVersionRef !== request.sourceImageAssetVersionRef ||
        sourceAsset.assetVersionDigest !== request.sourceImageAssetVersionDigest
      ) {
        return null;
      }
    }

    const semantic = lifecycle.semanticVisualQc;
    if (lifecycle.visualQcState === "NOT_STARTED") {
      if (semantic !== undefined) return null;
    } else {
      const expectedResult =
        lifecycle.visualQcState === "SEMANTIC_QC_PASSED" ? "PASS" : "FAIL";
      const decision = decisionsByCandidateRef.get(lifecycle.candidateRef);
      if (
        !isRecord(semantic) ||
        semantic.schemaVersion !== "v5.k2-semantic-visual-qc-decision.v1" ||
        !isNonEmptyRef(semantic.visualQcRef) ||
        !Number.isInteger(semantic.visualQcVersion) ||
        (semantic.visualQcVersion as number) < 1 ||
        semantic.revisionRef !== candidate.revisionRef ||
        semantic.slotRef !== candidate.slotRef ||
        semantic.candidateRef !== lifecycle.candidateRef ||
        semantic.candidateVersion !== candidate.candidateVersion ||
        semantic.candidateDigest !== candidate.payloadDigest ||
        semantic.artifactDigest !== candidate.artifactDigest ||
        semantic.sourceRequestRef !== candidate.sourceRequestRef ||
        semantic.sourceRequestDigest !== candidate.sourceRequestDigest ||
        !assetVersionBindingsMatch(
          semantic.sourceAssetVersions,
          candidate.sourceAssetVersions,
        ) ||
        semantic.technicalValidationRef !== technical.technicalValidationRef ||
        semantic.technicalValidationVersion !== technical.technicalValidationVersion ||
        semantic.technicalValidationDigest !== technical.payloadDigest ||
        semantic.result !== expectedResult ||
        semantic.lifecycleState !== lifecycle.visualQcState ||
        semantic.publicationAllowed !== false ||
        !isDigest(semantic.payloadDigest) ||
        !decision ||
        decision.visualQcRef !== semantic.visualQcRef ||
        decision.visualQcVersion !== semantic.visualQcVersion ||
        decision.candidateRef !== lifecycle.candidateRef ||
        decision.result !== expectedResult ||
        decision.payloadDigest !== semantic.payloadDigest
      ) {
        return null;
      }
      semanticDecisionCount += 1;
    }

    const selection = lifecycle.humanSelection;
    if (lifecycle.selectionState === "UNSELECTED") {
      if (selection !== undefined) return null;
    } else if (
      !isRecord(selection) ||
      selection.schemaVersion !== "v5.k2-human-selection-decision.v1" ||
      selection.candidateRef !== lifecycle.candidateRef ||
      selection.candidateDigest !== candidate.payloadDigest ||
      selection.lifecycleState !== lifecycle.selectionState ||
      !isNonEmptyRef(selection.selectionRef) ||
      !Number.isInteger(selection.selectionVersion) ||
      (selection.selectionVersion as number) < 1 ||
      selection.candidateVersion !== candidate.candidateVersion ||
      selection.artifactDigest !== candidate.artifactDigest ||
      selection.decision !==
        (lifecycle.selectionState === "SELECTED_BY_HUMAN" ? "SELECTED" : "REJECTED") ||
      !isNonEmptyRef(selection.visualQcRef) ||
      !Number.isInteger(selection.visualQcVersion) ||
      (selection.visualQcVersion as number) < 1 ||
      !isDigest(selection.visualQcDigest) ||
      !isDigest(selection.subjectDigest) ||
      !isNonEmptyRef(selection.approvalRef) ||
      !isNonEmptyRef(selection.actorRef) ||
      selection.actorKind !== "HUMAN" ||
      !isNonEmptyRef(selection.authorityRef) ||
      !isNonEmptyRef(selection.authorityDecisionRef) ||
      !isDigest(selection.authorityDecisionDigest) ||
      !isTimestamp(selection.authorityDecidedAt) ||
      selection.publicationAllowed !== false ||
      !isDigest(selection.payloadDigest)
    ) {
      return null;
    }

    contexts.push({ lifecycle, candidate });
    candidateRefs.push(lifecycle.candidateRef as string);
    candidateDigests.push(candidate.payloadDigest as string);
    sourceRequestRefs.push(candidate.sourceRequestRef as string);
    visualStates.push(lifecycle.visualQcState as string);
  }

  const expectedVisualState = visualStates.every((state) => state === "NOT_STARTED")
    ? "NOT_RECORDED"
    : visualStates.some((state) => state === "SEMANTIC_QC_FAILED")
      ? "FAIL"
      : visualStates.every((state) => state === "SEMANTIC_QC_PASSED")
        ? "PASS"
        : "IN_PROGRESS";
  return new Set(candidateRefs).size === 4 &&
    new Set(candidateDigests).size === 4 &&
    new Set(sourceRequestRefs).size === 4 &&
    semanticDecisionCount === decisions.length &&
    visualQcState.state === expectedVisualState
    ? contexts
    : null;
}

function isCandidateLifecycle(
  value: unknown,
  expectedRunRef: string,
  expectedWorkspaceRef?: string,
): value is K2CandidateLifecycleProjection {
  if (!isRecord(value)) return false;
  const latestRefs = value.latestCandidateRevisionRefs;
  return (
    value.schemaVersion === "v5.k2-candidate-lifecycle-projection.v1" &&
    isNonEmptyRef(value.workspaceRef) &&
    (expectedWorkspaceRef === undefined || value.workspaceRef === expectedWorkspaceRef) &&
    value.productionRunRef === expectedRunRef &&
    (value.latestCandidateRevisionRef === null || isNonEmptyRef(value.latestCandidateRevisionRef)) &&
    isRecord(latestRefs) &&
    Object.values(latestRefs).every(isNonEmptyRef) &&
    (value.activeRevisionRef === null || isNonEmptyRef(value.activeRevisionRef)) &&
    Number.isInteger(value.historicalCandidateCount) &&
    (value.historicalCandidateCount as number) >= 0 &&
    isRecordArray(value.candidates) &&
    isRecordArray(value.assetVersions) &&
    value.publicationAllowed === false
  );
}

function isStateProjection(
  value: unknown,
  expectedRunRef: string,
): value is K2ProductionStateProjectionEnvelope {
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
    isNonEmptyRef(value.workspaceRef) &&
    value.productionRunRef === expectedRunRef &&
    isProductionState(value.state) &&
    isProductionState(value.productionState) &&
    value.state === value.productionState &&
    isRecord(rootState) &&
    typeof rootState.state === "string" &&
    rootState.authority === "V5_ROOT_DATABASE" &&
    rootState.mutable === false &&
    isRecord(productionProjection) &&
    isProductionState(productionProjection.state) &&
    productionProjection.state === value.productionState &&
    productionProjection.authority === "V5_EVIDENCE_TRANSITIONS" &&
    isRecord(runtimeState) &&
    typeof runtimeState.state === "string" &&
    runtimeState.authority === "V4_RUNTIME_NON_CANONICAL" &&
    isRecord(visualQcState) &&
    isVisualQcState(visualQcState.state) &&
    visualQcState.authority === "V5_CANONICAL_APPEND_ONLY" &&
    isRecord(activeRevision) &&
    isActiveRevisionState(activeRevision.state, activeRevision.revisionRef, activeRevision.activationState) &&
    activeRevision.authority === "V5_CANONICAL_APPEND_ONLY" &&
    (activeRevision.activationState === undefined ||
      activeRevision.activationState === "CURRENT" || activeRevision.activationState === "STALE") &&
    (activeRevision.mediaKind === undefined || activeRevision.mediaKind === "IMAGE" || activeRevision.mediaKind === "VIDEO") &&
    isRecord(invariants) &&
    invariants.runtimeDoesNotAdvanceProduction === true &&
    invariants.visualQcDoesNotAdvanceProduction === true &&
    invariants.assetVersionAuthority === "V5_CANONICAL_EVIDENCE_ONLY" &&
    invariants.publicationAllowed === false &&
    value.publicationAllowed === false &&
    isCandidateLifecycle(candidateLifecycle, expectedRunRef, value.workspaceRef as string) &&
    candidateLifecycle.activeRevisionRef === activeRevision.revisionRef &&
    visualQcState.activeRevisionRef === activeRevision.revisionRef &&
    Number.isInteger(visualQcState.candidateCount) &&
    (visualQcState.candidateCount as number) >= 0 &&
    visualQcState.candidateCount === candidateLifecycle.candidates.length &&
    Number.isInteger(visualQcState.decisionCount) &&
    isRecordArray(visualQcState.decisions) &&
    visualQcState.decisionCount === visualQcState.decisions.length &&
    (visualQcState.expectedCandidateCount === undefined ||
      visualQcState.expectedCandidateCount === null ||
      (Number.isInteger(visualQcState.expectedCandidateCount) &&
        (visualQcState.expectedCandidateCount as number) > 0)) &&
    candidateViewsMatch(
      value.candidates,
      candidateLifecycle.candidates,
      activeRevision.revisionRef,
    ) &&
    (activeRevision.candidateRefs === undefined ||
      (isStringArray(activeRevision.candidateRefs) &&
        new Set(activeRevision.candidateRefs).size === activeRevision.candidateRefs.length &&
        activeRevision.candidateRefs.length === candidateLifecycle.candidates.length &&
        activeRevision.candidateRefs.every((ref) =>
          candidateLifecycle.candidates.some((candidate) => isRecord(candidate) && candidate.candidateRef === ref),
        ))) &&
    // Core _visual prioritizes an expired activation over all historical QC.
    ((activeRevision.state === "STALE_BLOCKED") === (visualQcState.state === "STALE_BLOCKED")) &&
    (visualQcState.state !== "STALE" ||
      (activeRevision.state === "ACTIVE" &&
        candidateLifecycle.candidates.some((candidate) => isRecord(candidate) && candidate.visualQcState === "STALE")))
  );
}

function isRealVideoRevision(
  value: unknown,
  expectedRunRef: string,
): value is K2RealVideoRevisionEnvelope {
  if (!isRecord(value)) return false;
  const plan = value.realVideoPlan;
  const productionProjection = value.productionProjection;
  const rootState = value.rootState;
  const runtimeState = value.runtimeState;
  const visualQcState = value.visualQcState;
  const activeRevision = value.activeRevision;
  const invariants = value.invariants;
  const requests = value.videoGenerationRequests;
  const candidateLifecycle = value.candidateLifecycle;
  if (
    value.ok !== true ||
    !isProductionState(value.state) ||
    productionStateRank(value.state) < productionStateRank("REAL_VIDEO_PLAN_READY") ||
    value.productionState !== value.state ||
    !isRecord(productionProjection) ||
    productionProjection.state !== value.state ||
    productionProjection.authority !== "V5_EVIDENCE_TRANSITIONS" ||
    !isRecord(rootState) ||
    typeof rootState.state !== "string" ||
    rootState.authority !== "V5_ROOT_DATABASE" ||
    rootState.mutable !== false ||
    !isRecord(runtimeState) ||
    typeof runtimeState.state !== "string" ||
    runtimeState.authority !== "V4_RUNTIME_NON_CANONICAL" ||
    !isRecord(visualQcState) ||
    !isVisualQcState(visualQcState.state) ||
    visualQcState.authority !== "V5_CANONICAL_APPEND_ONLY" ||
    !isRecord(activeRevision) ||
    activeRevision.state !== "ACTIVE" ||
    !isNonEmptyRef(activeRevision.revisionRef) ||
    activeRevision.authority !== "V5_CANONICAL_APPEND_ONLY" ||
    !isRecord(invariants) ||
    invariants.runtimeDoesNotAdvanceProduction !== true ||
    invariants.visualQcDoesNotAdvanceProduction !== true ||
    invariants.assetVersionAuthority !== "V5_CANONICAL_EVIDENCE_ONLY" ||
    invariants.publicationAllowed !== false ||
    !isRecord(plan) ||
    plan.schemaVersion !== "v5.k2-real-video-plan.v1" ||
    !isNonEmptyRef(plan.workspaceRef) ||
    plan.productionRunRef !== expectedRunRef ||
    !isNonEmptyRef(plan.realVideoPlanRef) ||
    !isNonEmptyRef(plan.realVideoPlanVersionRef) ||
    plan.version !== 1 ||
    !isDigest(plan.payloadDigest) ||
    plan.publicationAllowed !== false ||
    plan.expectedRequestCount !== 4 ||
    !isStringArray(plan.generationRequestRefs) ||
    plan.generationRequestRefs.length !== 4 ||
    !Array.isArray(plan.generationRequestDigests) ||
    plan.generationRequestDigests.length !== 4 ||
    !plan.generationRequestDigests.every(isDigest) ||
    !isStringArray(plan.sourceImageAssetVersionRefs) ||
    plan.sourceImageAssetVersionRefs.length !== 4 ||
    !Array.isArray(plan.sourceImageAssetVersionDigests) ||
    plan.sourceImageAssetVersionDigests.length !== 4 ||
    !plan.sourceImageAssetVersionDigests.every(isDigest) ||
    !isRecordArray(requests) ||
    requests.length !== 4 ||
    !isCandidateLifecycle(candidateLifecycle, expectedRunRef, plan.workspaceRef as string) ||
    value.publicationAllowed !== false ||
    !isRecordArray(value.candidates) ||
    candidateLifecycle.activeRevisionRef !== activeRevision.revisionRef ||
    visualQcState.activeRevisionRef !== activeRevision.revisionRef ||
    !Number.isInteger(visualQcState.candidateCount) ||
    (visualQcState.candidateCount as number) < 0 ||
    visualQcState.candidateCount !== candidateLifecycle.candidates.length ||
    !Number.isInteger(visualQcState.decisionCount) ||
    !isRecordArray(visualQcState.decisions) ||
    visualQcState.decisionCount !== visualQcState.decisions.length ||
    !candidateViewsMatch(
      value.candidates,
      candidateLifecycle.candidates,
      activeRevision.revisionRef,
    ) ||
    (value.technicalValidations !== undefined && !isRecordArray(value.technicalValidations)) ||
    (value.selectionDecisions !== undefined && !isRecordArray(value.selectionDecisions))
  ) {
    return false;
  }

  const requestRefs: string[] = [];
  const requestDigests: string[] = [];
  const sourceImageAssetVersionRefs: string[] = [];
  const sourceImageAssetVersionDigests: string[] = [];
  const creativeShotVersionRefs: string[] = [];
  const requestOrdinals: number[] = [];
  for (const request of requests) {
    if (
      request.schemaVersion !== "v5.k2-real-shot-video-request.v1" ||
      request.workspaceRef !== plan.workspaceRef ||
      request.productionRunRef !== expectedRunRef ||
      !isNonEmptyRef(request.generationRequestRef) ||
      !isNonEmptyRef(request.generationRequestVersionRef) ||
      request.version !== 1 ||
      !Number.isInteger(request.ordinal) ||
      !isDigest(request.payloadDigest) ||
      !isNonEmptyRef(request.sourceImageAssetVersionRef) ||
      !isDigest(request.sourceImageAssetVersionDigest) ||
      !isNonEmptyRef(request.creativeShotVersionRef) ||
      request.startImageBindingState !== "EXACT_ASSET_VERSION_BOUND" ||
      request.publicationAllowed !== false
    ) {
      return false;
    }
    requestRefs.push(request.generationRequestRef as string);
    requestDigests.push(request.payloadDigest as string);
    sourceImageAssetVersionRefs.push(request.sourceImageAssetVersionRef as string);
    sourceImageAssetVersionDigests.push(request.sourceImageAssetVersionDigest as string);
    creativeShotVersionRefs.push(request.creativeShotVersionRef as string);
    requestOrdinals.push(request.ordinal as number);
  }
  if (
    !arraysEqual(requestOrdinals, [1, 2, 3, 4]) ||
    new Set(requestRefs).size !== 4 ||
    new Set(requestDigests).size !== 4 ||
    new Set(sourceImageAssetVersionRefs).size !== 4 ||
    new Set(sourceImageAssetVersionDigests).size !== 4 ||
    new Set(creativeShotVersionRefs).size !== 4 ||
    !arraysEqual(plan.generationRequestRefs, requestRefs) ||
    !arraysEqual(plan.generationRequestDigests, requestDigests) ||
    !arraysEqual(plan.sourceImageAssetVersionRefs, sourceImageAssetVersionRefs) ||
    !arraysEqual(plan.sourceImageAssetVersionDigests, sourceImageAssetVersionDigests)
  ) {
    return false;
  }
  const activeMediaKinds = new Set(
    candidateLifecycle.candidates.map((item) =>
      isRecord(item) && isRecord(item.candidate)
        ? item.candidate.mediaKind
        : undefined,
    ),
  );
  if (
    activeMediaKinds.size > 1 ||
    [...activeMediaKinds].some((mediaKind) => mediaKind !== "IMAGE" && mediaKind !== "VIDEO")
  ) {
    return false;
  }
  const activeMediaKind =
    candidateLifecycle.candidates.length === 0
      ? null
      : ([...activeMediaKinds][0] as "IMAGE" | "VIDEO");
  if (
    visualQcState.expectedCandidateCount !==
    (activeRevision.revisionRef === plan.realVideoPlanRef ? 4 : null)
  ) {
    return false;
  }
  const candidateContexts = activeCandidateContexts(
    value.candidates,
    candidateLifecycle.candidates,
    activeRevision.revisionRef as string,
    visualQcState,
    activeMediaKind ?? "VIDEO",
    activeMediaKind === "VIDEO" ? requests : undefined,
  );
  if (candidateContexts === null) return false;
  if (
    candidateContexts.length > 0 &&
    (candidateLifecycle.latestCandidateRevisionRef !== activeRevision.revisionRef ||
      candidateLifecycle.latestCandidateRevisionRefs[activeMediaKind as string] !==
        activeRevision.revisionRef)
  ) {
    return false;
  }

  const videoReadyRank = productionStateRank("REAL_VIDEO_READY");
  const stateRank = productionStateRank(value.state);
  const admissionRequired = stateRank >= videoReadyRank;
  const admissionPresent =
    value.realVideoAdmissionManifest !== undefined ||
    value.videoAssetAdmissions !== undefined ||
    value.videoAssetVersions !== undefined;
  if (!admissionRequired) {
    return (
      !admissionPresent &&
      candidateContexts.every(
        ({ lifecycle }) =>
          ["UNSELECTED", "REJECTED_BY_HUMAN"].includes(
            lifecycle.selectionState as string,
          ) &&
          lifecycle.admissionState === "NOT_ADMITTED" &&
          lifecycle.assetVersionRef === null,
      )
    );
  }

  const manifest = value.realVideoAdmissionManifest;
  const admissions = value.videoAssetAdmissions;
  const versions = value.videoAssetVersions;
  if (
    !isRecord(manifest) ||
    manifest.schemaVersion !== "v5.k2-real-video-admission-manifest.v1" ||
    manifest.workspaceRef !== plan.workspaceRef ||
    manifest.productionRunRef !== expectedRunRef ||
    manifest.realVideoPlanRef !== plan.realVideoPlanRef ||
    manifest.realVideoPlanDigest !== plan.payloadDigest ||
    !isNonEmptyRef(manifest.realVideoAdmissionManifestRef) ||
    manifest.version !== 1 ||
    !isNonEmptyRef(manifest.revisionRef) ||
    !isDigest(manifest.selectionRequestDigest) ||
    !isStringArray(manifest.selectionRefs) ||
    manifest.selectionRefs.length !== 4 ||
    !Array.isArray(manifest.selectionDigests) ||
    manifest.selectionDigests.length !== 4 ||
    !manifest.selectionDigests.every(isDigest) ||
    manifest.admittedCount !== 4 ||
    manifest.state !== "REAL_VIDEO_ADMITTED" ||
    !isStringArray(manifest.assetVersionRefs) ||
    manifest.assetVersionRefs.length !== 4 ||
    !Array.isArray(manifest.assetVersionDigests) ||
    manifest.assetVersionDigests.length !== 4 ||
    !manifest.assetVersionDigests.every(isDigest) ||
    !isDigest(manifest.payloadDigest) ||
    manifest.publicationAllowed !== false ||
    !isRecordArray(admissions) ||
    admissions.length !== 4 ||
    !isRecordArray(versions) ||
    versions.length !== 4 ||
    candidateContexts.length !== 4 ||
    !isNonEmptyRef(activeRevision.revisionRef) ||
    candidateLifecycle.latestCandidateRevisionRef !== activeRevision.revisionRef ||
    !isNonEmptyRef(candidateLifecycle.latestCandidateRevisionRefs.VIDEO) ||
    activeRevision.state !== "ACTIVE" ||
    visualQcState.activeRevisionRef !== activeRevision.revisionRef
  ) {
    return false;
  }
  const latestVideoRevisionRef = candidateLifecycle.latestCandidateRevisionRefs.VIDEO;
  if (
    (activeMediaKind === "VIDEO" && latestVideoRevisionRef !== activeRevision.revisionRef) ||
    (activeMediaKind === "IMAGE" && latestVideoRevisionRef !== manifest.revisionRef)
  ) {
    return false;
  }

  const admissionRefs: string[] = [];
  const admissionDigests: string[] = [];
  const admissionCandidateRefs: string[] = [];
  const admissionCandidateDigests: string[] = [];
  const admissionSelectionRefs: string[] = [];
  const admissionSelectionVersions: number[] = [];
  const admissionSelectionDigests: string[] = [];
  const admissionOrdinals: number[] = [];
  for (const admission of admissions) {
    if (
      admission.schemaVersion !== "v5.k2-asset-admission.v1" ||
      !isNonEmptyRef(admission.admissionRef) ||
      admission.version !== 1 ||
      !Number.isInteger(admission.ordinal) ||
      !isNonEmptyRef(admission.candidateRef) ||
      !isDigest(admission.candidateDigest) ||
      !isNonEmptyRef(admission.selectionRef) ||
      !Number.isInteger(admission.selectionVersion) ||
      (admission.selectionVersion as number) < 1 ||
      !isDigest(admission.selectionDigest) ||
      !isNonEmptyRef(admission.assetVersionRef) ||
      !isDigest(admission.assetVersionDigest) ||
      admission.admissionState !== "ADMITTED" ||
      admission.publicationAllowed !== false ||
      !isDigest(admission.payloadDigest)
    ) {
      return false;
    }
    admissionRefs.push(admission.assetVersionRef as string);
    admissionDigests.push(admission.assetVersionDigest as string);
    admissionCandidateRefs.push(admission.candidateRef as string);
    admissionCandidateDigests.push(admission.candidateDigest as string);
    admissionSelectionRefs.push(admission.selectionRef as string);
    admissionSelectionVersions.push(admission.selectionVersion as number);
    admissionSelectionDigests.push(admission.selectionDigest as string);
    admissionOrdinals.push(admission.ordinal as number);
  }

  const versionRefs = versions.map((item) => item.assetVersionRef);
  const versionDigests = versions.map((item) => item.payloadDigest);
  const versionOrdinals: number[] = [];
  const versionSelectionRefs: string[] = [];
  const versionSelectionVersions: number[] = [];
  const versionSelectionDigests: string[] = [];
  const versionCandidateRefs: string[] = [];
  const versionCandidateDigests: string[] = [];
  const versionRevisionRefs: string[] = [];
  const versionAssetRefs: string[] = [];
  const predecessorVersionRefs: string[] = [];
  const predecessorVersionDigests: string[] = [];
  for (const version of versions) {
    if (
      version.schemaVersion !== "v5.k2-real-video-asset-version.v1" ||
      version.workspaceRef !== plan.workspaceRef ||
      version.productionRunRef !== expectedRunRef ||
      !isNonEmptyRef(version.assetRef) ||
      !isNonEmptyRef(version.assetVersionRef) ||
      !Number.isInteger(version.version) ||
      (version.version as number) < 2 ||
      !Number.isInteger(version.ordinal) ||
      !isNonEmptyRef(version.generationRequestRef) ||
      !isDigest(version.generationRequestDigest) ||
      !isNonEmptyRef(version.sourceImageAssetVersionRef) ||
      !isDigest(version.sourceImageAssetVersionDigest) ||
      !isNonEmptyRef(version.sourceCandidateRef) ||
      !isDigest(version.sourceCandidateDigest) ||
      !isNonEmptyRef(version.revisionRef) ||
      !isNonEmptyRef(version.semanticVisualQcRef) ||
      !isDigest(version.semanticVisualQcDigest) ||
      !isNonEmptyRef(version.humanSelectionRef) ||
      !Number.isInteger(version.humanSelectionVersion) ||
      (version.humanSelectionVersion as number) < 1 ||
      !isDigest(version.humanSelectionDigest) ||
      !isNonEmptyRef(version.supersedesAssetVersionRef) ||
      version.supersedesAssetVersionRef === version.assetVersionRef ||
      !isDigest(version.supersedesAssetVersionDigest) ||
      !isNonEmptyRef(version.artifactRef) ||
      !Number.isInteger(version.byteSize) ||
      (version.byteSize as number) <= 0 ||
      !isDigest(version.sha256) ||
      !["SELF_HOSTED_AI_GENERATED", "LOCAL_EVIDENCE", "IMPORTED"].includes(
        version.provenance as string,
      ) ||
      version.mediaKind !== "video" ||
      version.mediaType !== "video/mp4" ||
      version.state !== "REGISTERED" ||
      version.immutable !== true ||
      version.publicationAllowed !== false ||
      !isDigest(version.payloadDigest)
    ) {
      return false;
    }
    versionOrdinals.push(version.ordinal as number);
    versionSelectionRefs.push(version.humanSelectionRef as string);
    versionSelectionVersions.push(version.humanSelectionVersion as number);
    versionSelectionDigests.push(version.humanSelectionDigest as string);
    versionCandidateRefs.push(version.sourceCandidateRef as string);
    versionCandidateDigests.push(version.sourceCandidateDigest as string);
    versionRevisionRefs.push(version.revisionRef as string);
    versionAssetRefs.push(version.assetRef as string);
    predecessorVersionRefs.push(version.supersedesAssetVersionRef as string);
    predecessorVersionDigests.push(version.supersedesAssetVersionDigest as string);
  }

  const lifecycleAssetVersions = candidateLifecycle.assetVersions;
  if (!isRecordArray(lifecycleAssetVersions)) return false;
  const admissionsByCandidateRef = new Map(
    admissions.map((item) => [item.candidateRef, item]),
  );
  const versionsByRequestRef = new Map(
    versions.map((item) => [item.generationRequestRef, item]),
  );
  const lifecycleAssetVersionsByRef = new Map(
    lifecycleAssetVersions.map((item) => [item.assetVersionRef, item]),
  );
  if (
    versions.some(
      (version) => {
        const lifecycleVersion = lifecycleAssetVersionsByRef.get(
          version.assetVersionRef,
        );
        const predecessor = lifecycleAssetVersionsByRef.get(
          version.supersedesAssetVersionRef,
        );
        return (
          lifecycleVersion?.payloadDigest !== version.payloadDigest ||
          !predecessor ||
          predecessor.payloadDigest !== version.supersedesAssetVersionDigest ||
          predecessor.assetRef !== version.assetRef ||
          !Number.isInteger(predecessor.version) ||
          (predecessor.version as number) + 1 !== version.version
        );
      },
    )
  ) {
    return false;
  }
  const admittedRevisionIsActive =
    activeMediaKind === "VIDEO" && activeRevision.revisionRef === manifest.revisionRef;
  for (const { lifecycle, candidate } of candidateContexts) {
    if (activeMediaKind === "IMAGE") {
      continue;
    }
    if (admittedRevisionIsActive) {
      const admission = admissionsByCandidateRef.get(lifecycle.candidateRef);
      const version = versionsByRequestRef.get(candidate.sourceRequestRef);
      const selection = lifecycle.humanSelection;
      if (
        !["SELECTED_BY_HUMAN", "REJECTED_BY_HUMAN"].includes(
          lifecycle.selectionState as string,
        ) ||
        lifecycle.admissionState !== "ADMITTED" ||
        !isNonEmptyRef(lifecycle.assetVersionRef) ||
        !isRecord(selection) ||
        !admission ||
        !version ||
        admission.candidateDigest !== candidate.payloadDigest ||
        admission.assetVersionRef !== lifecycle.assetVersionRef ||
        version.assetVersionRef !== lifecycle.assetVersionRef ||
        version.sourceCandidateRef !== lifecycle.candidateRef ||
        version.sourceCandidateDigest !== candidate.payloadDigest ||
        version.artifactRef !== candidate.artifactRef ||
        version.byteSize !== candidate.artifactByteSize ||
        version.sha256 !== candidate.artifactDigest ||
        version.provenance !== candidate.provenance
      ) {
        return false;
      }
      if (
        lifecycle.selectionState === "SELECTED_BY_HUMAN" &&
        (admission.selectionRef !== selection.selectionRef ||
          admission.selectionVersion !== selection.selectionVersion ||
          admission.selectionDigest !== selection.payloadDigest ||
          version.humanSelectionRef !== selection.selectionRef ||
          version.humanSelectionVersion !== selection.selectionVersion ||
          version.humanSelectionDigest !== selection.payloadDigest ||
          version.semanticVisualQcRef !== selection.visualQcRef ||
          version.semanticVisualQcDigest !== selection.visualQcDigest)
      ) {
        return false;
      }
    } else if (
      !["UNSELECTED", "REJECTED_BY_HUMAN"].includes(
        lifecycle.selectionState as string,
      ) ||
      lifecycle.admissionState !== "NOT_ADMITTED" ||
      lifecycle.assetVersionRef !== null
    ) {
      return false;
    }
  }

  return (
    versionRefs.every(isNonEmptyRef) &&
    versionDigests.every(isDigest) &&
    arraysEqual(admissionOrdinals, [1, 2, 3, 4]) &&
    arraysEqual(versionOrdinals, [1, 2, 3, 4]) &&
    new Set(versionAssetRefs).size === 4 &&
    new Set(predecessorVersionRefs).size === 4 &&
    new Set(predecessorVersionDigests).size === 4 &&
    new Set(admissionCandidateRefs).size === 4 &&
    new Set(admissionCandidateDigests).size === 4 &&
    new Set(admissionSelectionRefs).size === 4 &&
    new Set(admissionSelectionDigests).size === 4 &&
    new Set(admissionRefs).size === 4 &&
    new Set(admissionDigests).size === 4 &&
    arraysEqual(admissionCandidateRefs, versionCandidateRefs) &&
    arraysEqual(admissionCandidateDigests, versionCandidateDigests) &&
    arraysEqual(manifest.selectionRefs, admissionSelectionRefs) &&
    arraysEqual(manifest.selectionDigests, admissionSelectionDigests) &&
    arraysEqual(manifest.selectionRefs, versionSelectionRefs) &&
    arraysEqual(manifest.selectionDigests, versionSelectionDigests) &&
    arraysEqual(admissionSelectionVersions, versionSelectionVersions) &&
    versionRevisionRefs.every((revisionRef) => revisionRef === manifest.revisionRef) &&
    arraysEqual(manifest.assetVersionRefs, admissionRefs) &&
    arraysEqual(manifest.assetVersionDigests, admissionDigests) &&
    arraysEqual(manifest.assetVersionRefs, versionRefs) &&
    arraysEqual(manifest.assetVersionDigests, versionDigests) &&
    arraysEqual(requestRefs, versions.map((item) => item.generationRequestRef)) &&
    arraysEqual(requestDigests, versions.map((item) => item.generationRequestDigest)) &&
    arraysEqual(sourceImageAssetVersionRefs, versions.map((item) => item.sourceImageAssetVersionRef)) &&
    arraysEqual(sourceImageAssetVersionDigests, versions.map((item) => item.sourceImageAssetVersionDigest))
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
  if (!isStateProjection(payload, productionRunRef.trim())) {
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
  if (!isRealVideoRevision(payload, productionRunRef.trim())) {
    throw new CreatorClientError(502, {
      code: "real_video_revision_contract_mismatch",
      message: "Core 返回的 K2 真实视频修订投影不符合当前公开契约。",
    });
  }
  return payload;
}
