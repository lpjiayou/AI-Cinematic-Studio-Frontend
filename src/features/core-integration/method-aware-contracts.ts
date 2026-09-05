// Public DTOs audited against Core e21789d265c4e936b0e0b29921746a4c205889b8.
export const METHOD_AWARE_RESOURCES = [
  "execution-method-plan", "method-aware-input-plan", "method-aware-video-route",
  "explicit-audio-requirement-route",
] as const;
export type MethodAwareResource = (typeof METHOD_AWARE_RESOURCES)[number];
export const EXECUTION_METHOD_BY_CLASS = {
  STATIC_HOLD: "STATIC_PLATE_OR_REUSE",
  MICRO_MOTION: "SINGLE_ANCHOR_I2V",
  CONTACT_ACTION: "CONTACT_CONDITIONED_VIDEO",
  GAIT_LOCOMOTION: "POSE_OR_TRAJECTORY_CONDITIONED_VIDEO",
  DETERMINISTIC_EVENT: "V3_DETERMINISTIC_COMPOSITION",
} as const;
export type ExecutionClass = keyof typeof EXECUTION_METHOD_BY_CLASS;
export type ExecutionMethod = (typeof EXECUTION_METHOD_BY_CLASS)[ExecutionClass];
export const AUDIO_TYPES = ["DIALOGUE", "NARRATION", "AMBIENCE", "SFX", "MUSIC", "SILENCE"] as const;
export type MethodAwareAudioType = (typeof AUDIO_TYPES)[number];
export const METHOD_INPUT_ROLES = [
  "STATIC_PLATE", "ACTION_READY_ANCHOR", "SUBJECT_CONDITIONING", "TARGET_CONDITIONING",
  "POSE_CONDITIONING", "TRAJECTORY_CONDITIONING", "EVENT_FREE_BASE_PLATE", "MASK_ASSET",
  "RESOURCE_ASSET", "STATIC_ASSET",
] as const;
export type MethodInputRole = (typeof METHOD_INPUT_ROLES)[number];
export type RequirementDisposition = "REUSE_EXISTING_ASSET" | "GENERATE_NEW_ASSET" |
  "DERIVE_DETERMINISTIC_POSTPROCESS" | "CAPABILITY_UNAVAILABLE" | "NO_ASSET_REQUIRED";
