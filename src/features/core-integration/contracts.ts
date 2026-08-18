export type CapabilityState =
  | "available"
  | "local_evidence_only"
  | "production_policy_required"
  | "authority_required"
  | "not_open";

export type CreatorCapability = {
  id: `M${number}`;
  name: string;
  state: CapabilityState;
  publicResources: string[];
  requirements: string[];
};

export type CreatorCapabilitiesEnvelope = {
  ok: true;
  schemaVersion: "creator.public.capabilities.v1";
  apiVersion: "v1";
  capabilities: CreatorCapability[];
};

export type CreatorError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export type CreatorErrorEnvelope = {
  ok: false;
  error: CreatorError;
};

export type CreatorProject = {
  schemaVersion: string;
  projectRef: string;
  projectType: string;
  title: string;
  description: string;
  targetPlatform: string;
  aspectRatio: string;
  defaultDurationSec: number;
  plannedEpisodeCount: number;
  status: string;
  seriesRefs: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CreatorEpisode = {
  schemaVersion: string;
  seriesRef: string;
  episodeRef: string;
  episodeNumber: number;
  seasonNumber: number;
  volumeNumber: number;
  title: string;
  status: string;
  canonicalProjectRef: string | null;
  creativePlanRef: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  confirmedPlanBinding?: Record<string, unknown>;
};

export type CreatorSeries = {
  schemaVersion: string;
  seriesRef: string;
  title: string;
  description: string;
  status: string;
  plannedEpisodeCount: number;
  episodes: CreatorEpisode[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProjectsEnvelope = {
  ok: true;
  projects: CreatorProject[];
};

export type ProjectEnvelope = {
  ok: true;
  project: CreatorProject;
};

export type SeriesEnvelope = {
  ok: true;
  series: CreatorSeries;
};

export type EpisodeEnvelope = {
  ok: true;
  episode: CreatorEpisode;
};

export type CreatorScript = {
  scriptRef: string;
  title: string;
  currentScriptVersionRef: string;
  confirmedScriptVersionRef: string | null;
  version: number;
  [key: string]: unknown;
};

export type CreatorScriptScene = {
  scriptSceneRef: string;
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  action: string;
  dialogue: Array<Record<string, unknown>>;
  narration: string[];
  subtitleText: string[];
  estimatedDurationSec: number;
  scenePurpose: string;
  continuityNotes: string[];
  productionNotes: string[];
  [key: string]: unknown;
};

export type CreatorScriptVersion = {
  scriptRef: string;
  scriptVersionRef: string;
  versionNumber: number;
  title: string;
  logline: string;
  synopsis: string;
  targetDurationSec: number;
  scenes: CreatorScriptScene[];
  changeKind: string;
  createdAt: string;
  [key: string]: unknown;
};

export type ScriptWorkspaceEnvelope = {
  ok: true;
  workspace: {
    bootstrap: Record<string, unknown>;
    script: CreatorScript | null;
    versions: CreatorScriptVersion[];
  };
};

export type ScriptMutationEnvelope = {
  ok: true;
  script: CreatorScript;
  scriptVersion?: CreatorScriptVersion;
  confirmedVersion?: CreatorScriptVersion;
};

export type CreatorCreativeBrief = {
  topic: string;
  theme: string;
  audience: string;
  duration: string;
  platform: string;
  style: string;
  character: string;
};

export type CreatorDirectorPlan = {
  schemaVersion: "creator.ai-director.plan.v1";
  creativeInterpretation: {
    logline: string;
    coreTheme: string;
    targetEmotion: string;
    narrativeArc: string;
  };
  storyDirection: {
    title: string;
    synopsis: string;
    keyBeats: string[];
  };
  scriptDraft: {
    opening: string;
    development: string;
    climax: string;
    ending: string;
    captionsOrDialogue: string[];
  };
  storyboardPlan: Array<{
    shotNo: number;
    durationSec: number;
    shotSize: string;
    cameraMovement: string;
    visualDescription: string;
    narrativePurpose: string;
  }>;
  visualStyle: {
    lighting: string;
    palette: string;
    composition: string;
    atmosphere: string;
    continuityRules: string[];
  };
  productionPlan: {
    shotCount: number;
    characters: string[];
    scenes: string[];
    visualAssets: string[];
    audioNeeds: string[];
    productionNotes: string[];
  };
};

export type DirectorCandidateEnvelope = {
  ok: true;
  kind: "candidate-creative-plan";
  confirmationRequired: true;
  sourcePlanRef: string;
  sourcePlanVersion: number;
  plan: CreatorDirectorPlan;
};

export type ConfirmedCreativePlan = {
  creativePlanRef: string;
  sourcePlanRef: string;
  sourcePlanSchemaVersion: string;
  sourcePlanVersion: number;
  humanConfirmed: true;
  [key: string]: unknown;
};

export type ConfirmedCreativePlanEnvelope = {
  ok: true;
  confirmedPlan: ConfirmedCreativePlan;
};

export type CreatorSeriesPlanCandidate = {
  schemaVersion: "creator.series-plan.candidate.v1";
  seriesConcept: string;
  premise: string;
  logline: string;
  mainNarrativeDirection: string;
  mainArcs: Array<{
    arcNumber: number;
    title: string;
    episodeStart: number;
    episodeEnd: number;
    objective: string;
    turningPoint: string;
  }>;
  subArcs: Array<Record<string, unknown>>;
  characterArcIntents: Array<Record<string, unknown>>;
  episodePlanItems: Array<{
    episodeNumber: number;
    title: string;
    logline: string;
    arcNumber: number;
    narrativePurpose: string;
    continuityNotes: string[];
    foreshadowing: string[];
  }>;
  narrativeRhythm: string;
  worldIntent: string;
  continuityIntent: string[];
  foreshadowingContext: string[];
  productionAssumptions: string[];
};

export type SeriesPlanCandidateEnvelope = {
  ok: true;
  kind: "candidate-series-plan";
  confirmationRequired: true;
  candidate: CreatorSeriesPlanCandidate;
};

export type CreatorSeriesPlan = {
  seriesPlanRef: string;
  currentSeriesPlanVersionRef: string;
  confirmedSeriesPlanVersionRef: string | null;
  status: string;
  version: number;
  [key: string]: unknown;
};

export type CreatorSeriesPlanVersion = Omit<CreatorSeriesPlanCandidate, "schemaVersion"> & {
  schemaVersion: string;
  seriesPlanRef: string;
  seriesPlanVersionRef: string;
  versionNumber: number;
  changeKind: string;
  [key: string]: unknown;
};

export type SeriesPlanningWorkspaceEnvelope = {
  ok: true;
  workspace: {
    schemaVersion: string;
    context: Record<string, unknown>;
    plan: CreatorSeriesPlan | null;
    versions: CreatorSeriesPlanVersion[];
  };
};

export type ConfirmedSeriesPlanEnvelope = {
  ok: true;
  plan: CreatorSeriesPlan;
  version: CreatorSeriesPlanVersion;
};

export type SeriesIntelligenceWorkspaceEnvelope = {
  ok: true;
  workspace: {
    schemaVersion: string;
    scope: Record<string, unknown>;
    seriesBible: Record<string, unknown> | null;
    seriesBibleVersions: Array<Record<string, unknown>>;
    characterContinuity: Record<string, unknown> | null;
    characterContinuityVersions: Array<Record<string, unknown>>;
    activeBaseline: Record<string, unknown> | null;
    baselineHistory: Array<Record<string, unknown>>;
    sourceCompatibility: string;
  };
};

export type EpisodeProductionState =
  | "ROOTS_READY"
  | "AUTHORITY_READY"
  | "SCRIPT_VALIDATED"
  | "SHOTS_COMPILED"
  | "ASSETS_READY"
  | "MEDIA_READY"
  | "PREVIEW_READY"
  | "QC_READY"
  | "APPROVAL_READY"
  | "MASTER_READY";

export type CreatorEpisodeProductionRun = {
  schemaVersion: string;
  productionRunRef: string;
  contentProfileRef: string;
  projectRef: string;
  seriesRef: string;
  episodeRef: string;
  seriesPlanRef: string;
  seriesPlanVersionRef: string;
  episodePlanItemRef: string;
  scriptRef: string;
  scriptVersionRef: string;
  manifest: {
    expectedShotCount?: number;
    executionMode?: string;
    output?: {
      width?: number;
      height?: number;
      frameRate?: number;
      totalFrames?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  upstreamSnapshot: Record<string, unknown>;
  upstreamDigest: string;
  payloadDigest: string;
  state: EpisodeProductionState;
  createdAt: string;
  updatedAt: string;
  version: number;
  idempotentReplay: boolean;
  completedGates?: string[];
};

export type EpisodeProductionRunsEnvelope = {
  ok: true;
  runs: CreatorEpisodeProductionRun[];
};

export type CreatorCreativeShotVersion = {
  creativeShotRef: string;
  creativeShotVersionRef: string;
  scriptSceneRef: string;
  globalOrder: number;
  sceneOrder: number;
  durationFrames: number;
  frameRate: number;
  cameraInstruction: {
    shotSize?: string;
    movement?: string;
    angle?: string;
    lensMm?: number;
    intent?: string;
    [key: string]: unknown;
  };
  action?: string;
  requiredCharacterIdentityLocks: Array<{
    scriptCharacterName?: string;
    characterRef: string;
    identityLockVersionRef: string;
    referenceVersionRef: string;
    [key: string]: unknown;
  }>;
  payloadDigest: string;
  [key: string]: unknown;
};

export type ShotGraphBundleEnvelope = {
  ok: true;
  state: EpisodeProductionState;
  consistencyValidation: Record<string, unknown>;
  storyboardVersion: {
    storyboardVersionRef: string;
    scenes?: Array<Record<string, unknown>>;
    payloadDigest: string;
    [key: string]: unknown;
  };
  creativeShotVersions: CreatorCreativeShotVersion[];
  executableShotGraph: {
    executableShotGraphVersionRef: string;
    shots: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    output: {
      width?: number;
      height?: number;
      frameRate?: number;
      totalFrames?: number;
      [key: string]: unknown;
    };
    payloadDigest: string;
    publicationAllowed: false;
    [key: string]: unknown;
  };
};

export type AssetPlanBundleEnvelope = {
  ok: true;
  state: EpisodeProductionState;
  assetResolutionManifest: {
    summary?: {
      requirements?: number;
      resolvedAuthority?: number;
      generationRequested?: number;
      blocked?: number;
      generationRequests?: number;
      [key: string]: unknown;
    };
    payloadDigest: string;
    publicationAllowed: false;
    [key: string]: unknown;
  };
  assetRequirements: Array<Record<string, unknown>>;
  generationRequests: Array<Record<string, unknown>>;
};

export type MediaBundleEnvelope = {
  ok: true;
  state: EpisodeProductionState;
  mediaManifest: {
    summary?: {
      requested?: number;
      verifiedResults?: number;
      registeredAssets?: number;
      videoAssets?: number;
      audioAssets?: number;
      failed?: number;
      [key: string]: unknown;
    };
    payloadDigest: string;
    provenance: string;
    gpuUsed: false;
    publicationAllowed: false;
    [key: string]: unknown;
  };
  generationResults: Array<Record<string, unknown>>;
  assetVersions: Array<Record<string, unknown>>;
  jobs: Array<{
    jobRef: string;
    mediaKind: string;
    state: string;
    gpuUsed: boolean | null;
    provenance: string | null;
    [key: string]: unknown;
  }>;
};

export type ProductionReadinessState =
  | "BLOCKED_POLICY"
  | "BLOCKED_EXTERNAL_EVIDENCE";

export type ProductionReadinessEnvelope = {
  ok: true;
  policyBundle: Record<string, unknown> | null;
  readiness: {
    state: ProductionReadinessState;
    policyRecorded: boolean;
    rightsState: string;
    providerPolicyState: string;
    persistenceClass: string;
    rootPayloadDigest?: string;
    blockers: string[];
    publicationAllowed: false;
  };
};

export type QcCheck = {
  checkId: string;
  status: "PASSED" | "FAILED";
  evidence?: string;
  [key: string]: unknown;
};

export type DeliveryBundleEnvelope = {
  ok: true;
  state: EpisodeProductionState;
  productionRunRef: string;
  timelineVersion?: {
    timelineVersionRef: string;
    items: Array<Record<string, unknown>>;
    output: Record<string, unknown>;
    payloadDigest: string;
    [key: string]: unknown;
  };
  previewCandidate?: {
    previewCandidateVersionRef: string;
    mediaType: string;
    byteSize: number;
    sha256: string;
    provenance: string;
    approvalStatus: string;
    gpuUsed: false;
    publicationAllowed: false;
    payloadDigest: string;
    [key: string]: unknown;
  };
  qcReport?: {
    qcReportRef: string;
    result: "PASS" | "FAIL";
    checks: QcCheck[];
    machineVerified: boolean;
    approvalStatus: string;
    publicationAllowed: false;
    payloadDigest: string;
    [key: string]: unknown;
  };
  approvalDecisions?: Array<{
    kind: EpisodeApprovalKind;
    decision: "ACCEPT";
    approvalRef: string;
    actorRef: string;
    authorityType: string;
    payloadDigest: string;
    [key: string]: unknown;
  }>;
  episodeMaster?: {
    episodeMasterVersionRef: string;
    state: "IMMUTABLE_MASTER";
    mediaType: string;
    byteSize: number;
    sha256: string;
    provenance: string;
    gpuUsed: false;
    publicationAllowed: false;
    payloadDigest: string;
    [key: string]: unknown;
  };
  exportArtifact?: {
    exportArtifactRef: string;
    fileName: string;
    mediaType: string;
    byteSize: number;
    sha256: string;
    state: "PLAYABLE_LOCAL_EVIDENCE";
    downloadAllowed: boolean;
    publicationAllowed: false;
    payloadDigest: string;
    [key: string]: unknown;
  };
};

export type EpisodeApprovalKind =
  | "CREATIVE_DIRECTION"
  | "IDENTITY_CONTINUITY"
  | "TECHNICAL_QC"
  | "FINAL_MASTER";

export type PreviewMutationEnvelope = DeliveryBundleEnvelope & {
  idempotentReplay: boolean;
};

export type FinalizeMutationEnvelope = DeliveryBundleEnvelope & {
  approvalDecisions: NonNullable<DeliveryBundleEnvelope["approvalDecisions"]>;
  episodeMaster: NonNullable<DeliveryBundleEnvelope["episodeMaster"]>;
  exportArtifact: NonNullable<DeliveryBundleEnvelope["exportArtifact"]>;
  idempotentReplay: boolean;
};

export type CoreConnectionState =
  | { status: "loading" }
  | { status: "connected"; capabilities: CreatorCapability[] }
  | { status: "disconnected" | "error"; error: CreatorError };

export const CREATOR_CAPABILITY_CATALOG = [
  ["M1", "AI Director"],
  ["M2", "Series + Episode Foundation"],
  ["M3", "Script Studio"],
  ["M4", "Project Context"],
  ["M5", "Series Planning + Series Director"],
  ["M6", "Series Intelligence"],
  ["M7", "Narrative Closed Loop"],
  ["M8", "Storyboard + Creative Shot Domain"],
  ["M9", "Asset Requirement + Asset Intelligence"],
  ["M10", "Image Generation"],
  ["M11", "Video Production"],
  ["M12", "Audio Production"],
  ["M13", "Timeline + Composition + Render"],
  ["M14", "Preview + QC + Approval + Local Regeneration"],
  ["M15", "Episode Master + Works"],
  ["M16", "Batch Production Orchestration"],
  ["M17", "Series Release & Management"],
  ["M18", "Performance Feedback"],
  ["M19", "Commercial SaaS + Enterprise Hardening"],
] as const;

export function isCreatorErrorEnvelope(value: unknown): value is CreatorErrorEnvelope {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<CreatorErrorEnvelope>;
  return (
    envelope.ok === false &&
    Boolean(envelope.error) &&
    typeof envelope.error?.code === "string" &&
    typeof envelope.error?.message === "string"
  );
}

export function creatorErrorFromUnknown(
  value: unknown,
  fallbackCode = "unexpected_response",
): CreatorError {
  if (isCreatorErrorEnvelope(value)) return value.error;
  return {
    code: fallbackCode,
    message: "服务返回了无法识别的响应，请稍后重试。",
  };
}
