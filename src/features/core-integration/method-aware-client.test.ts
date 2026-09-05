import { afterEach, describe, expect, it, vi } from "vitest";
import * as client from "./method-aware-client";
import { audioFixture, commandScope, executionCommand, executionFixture, inputCommand, inputFixture, videoFixture } from "./method-aware-test-fixtures";
const runRef = "run/空 格?";
const options = { productionRunRef: runRef, projectRef: "project a", seriesRef: "series/a", episodeRef: "episode?", versionRef: "version/1" };
const resources = ["execution-method-plan", "method-aware-input-plan", "method-aware-video-route", "explicit-audio-requirement-route"] as const;
const reads = [client.getExecutionMethodPlan, client.getMethodAwareInputPlan, client.getMethodAwareVideoRoute, client.getExplicitAudioRequirementRoute];
const fixtures = [executionFixture, inputFixture, videoFixture, audioFixture];
function writes(signal?: AbortSignal) {
  return [
    () => client.createExecutionMethodPlan(runRef, executionCommand(), signal),
    () => client.createMethodAwareInputPlan(runRef, inputCommand(), signal),
    () => client.createMethodAwareVideoRoute(runRef, commandScope, signal),
    () => client.createExplicitAudioRequirementRoute(runRef, { ...commandScope, audioRequirementRef: "audio-silence" }, signal),
  ];
}
afterEach(() => vi.restoreAllMocks());
for (const [i, resource] of resources.entries()) describe(resource, () => {
  it("GET constructs the exact same-origin path/query and passes cancellation through parsing", async () => {
    const signal = new AbortController().signal;
    const value = fixtures[i](); const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(value));
    expect(await reads[i]({ ...options, signal })).toEqual(value);
    expect(mock).toHaveBeenCalledOnce();
    expect(mock.mock.calls[0][0]).toBe(`/api/creator/episode-production-runs/${encodeURIComponent(runRef)}/${resource}?projectRef=project+a&seriesRef=series%2Fa&episodeRef=episode%3F&versionRef=version%2F1`);
    expect(mock.mock.calls[0][1]).toMatchObject({ method: "GET", signal, cache: "no-store" });
  });
  it("omits optional versionRef and ignores extraneous read options", async () => {
    const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(fixtures[i]()));
    await reads[i](Object.assign({ ...options, versionRef: undefined }, { workspaceRef: "forged", executionMethod: "forged" }));
    expect(mock.mock.calls[0][0]).toBe(`/api/creator/episode-production-runs/${encodeURIComponent(runRef)}/${resource}?projectRef=project+a&seriesRef=series%2Fa&episodeRef=episode%3F`);
  });
  it("POST rebuilds exactly the public body and passes cancellation", async () => {
    const signal = new AbortController().signal;
    const value = fixtures[i](); const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(value));
    expect(await writes(signal)[i]()).toEqual(value);
    expect(mock).toHaveBeenCalledOnce();
    expect(mock.mock.calls[0][0]).toBe(`/api/creator/episode-production-runs/${encodeURIComponent(runRef)}/${resource}`);
    const init = mock.mock.calls[0][1];
    expect(init).toMatchObject({ method: "POST", signal, cache: "no-store" });
    expect(JSON.parse(String(init?.body))).toEqual([executionCommand(), inputCommand(), commandScope, { ...commandScope, audioRequirementRef: "audio-silence" }][i]);
  });
  for (const method of ["GET", "POST"]) {
    it(`${method} fails closed on malformed success data`, async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ...fixtures[i](), payloadDigest: "bad" }));
      await expect(method === "GET" ? reads[i](options) : writes()[i]()).rejects.toMatchObject({ status: 502, detail: { code: "invalid_method_aware_response" } });
    });
    for (const status of [404, 409, 503]) it(`${method} preserves Core ${status} and its error code`, async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: false, error: { code: "core-specific-error", message: "Core 拒绝" } }, { status }));
      await expect(method === "GET" ? reads[i](options) : writes()[i]()).rejects.toMatchObject({ status, detail: { code: "core-specific-error", message: "Core 拒绝" } });
    });
  }
});
it("rebuilds every nested execution field instead of spreading untrusted request objects", async () => {
  const command = executionCommand();
  Object.assign(command, { workspaceRef: "forged", executionMethod: "forged" });
  Object.assign(command.shots[0], { authorityDigest: "forged" });
  Object.assign(command.shots[0].cameraInstruction, { provider: "forged" });
  Object.assign(command.shots[0].actionExecutionBeats[0].sourceSpan, { digest: "forged" });
  Object.assign(command.shots[0].audioIntents[0].timingReference, { secret: "forged" });
  const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(executionFixture()));
  await client.createExecutionMethodPlan(runRef, command);
  expect(JSON.parse(String(mock.mock.calls[0][1]?.body))).toEqual(executionCommand());
});
it("strips extra input/video/audio claims while preserving opaque optional audio refs", async () => {
  const mock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json(inputFixture())).mockResolvedValueOnce(Response.json(videoFixture())).mockResolvedValueOnce(Response.json(audioFixture("DIALOGUE")));
  const command = inputCommand(); Object.assign(command.assetBindings[0], { assetVersionDigest: "forged" });
  await client.createMethodAwareInputPlan(runRef, Object.assign(command, { executionMethodPlanVersionRef: "forged" }));
  await client.createMethodAwareVideoRoute(runRef, Object.assign({ ...commandScope }, { provider: "forged" }));
  const audio = { ...commandScope, audioRequirementRef: "audio-dialogue", rightsBindingRef: "rights-1", voiceAssetVersionRef: "voice-v1" };
  await client.createExplicitAudioRequirementRoute(runRef, Object.assign({ ...audio }, { rightsBinding: {}, voiceAssetVersion: {} }));
  expect(JSON.parse(String(mock.mock.calls[0][1]?.body))).toEqual(inputCommand());
  expect(JSON.parse(String(mock.mock.calls[1][1]?.body))).toEqual(commandScope);
  expect(JSON.parse(String(mock.mock.calls[2][1]?.body))).toEqual(audio);
});
