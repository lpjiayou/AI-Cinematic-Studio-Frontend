import { creatorRequest } from "./browser-client";
import type { CreateExecutionMethodPlanCommand, CreateExplicitAudioRequirementRouteCommand, CreateMethodAwareInputPlanCommand, CreateMethodAwareVideoRouteCommand, MethodAwareReadOptions, MethodAwareResource, MethodAwareSourceSpan } from "./method-aware-contracts";
import { parseExecutionMethodPlan, parseExplicitAudioRequirementRoute, parseMethodAwareInputPlan, parseMethodAwareVideoRoute } from "./method-aware-validators";

function path(runRef: string, resource: MethodAwareResource) {
  return `episode-production-runs/${encodeURIComponent(runRef)}/${resource}`;
}
function readPath(resource: MethodAwareResource, options: MethodAwareReadOptions) {
  const query = new URLSearchParams({ projectRef: options.projectRef, seriesRef: options.seriesRef, episodeRef: options.episodeRef });
  if (options.versionRef !== undefined) query.set("versionRef", options.versionRef);
  return `${path(options.productionRunRef, resource)}?${query}`;
}
function sourceSpan(span: MethodAwareSourceSpan) {
  return { scriptSceneRef: span.scriptSceneRef, sourceField: span.sourceField, sourceIndex: span.sourceIndex,
    startOffsetInclusive: span.startOffsetInclusive, endOffsetExclusive: span.endOffsetExclusive };
}
export async function getExecutionMethodPlan(options: MethodAwareReadOptions) {
  return parseExecutionMethodPlan(await creatorRequest<unknown>(readPath("execution-method-plan", options), { method: "GET", signal: options.signal }));
}
export async function getMethodAwareInputPlan(options: MethodAwareReadOptions) {
  return parseMethodAwareInputPlan(await creatorRequest<unknown>(readPath("method-aware-input-plan", options), { method: "GET", signal: options.signal }));
}
export async function getMethodAwareVideoRoute(options: MethodAwareReadOptions) {
  return parseMethodAwareVideoRoute(await creatorRequest<unknown>(readPath("method-aware-video-route", options), { method: "GET", signal: options.signal }));
}
export async function getExplicitAudioRequirementRoute(options: MethodAwareReadOptions) {
  return parseExplicitAudioRequirementRoute(await creatorRequest<unknown>(readPath("explicit-audio-requirement-route", options), { method: "GET", signal: options.signal }));
}
export async function createExecutionMethodPlan(productionRunRef: string, command: CreateExecutionMethodPlanCommand, signal?: AbortSignal) {
  return parseExecutionMethodPlan(await creatorRequest<unknown>(path(productionRunRef, "execution-method-plan"), { method: "POST", signal, body: {
    projectRef: command.projectRef, seriesRef: command.seriesRef, episodeRef: command.episodeRef,
    consistencyValidationVersionRef: command.consistencyValidationVersionRef, idempotencyKey: command.idempotencyKey,
    shots: command.shots.map((shot) => ({ shotOrder: shot.shotOrder, shotFrameCount: shot.shotFrameCount,
      cameraInstruction: { framing: shot.cameraInstruction.framing, movement: shot.cameraInstruction.movement },
      actionExecutionBeats: shot.actionExecutionBeats.map((beat) => {
        const source = { beatRef: beat.beatRef, beatOrder: beat.beatOrder,
        sourceSpan: sourceSpan(beat.sourceSpan), subjectRefs: beat.subjectRefs.map((ref) => ref), targetRefs: beat.targetRefs.map((ref) => ref),
          frameRangeStartInclusive: beat.frameRangeStartInclusive, frameRangeEndExclusive: beat.frameRangeEndExclusive, executionClass: beat.executionClass };
        if (beat.executionClass === "DETERMINISTIC_EVENT") return { ...source, postprocessRequirementKey: beat.postprocessRequirementKey };
        return source;
      }),
      audioIntents: shot.audioIntents.map((intent) => {
        const audio = { audioType: intent.audioType, beatRef: intent.beatRef,
          timingReference: { startFrameInclusive: intent.timingReference.startFrameInclusive, endFrameExclusive: intent.timingReference.endFrameExclusive } };
        // Only this Core-derived discriminant permits the additional source fact.
        if (intent.audioType === "DIALOGUE" || intent.audioType === "NARRATION") return { ...audio, sourceSpan: sourceSpan(intent.sourceSpan) };
        return audio;
      }),
    })),
  } }));
}
export async function createMethodAwareInputPlan(productionRunRef: string, command: CreateMethodAwareInputPlanCommand, signal?: AbortSignal) {
  return parseMethodAwareInputPlan(await creatorRequest<unknown>(path(productionRunRef, "method-aware-input-plan"), { method: "POST", signal, body: {
    projectRef: command.projectRef, seriesRef: command.seriesRef, episodeRef: command.episodeRef, idempotencyKey: command.idempotencyKey,
    assetBindings: command.assetBindings.map((binding) => ({ visualExecutionRequirementRef: binding.visualExecutionRequirementRef,
      inputRequirementKey: binding.inputRequirementKey, inputRole: binding.inputRole, assetVersionRef: binding.assetVersionRef })),
  } }));
}
export async function createMethodAwareVideoRoute(productionRunRef: string, command: CreateMethodAwareVideoRouteCommand, signal?: AbortSignal) {
  return parseMethodAwareVideoRoute(await creatorRequest<unknown>(path(productionRunRef, "method-aware-video-route"), { method: "POST", signal, body: {
    projectRef: command.projectRef, seriesRef: command.seriesRef, episodeRef: command.episodeRef, idempotencyKey: command.idempotencyKey,
  } }));
}
export async function createExplicitAudioRequirementRoute(productionRunRef: string, command: CreateExplicitAudioRequirementRouteCommand, signal?: AbortSignal) {
  const body: { projectRef: string; seriesRef: string; episodeRef: string; audioRequirementRef: string; idempotencyKey: string; rightsBindingRef?: string; voiceAssetVersionRef?: string } = {
    projectRef: command.projectRef, seriesRef: command.seriesRef, episodeRef: command.episodeRef,
    audioRequirementRef: command.audioRequirementRef, idempotencyKey: command.idempotencyKey,
  };
  if (command.rightsBindingRef !== undefined) body.rightsBindingRef = command.rightsBindingRef;
  if (command.voiceAssetVersionRef !== undefined) body.voiceAssetVersionRef = command.voiceAssetVersionRef;
  return parseExplicitAudioRequirementRoute(await creatorRequest<unknown>(path(productionRunRef, "explicit-audio-requirement-route"), { method: "POST", signal, body }));
}
