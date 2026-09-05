import type { EpisodeProductionState } from "./contracts";

// Public projection shapes from Core e21789d: _active_revision and _visual.
// Synthetic test data only; no fixture is imported by a product module.
export type ProjectionFixtureKind = "active" | "not-recorded" | "ambiguous" | "stale-revision" | "stale-qc";

export function productionTruthProjection(
  kind: ProjectionFixtureKind = "active",
  state: EpisodeProductionState = "MEDIA_READY",
  productionRunRef = "episode-production-run-1",
) {
  const absent = kind === "not-recorded" || kind === "ambiguous";
  const revisionRef = "video-revision-current";
  const candidates = absent ? [] : [1, 2].map((ordinal) => ({
    candidateRef: `candidate-current-${ordinal}`,
    revisionRef,
    visualQcState: kind === "stale-qc" ? "STALE" : kind === "stale-revision" ? "NOT_STARTED" : "SEMANTIC_QC_PASSED",
    ...(kind === "stale-revision" ? {} : {
      semanticVisualQc: {
        visualQcRef: `visual-qc-${ordinal}`,
        visualQcVersion: 1,
        candidateRef: `candidate-current-${ordinal}`,
        result: "PASS",
        payloadDigest: String(ordinal).repeat(64),
      },
    }),
  }));
  const activeRevision = {
    authority: "V5_CANONICAL_APPEND_ONLY" as const,
    mediaKind: "VIDEO" as const,
    candidateRefs: candidates.map((item) => item.candidateRef),
    ...(absent
      ? { state: kind === "ambiguous" ? "BLOCKED_AMBIGUOUS" as const : "NOT_RECORDED" as const, revisionRef: null }
      : kind === "stale-revision"
        ? { state: "STALE_BLOCKED" as const, revisionRef, activationState: "STALE" as const,
            activationManifestRef: "historical-admission", activationManifestDigest: "a".repeat(64), activationRevisionRef: "video-revision-old" }
        : { state: "ACTIVE" as const, revisionRef, activationState: "CURRENT" as const }),
  };
  const visualQcState = {
    state: kind === "stale-revision" ? "STALE_BLOCKED" as const
      : kind === "stale-qc" ? "STALE" as const
        : kind === "ambiguous" ? "BLOCKED_AMBIGUOUS" as const
          : kind === "not-recorded" ? "NOT_RECORDED" as const : "PASS" as const,
    authority: "V5_CANONICAL_APPEND_ONLY" as const,
    activeRevisionRef: activeRevision.revisionRef,
    candidateCount: candidates.length,
    expectedCandidateCount: absent ? null : 2,
    decisionCount: candidates.filter((item) => item.semanticVisualQc).length,
    decisions: candidates.flatMap((item) => item.semanticVisualQc ? [item.semanticVisualQc] : []),
  };
  const latestCandidateRevisionRefs: Record<string, string> = absent ? {} : { VIDEO: revisionRef };
  return {
    ok: true as const,
    schemaVersion: "v5.k2-production-state-projection.v1" as const,
    workspaceRef: "workspace-k2",
    productionRunRef,
    state,
    productionState: state,
    rootState: { state: "ROOTS_READY", authority: "V5_ROOT_DATABASE" as const, mutable: false as const },
    productionProjection: { state, authority: "V5_EVIDENCE_TRANSITIONS" as const },
    runtimeState: { state: "SUCCEEDED", authority: "V4_RUNTIME_NON_CANONICAL" as const },
    activeRevision,
    visualQcState,
    candidateLifecycle: {
      schemaVersion: "v5.k2-candidate-lifecycle-projection.v1" as const,
      workspaceRef: "workspace-k2",
      productionRunRef,
      latestCandidateRevisionRef: activeRevision.revisionRef,
      latestCandidateRevisionRefs,
      activeRevisionRef: activeRevision.revisionRef,
      historicalCandidateCount: kind === "stale-revision" ? 2 : 0,
      candidates,
      assetVersions: [],
      publicationAllowed: false as const,
    },
    candidates,
    invariants: {
      runtimeDoesNotAdvanceProduction: true as const,
      visualQcDoesNotAdvanceProduction: true as const,
      assetVersionAuthority: "V5_CANONICAL_EVIDENCE_ONLY" as const,
      publicationAllowed: false as const,
    },
    publicationAllowed: false as const,
  };
}