export interface MethodAwareCommandScope { projectRef: string; seriesRef: string; episodeRef: string }
export interface MethodAwareReadOptions extends MethodAwareCommandScope {
  productionRunRef: string; versionRef?: string; signal?: AbortSignal;
}
export interface MethodAwareSourceSpan {
  scriptSceneRef: string;
  sourceField: "ACTION" | "DIALOGUE" | "NARRATION" | "SUBTITLE_TEXT";
  sourceIndex: number; startOffsetInclusive: number; endOffsetExclusive: number;
}
export interface MethodAwareTiming { startFrameInclusive: number; endFrameExclusive: number }
export interface MethodAwareCamera { framing: string; movement: string }
interface ActionExecutionBeatInputBase {
  beatRef: string; beatOrder: number; sourceSpan: MethodAwareSourceSpan;
  subjectRefs: string[]; targetRefs: string[]; frameRangeStartInclusive: number;
  frameRangeEndExclusive: number;
}
export type ActionExecutionBeatInput = ActionExecutionBeatInputBase & (
  { executionClass: "DETERMINISTIC_EVENT"; postprocessRequirementKey: string } |
  { executionClass: Exclude<ExecutionClass, "DETERMINISTIC_EVENT"> }
);
export type MethodAwareAudioIntent = { beatRef: string; timingReference: MethodAwareTiming } & (
  { audioType: "DIALOGUE"; sourceSpan: MethodAwareSourceSpan & { sourceField: "DIALOGUE" } } |
  { audioType: "NARRATION"; sourceSpan: MethodAwareSourceSpan & { sourceField: "NARRATION" } } |
  { audioType: "AMBIENCE" | "SFX" | "MUSIC" | "SILENCE" }
);
export interface ExecutionMethodShotInput {
  shotOrder: number; shotFrameCount: number; cameraInstruction: MethodAwareCamera;
  actionExecutionBeats: ActionExecutionBeatInput[]; audioIntents: MethodAwareAudioIntent[];
}
export interface CreateExecutionMethodPlanCommand extends MethodAwareCommandScope {
  consistencyValidationVersionRef: string; shots: ExecutionMethodShotInput[]; idempotencyKey: string;
}
export interface MethodAwareAssetBindingInput {
  visualExecutionRequirementRef: string; inputRequirementKey: string;
  inputRole: MethodInputRole; assetVersionRef: string;
}
export interface CreateMethodAwareInputPlanCommand extends MethodAwareCommandScope {
  assetBindings: MethodAwareAssetBindingInput[]; idempotencyKey: string;
}
export interface CreateMethodAwareVideoRouteCommand extends MethodAwareCommandScope { idempotencyKey: string }
export interface CreateExplicitAudioRequirementRouteCommand extends MethodAwareCommandScope {
  audioRequirementRef: string; idempotencyKey: string; rightsBindingRef?: string; voiceAssetVersionRef?: string;
}
export interface MethodAwareResponseScope extends MethodAwareCommandScope {
  workspaceRef: string; productionRunRef: string;
}
interface Sealed { payloadDigest: string }
interface Envelope extends Sealed, MethodAwareResponseScope {
  ok: true; currentness: "CURRENT" | "STALE"; idempotentReplay: boolean;
}
interface ScriptBinding { scriptVersionRef: string; scriptVersionDigest: string }
interface StoryboardBinding { storyboardVersionRef: string; storyboardVersionDigest: string }
interface BeatBinding {
  creativeShotVersionRef: string; creativeShotVersionDigest: string; beatRef: string; beatDigest: string;
}
export interface StoryboardVersion extends Sealed, MethodAwareResponseScope, ScriptBinding {
  schemaVersion: "v5.storyboard-version.v2"; storyboardRef: string; storyboardVersionRef: string;
  storyboardVersion: number; consistencyValidationVersionRef: string; consistencyValidationDigest: string;
  creativeShotVersionRefs: string[];
}
export type ActionExecutionBeat = ActionExecutionBeatInput & Sealed & {
  schemaVersion: "v5.action-execution-beat.v1"; sourceTextDigest: string;
};
export interface CreativeShotVersion extends Sealed, MethodAwareResponseScope, ScriptBinding, StoryboardBinding {
  schemaVersion: "v5.creative-shot-version.v2"; creativeShotRef: string; creativeShotVersionRef: string;
  creativeShotVersion: number; shotOrder: number; storyboardRef: string; scriptSceneRefs: string[];
  shotFrameCount: number; cameraInstruction: MethodAwareCamera; actionExecutionBeats: ActionExecutionBeat[];
}
interface Requirement extends Sealed, MethodAwareResponseScope, StoryboardBinding, BeatBinding {
  requirementOrder: number; disposition: RequirementDisposition;
}
export interface VisualExecutionRequirement extends Requirement {
  schemaVersion: "v5.visual-execution-requirement.v1"; visualExecutionRequirementRef: string;
  executionClass: ExecutionClass; executionMethod: ExecutionMethod;
}
export type AudioRequirement = Requirement & ScriptBinding & {
  schemaVersion: "v5.audio-requirement.v1"; audioRequirementRef: string; timingReference: MethodAwareTiming;
} & (
  { audioType: "DIALOGUE"; sourceSpan: MethodAwareSourceSpan; sourceTextDigest: string; speakerCharacterRef: string } |
  { audioType: "NARRATION"; sourceSpan: MethodAwareSourceSpan; sourceTextDigest: string } |
  { audioType: "AMBIENCE" | "SFX" | "MUSIC" | "SILENCE" }
);
export interface PostprocessRequirement extends Requirement {
  schemaVersion: "v5.postprocess-requirement.v1"; postprocessRequirementRef: string;
  postprocessRequirementKey: string; executionMethod: "V3_DETERMINISTIC_COMPOSITION";
  eventFreeBaseMediaRequirementKey: string; maskAssetRequirementKeys: never[];
  resourceAssetRequirementKeys: never[]; staticAssetRequirementKeys: never[];
}
export interface ExecutionMethodPlanEnvelope extends Envelope, ScriptBinding {
  schemaVersion: "v5.execution-method-plan.v2"; executionMethodPlanRef: string;
  executionMethodPlanVersionRef: string; planningVersion: number;
  consistencyValidationVersionRef: string; consistencyValidationDigest: string;
  storyboardVersion: StoryboardVersion; creativeShotVersions: CreativeShotVersion[];
  visualExecutionRequirements: VisualExecutionRequirement[]; audioRequirements: AudioRequirement[];
  postprocessRequirements: PostprocessRequirement[];
}
export interface MethodAwareResolvedAssetBinding {
  inputRequirementKey: string; inputRole: MethodInputRole; assetRef: string; assetVersionRef: string;
  assetVersionDigest: string; assetVersionNumber: number; mediaKind: "IMAGE"; mediaType: string;
  contentDigest: string; sourceCandidateRef: string;
}
export interface MethodInputRequirement extends Sealed {
  schemaVersion: "v5.method-input-requirement.v1"; inputRequirementKey: string;
  acceptedInputRoles: MethodInputRole[]; minimumAssetCount: number; maximumAssetCount: number;
  assetVersionBindings: MethodAwareResolvedAssetBinding[];
  resolutionState: "RESOLVED_CURRENT_ASSET" | "ASSET_REQUIRED";
}
export interface MethodInputPlan extends Sealed, BeatBinding {
  schemaVersion: "v5.method-input-plan.v1"; methodInputPlanRef: string; inputPlanOrder: number;
  visualExecutionRequirementRef: string; visualExecutionRequirementDigest: string;
  executionClass: ExecutionClass; executionMethod: ExecutionMethod; sourceDisposition: RequirementDisposition;
  inputRequirements: MethodInputRequirement[]; inputPlanningState: "READY" | "INPUT_REQUIRED";
}
interface ExecutionPlanBinding { executionMethodPlanVersionRef: string; executionMethodPlanDigest: string }
export interface MethodAwareInputPlanEnvelope extends Envelope, ExecutionPlanBinding {
  schemaVersion: "v5.method-aware-input-plan.v1"; methodAwareInputPlanRef: string;
  methodAwareInputPlanVersionRef: string; inputPlanningVersion: number; executionMethodPlanRef: string;
  methodInputPlans: MethodInputPlan[]; requestedAssetBindingCount: number; resolvedAssetBindingCount: number;
  inputReadyCount: number; inputBlockedCount: number; publicationAllowed: false; createdAt: string;
}
export type MethodAwareRoutingState = "BYPASSED_STATIC_PLATE" | "QUEUED_EXISTING_MEDIA_JOB" |
  "CAPABILITY_UNAVAILABLE" | "REJECTED_DETERMINISTIC_POSTPROCESS" | "INPUT_BLOCKED";
