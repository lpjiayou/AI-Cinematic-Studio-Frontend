import { afterEach, describe, expect, it, vi } from "vitest";
import {
  K2_REAL_IMAGE_READ_RESOURCES,
  K2_REAL_VIDEO_READ_RESOURCES,
  getK2ProductionStateProjection,
  getK2RealImageRevision,
  getK2RealVideoRevision,
} from "./browser-client";

const projection = {
  ok: true,
  schemaVersion: "v5.k2-production-state-projection.v1",
  workspaceRef: "workspace-k2",
  productionRunRef: "run 1",
  state: "REAL_VIDEO_PLAN_READY",
  productionState: "REAL_VIDEO_PLAN_READY",
  rootState: {
    state: "ROOTS_READY",
    authority: "V5_ROOT_DATABASE",
    mutable: false,
  },
  productionProjection: {
    state: "REAL_VIDEO_PLAN_READY",
    authority: "V5_EVIDENCE_TRANSITIONS",
  },
  runtimeState: {
    state: "ATTENTION_REQUIRED",
    authority: "V4_RUNTIME_NON_CANONICAL",
  },
  visualQcState: {
    state: "NOT_RECORDED",
    authority: "V5_CANONICAL_APPEND_ONLY",
    activeRevisionRef: "real-video-plan-v1",
    candidateCount: 0,
    expectedCandidateCount: 4,
    decisionCount: 0,
    decisions: [],
  },
  activeRevision: {
    state: "ACTIVE",
    revisionRef: "real-video-plan-v1",
    authority: "V5_CANONICAL_APPEND_ONLY",
  },
  candidateLifecycle: {
    schemaVersion: "v5.k2-candidate-lifecycle-projection.v1",
    workspaceRef: "workspace-k2",
    productionRunRef: "run 1",
    latestCandidateRevisionRef: "real-video-plan-v1",
    latestCandidateRevisionRefs: { VIDEO: "real-video-plan-v1" },
    activeRevisionRef: "real-video-plan-v1",
    historicalCandidateCount: 0,
    candidates: [],
    assetVersions: [],
    publicationAllowed: false,
  },
  candidates: [],
  invariants: {
    runtimeDoesNotAdvanceProduction: true,
    visualQcDoesNotAdvanceProduction: true,
    assetVersionAuthority: "V5_CANONICAL_EVIDENCE_ONLY",
    publicationAllowed: false,
  },
  publicationAllowed: false,
} as const;

const videoGenerationRequests = [1, 2, 3, 4].map((ordinal) => ({
  schemaVersion: "v5.k2-real-shot-video-request.v1",
  workspaceRef: "workspace-k2",
  productionRunRef: "run-1",
  generationRequestRef: `video-request-${ordinal}`,
  generationRequestVersionRef: `video-request-version-${ordinal}`,
  version: 1,
  ordinal,
  creativeShotVersionRef: `shot-version-${ordinal}`,
  sourceImageAssetVersionRef: `image-asset-version-${ordinal}`,
  sourceImageAssetVersionDigest: String(ordinal).repeat(64),
  startImageBindingState: "EXACT_ASSET_VERSION_BOUND",
  publicationAllowed: false,
  payloadDigest: String(ordinal + 4).repeat(64),
}));

const realVideoPlan = {
  schemaVersion: "v5.k2-real-video-plan.v1",
  workspaceRef: "workspace-k2",
  productionRunRef: "run-1",
  realVideoPlanRef: "real-video-plan-v1",
  realVideoPlanVersionRef: "real-video-plan-version-v1",
  version: 1,
  expectedRequestCount: 4,
  generationRequestRefs: videoGenerationRequests.map((item) => item.generationRequestRef),
  generationRequestDigests: videoGenerationRequests.map((item) => item.payloadDigest),
  sourceImageAssetVersionRefs: videoGenerationRequests.map(
    (item) => item.sourceImageAssetVersionRef,
  ),
  sourceImageAssetVersionDigests: videoGenerationRequests.map(
    (item) => item.sourceImageAssetVersionDigest,
  ),
  publicationAllowed: false,
  payloadDigest: "a".repeat(64),
};

const videoCandidateLifecycle = {
  schemaVersion: "v5.k2-candidate-lifecycle-projection.v1",
  workspaceRef: "workspace-k2",
  productionRunRef: "run-1",
  latestCandidateRevisionRef: "real-video-plan-v1",
  latestCandidateRevisionRefs: { VIDEO: "real-video-plan-v1" },
  activeRevisionRef: "real-video-plan-v1",
  historicalCandidateCount: 0,
  candidates: [],
  assetVersions: [],
  publicationAllowed: false,
};

