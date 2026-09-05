import { CreatorClientError } from "./browser-client";
import { AUDIO_TYPES, EXECUTION_METHOD_BY_CLASS, METHOD_INPUT_ROLES } from "./method-aware-contracts";
import type * as C from "./method-aware-contracts";

type Check<T> = (value: unknown) => value is T;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const ref: Check<string> = (v): v is string => typeof v === "string" && v.length > 0 && v.trim() === v;
const digest: Check<string> = (v): v is string => typeof v === "string" && /^[0-9a-f]{64}$/.test(v);
const natural: Check<number> = (v): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const positive: Check<number> = (v): v is number => natural(v) && v > 0;
const boolean: Check<boolean> = (v): v is boolean => typeof v === "boolean";
const timestamp: Check<string> = (v): v is string => ref(v) && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v));
function literal<const T extends string | number | boolean | null>(expected: T): Check<T> {
  return (v): v is T => v === expected;
}
function choice<const T extends readonly string[]>(values: T): Check<T[number]> {
  return (v): v is T[number] => typeof v === "string" && values.includes(v);
}
function list<T>(item: Check<T>): Check<T[]> {
  return (v): v is T[] => Array.isArray(v) && Array.from(v).every(item);
}
function nullable<T>(check: Check<T>): Check<T | null> { return (v): v is T | null => v === null || check(v); }
function optional<T>(check: Check<T>): Check<T | undefined> { return (v): v is T | undefined => check(v); }
function union<T>(...checks: Check<T>[]): Check<T> { return (v): v is T => checks.some((check) => check(v)); }
function object<T>(shape: { [K in keyof T]-?: Check<T[K]> }, optionalKeys: readonly (keyof T)[] = []): Check<T> {
  const fields = Object.keys(shape) as (keyof T & string)[];
  return (v): v is T => record(v) && Object.keys(v).every((k) => fields.includes(k as keyof T & string)) &&
    fields.every((k) => Object.hasOwn(v, k) ? shape[k](v[k]) : optionalKeys.includes(k));
}
const empty: Check<never[]> = (v): v is never[] => Array.isArray(v) && v.length === 0;
const refs = list(ref);
const scope = { workspaceRef: ref, projectRef: ref, seriesRef: ref, episodeRef: ref, productionRunRef: ref };
const sealed = { payloadDigest: digest };
const envelope = { ...scope, ...sealed, ok: literal(true), currentness: choice(["CURRENT", "STALE"]), idempotentReplay: boolean };
const scriptBinding = { scriptVersionRef: ref, scriptVersionDigest: digest };
const storyboardBinding = { storyboardVersionRef: ref, storyboardVersionDigest: digest };
const beatBinding = { creativeShotVersionRef: ref, creativeShotVersionDigest: digest, beatRef: ref, beatDigest: digest };
const executionBinding = { executionMethodPlanVersionRef: ref, executionMethodPlanDigest: digest };
const inputBinding = { methodAwareInputPlanVersionRef: ref, methodAwareInputPlanDigest: digest };
const classes = choice(["STATIC_HOLD", "MICRO_MOTION", "CONTACT_ACTION", "GAIT_LOCOMOTION", "DETERMINISTIC_EVENT"]);
const methods = choice(Object.values(EXECUTION_METHOD_BY_CLASS));
const disposition = choice(["REUSE_EXISTING_ASSET", "GENERATE_NEW_ASSET", "DERIVE_DETERMINISTIC_POSTPROCESS", "CAPABILITY_UNAVAILABLE", "NO_ASSET_REQUIRED"]);
const roles = choice(METHOD_INPUT_ROLES);
const sourceSpan = object<C.MethodAwareSourceSpan>({
  scriptSceneRef: ref, sourceField: choice(["ACTION", "DIALOGUE", "NARRATION", "SUBTITLE_TEXT"]),
  sourceIndex: natural, startOffsetInclusive: natural, endOffsetExclusive: positive,
});
const validSpan: Check<C.MethodAwareSourceSpan> = (v): v is C.MethodAwareSourceSpan => sourceSpan(v) && v.endOffsetExclusive > v.startOffsetInclusive;
const timingShape = object<C.MethodAwareTiming>({ startFrameInclusive: natural, endFrameExclusive: positive });
const timing: Check<C.MethodAwareTiming> = (v): v is C.MethodAwareTiming => timingShape(v) && v.endFrameExclusive > v.startFrameInclusive;
const camera = object<C.MethodAwareCamera>({ framing: ref, movement: ref });
const beatBase = {
  ...sealed, schemaVersion: literal("v5.action-execution-beat.v1"), beatRef: ref, beatOrder: positive,
  sourceSpan: validSpan, subjectRefs: refs, targetRefs: refs, frameRangeStartInclusive: natural,
  frameRangeEndExclusive: positive, sourceTextDigest: digest,
};
const beatShape = union<C.ActionExecutionBeat>(
  object<Extract<C.ActionExecutionBeat, { executionClass: "DETERMINISTIC_EVENT" }>>({
    ...beatBase, executionClass: literal("DETERMINISTIC_EVENT"), postprocessRequirementKey: ref,
  }),
  object<Extract<C.ActionExecutionBeat, { executionClass: Exclude<C.ExecutionClass, "DETERMINISTIC_EVENT"> }>>({
    ...beatBase, executionClass: choice(["STATIC_HOLD", "MICRO_MOTION", "CONTACT_ACTION", "GAIT_LOCOMOTION"]),
  }),
);
const beat: Check<C.ActionExecutionBeat> = (v): v is C.ActionExecutionBeat => beatShape(v) && v.frameRangeEndExclusive > v.frameRangeStartInclusive;
const storyboard = object<C.StoryboardVersion>({
  ...sealed, ...scope, ...scriptBinding, schemaVersion: literal("v5.storyboard-version.v2"),
  storyboardRef: ref, storyboardVersionRef: ref, storyboardVersion: positive,
  consistencyValidationVersionRef: ref, consistencyValidationDigest: digest, creativeShotVersionRefs: refs,
});
const shot = object<C.CreativeShotVersion>({
  ...sealed, ...scope, ...scriptBinding, ...storyboardBinding, schemaVersion: literal("v5.creative-shot-version.v2"),
  creativeShotRef: ref, creativeShotVersionRef: ref, creativeShotVersion: positive, shotOrder: positive,
  storyboardRef: ref, scriptSceneRefs: refs, shotFrameCount: positive, cameraInstruction: camera, actionExecutionBeats: list(beat),
});
const requirement = { ...sealed, ...scope, ...storyboardBinding, ...beatBinding, requirementOrder: positive, disposition };
const visual = object<C.VisualExecutionRequirement>({
  ...requirement, schemaVersion: literal("v5.visual-execution-requirement.v1"),
  visualExecutionRequirementRef: ref, executionClass: classes, executionMethod: methods,
});
const audioRequirementBase = { ...requirement, ...scriptBinding, schemaVersion: literal("v5.audio-requirement.v1"), audioRequirementRef: ref, timingReference: timing };
const audioRequirement = union<C.AudioRequirement>(
  object<Extract<C.AudioRequirement, { audioType: "DIALOGUE" }>>({ ...audioRequirementBase, audioType: literal("DIALOGUE"), sourceSpan: validSpan, sourceTextDigest: digest, speakerCharacterRef: ref }),
  object<Extract<C.AudioRequirement, { audioType: "NARRATION" }>>({ ...audioRequirementBase, audioType: literal("NARRATION"), sourceSpan: validSpan, sourceTextDigest: digest }),
  object<Extract<C.AudioRequirement, { audioType: "AMBIENCE" | "SFX" | "MUSIC" | "SILENCE" }>>({ ...audioRequirementBase, audioType: choice(["AMBIENCE", "SFX", "MUSIC", "SILENCE"]) }),
);
const postprocess = object<C.PostprocessRequirement>({
  ...requirement, schemaVersion: literal("v5.postprocess-requirement.v1"), postprocessRequirementRef: ref,
  postprocessRequirementKey: ref, executionMethod: literal("V3_DETERMINISTIC_COMPOSITION"),
  eventFreeBaseMediaRequirementKey: (v): v is string => typeof v === "string" && /^event-free-base:[0-9a-f]{64}$/.test(v),
  maskAssetRequirementKeys: empty, resourceAssetRequirementKeys: empty, staticAssetRequirementKeys: empty,
});
const executionPlan = object<C.ExecutionMethodPlanEnvelope>({
  ...envelope, ...scriptBinding, schemaVersion: literal("v5.execution-method-plan.v2"), executionMethodPlanRef: ref,
  executionMethodPlanVersionRef: ref, planningVersion: positive, consistencyValidationVersionRef: ref,
  consistencyValidationDigest: digest, storyboardVersion: storyboard, creativeShotVersions: list(shot),
  visualExecutionRequirements: list(visual), audioRequirements: list(audioRequirement), postprocessRequirements: list(postprocess),
});
const assetBinding = object<C.MethodAwareResolvedAssetBinding>({
  inputRequirementKey: ref, inputRole: roles, assetRef: ref, assetVersionRef: ref, assetVersionDigest: digest,
  assetVersionNumber: positive, mediaKind: literal("IMAGE"), mediaType: choice(["image/png", "image/jpeg"]),
  contentDigest: digest, sourceCandidateRef: ref,
});
const inputRequirement = object<C.MethodInputRequirement>({
  ...sealed, schemaVersion: literal("v5.method-input-requirement.v1"), inputRequirementKey: ref,
  acceptedInputRoles: list(roles), minimumAssetCount: positive, maximumAssetCount: positive,
  assetVersionBindings: list(assetBinding), resolutionState: choice(["RESOLVED_CURRENT_ASSET", "ASSET_REQUIRED"]),
});
const methodInput = object<C.MethodInputPlan>({
  ...sealed, ...beatBinding, schemaVersion: literal("v5.method-input-plan.v1"), methodInputPlanRef: ref, inputPlanOrder: positive,
  visualExecutionRequirementRef: ref, visualExecutionRequirementDigest: digest, executionClass: classes, executionMethod: methods,
  sourceDisposition: disposition, inputRequirements: list(inputRequirement), inputPlanningState: choice(["READY", "INPUT_REQUIRED"]),
});
const inputPlan = object<C.MethodAwareInputPlanEnvelope>({
  ...envelope, ...executionBinding, schemaVersion: literal("v5.method-aware-input-plan.v1"), methodAwareInputPlanRef: ref,
  methodAwareInputPlanVersionRef: ref, inputPlanningVersion: positive, executionMethodPlanRef: ref,
  methodInputPlans: list(methodInput), requestedAssetBindingCount: natural, resolvedAssetBindingCount: natural,
  inputReadyCount: natural, inputBlockedCount: natural, publicationAllowed: literal(false), createdAt: timestamp,
});
const route = object<C.VideoMethodRoute>({
  ...sealed, ...beatBinding, schemaVersion: literal("v5.video-method-route.v1"), routeRef: ref, routeOrder: positive,
  methodInputPlanRef: ref, methodInputPlanDigest: digest, visualExecutionRequirementRef: ref, visualExecutionRequirementDigest: digest,
  executionClass: classes, executionMethod: methods,
  routingState: choice(["BYPASSED_STATIC_PLATE", "QUEUED_EXISTING_MEDIA_JOB", "CAPABILITY_UNAVAILABLE", "REJECTED_DETERMINISTIC_POSTPROCESS", "INPUT_BLOCKED"]),
  adapterCapability: nullable(ref), adapterIdentity: nullable(ref), videoGenerationRequestRef: nullable(ref),
  videoGenerationRequestDigest: nullable(digest), mediaJobRef: nullable(ref), fallbackUsed: literal(false),
  targetBoundary: choice(["M10_ASSET_OUTPUT", "M11_VIDEO_EXECUTION", "M13_DETERMINISTIC_POSTPROCESS"]),
});
const videoRequest = object<C.MethodAwareVideoGenerationRequest>({
  ...sealed, ...scope, ...executionBinding, ...inputBinding, ...beatBinding,
  schemaVersion: literal("v5.method-aware-video-generation-request.v1"), generationRequestRef: ref,
  generationRequestVersionRef: ref, version: literal(1), visualExecutionRequirementRef: ref, visualExecutionRequirementDigest: digest,
  executionClass: literal("MICRO_MOTION"), executionMethod: literal("SINGLE_ANCHOR_I2V"),
  sourceImageAssetRef: ref, sourceImageAssetVersionRef: ref, sourceImageAssetVersionDigest: digest,
  sourceImageContentDigest: digest, sourceImageMediaType: choice(["image/png", "image/jpeg"]),
  cameraInstruction: camera, sourceAction: object({ sourceSpan: validSpan, sourceTextDigest: digest }), frameRange: timing,
  adapterCapability: literal("self-hosted-wan22-image-to-video-v1"), executionMode: literal("INTERNAL_SELF_HOSTED"),
  executionAuthorizationState: literal("QUEUED_NOT_EXECUTED"), selectionRequired: literal(true), publicationAllowed: literal(false), createdAt: timestamp,
});
const queuedJob = object<C.MethodAwareQueuedJob>({ generationRequestRef: ref, generationRequestDigest: digest, mediaJobRef: ref, queueState: literal("QUEUED"), queueReplay: boolean });
const videoPlan = object<C.MethodAwareVideoRouteEnvelope>({
  ...envelope, ...executionBinding, ...inputBinding, schemaVersion: literal("v5.video-method-route-plan.v1"),
  videoMethodRouteRef: ref, videoMethodRouteVersionRef: ref, routingVersion: positive, methodAwareInputPlanRef: ref,
  capabilityRegistryVersion: literal("v5.video-method-capability-registry.v1"), capabilityRegistryDigest: digest,
  routes: list(route), videoGenerationRequests: list(videoRequest), queuedJobs: list(queuedJob), videoGenerationRequestCount: natural,
  queuedJobCount: natural, wanFallbackUsed: literal(false), publicationAllowed: literal(false), createdAt: timestamp,
});
const voiceLineage = object<C.MethodAwareVoiceLineage>({
  consentGrantRef: ref, consentGrantVersionRef: ref, consentGrantVersionDigest: digest, voiceLockVersionRef: ref,
  voiceLockVersionDigest: digest, voiceProfileRef: ref, voiceProfileVersionRef: ref, voiceProfileVersionDigest: digest,
});
const speechParameters = object<C.MethodAwareSpeechParameters>({
  speechSynthesis: literal(true), text: (v): v is string => ref(v) && v.length <= 2000,
  voiceRef: ref, sampleRate: (v): v is number => positive(v) && v >= 8000 && v <= 384000,
  channels: (v): v is number => v === 1 || v === 2, audioRole: choice(["dialogue", "narration"]),
});
const speechSpec = object<C.MethodAwareSpeechRequestSpec>({
  ...scriptBinding, speechRole: choice(["dialogue", "narration"]), dialogueRef: nullable(ref), narrationRef: nullable(ref),
  voiceAssetVersionRef: ref, voiceAssetVersionDigest: digest, language: ref, normalizedSpeechParameters: speechParameters, sourceAudioCueRefs: empty,
});
const audioRequestBase = {
  ...sealed, ...scope, ...executionBinding, ...scriptBinding, schemaVersion: literal("v5.audio-generation-request.v2"),
  generationRequestRef: ref, generationRequestVersionRef: ref, version: literal(1),
  supersedesGenerationRequestVersionRef: literal(null), supersedesGenerationRequestVersionDigest: literal(null),
  assetRequirementRef: ref, assetRequirementDigest: digest, outputTarget: literal("ASSET_VERSION"),
  state: literal("CONTRACT_ONLY_ADAPTER_REQUIRED"), immutable: literal(true), publicationAllowed: literal(false),
  createdBy: literal("v5.m9-m12-explicit-audio-bridge.v1"), createdAt: timestamp,
  audioRequirementRef: ref, audioRequirementDigest: digest, creativeShotVersionRef: ref, creativeShotVersionDigest: digest, timingReference: timing,
};
const speechRequest = {
  ...audioRequestBase, outputAssetVersionType: literal("DialogueAssetVersion"), requestSpec: speechSpec,
  sourceSpan: validSpan, sourceTextDigest: digest, voiceLineage: optional(voiceLineage),
};
const audioRequest = union<C.MethodAwareAudioGenerationRequest>(
  object<Extract<C.MethodAwareAudioGenerationRequest, { requestKind: "DIALOGUE_SYNTHESIS" }>>({ ...speechRequest, requestKind: literal("DIALOGUE_SYNTHESIS"), audioRole: literal("dialogue"), speakerCharacterRef: ref }, ["voiceLineage"]),
  object<Extract<C.MethodAwareAudioGenerationRequest, { requestKind: "NARRATION_SYNTHESIS" }>>({ ...speechRequest, requestKind: literal("NARRATION_SYNTHESIS"), audioRole: literal("narration") }, ["voiceLineage"]),
  object<Extract<C.MethodAwareAudioGenerationRequest, { requestKind: "SFX_GENERATION" }>>({
    ...audioRequestBase, requestKind: literal("SFX_GENERATION"), audioRole: literal("sfx"), outputAssetVersionType: literal("SfxAssetVersion"),
    requestSpec: object({ sfxKind: literal("M9_EXPLICIT_SFX"), synthesisSpecDigest: digest, sourceAudioCueRefs: empty }),
  }),
  object<Extract<C.MethodAwareAudioGenerationRequest, { requestKind: "AMBIENCE_GENERATION" }>>({
    ...audioRequestBase, requestKind: literal("AMBIENCE_GENERATION"), audioRole: literal("ambience"), outputAssetVersionType: literal("AmbienceAssetVersion"),
    requestSpec: object({ ambienceKind: literal("M9_EXPLICIT_AMBIENCE"), synthesisSpecDigest: digest, sourceAudioCueRefs: empty }),
  }),
);
const cue = object<C.MethodAwareAudioCueTimingBinding>({
  ...sealed, schemaVersion: literal("v5.m9-m12-audio-cue-timing-binding.v1"), audioRequirementRef: ref, audioRequirementDigest: digest,
  audioGenerationRequestVersionRef: ref, audioGenerationRequestDigest: digest, creativeShotVersionRef: ref, creativeShotVersionDigest: digest,
  audioRole: choice(["dialogue", "narration", "sfx", "ambience"]), timingReference: timing,
  timelineAuthority: literal("M13_EXISTING_TIMELINE_AUTHORITY"), bindingState: literal("AWAITING_TYPED_AUDIO_ASSET"),
});
const audioRoute = object<C.ExplicitAudioRequirementRouteEnvelope>({
  ...envelope, ...executionBinding, schemaVersion: literal("v5.m9-m12-audio-requirement-route.v1"), audioRequirementRouteRef: ref,
  audioRequirementRouteVersionRef: ref, routeVersion: positive, audioRequirementRef: ref, audioRequirementDigest: digest,
  audioType: choice(AUDIO_TYPES), routeDisposition: choice(["REQUEST_CREATED", "NO_REQUEST_SILENCE", "MUSIC_NOT_IMPLEMENTED"]),
  audioGenerationRequest: nullable(audioRequest), audioCueTimingBinding: nullable(cue),
  m12RuntimeState: literal("NOT_INSTALLED_G0_NOT_COMPLETE"), m12RuntimeInstalled: literal(false), publicationAllowed: literal(false), createdAt: timestamp,
});