export interface VideoMethodRoute extends Sealed, BeatBinding {
  schemaVersion: "v5.video-method-route.v1"; routeRef: string; routeOrder: number;
  methodInputPlanRef: string; methodInputPlanDigest: string;
  visualExecutionRequirementRef: string; visualExecutionRequirementDigest: string;
  executionClass: ExecutionClass; executionMethod: ExecutionMethod; routingState: MethodAwareRoutingState;
  adapterCapability: string | null; adapterIdentity: string | null;
  videoGenerationRequestRef: string | null; videoGenerationRequestDigest: string | null;
  mediaJobRef: string | null; fallbackUsed: false;
  targetBoundary: "M10_ASSET_OUTPUT" | "M11_VIDEO_EXECUTION" | "M13_DETERMINISTIC_POSTPROCESS";
}
interface InputPlanBinding { methodAwareInputPlanVersionRef: string; methodAwareInputPlanDigest: string }
export interface MethodAwareVideoGenerationRequest extends Sealed, MethodAwareResponseScope, ExecutionPlanBinding, InputPlanBinding, BeatBinding {
  schemaVersion: "v5.method-aware-video-generation-request.v1"; generationRequestRef: string;
  generationRequestVersionRef: string; version: 1;
  visualExecutionRequirementRef: string; visualExecutionRequirementDigest: string;
  executionClass: "MICRO_MOTION"; executionMethod: "SINGLE_ANCHOR_I2V";
  sourceImageAssetRef: string; sourceImageAssetVersionRef: string; sourceImageAssetVersionDigest: string;
  sourceImageContentDigest: string; sourceImageMediaType: string; cameraInstruction: MethodAwareCamera;
  sourceAction: { sourceSpan: MethodAwareSourceSpan; sourceTextDigest: string };
  frameRange: MethodAwareTiming; adapterCapability: "self-hosted-wan22-image-to-video-v1";
  executionMode: "INTERNAL_SELF_HOSTED"; executionAuthorizationState: "QUEUED_NOT_EXECUTED";
  selectionRequired: true; publicationAllowed: false; createdAt: string;
}
export interface MethodAwareQueuedJob {
  generationRequestRef: string; generationRequestDigest: string; mediaJobRef: string;
  queueState: "QUEUED"; queueReplay: boolean;
}
export interface MethodAwareVideoRouteEnvelope extends Envelope, ExecutionPlanBinding, InputPlanBinding {
  schemaVersion: "v5.video-method-route-plan.v1"; videoMethodRouteRef: string; videoMethodRouteVersionRef: string;
  routingVersion: number; methodAwareInputPlanRef: string;
  capabilityRegistryVersion: "v5.video-method-capability-registry.v1"; capabilityRegistryDigest: string;
  routes: VideoMethodRoute[]; videoGenerationRequests: MethodAwareVideoGenerationRequest[];
  queuedJobs: MethodAwareQueuedJob[]; videoGenerationRequestCount: number; queuedJobCount: number;
  wanFallbackUsed: false; publicationAllowed: false; createdAt: string;
}
export type MethodAwareAudioRole = "dialogue" | "narration" | "sfx" | "ambience";
export interface MethodAwareVoiceLineage {
  consentGrantRef: string; consentGrantVersionRef: string; consentGrantVersionDigest: string;
  voiceLockVersionRef: string; voiceLockVersionDigest: string; voiceProfileRef: string;
  voiceProfileVersionRef: string; voiceProfileVersionDigest: string;
}
export interface MethodAwareSpeechParameters {
  speechSynthesis: true; text: string; voiceRef: string; sampleRate: number; channels: number;
  audioRole: "dialogue" | "narration";
}
export interface MethodAwareSpeechRequestSpec extends ScriptBinding {
  speechRole: "dialogue" | "narration"; dialogueRef: string | null; narrationRef: string | null;
  voiceAssetVersionRef: string; voiceAssetVersionDigest: string; language: string;
  normalizedSpeechParameters: MethodAwareSpeechParameters; sourceAudioCueRefs: never[];
}
interface AudioRequestBase extends Sealed, MethodAwareResponseScope, ExecutionPlanBinding, ScriptBinding {
  schemaVersion: "v5.audio-generation-request.v2"; generationRequestRef: string;
  generationRequestVersionRef: string; version: 1; supersedesGenerationRequestVersionRef: null;
  supersedesGenerationRequestVersionDigest: null; assetRequirementRef: string; assetRequirementDigest: string;
  outputTarget: "ASSET_VERSION"; state: "CONTRACT_ONLY_ADAPTER_REQUIRED"; immutable: true;
  publicationAllowed: false; createdBy: "v5.m9-m12-explicit-audio-bridge.v1"; createdAt: string;
  audioRequirementRef: string; audioRequirementDigest: string; creativeShotVersionRef: string;
  creativeShotVersionDigest: string; timingReference: MethodAwareTiming;
}
interface SpeechRequest extends AudioRequestBase {
  outputAssetVersionType: "DialogueAssetVersion"; requestSpec: MethodAwareSpeechRequestSpec;
  sourceSpan: MethodAwareSourceSpan; sourceTextDigest: string; voiceLineage?: MethodAwareVoiceLineage;
}
export type MethodAwareAudioGenerationRequest =
  (SpeechRequest & { requestKind: "DIALOGUE_SYNTHESIS"; audioRole: "dialogue"; speakerCharacterRef: string }) |
  (SpeechRequest & { requestKind: "NARRATION_SYNTHESIS"; audioRole: "narration" }) |
  (AudioRequestBase & { requestKind: "SFX_GENERATION"; audioRole: "sfx"; outputAssetVersionType: "SfxAssetVersion";
    requestSpec: { sfxKind: "M9_EXPLICIT_SFX"; synthesisSpecDigest: string; sourceAudioCueRefs: never[] } }) |
  (AudioRequestBase & { requestKind: "AMBIENCE_GENERATION"; audioRole: "ambience"; outputAssetVersionType: "AmbienceAssetVersion";
    requestSpec: { ambienceKind: "M9_EXPLICIT_AMBIENCE"; synthesisSpecDigest: string; sourceAudioCueRefs: never[] } });