const realVideoRevision = {
  ok: true,
  state: "REAL_VIDEO_PLAN_READY",
  productionState: "REAL_VIDEO_PLAN_READY",
  rootState: {
    state: "ROOTS_READY",
    authority: "V5_ROOT_DATABASE",
    mutable: false,
  },
  productionProjection: {
    state: "REAL_VIDEO_PLAN_READY",
    authority: "V5_EVIDENCE_TRANSITIONS",
  },
  runtimeState: {
    state: "ATTENTION_REQUIRED",
    authority: "V4_RUNTIME_NON_CANONICAL",
  },
  visualQcState: {
    state: "NOT_RECORDED",
    authority: "V5_CANONICAL_APPEND_ONLY",
    activeRevisionRef: "real-video-plan-v1",
    candidateCount: 0,
    expectedCandidateCount: 4,
    decisionCount: 0,
    decisions: [],
  },
  activeRevision: {
    state: "ACTIVE",
    revisionRef: "real-video-plan-v1",
    authority: "V5_CANONICAL_APPEND_ONLY",
  },
  invariants: {
    runtimeDoesNotAdvanceProduction: true,
    visualQcDoesNotAdvanceProduction: true,
    assetVersionAuthority: "V5_CANONICAL_EVIDENCE_ONLY",
    publicationAllowed: false,
  },
  realVideoPlan,
  videoGenerationRequests,
  candidateLifecycle: videoCandidateLifecycle,
  candidates: [],
  publicationAllowed: false,
};

const videoAssetVersions = videoGenerationRequests.map((request, index) => {
  const ordinal = index + 1;
  return {
    schemaVersion: "v5.k2-real-video-asset-version.v1",
    workspaceRef: "workspace-k2",
    productionRunRef: "run-1",
    assetRef: `video-asset-${ordinal}`,
    assetVersionRef: `video-asset-version-${ordinal}`,
    version: 2,
    ordinal,
    generationRequestRef: request.generationRequestRef,
    generationRequestDigest: request.payloadDigest,
    sourceImageAssetVersionRef: request.sourceImageAssetVersionRef,
    sourceImageAssetVersionDigest: request.sourceImageAssetVersionDigest,
    sourceCandidateRef: `video-candidate-${ordinal}`,
    sourceCandidateDigest: ["5", "6", "7", "8"][index].repeat(64),
    revisionRef: "video-candidate-revision-v1",
    semanticVisualQcRef: `video-visual-qc-${ordinal}`,
    semanticVisualQcDigest: ["0", "9", "a", "f"][index].repeat(64),
    humanSelectionRef: `video-selection-${ordinal}`,
    humanSelectionVersion: 1,
    humanSelectionDigest: ["1", "2", "3", "4"][index].repeat(64),
    supersedesAssetVersionRef: `video-predecessor-version-${ordinal}`,
    supersedesAssetVersionDigest: ["4", "3", "2", "1"][index].repeat(64),
    artifactRef: `video-artifact-${ordinal}`,
    byteSize: 10_000 + ordinal,
    sha256: ["a", "b", "c", "d"][index].repeat(64),
    provenance: "SELF_HOSTED_AI_GENERATED",
    mediaKind: "video",
    mediaType: "video/mp4",
    state: "REGISTERED",
    immutable: true,
    publicationAllowed: false,
    payloadDigest: ["b", "c", "d", "e"][index].repeat(64),
  };
});

const videoPredecessorAssetVersions = videoAssetVersions.map((item) => ({
  schemaVersion: "v5.asset-version.v1",
  assetRef: item.assetRef,
  assetVersionRef: item.supersedesAssetVersionRef,
  version: item.version - 1,
  mediaKind: "video",
  immutable: true,
  publicationAllowed: false,
  payloadDigest: item.supersedesAssetVersionDigest,
}));

const videoAssetAdmissions = videoAssetVersions.map((item, index) => ({
  schemaVersion: "v5.k2-asset-admission.v1",
  admissionRef: `video-admission-${item.ordinal}`,
  version: 1,
  ordinal: item.ordinal,
  candidateRef: `video-candidate-${item.ordinal}`,
  candidateDigest: ["5", "6", "7", "8"][index].repeat(64),
  selectionRef: item.humanSelectionRef,
  selectionVersion: item.humanSelectionVersion,
  selectionDigest: item.humanSelectionDigest,
  assetVersionRef: item.assetVersionRef,
  assetVersionDigest: item.payloadDigest,
  admissionState: "ADMITTED",
  publicationAllowed: false,
  payloadDigest: ["8", "7", "6", "5"][index].repeat(64),
}));

