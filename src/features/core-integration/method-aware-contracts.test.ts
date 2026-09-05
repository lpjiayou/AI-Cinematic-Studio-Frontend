import { describe, expect, expectTypeOf, it } from "vitest";
import { EXECUTION_METHOD_BY_CLASS, METHOD_AWARE_RESOURCES } from "./method-aware-contracts";
import type * as C from "./method-aware-contracts";
import { executionCommand } from "./method-aware-test-fixtures";
type Forbidden = "workspaceRef" | "productionRunRef" | "tenantId" | "contentProfileRef" | "executionMethod" | "executionClass" |
  "provider" | "providerCapabilityRef" | "adapterCapability" | "adapterIdentity" | "authorityDigest" | "publicationAllowed" |
  "fallbackPolicy" | "assetVersionDigest" | "rightsBinding" | "voiceAssetVersion" | "storageKey" | "internalPath" | "localPath";
describe("closed public requests", () => {
  it("has no forbidden keys or open index signatures in any command", () => {
    expectTypeOf<Extract<keyof C.CreateExecutionMethodPlanCommand, Forbidden>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof C.CreateMethodAwareInputPlanCommand, Forbidden>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof C.CreateMethodAwareVideoRouteCommand, Forbidden>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof C.CreateExplicitAudioRequirementRouteCommand, Forbidden>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof C.MethodAwareAssetBindingInput, Forbidden>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof C.ExecutionMethodShotInput, "executionClass" | "executionMethod">>().toEqualTypeOf<never>();
    expectTypeOf<C.ActionExecutionBeatInput["executionClass"]>().toEqualTypeOf<C.ExecutionClass>();
  });
  it("rejects explicit extra fields and requires speech source authority at compile time", () => {
    // @ts-expect-error browser workspace cannot enter a public command
    const workspace: C.CreateExecutionMethodPlanCommand = { ...executionCommand(), workspaceRef: "forged" };
    // @ts-expect-error a downstream binding cannot supply a digest
    const binding: C.MethodAwareAssetBindingInput = { visualExecutionRequirementRef: "v", inputRequirementKey: "i", inputRole: "STATIC_PLATE", assetVersionRef: "a", assetVersionDigest: "forged" };
    // @ts-expect-error speech audioIntent requires its own sourceSpan
    const missing: C.MethodAwareAudioIntent = { audioType: "DIALOGUE", beatRef: "b", timingReference: { startFrameInclusive: 0, endFrameExclusive: 1 } };
    // @ts-expect-error non-speech audioIntent cannot carry a sourceSpan
    const extra: C.MethodAwareAudioIntent = { audioType: "SILENCE", beatRef: "b", timingReference: { startFrameInclusive: 0, endFrameExclusive: 1 }, sourceSpan: { scriptSceneRef: "s", sourceField: "ACTION", sourceIndex: 0, startOffsetInclusive: 0, endOffsetExclusive: 1 } };
    // @ts-expect-error dialogue sourceField cannot be narration
    const mismatch: C.MethodAwareAudioIntent = { audioType: "DIALOGUE", beatRef: "b", timingReference: { startFrameInclusive: 0, endFrameExclusive: 1 }, sourceSpan: { scriptSceneRef: "s", sourceField: "NARRATION", sourceIndex: 0, startOffsetInclusive: 0, endOffsetExclusive: 1 } };
    expect([workspace, binding, missing, extra, mismatch]).toHaveLength(5);
  });
  it("freezes exactly four resources and five server-derived mappings", () => {
    expect(METHOD_AWARE_RESOURCES).toEqual(["execution-method-plan", "method-aware-input-plan", "method-aware-video-route", "explicit-audio-requirement-route"]);
    expect(EXECUTION_METHOD_BY_CLASS).toEqual({ STATIC_HOLD: "STATIC_PLATE_OR_REUSE", MICRO_MOTION: "SINGLE_ANCHOR_I2V", CONTACT_ACTION: "CONTACT_CONDITIONED_VIDEO", GAIT_LOCOMOTION: "POSE_OR_TRAJECTORY_CONDITIONED_VIDEO", DETERMINISTIC_EVENT: "V3_DETERMINISTIC_COMPOSITION" });
  });
  it("requires the deterministic key only on the deterministic source fact", () => {
    const common = { beatRef: "b", beatOrder: 1, sourceSpan: { scriptSceneRef: "s", sourceField: "ACTION" as const, sourceIndex: 0, startOffsetInclusive: 0, endOffsetExclusive: 1 },
      subjectRefs: ["c"], targetRefs: [], frameRangeStartInclusive: 0, frameRangeEndExclusive: 1 };
    // @ts-expect-error deterministic event requires its postprocess requirement key
    const missing: C.ActionExecutionBeatInput = { ...common, executionClass: "DETERMINISTIC_EVENT" };
    // @ts-expect-error static facts cannot carry the deterministic key
    const extra: C.ActionExecutionBeatInput = { ...common, executionClass: "STATIC_HOLD", postprocessRequirementKey: "event-1" };
    const event: C.ActionExecutionBeatInput = { ...common, executionClass: "DETERMINISTIC_EVENT", postprocessRequirementKey: "event-1" };
    expect([missing, extra, event]).toHaveLength(3);
  });
});
