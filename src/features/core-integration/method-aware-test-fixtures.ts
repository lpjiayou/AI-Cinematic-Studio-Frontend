// Test-only public shapes transcribed from the pinned Core builders and public stripping.
// These are synthetic contract examples, never a product fallback or authority evidence.
import { EXECUTION_METHOD_BY_CLASS } from "./method-aware-contracts";
import type * as C from "./method-aware-contracts";
export const scope = { workspaceRef: "workspace-test", projectRef: "project-test", seriesRef: "series-test", episodeRef: "episode-test", productionRunRef: "run-test" };
export const commandScope = { projectRef: scope.projectRef, seriesRef: scope.seriesRef, episodeRef: scope.episodeRef, idempotencyKey: "operation-test" };
export const d = "a".repeat(64);
export const e = "b".repeat(64);
const now = "2026-09-05T01:00:00Z";
const script = { scriptVersionRef: "script-v1", scriptVersionDigest: d };
const execution = { executionMethodPlanVersionRef: "execution-v1", executionMethodPlanDigest: d };
const input = { methodAwareInputPlanVersionRef: "input-v1", methodAwareInputPlanDigest: d };
const timing = { startFrameInclusive: 0, endFrameExclusive: 10 };
const span: C.MethodAwareSourceSpan = { scriptSceneRef: "scene-1", sourceField: "ACTION", sourceIndex: 0, startOffsetInclusive: 0, endOffsetExclusive: 4 };
const classes: C.ExecutionClass[] = ["STATIC_HOLD", "MICRO_MOTION", "CONTACT_ACTION", "GAIT_LOCOMOTION", "DETERMINISTIC_EVENT"];
const eventBaseKey = "event-free-base:ce36863f51b6baf9d16397ffb3e9af506b284a816f72d487e55943c1fd974d6d";
export function executionFixture(): C.ExecutionMethodPlanEnvelope {
  const board: C.StoryboardVersion = { ...scope, ...script, schemaVersion: "v5.storyboard-version.v2", storyboardRef: "storyboard-1", storyboardVersionRef: "storyboard-v1", storyboardVersion: 1,
    consistencyValidationVersionRef: "validation-v1", consistencyValidationDigest: d, creativeShotVersionRefs: ["shot-v1"], payloadDigest: d };
  const shot: C.CreativeShotVersion = { ...scope, ...script, schemaVersion: "v5.creative-shot-version.v2", creativeShotRef: "shot-1", creativeShotVersionRef: "shot-v1", creativeShotVersion: 1, shotOrder: 1,
    storyboardRef: board.storyboardRef, storyboardVersionRef: board.storyboardVersionRef, storyboardVersionDigest: d,
    scriptSceneRefs: ["scene-1"], shotFrameCount: 50, cameraInstruction: { framing: "WIDE", movement: "LOCKED" },
    actionExecutionBeats: classes.map((executionClass, i): C.ActionExecutionBeat => {
      const base = { schemaVersion: "v5.action-execution-beat.v1" as const, beatRef: `beat-${i}`, beatOrder: i + 1,
      sourceSpan: { ...span }, sourceTextDigest: d, subjectRefs: ["character-1"], targetRefs: ["object-1"], frameRangeStartInclusive: i * 10,
        frameRangeEndExclusive: (i + 1) * 10, payloadDigest: d };
      return executionClass === "DETERMINISTIC_EVENT" ? { ...base, executionClass, postprocessRequirementKey: "event-1" } : { ...base, executionClass };
    }), payloadDigest: d };
  const requirement = { ...scope, storyboardVersionRef: board.storyboardVersionRef, storyboardVersionDigest: d,
    creativeShotVersionRef: shot.creativeShotVersionRef, creativeShotVersionDigest: d, beatRef: "beat-0", beatDigest: d, payloadDigest: d };
  const audioBase = { ...requirement, ...script, schemaVersion: "v5.audio-requirement.v1" as const, timingReference: { ...timing } };
  const audio: C.AudioRequirement[] = [
    { ...audioBase, audioRequirementRef: "audio-dialogue", requirementOrder: 1, audioType: "DIALOGUE", sourceSpan: { ...span, sourceField: "DIALOGUE" }, sourceTextDigest: d, speakerCharacterRef: "character-1", disposition: "GENERATE_NEW_ASSET" },
    { ...audioBase, audioRequirementRef: "audio-narration", requirementOrder: 2, audioType: "NARRATION", sourceSpan: { ...span, sourceField: "NARRATION" }, sourceTextDigest: d, disposition: "GENERATE_NEW_ASSET" },
    { ...audioBase, audioRequirementRef: "audio-ambience", requirementOrder: 3, audioType: "AMBIENCE", disposition: "GENERATE_NEW_ASSET" },
    { ...audioBase, audioRequirementRef: "audio-sfx", requirementOrder: 4, audioType: "SFX", disposition: "GENERATE_NEW_ASSET" },
    { ...audioBase, audioRequirementRef: "audio-music", requirementOrder: 5, audioType: "MUSIC", disposition: "CAPABILITY_UNAVAILABLE" },
    { ...audioBase, audioRequirementRef: "audio-silence", requirementOrder: 6, audioType: "SILENCE", disposition: "NO_ASSET_REQUIRED" },
  ];
  return { ...scope, ...script, schemaVersion: "v5.execution-method-plan.v2", ok: true, executionMethodPlanRef: "execution-1", executionMethodPlanVersionRef: execution.executionMethodPlanVersionRef,
    planningVersion: 1, consistencyValidationVersionRef: "validation-v1", consistencyValidationDigest: d, storyboardVersion: board, creativeShotVersions: [shot],
    visualExecutionRequirements: classes.map((executionClass, i) => ({ ...requirement, schemaVersion: "v5.visual-execution-requirement.v1", visualExecutionRequirementRef: `visual-${i}`,
      requirementOrder: i + 1, beatRef: `beat-${i}`, executionClass, executionMethod: EXECUTION_METHOD_BY_CLASS[executionClass],
      disposition: executionClass === "STATIC_HOLD" ? "NO_ASSET_REQUIRED" : executionClass === "DETERMINISTIC_EVENT" ? "DERIVE_DETERMINISTIC_POSTPROCESS" : "GENERATE_NEW_ASSET" })),
    audioRequirements: audio, postprocessRequirements: [{ ...requirement, schemaVersion: "v5.postprocess-requirement.v1", postprocessRequirementRef: "post-1", requirementOrder: 1, beatRef: "beat-4",
      postprocessRequirementKey: "event-1", executionMethod: "V3_DETERMINISTIC_COMPOSITION", eventFreeBaseMediaRequirementKey: eventBaseKey, maskAssetRequirementKeys: [],
      resourceAssetRequirementKeys: [], staticAssetRequirementKeys: [], disposition: "DERIVE_DETERMINISTIC_POSTPROCESS" }],
    payloadDigest: d, currentness: "CURRENT", idempotentReplay: false };
}
export function executionCommand(): C.CreateExecutionMethodPlanCommand {
  const p = executionFixture();
  return { ...commandScope, consistencyValidationVersionRef: p.consistencyValidationVersionRef, shots: p.creativeShotVersions.map((s) => ({
    shotOrder: s.shotOrder, shotFrameCount: s.shotFrameCount, cameraInstruction: { ...s.cameraInstruction },
    actionExecutionBeats: s.actionExecutionBeats.map((b): C.ActionExecutionBeatInput => {
      const base = { beatRef: b.beatRef, beatOrder: b.beatOrder, sourceSpan: { ...b.sourceSpan }, subjectRefs: [...b.subjectRefs], targetRefs: [...b.targetRefs],
        frameRangeStartInclusive: b.frameRangeStartInclusive, frameRangeEndExclusive: b.frameRangeEndExclusive };
      return b.executionClass === "DETERMINISTIC_EVENT" ? { ...base, executionClass: b.executionClass, postprocessRequirementKey: b.postprocessRequirementKey } : { ...base, executionClass: b.executionClass };
    }),
    audioIntents: [
      { audioType: "DIALOGUE", beatRef: "beat-0", timingReference: { ...timing }, sourceSpan: { ...span, sourceField: "DIALOGUE" } },
      { audioType: "NARRATION", beatRef: "beat-0", timingReference: { ...timing }, sourceSpan: { ...span, sourceField: "NARRATION" } },
      { audioType: "SILENCE", beatRef: "beat-0", timingReference: { ...timing } },
    ],
  })) };
}
export function inputCommand(): C.CreateMethodAwareInputPlanCommand {
  return { ...commandScope, assetBindings: [{ visualExecutionRequirementRef: "visual-1", inputRequirementKey: "action-ready-anchor:visual-1", inputRole: "ACTION_READY_ANCHOR", assetVersionRef: "asset-v1" }] };
}
export function inputFixture(): C.MethodAwareInputPlanEnvelope {
  const p = executionFixture();
  const roles: C.MethodInputRole[][][] = [[["STATIC_PLATE"]], [["ACTION_READY_ANCHOR"]], [["SUBJECT_CONDITIONING"], ["TARGET_CONDITIONING"]], [["POSE_CONDITIONING", "TRAJECTORY_CONDITIONING"]], [["EVENT_FREE_BASE_PLATE"]]];
  const keys = [["static-plate:visual-0"], ["action-ready-anchor:visual-1"], ["subject-conditioning:character-1", "target-conditioning:object-1"], ["pose-or-trajectory:visual-3"], [eventBaseKey]];
  return { ...scope, ...execution, ok: true, schemaVersion: "v5.method-aware-input-plan.v1", methodAwareInputPlanRef: "input-1", methodAwareInputPlanVersionRef: input.methodAwareInputPlanVersionRef,
    inputPlanningVersion: 1, executionMethodPlanRef: p.executionMethodPlanRef,
    methodInputPlans: p.visualExecutionRequirements.map((r, i) => ({ schemaVersion: "v5.method-input-plan.v1", methodInputPlanRef: `method-input-${i}`, inputPlanOrder: i + 1,
      visualExecutionRequirementRef: r.visualExecutionRequirementRef, visualExecutionRequirementDigest: r.payloadDigest, creativeShotVersionRef: r.creativeShotVersionRef,
      creativeShotVersionDigest: r.creativeShotVersionDigest, beatRef: r.beatRef, beatDigest: r.beatDigest, executionClass: r.executionClass, executionMethod: r.executionMethod,
      sourceDisposition: r.disposition, inputPlanningState: i === 1 ? "READY" : "INPUT_REQUIRED", payloadDigest: d,
      inputRequirements: roles[i].map((acceptedInputRoles, n) => ({ schemaVersion: "v5.method-input-requirement.v1", inputRequirementKey: keys[i][n], acceptedInputRoles, minimumAssetCount: 1, maximumAssetCount: i === 3 ? 2 : 1,
        assetVersionBindings: i === 1 ? [{ inputRequirementKey: keys[i][n], inputRole: "ACTION_READY_ANCHOR", assetRef: "asset-1", assetVersionRef: "asset-v1", assetVersionDigest: d,
          assetVersionNumber: 1, mediaKind: "IMAGE", mediaType: "image/png", contentDigest: d, sourceCandidateRef: "candidate-1" }] : [],
        resolutionState: i === 1 ? "RESOLVED_CURRENT_ASSET" : "ASSET_REQUIRED", payloadDigest: d })),
    })), requestedAssetBindingCount: 1, resolvedAssetBindingCount: 1, inputReadyCount: 1, inputBlockedCount: 4,
    publicationAllowed: false, createdAt: now, payloadDigest: d, currentness: "CURRENT", idempotentReplay: false };
}
export function videoFixture(): C.MethodAwareVideoRouteEnvelope {
  const p = inputFixture();
  const r = p.methodInputPlans[1];
  const request: C.MethodAwareVideoGenerationRequest = { ...scope, ...execution, ...input, schemaVersion: "v5.method-aware-video-generation-request.v1", generationRequestRef: "video-request-1", generationRequestVersionRef: "video-request-v1", version: 1,
    visualExecutionRequirementRef: r.visualExecutionRequirementRef, visualExecutionRequirementDigest: d, creativeShotVersionRef: r.creativeShotVersionRef, creativeShotVersionDigest: d, beatRef: r.beatRef, beatDigest: d,
    executionClass: "MICRO_MOTION", executionMethod: "SINGLE_ANCHOR_I2V", sourceImageAssetRef: "asset-1", sourceImageAssetVersionRef: "asset-v1", sourceImageAssetVersionDigest: d,
    sourceImageContentDigest: d, sourceImageMediaType: "image/png", cameraInstruction: { framing: "WIDE", movement: "LOCKED" }, sourceAction: { sourceSpan: { ...span }, sourceTextDigest: d }, frameRange: { startFrameInclusive: 10, endFrameExclusive: 20 },
    adapterCapability: "self-hosted-wan22-image-to-video-v1", executionMode: "INTERNAL_SELF_HOSTED", executionAuthorizationState: "QUEUED_NOT_EXECUTED", selectionRequired: true, publicationAllowed: false, createdAt: now, payloadDigest: d };
  return { ...scope, ...execution, ...input, schemaVersion: "v5.video-method-route-plan.v1", ok: true, videoMethodRouteRef: "video-route-1", videoMethodRouteVersionRef: "video-route-v1", routingVersion: 1,
    methodAwareInputPlanRef: p.methodAwareInputPlanRef, capabilityRegistryVersion: "v5.video-method-capability-registry.v1", capabilityRegistryDigest: d,
    routes: p.methodInputPlans.map((r, i) => ({ schemaVersion: "v5.video-method-route.v1", routeRef: `route-${i}`, routeOrder: i + 1, methodInputPlanRef: r.methodInputPlanRef, methodInputPlanDigest: d,
      visualExecutionRequirementRef: r.visualExecutionRequirementRef, visualExecutionRequirementDigest: d, creativeShotVersionRef: r.creativeShotVersionRef, creativeShotVersionDigest: d, beatRef: r.beatRef, beatDigest: d,
      executionClass: r.executionClass, executionMethod: r.executionMethod,
      routingState: i === 0 ? "BYPASSED_STATIC_PLATE" : i === 1 ? "QUEUED_EXISTING_MEDIA_JOB" : i === 4 ? "REJECTED_DETERMINISTIC_POSTPROCESS" : "CAPABILITY_UNAVAILABLE",
      adapterCapability: i === 1 ? "self-hosted-wan22-image-to-video-v1" : null, adapterIdentity: i === 1 ? "v4.comfyui-wan22-image-to-video.v1" : null,
      videoGenerationRequestRef: i === 1 ? request.generationRequestRef : null, videoGenerationRequestDigest: i === 1 ? d : null, mediaJobRef: i === 1 ? "job-1" : null,
      fallbackUsed: false, targetBoundary: i === 0 ? "M10_ASSET_OUTPUT" : i === 4 ? "M13_DETERMINISTIC_POSTPROCESS" : "M11_VIDEO_EXECUTION", payloadDigest: d })),
    videoGenerationRequests: [request], queuedJobs: [{ generationRequestRef: request.generationRequestRef, generationRequestDigest: d, mediaJobRef: "job-1", queueState: "QUEUED", queueReplay: false }],
    videoGenerationRequestCount: 1, queuedJobCount: 1, wanFallbackUsed: false, publicationAllowed: false, createdAt: now, payloadDigest: d, currentness: "CURRENT", idempotentReplay: false };
}
export function audioFixture(type: C.MethodAwareAudioType = "SILENCE", clone = false): C.ExplicitAudioRequirementRouteEnvelope {
  const base = { ...scope, ...execution, ...script, schemaVersion: "v5.audio-generation-request.v2" as const, generationRequestRef: "audio-request-1", generationRequestVersionRef: "audio-request-v1", version: 1 as const,
    supersedesGenerationRequestVersionRef: null, supersedesGenerationRequestVersionDigest: null, assetRequirementRef: `audio-${type.toLowerCase()}`, assetRequirementDigest: d,
    outputTarget: "ASSET_VERSION" as const, state: "CONTRACT_ONLY_ADAPTER_REQUIRED" as const, immutable: true as const, publicationAllowed: false as const,
    createdBy: "v5.m9-m12-explicit-audio-bridge.v1" as const, createdAt: now, audioRequirementRef: `audio-${type.toLowerCase()}`, audioRequirementDigest: d,
    creativeShotVersionRef: "shot-v1", creativeShotVersionDigest: d, timingReference: { ...timing }, payloadDigest: d };
  let request: C.MethodAwareAudioGenerationRequest | null = null;
  if (type === "DIALOGUE" || type === "NARRATION") {
    const speech = { ...base, outputAssetVersionType: "DialogueAssetVersion" as const, sourceSpan: { ...span, sourceField: type }, sourceTextDigest: d,
      requestSpec: { ...script, speechRole: type === "DIALOGUE" ? "dialogue" as const : "narration" as const, dialogueRef: type === "DIALOGUE" ? "dialogue-1" : null, narrationRef: type === "NARRATION" ? "narration-1" : null,
        voiceAssetVersionRef: "voice-v1", voiceAssetVersionDigest: d, language: "zh-CN", sourceAudioCueRefs: [],
        normalizedSpeechParameters: { speechSynthesis: true as const, text: "这是测试", voiceRef: "voice-1", sampleRate: 48000, channels: 1, audioRole: type === "DIALOGUE" ? "dialogue" as const : "narration" as const } } };
    request = type === "DIALOGUE" ? { ...speech, requestKind: "DIALOGUE_SYNTHESIS", audioRole: "dialogue", speakerCharacterRef: "character-1" } : { ...speech, requestKind: "NARRATION_SYNTHESIS", audioRole: "narration" };
    if (clone) request.voiceLineage = { consentGrantRef: "consent-1", consentGrantVersionRef: "consent-v1", consentGrantVersionDigest: d, voiceLockVersionRef: "voice-lock-v1", voiceLockVersionDigest: d,
      voiceProfileRef: "voice-profile-1", voiceProfileVersionRef: "voice-profile-v1", voiceProfileVersionDigest: d };
  } else if (type === "SFX") request = { ...base, requestKind: "SFX_GENERATION", audioRole: "sfx", outputAssetVersionType: "SfxAssetVersion", requestSpec: { sfxKind: "M9_EXPLICIT_SFX", synthesisSpecDigest: d, sourceAudioCueRefs: [] } };
  else if (type === "AMBIENCE") request = { ...base, requestKind: "AMBIENCE_GENERATION", audioRole: "ambience", outputAssetVersionType: "AmbienceAssetVersion", requestSpec: { ambienceKind: "M9_EXPLICIT_AMBIENCE", synthesisSpecDigest: d, sourceAudioCueRefs: [] } };
  return { ...scope, ...execution, schemaVersion: "v5.m9-m12-audio-requirement-route.v1", ok: true, audioRequirementRouteRef: "audio-route-1", audioRequirementRouteVersionRef: "audio-route-v1", routeVersion: 1,
    audioRequirementRef: base.audioRequirementRef, audioRequirementDigest: d, audioType: type, routeDisposition: type === "SILENCE" ? "NO_REQUEST_SILENCE" : type === "MUSIC" ? "MUSIC_NOT_IMPLEMENTED" : "REQUEST_CREATED",
    audioGenerationRequest: request, audioCueTimingBinding: request ? { schemaVersion: "v5.m9-m12-audio-cue-timing-binding.v1", audioRequirementRef: request.audioRequirementRef, audioRequirementDigest: d,
      audioGenerationRequestVersionRef: request.generationRequestVersionRef, audioGenerationRequestDigest: d, creativeShotVersionRef: request.creativeShotVersionRef, creativeShotVersionDigest: d,
      audioRole: request.audioRole, timingReference: { ...timing }, timelineAuthority: "M13_EXISTING_TIMELINE_AUTHORITY", bindingState: "AWAITING_TYPED_AUDIO_ASSET", payloadDigest: d } : null,
    m12RuntimeState: "NOT_INSTALLED_G0_NOT_COMPLETE", m12RuntimeInstalled: false, publicationAllowed: false, createdAt: now, payloadDigest: d, currentness: "CURRENT", idempotentReplay: false };
}
