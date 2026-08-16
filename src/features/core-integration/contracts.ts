export type CapabilityState =
  | "available"
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