const videoCandidates = videoGenerationRequests.map((request, index) => {
  const admission = videoAssetAdmissions[index];
  const artifactDigest = ["a", "b", "c", "d"][index].repeat(64);
  const technicalDigest = ["1", "2", "3", "4"][index].repeat(64);
  const semanticDigest = ["0", "9", "a", "f"][index].repeat(64);
  return {
    candidateRef: admission.candidateRef,
    revisionRef: "video-candidate-revision-v1",
    technicalState: "TECHNICALLY_VERIFIED",
    visualQcState: "SEMANTIC_QC_PASSED",
    selectionState: "SELECTED_BY_HUMAN",
    admissionState: "ADMITTED",
    assetVersionRef: admission.assetVersionRef,
    candidate: {
      schemaVersion: "v5.k2-media-candidate.v1",
      candidateRef: admission.candidateRef,
      candidateVersion: 1,
      revisionRef: "video-candidate-revision-v1",
      mediaKind: "VIDEO",
      slotRef: request.creativeShotVersionRef,
      sourceRequestRef: request.generationRequestRef,
      sourceRequestDigest: request.payloadDigest,
      artifactRef: `video-artifact-${index + 1}`,
      artifactDigest,
      artifactByteSize: 10_001 + index,
      sourceAssetVersions: [
        {
          assetVersionRef: request.sourceImageAssetVersionRef,
          assetVersionDigest: request.sourceImageAssetVersionDigest,
        },
      ],
      publicationAllowed: false,
      provenance: "SELF_HOSTED_AI_GENERATED",
      lifecycleState: "CANDIDATE_RECORDED",
      payloadDigest: admission.candidateDigest,
    },
    technicalValidation: {
      schemaVersion: "v5.k2-technical-validation.v1",
      technicalValidationRef: `video-technical-${index + 1}`,
      technicalValidationVersion: 1,
      candidateRef: admission.candidateRef,
      candidateVersion: 1,
      candidateDigest: admission.candidateDigest,
      artifactDigest,
      result: "PASS",
      lifecycleState: "TECHNICALLY_VERIFIED",
      publicationAllowed: false,
      payloadDigest: technicalDigest,
    },
    semanticVisualQc: {
      schemaVersion: "v5.k2-semantic-visual-qc-decision.v1",
      visualQcRef: `video-visual-qc-${index + 1}`,
      visualQcVersion: 1,
      revisionRef: "video-candidate-revision-v1",
      slotRef: request.creativeShotVersionRef,
      candidateRef: admission.candidateRef,
      candidateVersion: 1,
      candidateDigest: admission.candidateDigest,
      artifactDigest,
      sourceRequestRef: request.generationRequestRef,
      sourceRequestDigest: request.payloadDigest,
      sourceAssetVersions: [
        {
          assetVersionRef: request.sourceImageAssetVersionRef,
          assetVersionDigest: request.sourceImageAssetVersionDigest,
        },
      ],
      technicalValidationRef: `video-technical-${index + 1}`,
      technicalValidationVersion: 1,
      technicalValidationDigest: technicalDigest,
      result: "PASS",
      lifecycleState: "SEMANTIC_QC_PASSED",
      publicationAllowed: false,
      payloadDigest: semanticDigest,
    },
    humanSelection: {
      schemaVersion: "v5.k2-human-selection-decision.v1",
      selectionRef: admission.selectionRef,
      selectionVersion: admission.selectionVersion,
      candidateRef: admission.candidateRef,
      candidateVersion: 1,
      candidateDigest: admission.candidateDigest,
      artifactDigest,
      visualQcRef: `video-visual-qc-${index + 1}`,
      visualQcVersion: 1,
      visualQcDigest: semanticDigest,
      subjectDigest: ["6", "7", "8", "9"][index].repeat(64),
      approvalRef: `video-approval-${index + 1}`,
      actorRef: "reviewer-project-lead",
      actorKind: "HUMAN",
      authorityRef: "video-selection-authority",
      authorityDecisionRef: `video-authority-decision-${index + 1}`,
      authorityDecisionDigest: ["a", "b", "c", "d"][index].repeat(64),
      authorityDecidedAt: "2026-08-24T00:00:00Z",
      decision: "SELECTED",
      lifecycleState: "SELECTED_BY_HUMAN",
      publicationAllowed: false,
      payloadDigest: admission.selectionDigest,
    },
  };
});

const successorRevisionRef = "video-candidate-successor-revision-v2";
const successorCandidates = videoGenerationRequests.map((request, index) => {
  const candidateRef = `video-successor-candidate-${index + 1}`;
  const candidateDigest = ["0", "9", "a", "f"][index].repeat(64);
  const artifactDigest = ["a", "b", "c", "d"][index].repeat(64);
  return {
    candidateRef,
    revisionRef: successorRevisionRef,
    technicalState: "TECHNICALLY_VERIFIED",
    visualQcState: "NOT_STARTED",
    selectionState: "UNSELECTED",
    admissionState: "NOT_ADMITTED",
    assetVersionRef: null,
    candidate: {
      schemaVersion: "v5.k2-media-candidate.v1",
      candidateRef,
      candidateVersion: 1,
      revisionRef: successorRevisionRef,
      mediaKind: "VIDEO",
      slotRef: request.creativeShotVersionRef,
      sourceRequestRef: request.generationRequestRef,
      sourceRequestDigest: request.payloadDigest,
      artifactRef: `video-successor-artifact-${index + 1}`,
      artifactDigest,
      artifactByteSize: 20_001 + index,
      sourceAssetVersions: [
        {
          assetVersionRef: request.sourceImageAssetVersionRef,
          assetVersionDigest: request.sourceImageAssetVersionDigest,
        },
      ],
      publicationAllowed: false,
      provenance: "SELF_HOSTED_AI_GENERATED",
      lifecycleState: "CANDIDATE_RECORDED",
      payloadDigest: candidateDigest,
    },
    technicalValidation: {
      schemaVersion: "v5.k2-technical-validation.v1",
      technicalValidationRef: `video-successor-technical-${index + 1}`,
      technicalValidationVersion: 1,
      candidateRef,
      candidateVersion: 1,
      candidateDigest,
      artifactDigest,
      result: "PASS",
      lifecycleState: "TECHNICALLY_VERIFIED",
      publicationAllowed: false,
      payloadDigest: ["4", "3", "2", "1"][index].repeat(64),
    },
  };
});