export interface MethodAwareAudioCueTimingBinding extends Sealed {
  schemaVersion: "v5.m9-m12-audio-cue-timing-binding.v1"; audioRequirementRef: string; audioRequirementDigest: string;
  audioGenerationRequestVersionRef: string; audioGenerationRequestDigest: string;
  creativeShotVersionRef: string; creativeShotVersionDigest: string; audioRole: MethodAwareAudioRole;
  timingReference: MethodAwareTiming; timelineAuthority: "M13_EXISTING_TIMELINE_AUTHORITY";
  bindingState: "AWAITING_TYPED_AUDIO_ASSET";
}
export interface ExplicitAudioRequirementRouteEnvelope extends Envelope, ExecutionPlanBinding {
  schemaVersion: "v5.m9-m12-audio-requirement-route.v1"; audioRequirementRouteRef: string;
  audioRequirementRouteVersionRef: string; routeVersion: number; audioRequirementRef: string;
  audioRequirementDigest: string; audioType: MethodAwareAudioType;
  routeDisposition: "REQUEST_CREATED" | "NO_REQUEST_SILENCE" | "MUSIC_NOT_IMPLEMENTED";
  audioGenerationRequest: MethodAwareAudioGenerationRequest | null;
  audioCueTimingBinding: MethodAwareAudioCueTimingBinding | null;
  m12RuntimeState: "NOT_INSTALLED_G0_NOT_COMPLETE"; m12RuntimeInstalled: false;
  publicationAllowed: false; createdAt: string;
}