const privateNames = new Set([
  "authoritystate", "requestedprovenance", "rightsbinding", "sourcerefs", "voiceassetversionsnapshot",
  "absolutepath", "artifactpath", "artifactroot", "candidatepath", "filesystempath", "finalpath",
  "inputpath", "internalpath", "outputpath", "storagebindingref", "token", "cookie", "credential",
  "secret", "privatekey", "providerselection", "localpath",
]);
function publicOnly(value: unknown, depth = 0): boolean {
  if (depth > 64) return false;
  if (Array.isArray(value)) return value.every((v) => publicOnly(v, depth + 1));
  if (value !== null && typeof value === "object") {
    return record(value) && Object.entries(value).every(([key, v]) => {
      const normalized = key.replace(/[_-]/g, "").toLowerCase();
      return !privateNames.has(normalized) && !/storagekeys?$/.test(normalized) && publicOnly(v, depth + 1);
    });
  }
  return true;
}
function invalid(): never {
  throw new CreatorClientError(502, { code: "invalid_method_aware_response", message: "Frontend 无法验证 Core 返回的方法规划数据。" });
}
function parse<T>(value: unknown, check: Check<T>, bindings: (v: T) => boolean): T {
  if (!publicOnly(value) || !check(value) || !bindings(value)) return invalid();
  return value;
}
const unique = (values: readonly string[]) => new Set(values).size === values.length;
const same = (a: readonly unknown[], b: readonly unknown[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameScope = (a: C.MethodAwareResponseScope, b: C.MethodAwareResponseScope) =>
  a.workspaceRef === b.workspaceRef && a.projectRef === b.projectRef && a.seriesRef === b.seriesRef && a.episodeRef === b.episodeRef && a.productionRunRef === b.productionRunRef;
const sameTiming = (a: C.MethodAwareTiming, b: C.MethodAwareTiming) => a.startFrameInclusive === b.startFrameInclusive && a.endFrameExclusive === b.endFrameExclusive;
const visualDisposition = (c: C.ExecutionClass): C.RequirementDisposition => c === "STATIC_HOLD" ? "NO_ASSET_REQUIRED" : c === "DETERMINISTIC_EVENT" ? "DERIVE_DETERMINISTIC_POSTPROCESS" : "GENERATE_NEW_ASSET";
const audioDisposition = (t: C.MethodAwareAudioType): C.RequirementDisposition => t === "SILENCE" ? "NO_ASSET_REQUIRED" : t === "MUSIC" ? "CAPABILITY_UNAVAILABLE" : "GENERATE_NEW_ASSET";
function executionBindings(v: C.ExecutionMethodPlanEnvelope): boolean {
  const board = v.storyboardVersion;
  if (!sameScope(v, board) || board.scriptVersionRef !== v.scriptVersionRef || board.scriptVersionDigest !== v.scriptVersionDigest ||
      board.consistencyValidationVersionRef !== v.consistencyValidationVersionRef || board.consistencyValidationDigest !== v.consistencyValidationDigest || board.storyboardVersion !== v.planningVersion ||
      !v.creativeShotVersions.length || !same(board.creativeShotVersionRefs, v.creativeShotVersions.map((s) => s.creativeShotVersionRef)) || !unique(board.creativeShotVersionRefs)) return false;
  const beats = new Map<string, { shot: C.CreativeShotVersion; beat: C.ActionExecutionBeat }>();
  for (const [index, s] of v.creativeShotVersions.entries()) {
    if (!sameScope(v, s) || s.shotOrder !== index + 1 || s.storyboardRef !== board.storyboardRef || s.storyboardVersionRef !== board.storyboardVersionRef ||
        s.storyboardVersionDigest !== board.payloadDigest || s.scriptVersionRef !== v.scriptVersionRef || s.scriptVersionDigest !== v.scriptVersionDigest || s.creativeShotVersion !== v.planningVersion || !s.actionExecutionBeats.length) return false;
    let coverage = 0;
    for (const [i, b] of s.actionExecutionBeats.entries()) {
      if (b.beatOrder !== i + 1 || beats.has(b.beatRef) || b.frameRangeEndExclusive > s.shotFrameCount || !s.scriptSceneRefs.includes(b.sourceSpan.scriptSceneRef) ||
          !b.subjectRefs.length || !unique(b.subjectRefs) || !unique(b.targetRefs)) return false;
      beats.set(b.beatRef, { shot: s, beat: b });
    }
    for (const b of [...s.actionExecutionBeats].sort((a, b) => a.frameRangeStartInclusive - b.frameRangeStartInclusive)) {
      if (b.frameRangeStartInclusive > coverage) return false;
      coverage = Math.max(coverage, b.frameRangeEndExclusive);
    }
    if (coverage !== s.shotFrameCount) return false;
    if (!same([...new Set(s.actionExecutionBeats.map((b) => b.sourceSpan.scriptSceneRef))].sort(), s.scriptSceneRefs)) return false;
    for (const subject of new Set(s.actionExecutionBeats.flatMap((b) => b.subjectRefs))) {
      let end = -1;
      for (const b of s.actionExecutionBeats.filter((b) => b.subjectRefs.includes(subject)).sort((a, b) => a.frameRangeStartInclusive - b.frameRangeStartInclusive)) {
        if (b.frameRangeStartInclusive < end) return false;
        end = b.frameRangeEndExclusive;
      }
    }
  }
  if (v.visualExecutionRequirements.length !== beats.size || !unique(v.visualExecutionRequirements.map((r) => r.beatRef))) return false;
  for (const collection of [v.visualExecutionRequirements, v.audioRequirements, v.postprocessRequirements]) {
    for (const [i, r] of collection.entries()) {
      const bound = beats.get(r.beatRef);
      if (!bound || !sameScope(v, r) || r.requirementOrder !== i + 1 || r.storyboardVersionRef !== board.storyboardVersionRef ||
          r.storyboardVersionDigest !== board.payloadDigest || r.creativeShotVersionRef !== bound.shot.creativeShotVersionRef ||
          r.creativeShotVersionDigest !== bound.shot.payloadDigest || r.beatDigest !== bound.beat.payloadDigest) return false;
    }
  }
  if (!unique(v.visualExecutionRequirements.map((r) => r.visualExecutionRequirementRef)) || !unique(v.audioRequirements.map((r) => r.audioRequirementRef)) ||
      !unique(v.postprocessRequirements.map((r) => r.postprocessRequirementRef))) return false;
  for (const r of v.visualExecutionRequirements) {
    if (r.executionClass !== beats.get(r.beatRef)?.beat.executionClass || r.executionMethod !== EXECUTION_METHOD_BY_CLASS[r.executionClass] || r.disposition !== visualDisposition(r.executionClass)) return false;
  }
  const deterministic = v.visualExecutionRequirements.filter((r) => r.executionClass === "DETERMINISTIC_EVENT").map((r) => r.beatRef);
  if (!same([...deterministic].sort(), v.postprocessRequirements.map((r) => r.beatRef).sort()) || v.postprocessRequirements.some((r) => r.disposition !== "DERIVE_DETERMINISTIC_POSTPROCESS")) return false;
  for (const r of v.postprocessRequirements) {
    const b = beats.get(r.beatRef)?.beat;
    if (!b || b.executionClass !== "DETERMINISTIC_EVENT" || b.postprocessRequirementKey !== r.postprocessRequirementKey) return false;
  }
  for (const r of v.audioRequirements) {
    if (r.scriptVersionRef !== v.scriptVersionRef || r.scriptVersionDigest !== v.scriptVersionDigest || r.disposition !== audioDisposition(r.audioType) ||
        r.timingReference.endFrameExclusive > (beats.get(r.beatRef)?.shot.shotFrameCount ?? 0)) return false;
    if ((r.audioType === "DIALOGUE" || r.audioType === "NARRATION") && r.sourceSpan.sourceField !== r.audioType) return false;
  }
  return true;
}
const methodRoles: { [K in C.ExecutionClass]: readonly C.MethodInputRole[] } = {
  STATIC_HOLD: ["STATIC_PLATE"], MICRO_MOTION: ["ACTION_READY_ANCHOR"], CONTACT_ACTION: ["SUBJECT_CONDITIONING", "TARGET_CONDITIONING"],
  GAIT_LOCOMOTION: ["POSE_CONDITIONING", "TRAJECTORY_CONDITIONING"], DETERMINISTIC_EVENT: ["EVENT_FREE_BASE_PLATE", "MASK_ASSET", "RESOURCE_ASSET", "STATIC_ASSET"],
};
function inputBindings(v: C.MethodAwareInputPlanEnvelope): boolean {
  let resolved = 0; let ready = 0;
  if (!v.methodInputPlans.length || !unique(v.methodInputPlans.map((p) => p.methodInputPlanRef)) || !unique(v.methodInputPlans.map((p) => p.visualExecutionRequirementRef))) return false;
  for (const [i, p] of v.methodInputPlans.entries()) {
    if (p.inputPlanOrder !== i + 1 || p.executionMethod !== EXECUTION_METHOD_BY_CLASS[p.executionClass] || p.sourceDisposition !== visualDisposition(p.executionClass) ||
        !p.inputRequirements.length || !unique(p.inputRequirements.map((r) => r.inputRequirementKey))) return false;
    if (p.executionClass !== "CONTACT_ACTION" && p.inputRequirements.length !== 1) return false;
    if (p.executionClass === "CONTACT_ACTION" && !["SUBJECT_CONDITIONING", "TARGET_CONDITIONING"].every((role) => p.inputRequirements.some((r) => r.acceptedInputRoles.includes(role as C.MethodInputRole)))) return false;
    if (p.executionClass === "DETERMINISTIC_EVENT" && !same(p.inputRequirements[0].acceptedInputRoles, ["EVENT_FREE_BASE_PLATE"])) return false;
    for (const r of p.inputRequirements) {
      if (!r.acceptedInputRoles.length || !unique(r.acceptedInputRoles) || r.minimumAssetCount !== 1 || r.maximumAssetCount !== (p.executionClass === "GAIT_LOCOMOTION" ? 2 : 1) ||
          r.acceptedInputRoles.some((role) => !methodRoles[p.executionClass].includes(role)) || r.assetVersionBindings.length > r.maximumAssetCount ||
          !unique(r.assetVersionBindings.map((b) => b.assetVersionRef))) return false;
      if (p.executionClass === "GAIT_LOCOMOTION" && !same(r.acceptedInputRoles, methodRoles.GAIT_LOCOMOTION)) return false;
      if (p.executionClass !== "GAIT_LOCOMOTION" && r.acceptedInputRoles.length !== 1) return false;
      for (const b of r.assetVersionBindings) if (b.inputRequirementKey !== r.inputRequirementKey || !r.acceptedInputRoles.includes(b.inputRole)) return false;
      if ((r.resolutionState === "RESOLVED_CURRENT_ASSET") !== (r.assetVersionBindings.length >= r.minimumAssetCount)) return false;
      resolved += r.assetVersionBindings.length;
    }
    const isReady = p.inputRequirements.every((r) => r.resolutionState === "RESOLVED_CURRENT_ASSET");
    if ((p.inputPlanningState === "READY") !== isReady) return false;
    if (isReady) ready++;
  }
  return v.requestedAssetBindingCount === resolved && v.resolvedAssetBindingCount === resolved && v.inputReadyCount === ready && v.inputBlockedCount === v.methodInputPlans.length - ready;
}
function videoBindings(v: C.MethodAwareVideoRouteEnvelope): boolean {
  if (!v.routes.length || !unique(v.routes.map((r) => r.routeRef)) || !unique(v.routes.map((r) => r.visualExecutionRequirementRef)) ||
      !unique(v.videoGenerationRequests.map((r) => r.generationRequestRef)) || !unique(v.queuedJobs.map((j) => j.mediaJobRef)) ||
      !unique(v.queuedJobs.map((j) => j.generationRequestRef)) || v.videoGenerationRequestCount !== v.videoGenerationRequests.length || v.queuedJobCount !== v.queuedJobs.length ||
      v.videoGenerationRequestCount !== v.queuedJobCount || v.routes.filter((r) => r.routingState === "QUEUED_EXISTING_MEDIA_JOB").length !== v.queuedJobCount) return false;
  for (const [i, r] of v.routes.entries()) {
    if (r.routeOrder !== i + 1 || r.executionMethod !== EXECUTION_METHOD_BY_CLASS[r.executionClass]) return false;
    const micro = r.executionClass === "MICRO_MOTION";
    if (r.adapterCapability !== (micro ? "self-hosted-wan22-image-to-video-v1" : null) || r.adapterIdentity !== (micro ? "v4.comfyui-wan22-image-to-video.v1" : null)) return false;
    const expectedState = r.executionClass === "STATIC_HOLD" ? "BYPASSED_STATIC_PLATE" : r.executionClass === "DETERMINISTIC_EVENT" ? "REJECTED_DETERMINISTIC_POSTPROCESS" : micro ? r.routingState : "CAPABILITY_UNAVAILABLE";
    const target = r.executionClass === "STATIC_HOLD" ? "M10_ASSET_OUTPUT" : r.executionClass === "DETERMINISTIC_EVENT" ? "M13_DETERMINISTIC_POSTPROCESS" : "M11_VIDEO_EXECUTION";
    if (r.routingState !== expectedState || r.targetBoundary !== target || (micro && r.routingState !== "INPUT_BLOCKED" && r.routingState !== "QUEUED_EXISTING_MEDIA_JOB")) return false;
    if (r.routingState !== "QUEUED_EXISTING_MEDIA_JOB") {
      if (r.videoGenerationRequestRef !== null || r.videoGenerationRequestDigest !== null || r.mediaJobRef !== null) return false;
      continue;
    }
    const request = v.videoGenerationRequests.find((q) => q.generationRequestRef === r.videoGenerationRequestRef);
    const job = v.queuedJobs.find((j) => j.mediaJobRef === r.mediaJobRef);
    if (!request || !job || !sameScope(v, request) || request.payloadDigest !== r.videoGenerationRequestDigest || job.generationRequestDigest !== request.payloadDigest ||
        job.generationRequestRef !== request.generationRequestRef || request.methodAwareInputPlanVersionRef !== v.methodAwareInputPlanVersionRef || request.methodAwareInputPlanDigest !== v.methodAwareInputPlanDigest ||
        request.executionMethodPlanVersionRef !== v.executionMethodPlanVersionRef || request.executionMethodPlanDigest !== v.executionMethodPlanDigest ||
        request.visualExecutionRequirementRef !== r.visualExecutionRequirementRef || request.visualExecutionRequirementDigest !== r.visualExecutionRequirementDigest ||
        request.creativeShotVersionRef !== r.creativeShotVersionRef || request.creativeShotVersionDigest !== r.creativeShotVersionDigest || request.beatRef !== r.beatRef || request.beatDigest !== r.beatDigest) return false;
  }
  return true;
}
function audioBindings(v: C.ExplicitAudioRequirementRouteEnvelope): boolean {
  if (v.audioType === "SILENCE" || v.audioType === "MUSIC") return v.routeDisposition === (v.audioType === "SILENCE" ? "NO_REQUEST_SILENCE" : "MUSIC_NOT_IMPLEMENTED") && v.audioGenerationRequest === null && v.audioCueTimingBinding === null;
  const r = v.audioGenerationRequest; const c = v.audioCueTimingBinding;
  if (v.routeDisposition !== "REQUEST_CREATED" || !r || !c || !sameScope(v, r) || r.audioRole !== v.audioType.toLowerCase() || r.executionMethodPlanVersionRef !== v.executionMethodPlanVersionRef || r.executionMethodPlanDigest !== v.executionMethodPlanDigest ||
      r.audioRequirementRef !== v.audioRequirementRef || r.audioRequirementDigest !== v.audioRequirementDigest || r.assetRequirementRef !== r.audioRequirementRef || r.assetRequirementDigest !== r.audioRequirementDigest ||
      c.audioRequirementRef !== r.audioRequirementRef || c.audioRequirementDigest !== r.audioRequirementDigest || c.audioGenerationRequestVersionRef !== r.generationRequestVersionRef || c.audioGenerationRequestDigest !== r.payloadDigest ||
      c.creativeShotVersionRef !== r.creativeShotVersionRef || c.creativeShotVersionDigest !== r.creativeShotVersionDigest || c.audioRole !== r.audioRole || !sameTiming(c.timingReference, r.timingReference)) return false;
  if (r.requestKind === "DIALOGUE_SYNTHESIS" || r.requestKind === "NARRATION_SYNTHESIS") {
    const s = r.requestSpec;
    if (r.sourceSpan.sourceField !== v.audioType || s.speechRole !== r.audioRole || s.normalizedSpeechParameters.audioRole !== r.audioRole || s.scriptVersionRef !== r.scriptVersionRef || s.scriptVersionDigest !== r.scriptVersionDigest ||
        (r.audioRole === "dialogue" ? !ref(s.dialogueRef) || s.narrationRef !== null : !ref(s.narrationRef) || s.dialogueRef !== null)) return false;
  }
  return true;
}
export function parseExecutionMethodPlan(value: unknown): C.ExecutionMethodPlanEnvelope { return parse(value, executionPlan, executionBindings); }
export function parseMethodAwareInputPlan(value: unknown): C.MethodAwareInputPlanEnvelope { return parse(value, inputPlan, inputBindings); }
export function parseMethodAwareVideoRoute(value: unknown): C.MethodAwareVideoRouteEnvelope { return parse(value, videoPlan, videoBindings); }
export function parseExplicitAudioRequirementRoute(value: unknown): C.ExplicitAudioRequirementRouteEnvelope { return parse(value, audioRoute, audioBindings); }