const imageSuccessorRevisionRef = "image-candidate-successor-revision-v2";
const imageSuccessorCandidates = successorCandidates.map((item, index) => ({
  ...item,
  revisionRef: imageSuccessorRevisionRef,
  candidate: {
    ...item.candidate,
    revisionRef: imageSuccessorRevisionRef,
    mediaKind: "IMAGE",
    sourceRequestRef: `image-successor-request-${index + 1}`,
    sourceRequestDigest: ["e", "d", "c", "b"][index].repeat(64),
    sourceAssetVersions: [],
  },
}));

const realVideoReadyRevision = {
  ...realVideoRevision,
  state: "REAL_VIDEO_READY",
  productionState: "REAL_VIDEO_READY",
  productionProjection: {
    state: "REAL_VIDEO_READY",
    authority: "V5_EVIDENCE_TRANSITIONS",
  },
  visualQcState: {
    ...realVideoRevision.visualQcState,
    state: "PASS",
    activeRevisionRef: "video-candidate-revision-v1",
    candidateCount: 4,
    expectedCandidateCount: null,
    decisionCount: 4,
    decisions: videoCandidates.map((item) => ({
      visualQcRef: item.semanticVisualQc.visualQcRef,
      visualQcVersion: item.semanticVisualQc.visualQcVersion,
      candidateRef: item.candidateRef,
      result: "PASS",
      payloadDigest: item.semanticVisualQc.payloadDigest,
    })),
  },
  activeRevision: {
    ...realVideoRevision.activeRevision,
    revisionRef: "video-candidate-revision-v1",
  },
  candidateLifecycle: {
    ...videoCandidateLifecycle,
    latestCandidateRevisionRef: "video-candidate-revision-v1",
    latestCandidateRevisionRefs: { VIDEO: "video-candidate-revision-v1" },
    activeRevisionRef: "video-candidate-revision-v1",
    candidates: videoCandidates,
    assetVersions: [...videoPredecessorAssetVersions, ...videoAssetVersions],
  },
  candidates: videoCandidates,
  realVideoAdmissionManifest: {
    schemaVersion: "v5.k2-real-video-admission-manifest.v1",
    workspaceRef: "workspace-k2",
    productionRunRef: "run-1",
    realVideoAdmissionManifestRef: "real-video-admission-manifest-v1",
    realVideoPlanRef: realVideoPlan.realVideoPlanRef,
    realVideoPlanDigest: realVideoPlan.payloadDigest,
    version: 1,
    revisionRef: "video-candidate-revision-v1",
    selectionRequestDigest: "9".repeat(64),
    selectionRefs: videoAssetAdmissions.map((item) => item.selectionRef),
    selectionDigests: videoAssetAdmissions.map((item) => item.selectionDigest),
    admittedCount: 4,
    assetVersionRefs: videoAssetVersions.map((item) => item.assetVersionRef),
    assetVersionDigests: videoAssetVersions.map((item) => item.payloadDigest),
    state: "REAL_VIDEO_ADMITTED",
    publicationAllowed: false,
    payloadDigest: "f".repeat(64),
  },
  videoAssetAdmissions,
  videoAssetVersions,
};

const realVideoSuccessorRevision = {
  ...realVideoReadyRevision,
  activeRevision: {
    ...realVideoReadyRevision.activeRevision,
    revisionRef: successorRevisionRef,
    lineageSource: "CANDIDATE_JOURNAL",
  },
  visualQcState: {
    ...realVideoReadyRevision.visualQcState,
    state: "NOT_RECORDED",
    activeRevisionRef: successorRevisionRef,
    candidateCount: 4,
    expectedCandidateCount: null,
    decisionCount: 0,
    decisions: [],
  },
  candidateLifecycle: {
    ...realVideoReadyRevision.candidateLifecycle,
    latestCandidateRevisionRef: successorRevisionRef,
    latestCandidateRevisionRefs: { VIDEO: successorRevisionRef },
    activeRevisionRef: successorRevisionRef,
    historicalCandidateCount: 4,
    candidates: successorCandidates,
  },
  candidates: successorCandidates,
};

const realVideoImageSuccessorRevision = {
  ...realVideoReadyRevision,
  activeRevision: {
    ...realVideoReadyRevision.activeRevision,
    revisionRef: imageSuccessorRevisionRef,
    lineageSource: "CANDIDATE_JOURNAL",
  },
  visualQcState: {
    ...realVideoReadyRevision.visualQcState,
    state: "NOT_RECORDED",
    activeRevisionRef: imageSuccessorRevisionRef,
    candidateCount: 4,
    expectedCandidateCount: null,
    decisionCount: 0,
    decisions: [],
  },
  candidateLifecycle: {
    ...realVideoReadyRevision.candidateLifecycle,
    latestCandidateRevisionRef: imageSuccessorRevisionRef,
    latestCandidateRevisionRefs: {
      IMAGE: imageSuccessorRevisionRef,
      VIDEO: "video-candidate-revision-v1",
    },
    activeRevisionRef: imageSuccessorRevisionRef,
    historicalCandidateCount: 4,
    candidates: imageSuccessorCandidates,
  },
  candidates: imageSuccessorCandidates,
};

