import { describe, expect, it } from "vitest";
import { CreatorClientError } from "./browser-client";
import { AUDIO_TYPES } from "./method-aware-contracts";
import { audioFixture, d, e, executionFixture, inputFixture, videoFixture } from "./method-aware-test-fixtures";
import { parseExecutionMethodPlan, parseExplicitAudioRequirementRoute, parseMethodAwareInputPlan, parseMethodAwareVideoRoute } from "./method-aware-validators";

const examples = [
  { name: "execution", value: executionFixture(), parse: parseExecutionMethodPlan },
  { name: "input", value: inputFixture(), parse: parseMethodAwareInputPlan },
  { name: "video", value: videoFixture(), parse: parseMethodAwareVideoRoute },
  ...AUDIO_TYPES.map((type) => ({ name: `audio-${type}`, value: audioFixture(type), parse: parseExplicitAudioRequirementRoute })),
  { name: "audio-clone-dialogue", value: audioFixture("DIALOGUE", true), parse: parseExplicitAudioRequirementRoute },
  { name: "audio-clone-narration", value: audioFixture("NARRATION", true), parse: parseExplicitAudioRequirementRoute },
];
function fields(value: unknown, prefix: string[] = []): { path: string[]; value: unknown }[] {
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, v]) => [{ path: [...prefix, key], value: v }, ...fields(v, [...prefix, key])]);
}
function changed(value: unknown, path: readonly string[], replacement: unknown, remove = false): unknown {
  const copy = structuredClone(value);
  let target = copy as Record<string, unknown>;
  for (const key of path.slice(0, -1)) target = target[key] as Record<string, unknown>;
  const key = path[path.length - 1];
  if (remove) delete target[key]; else target[key] = replacement;
  return copy;
}
function fails(parse: (v: unknown) => unknown, value: unknown) {
  expect(() => parse(value)).toThrow(CreatorClientError);
  expect(() => parse(value)).toThrow("Frontend 无法验证 Core 返回的方法规划数据。");
  try { parse(value); } catch (error) {
    expect(error).toMatchObject({ status: 502, detail: { code: "invalid_method_aware_response" } });
  }
}
for (const example of examples) describe(example.name, () => {
  it("accepts the complete current and stale public DTO without changing authority state", () => {
    expect(example.parse(example.value)).toEqual(example.value);
    expect(example.parse({ ...example.value, currentness: "STALE", idempotentReplay: true })).toMatchObject({ currentness: "STALE", idempotentReplay: true });
  });
  for (const { path, value } of fields(example.value)) {
    const key = path[path.length - 1];
    if (!/^\d+$/.test(key) && key !== "voiceLineage") it(`rejects missing ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, undefined, true)));
    if (value !== null && typeof value === "object" && !Array.isArray(value)) it(`rejects extra nested fields in ${path.join(".")}`, () => fails(example.parse, changed(example.value, [...path, "unknownField"], true)));
    if (Array.isArray(value)) it(`rejects a malformed member in ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, [...value, null])));
    if (key === "schemaVersion") it(`rejects wrong schema at ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, "v999.unknown")));
    if (/Ref$/.test(key) && typeof value === "string") it(`rejects empty ref at ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, " ")));
    if (/Digest$/.test(key) && typeof value === "string") it(`rejects bad digest at ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, "abcd")));
    if (typeof value === "number") it(`rejects invalid integer at ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, -1)));
    if (value === false) it(`rejects missing false evidence at ${path.join(".")}`, () => fails(example.parse, changed(example.value, path, undefined)));
  }
  it("rejects unknown root values, enums, replay types, publication and private data", () => {
    for (const value of [null, undefined, [], 0, "unknown", {}, { ...example.value, extra: true }, { ...example.value, currentness: "UNKNOWN" },
      { ...example.value, idempotentReplay: "false" }, { ...example.value, publicationAllowed: true }]) fails(example.parse, value);
    const names = ["authorityState", "requestedProvenance", "rightsBinding", "sourceRefs", "voiceAssetVersionSnapshot", "absolutePath", "artifactPath", "artifactRoot", "candidatePath", "filesystemPath", "finalPath", "inputPath", "internalPath", "outputPath", "storageBindingRef", "resultStorageKey", "resultStorageKeys", "token", "cookie", "credential", "secret", "privateKey", "providerSelection", "localPath"];
    const objects = [[], ...fields(example.value).filter(({ value }) => value !== null && typeof value === "object" && !Array.isArray(value)).map(({ path }) => path)];
    for (const path of objects) for (const key of names) {
      fails(example.parse, changed(example.value, [...path, key], "private"));
      fails(example.parse, changed(example.value, [...path, key.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()], "private"));
    }
  });
});
describe("cross-field evidence", () => {
  it("binds every execution class to its method and source beat", () => {
    for (let i = 0; i < 5; i++) {
      const v = executionFixture();
      v.visualExecutionRequirements[i].executionMethod = i === 1 ? "CONTACT_CONDITIONED_VIDEO" : "SINGLE_ANCHOR_I2V";
      fails(parseExecutionMethodPlan, v);
      const stale = executionFixture(); stale.visualExecutionRequirements[i].beatDigest = e; fails(parseExecutionMethodPlan, stale);
    }
    for (const path of [["storyboardVersion", "scriptVersionDigest"], ["creativeShotVersions", "0", "storyboardVersionDigest"], ["audioRequirements", "0", "creativeShotVersionDigest"], ["postprocessRequirements", "0", "beatDigest"]]) fails(parseExecutionMethodPlan, changed(executionFixture(), path, e));
    fails(parseExecutionMethodPlan, { ...executionFixture(), postprocessRequirements: [] });
    fails(parseExecutionMethodPlan, changed(executionFixture(), ["creativeShotVersions", "0", "actionExecutionBeats", "4", "postprocessRequirementKey"], undefined, true));
    fails(parseExecutionMethodPlan, changed(executionFixture(), ["postprocessRequirements", "0", "postprocessRequirementKey"], "other-event"));
    for (const i of [0, 1, 2, 3]) fails(parseExecutionMethodPlan, changed(executionFixture(), ["creativeShotVersions", "0", "actionExecutionBeats", String(i), "postprocessRequirementKey"], "event-1"));
    fails(parseExecutionMethodPlan, changed(executionFixture(), ["audioRequirements", "0", "sourceSpan", "sourceField"], "ACTION"));
    fails(parseExecutionMethodPlan, changed(executionFixture(), ["creativeShotVersions", "0", "actionExecutionBeats", "1", "frameRangeStartInclusive"], 11));
    fails(parseExecutionMethodPlan, { ...executionFixture(), executionClass: "STATIC_HOLD" });
  });
  it("requires exact input roles, resolved bindings, readiness and counts", () => {
    for (const key of ["requestedAssetBindingCount", "resolvedAssetBindingCount", "inputReadyCount", "inputBlockedCount"]) fails(parseMethodAwareInputPlan, { ...inputFixture(), [key]: 100 });
    const v = inputFixture(); v.methodInputPlans[1].inputRequirements[0].assetVersionBindings[0].assetVersionDigest = "bad"; fails(parseMethodAwareInputPlan, v);
    for (const [path, value] of [
      [["methodInputPlans", "1", "inputPlanningState"], "INPUT_REQUIRED"],
      [["methodInputPlans", "0", "inputPlanningState"], "AVAILABLE"],
      [["methodInputPlans", "1", "inputRequirements", "0", "acceptedInputRoles"], ["STATIC_PLATE"]],
      [["methodInputPlans", "1", "inputRequirements", "0", "assetVersionBindings", "0", "inputRole"], "UNKNOWN"],
    ] satisfies [string[], unknown][]) fails(parseMethodAwareInputPlan, changed(inputFixture(), path, value));
  });
  it("accepts input-blocked Micro Motion without a job and rejects all routing fallback", () => {
    const blocked = videoFixture(); blocked.routes[1].routingState = "INPUT_BLOCKED";
    blocked.routes[1].videoGenerationRequestRef = null; blocked.routes[1].videoGenerationRequestDigest = null; blocked.routes[1].mediaJobRef = null;
    blocked.videoGenerationRequests = []; blocked.queuedJobs = []; blocked.videoGenerationRequestCount = 0; blocked.queuedJobCount = 0;
    expect(parseMethodAwareVideoRoute(blocked)).toEqual(blocked);
    for (const i of [0, 2, 3, 4]) {
      const v = videoFixture(); v.routes[i].executionMethod = "SINGLE_ANCHOR_I2V"; fails(parseMethodAwareVideoRoute, v);
      const r = videoFixture(); r.routes[i].videoGenerationRequestRef = "video-request-1"; fails(parseMethodAwareVideoRoute, r);
    }
    for (const [path, value] of [
      [["wanFallbackUsed"], true], [["routes", "1", "fallbackUsed"], true], [["routes", "1", "routingState"], "AVAILABLE"],
      [["routes", "4", "targetBoundary"], "M11_VIDEO_EXECUTION"], [["videoGenerationRequestCount"], 0], [["queuedJobCount"], 0],
      [["queuedJobs", "0", "generationRequestDigest"], e], [["videoGenerationRequests", "0", "executionMethodPlanDigest"], e],
      [["videoGenerationRequests", "0", "publicationAllowed"], true], [["videoGenerationRequests", "0", "executionAuthorizationState"], "EXECUTED"],
    ] satisfies [string[], unknown][]) fails(parseMethodAwareVideoRoute, changed(videoFixture(), path, value));
  });
  it("requires SILENCE/MUSIC null requests and prevents runtime or voice authority escalation", () => {
    for (const type of ["SILENCE", "MUSIC"] as const) {
      fails(parseExplicitAudioRequirementRoute, { ...audioFixture(type), routeDisposition: "REQUEST_CREATED" });
      fails(parseExplicitAudioRequirementRoute, { ...audioFixture(type), audioGenerationRequest: audioFixture("DIALOGUE").audioGenerationRequest });
    }
    for (const [path, value] of [
      [["audioGenerationRequest"], null], [["audioCueTimingBinding"], null], [["m12RuntimeInstalled"], true], [["m12RuntimeState"], "INSTALLED"],
      [["audioGenerationRequest", "assetRequirementDigest"], e], [["audioCueTimingBinding", "audioGenerationRequestDigest"], e],
      [["audioGenerationRequest", "requestSpec", "normalizedSpeechParameters", "audioRole"], "narration"],
      [["audioGenerationRequest", "sourceSpan", "sourceField"], "ACTION"], [["audioCueTimingBinding", "timingReference", "endFrameExclusive"], 20],
    ] satisfies [string[], unknown][]) fails(parseExplicitAudioRequirementRoute, changed(audioFixture("DIALOGUE"), path, value));
    expect(audioFixture("DIALOGUE", true).audioGenerationRequest?.payloadDigest).toBe(d);
  });
});