const failedPlanCandidates = successorCandidates.map((item, index) => ({
  ...item,
  visualQcState: "SEMANTIC_QC_FAILED",
  semanticVisualQc: {
    schemaVersion: "v5.k2-semantic-visual-qc-decision.v1",
    visualQcRef: `video-failed-qc-${index + 1}`,
    visualQcVersion: 1,
    revisionRef: item.candidate.revisionRef,
    slotRef: item.candidate.slotRef,
    candidateRef: item.candidateRef,
    candidateVersion: item.candidate.candidateVersion,
    candidateDigest: item.candidate.payloadDigest,
    artifactDigest: item.candidate.artifactDigest,
    sourceRequestRef: item.candidate.sourceRequestRef,
    sourceRequestDigest: item.candidate.sourceRequestDigest,
    sourceAssetVersions: item.candidate.sourceAssetVersions,
    technicalValidationRef: item.technicalValidation.technicalValidationRef,
    technicalValidationVersion: item.technicalValidation.technicalValidationVersion,
    technicalValidationDigest: item.technicalValidation.payloadDigest,
    result: "FAIL",
    lifecycleState: "SEMANTIC_QC_FAILED",
    publicationAllowed: false,
    payloadDigest: ["e", "d", "c", "b"][index].repeat(64),
  },
}));

const realVideoFailedPlanRevision = {
  ...realVideoRevision,
  activeRevision: {
    ...realVideoRevision.activeRevision,
    revisionRef: successorRevisionRef,
    lineageSource: "CANDIDATE_JOURNAL",
  },
  visualQcState: {
    ...realVideoRevision.visualQcState,
    state: "FAIL",
    activeRevisionRef: successorRevisionRef,
    candidateCount: 4,
    expectedCandidateCount: null,
    decisionCount: 4,
    decisions: failedPlanCandidates.map((item) => ({
      visualQcRef: item.semanticVisualQc.visualQcRef,
      visualQcVersion: item.semanticVisualQc.visualQcVersion,
      candidateRef: item.candidateRef,
      result: "FAIL",
      payloadDigest: item.semanticVisualQc.payloadDigest,
    })),
  },
  candidateLifecycle: {
    ...videoCandidateLifecycle,
    latestCandidateRevisionRef: successorRevisionRef,
    latestCandidateRevisionRefs: { VIDEO: successorRevisionRef },
    activeRevisionRef: successorRevisionRef,
    candidates: failedPlanCandidates,
  },
  candidates: failedPlanCandidates,
};

const supersededQcCandidates = [
  {
    ...videoCandidates[0],
    visualQcState: "SEMANTIC_QC_FAILED",
    semanticVisualQc: {
      ...videoCandidates[0].semanticVisualQc,
      visualQcRef: "video-visual-qc-1-v2",
      visualQcVersion: 2,
      result: "FAIL",
      lifecycleState: "SEMANTIC_QC_FAILED",
      payloadDigest: "e".repeat(64),
    },
  },
  ...videoCandidates.slice(1),
];

const realVideoSupersededQcRevision = {
  ...realVideoReadyRevision,
  visualQcState: {
    ...realVideoReadyRevision.visualQcState,
    state: "FAIL",
    decisions: supersededQcCandidates.map((item) => ({
      visualQcRef: item.semanticVisualQc.visualQcRef,
      visualQcVersion: item.semanticVisualQc.visualQcVersion,
      candidateRef: item.candidateRef,
      result: item.visualQcState === "SEMANTIC_QC_FAILED" ? "FAIL" : "PASS",
      payloadDigest: item.semanticVisualQc.payloadDigest,
    })),
  },
  candidateLifecycle: {
    ...realVideoReadyRevision.candidateLifecycle,
    candidates: supersededQcCandidates,
  },
  candidates: supersededQcCandidates,
};

const postAdmissionRejectedCandidates = [
  {
    ...videoCandidates[0],
    selectionState: "REJECTED_BY_HUMAN",
    humanSelection: {
      ...videoCandidates[0].humanSelection,
      selectionRef: "video-rejection-1-v2",
      selectionVersion: 2,
      decision: "REJECTED",
      lifecycleState: "REJECTED_BY_HUMAN",
      payloadDigest: "e".repeat(64),
    },
  },
  ...videoCandidates.slice(1),
];

const realVideoPostAdmissionRejectedRevision = {
  ...realVideoReadyRevision,
  candidateLifecycle: {
    ...realVideoReadyRevision.candidateLifecycle,
    candidates: postAdmissionRejectedCandidates,
  },
  candidates: postAdmissionRejectedCandidates,
};

describe("K2 control-plane browser client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads and validates the exact four-axis state projection", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(projection));

    await expect(getK2ProductionStateProjection("run 1")).resolves.toEqual(projection);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/creator/episode-production-runs/run%201/state-projection",
      expect.objectContaining({ cache: "no-store", method: "GET" }),
    );
  });

  it("fails closed when Core collapses or renames a projection axis", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ ...projection, productionProjection: undefined }),
    );

    await expect(getK2ProductionStateProjection("run 1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
  });

  it("fails closed when the production alias or active revision is inconsistent", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...projection, productionState: "QC_READY" }),
    );
    await expect(getK2ProductionStateProjection("run 1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...projection, activeRevision: undefined }),
    );
    await expect(getK2ProductionStateProjection("run 1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
  });

  it("fails closed when active-revision refs diverge across projection axes", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ...projection,
        candidateLifecycle: {
          ...projection.candidateLifecycle,
          activeRevisionRef: "different-revision",
        },
      }),
    );

    await expect(getK2ProductionStateProjection("run 1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
  });

  it.each([
    [
      "runtime isolation",
      {
        ...projection,
        invariants: {
          ...projection.invariants,
          runtimeDoesNotAdvanceProduction: false,
        },
      },
    ],
    [
      "visual-QC isolation",
      {
        ...projection,
        invariants: {
          ...projection.invariants,
          visualQcDoesNotAdvanceProduction: false,
        },
      },
    ],
    [
      "AssetVersion authority",
      {
        ...projection,
        invariants: {
          ...projection.invariants,
          assetVersionAuthority: "V4_RUNTIME",
        },
      },
    ],
    [
      "nested publication lock",
      {
        ...projection,
        invariants: {
          ...projection.invariants,
          publicationAllowed: true,
        },
      },
    ],
  ])("fails closed when the projection weakens %s", async (_case, payload) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(payload));

    await expect(getK2ProductionStateProjection("run 1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
  });

  it("consumes every read-only review and admission view as one revision contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json(realVideoRevision),
    );

    for (const resource of K2_REAL_VIDEO_READ_RESOURCES) {
      await expect(getK2RealVideoRevision("run-1", resource)).resolves.toMatchObject({
        ok: true,
        state: "REAL_VIDEO_PLAN_READY",
      });
    }

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(
      K2_REAL_VIDEO_READ_RESOURCES.map(
        (resource) => `/api/creator/episode-production-runs/run-1/${resource}`,
      ),
    );
  });

  it("accepts the current four-candidate QC-failed plan without inventing admission", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(realVideoFailedPlanRevision),
    );

    const result = await getK2RealVideoRevision("run-1", "semantic-visual-qc");

    expect(result).toMatchObject({
      state: "REAL_VIDEO_PLAN_READY",
      visualQcState: { state: "FAIL", candidateCount: 4 },
    });
    expect(result.candidateLifecycle.candidates).toHaveLength(4);
    expect(result).not.toHaveProperty("realVideoAdmissionManifest");
  });

  it("accepts a coherent four-item video admission bundle", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(realVideoReadyRevision),
    );

    const result = await getK2RealVideoRevision("run-1", "real-video-admission");

    expect(result).toMatchObject({
      state: "REAL_VIDEO_READY",
      realVideoAdmissionManifest: { admittedCount: 4 },
    });
    expect(result.videoAssetVersions).toHaveLength(4);
  });

  it("preserves a valid unadmitted successor revision above an older admitted bundle", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(realVideoSuccessorRevision),
    );

    const result = await getK2RealVideoRevision("run-1", "real-video-candidates");

    expect(result).toMatchObject({
      state: "REAL_VIDEO_READY",
      activeRevision: { revisionRef: successorRevisionRef },
      visualQcState: { state: "NOT_RECORDED" },
    });
    expect(result.candidateLifecycle.candidates).toHaveLength(4);
    expect(result.realVideoAdmissionManifest).toMatchObject({
      revisionRef: "video-candidate-revision-v1",
    });
  });

  it("preserves a post-M10 image successor above the historical video admission", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(realVideoImageSuccessorRevision),
    );

    const result = await getK2RealVideoRevision("run-1", "real-video-candidates");

    expect(result).toMatchObject({
      state: "REAL_VIDEO_READY",
      activeRevision: { revisionRef: imageSuccessorRevisionRef },
      visualQcState: { state: "NOT_RECORDED" },
      realVideoAdmissionManifest: { revisionRef: "video-candidate-revision-v1" },
    });
    expect(result.candidateLifecycle.candidates).toHaveLength(4);
  });

  it("preserves a superseding QC failure without erasing historical admission", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(realVideoSupersededQcRevision),
    );

    const result = await getK2RealVideoRevision("run-1", "semantic-visual-qc");

    expect(result).toMatchObject({
      state: "REAL_VIDEO_READY",
      visualQcState: { state: "FAIL" },
      realVideoAdmissionManifest: { revisionRef: "video-candidate-revision-v1" },
    });
    expect(result.candidateLifecycle.candidates).toHaveLength(4);
  });

  it("preserves historical admission after a current authoritative rejection", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(realVideoPostAdmissionRejectedRevision),
    );

    const result = await getK2RealVideoRevision("run-1", "media-selection");

    expect(result).toMatchObject({
      state: "REAL_VIDEO_READY",
      realVideoAdmissionManifest: { revisionRef: "video-candidate-revision-v1" },
    });
    expect(result.candidateLifecycle.candidates[0]).toMatchObject({
      selectionState: "REJECTED_BY_HUMAN",
      admissionState: "ADMITTED",
    });
  });

  it.each([
    [
      "omits the video plan",
      {
        ...realVideoRevision,
        realVideoPlan: undefined,
      },
    ],
    [
      "returns the wrong plan schema",
      {
        ...realVideoRevision,
        realVideoPlan: { ...realVideoPlan, schemaVersion: "v5.wrong" },
      },
    ],
    [
      "returns a plan for another run",
      {
        ...realVideoRevision,
        realVideoPlan: { ...realVideoPlan, productionRunRef: "run-2" },
      },
    ],
    [
      "diverges from a sealed request ref",
      {
        ...realVideoRevision,
        videoGenerationRequests: [
          { ...videoGenerationRequests[0], generationRequestRef: "changed-request" },
          ...videoGenerationRequests.slice(1),
        ],
      },
    ],
    [
      "returns a lifecycle for another run",
      {
        ...realVideoRevision,
        candidateLifecycle: {
          ...videoCandidateLifecycle,
          productionRunRef: "run-2",
        },
      },
    ],
    [
      "returns sparse candidates for the current QC-failed plan",
      {
        ...realVideoFailedPlanRevision,
        candidateLifecycle: {
          ...realVideoFailedPlanRevision.candidateLifecycle,
          candidates: failedPlanCandidates.map((item) => ({
            candidateRef: item.candidateRef,
            revisionRef: item.revisionRef,
          })),
        },
        candidates: failedPlanCandidates.map((item) => ({
          candidateRef: item.candidateRef,
          revisionRef: item.revisionRef,
        })),
      },
    ],
    [
      "disconnects the active video candidates from the latest VIDEO revision",
      {
        ...realVideoFailedPlanRevision,
        candidateLifecycle: {
          ...realVideoFailedPlanRevision.candidateLifecycle,
          latestCandidateRevisionRefs: { VIDEO: "different-video-revision" },
        },
      },
    ],
    [
      "crosses workspace scope in a sealed request",
      {
        ...realVideoRevision,
        videoGenerationRequests: [
          { ...videoGenerationRequests[0], workspaceRef: "workspace-other" },
          ...videoGenerationRequests.slice(1),
        ],
      },
    ],
    [
      "weakens a merged control-plane invariant",
      {
        ...realVideoRevision,
        invariants: {
          ...realVideoRevision.invariants,
          visualQcDoesNotAdvanceProduction: false,
        },
      },
    ],
    [
      "returns non-canonical request ordinals",
      {
        ...realVideoRevision,
        videoGenerationRequests: [
          videoGenerationRequests[0],
          { ...videoGenerationRequests[1], ordinal: 1 },
          ...videoGenerationRequests.slice(2),
        ],
      },
    ],
    [
      "reuses one start-image lineage across two requests",
      {
        ...realVideoRevision,
        realVideoPlan: {
          ...realVideoPlan,
          sourceImageAssetVersionRefs: [
            realVideoPlan.sourceImageAssetVersionRefs[0],
            realVideoPlan.sourceImageAssetVersionRefs[0],
            ...realVideoPlan.sourceImageAssetVersionRefs.slice(2),
          ],
          sourceImageAssetVersionDigests: [
            realVideoPlan.sourceImageAssetVersionDigests[0],
            realVideoPlan.sourceImageAssetVersionDigests[0],
            ...realVideoPlan.sourceImageAssetVersionDigests.slice(2),
          ],
        },
        videoGenerationRequests: [
          videoGenerationRequests[0],
          {
            ...videoGenerationRequests[1],
            sourceImageAssetVersionRef: videoGenerationRequests[0].sourceImageAssetVersionRef,
            sourceImageAssetVersionDigest: videoGenerationRequests[0].sourceImageAssetVersionDigest,
          },
          ...videoGenerationRequests.slice(2),
        ],
      },
    ],
    [
      "carries admission evidence before the admission state",
      {
        ...realVideoReadyRevision,
        state: "REAL_VIDEO_PLAN_READY",
        productionState: "REAL_VIDEO_PLAN_READY",
        productionProjection: {
          state: "REAL_VIDEO_PLAN_READY",
          authority: "V5_EVIDENCE_TRANSITIONS",
        },
      },
    ],
    [
      "claims readiness without a complete admission bundle",
      {
        ...realVideoRevision,
        state: "REAL_VIDEO_READY",
        productionState: "REAL_VIDEO_READY",
        productionProjection: {
          state: "REAL_VIDEO_READY",
          authority: "V5_EVIDENCE_TRANSITIONS",
        },
      },
    ],
    [
      "claims readiness with an empty canonical candidate journal",
      {
        ...realVideoReadyRevision,
        candidateLifecycle: {
          ...realVideoReadyRevision.candidateLifecycle,
          candidates: [],
        },
        candidates: [],
      },
    ],
    [
      "reports the wrong expected candidate cardinality",
      {
        ...realVideoReadyRevision,
        visualQcState: {
          ...realVideoReadyRevision.visualQcState,
          expectedCandidateCount: 1,
        },
      },
    ],
    [
      "diverges an admitted candidate digest from its journal record",
      {
        ...realVideoReadyRevision,
        candidateLifecycle: {
          ...realVideoReadyRevision.candidateLifecycle,
          candidates: [
            {
              ...videoCandidates[0],
              candidate: {
                ...videoCandidates[0].candidate,
                payloadDigest: "0".repeat(64),
              },
            },
            ...videoCandidates.slice(1),
          ],
        },
        candidates: [
          {
            ...videoCandidates[0],
            candidate: {
              ...videoCandidates[0].candidate,
              payloadDigest: "0".repeat(64),
            },
          },
          ...videoCandidates.slice(1),
        ],
      },
    ],
    [
      "breaks the semantic-QC to technical-validation digest edge",
      {
        ...realVideoReadyRevision,
        candidateLifecycle: {
          ...realVideoReadyRevision.candidateLifecycle,
          candidates: [
            {
              ...videoCandidates[0],
              semanticVisualQc: {
                ...videoCandidates[0].semanticVisualQc,
                technicalValidationDigest: "f".repeat(64),
              },
            },
            ...videoCandidates.slice(1),
          ],
        },
        candidates: [
          {
            ...videoCandidates[0],
            semanticVisualQc: {
              ...videoCandidates[0].semanticVisualQc,
              technicalValidationDigest: "f".repeat(64),
            },
          },
          ...videoCandidates.slice(1),
        ],
      },
    ],
    [
      "omits the admitted candidate artifact identity",
      {
        ...realVideoReadyRevision,
        candidateLifecycle: {
          ...realVideoReadyRevision.candidateLifecycle,
          candidates: [
            {
              ...videoCandidates[0],
              candidate: { ...videoCandidates[0].candidate, artifactRef: undefined },
            },
            ...videoCandidates.slice(1),
          ],
        },
        candidates: [
          {
            ...videoCandidates[0],
            candidate: { ...videoCandidates[0].candidate, artifactRef: undefined },
          },
          ...videoCandidates.slice(1),
        ],
      },
    ],
    [
      "omits the external selection authority identity",
      {
        ...realVideoReadyRevision,
        candidateLifecycle: {
          ...realVideoReadyRevision.candidateLifecycle,
          candidates: [
            {
              ...videoCandidates[0],
              humanSelection: {
                ...videoCandidates[0].humanSelection,
                authorityRef: undefined,
              },
            },
            ...videoCandidates.slice(1),
          ],
        },
        candidates: [
          {
            ...videoCandidates[0],
            humanSelection: {
              ...videoCandidates[0].humanSelection,
              authorityRef: undefined,
            },
          },
          ...videoCandidates.slice(1),
        ],
      },
    ],
    [
      "returns sparse AssetAdmission objects",
      {
        ...realVideoReadyRevision,
        videoAssetAdmissions: videoAssetVersions.map((item) => ({
          assetVersionRef: item.assetVersionRef,
        })),
      },
    ],
    [
      "weakens an admitted AssetVersion publication lock",
      {
        ...realVideoReadyRevision,
        videoAssetVersions: [
          { ...videoAssetVersions[0], publicationAllowed: true },
          ...videoAssetVersions.slice(1),
        ],
      },
    ],
    [
      "returns a zero-byte admitted video AssetVersion",
      {
        ...realVideoReadyRevision,
        videoAssetVersions: [
          { ...videoAssetVersions[0], byteSize: 0 },
          ...videoAssetVersions.slice(1),
        ],
      },
    ],
    [
      "omits an admitted AssetVersion predecessor digest",
      {
        ...realVideoReadyRevision,
        videoAssetVersions: [
          { ...videoAssetVersions[0], supersedesAssetVersionDigest: undefined },
          ...videoAssetVersions.slice(1),
        ],
      },
    ],
    [
      "reuses one logical video asset across admitted slots",
      {
        ...realVideoReadyRevision,
        videoAssetVersions: [
          videoAssetVersions[0],
          { ...videoAssetVersions[1], assetRef: videoAssetVersions[0].assetRef },
          ...videoAssetVersions.slice(2),
        ],
      },
    ],
  ])("fails closed when a real-video revision %s", async (_case, payload) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(payload));

    await expect(
      getK2RealVideoRevision("run-1", "real-video-candidates"),
    ).rejects.toMatchObject({
      status: 502,
      detail: { code: "real_video_revision_contract_mismatch" },
    });
  });

  it("consumes every unified real-image resource as one revision contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        ok: true,
        state: "REAL_IMAGE_PLAN_READY",
        realImagePlan: {
          schemaVersion: "v5.k2-real-image-plan.v1",
          realImagePlanRef: "real-image-plan-v1",
        },
        generationRequests: [],
        publicationAllowed: false,
      }),
    );

    for (const resource of K2_REAL_IMAGE_READ_RESOURCES) {
      await expect(getK2RealImageRevision("run-1", resource)).resolves.toMatchObject({
        ok: true,
        state: "REAL_IMAGE_PLAN_READY",
      });
    }

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(
      K2_REAL_IMAGE_READ_RESOURCES.map(
        (resource) => `/api/creator/episode-production-runs/run-1/${resource}`,
      ),
    );
  });

  it("fails closed when a unified real-image revision is incomplete", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        state: "REAL_IMAGE_PLAN_READY",
        realImagePlan: {},
        generationRequests: "not-an-array",
      }),
    );

    await expect(
      getK2RealImageRevision("run-1", "real-image-candidates"),
    ).rejects.toMatchObject({
      status: 502,
      detail: { code: "real_image_revision_contract_mismatch" },
    });
  });
});
