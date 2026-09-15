import { afterEach, describe, expect, it, vi } from "vitest";
import { createImageVideoGeneration, IMAGE_VIDEO_MAX_BYTES, imageVideoContentUrl, parseImageVideoGeneration, parseImageVideoWorkspace, parseRuntimeEnvironment, readImageVideoGeneration, readImageVideoWorkspace, readRuntimeEnvironment, validImageVideoCommand } from "./image-video-client";

const scope = { projectRef: "project-one", seriesRef: "series-one", episodeRef: "episode-one", productionRunRef: "run-one" };
const generation = { schemaVersion: "creator.image-video-generation.v1", ...scope, generationRef: "generation-one", mediaJobRef: null, state: "PREPARING", attemptCount: 0, description: "人物转头", inputSha256: "a".repeat(64), createdAt: "2026-09-15T09:00:00+00:00", errorCode: null, artifact: null, publicationAllowed: false, automaticRetryAllowed: false };
const policy = { policyDigest: "b".repeat(64), maxInputBytes: IMAGE_VIDEO_MAX_BYTES, maxDescriptionChars: 1000, output: { width: 704, height: 1280, durationFrames: 48, frameRate: 24 }, maxCostMinor: 1000, currency: "CNY", executionTimeoutSeconds: 7200 };
const workspace = { schemaVersion: "creator.image-video-workspace.v1", ...scope, policy, available: true, reason: null, generations: [generation] };
const environment = { schemaVersion: "creator.runtime-environment.v1", ...scope, observedAt: "2026-09-15T10:00:00Z", core: "CONNECTED", operator: "READY", gpu: "CONNECTED", comfyui: "CONNECTED", queue: { state: "IDLE", runningCount: 0, pendingCount: 0 }, readOnly: true };
const command = { projectRef: scope.projectRef, seriesRef: scope.seriesRef, episodeRef: scope.episodeRef, imageBase64: "aGVsbG8=", imageMediaType: "image/png" as const, description: "人物转头", idempotencyKey: "00000000-0000-4000-8000-000000000001", expectedPolicyDigest: policy.policyDigest };
afterEach(() => vi.unstubAllGlobals());

describe("image + description closed client contract", () => {
  it("reads closed authoritative scope, policy and original server history", () => {
    expect(parseImageVideoWorkspace({ ok: true, workspace }, scope)).toEqual(workspace);
    expect(parseImageVideoGeneration({ ok: true, generation }, scope, "generation-one")).toEqual(generation);
    for (const field of ["workspaceRef", "grant", "endpoint", "rightsApproval"]) {
      expect(() => parseImageVideoGeneration({ ok: true, generation: { ...generation, [field]: "forged" } }, scope)).toThrow();
    }
    for (const field of ["projectRef", "seriesRef", "episodeRef", "productionRunRef"] as const) {
      expect(() => parseImageVideoGeneration({ ok: true, generation: { ...generation, [field]: "other" } }, scope)).toThrow();
    }
    expect(() => parseImageVideoGeneration({ ok: true, generation }, scope, "other")).toThrow();
    expect(() => parseImageVideoWorkspace({ ok: true, workspace: { ...workspace, generations: [generation, generation] } }, scope)).toThrow();
  });
  it("rejects unsafe policy, fake success, retries and private fields", () => {
    for (const delta of [{ maxInputBytes: IMAGE_VIDEO_MAX_BYTES + 1 }, { maxCostMinor: -1 }, { currency: "USD" }, { output: { ...policy.output, width: 1280 } }]) {
      expect(() => parseImageVideoWorkspace({ ok: true, workspace: { ...workspace, policy: { ...policy, ...delta } } }, scope)).toThrow();
    }
    expect(() => parseImageVideoWorkspace({ ok: true, workspace: { ...workspace, policy: null } }, scope)).toThrow();
    for (const delta of [{ publicationAllowed: true }, { automaticRetryAllowed: true }, { attemptCount: 2 }, { state: "SUCCEEDED" }, { createdAt: "yesterday" }]) {
      expect(() => parseImageVideoGeneration({ ok: true, generation: { ...generation, ...delta } }, scope)).toThrow();
    }
  });
  it("keeps PNG/JPEG, bytes, unicode description and UUID bounds closed", () => {
    expect(validImageVideoCommand(command)).toBe(true);
    for (const delta of [{ imageMediaType: "image/svg+xml" }, { imageBase64: "bad$$" }, { description: " " }, { description: "字".repeat(1001) }, { idempotencyKey: "generation-ref" }, { endpoint: "injected" }, { workspaceRef: "forged" }]) expect(validImageVideoCommand({ ...command, ...delta })).toBe(false);
    expect(validImageVideoCommand({ ...command, description: "🎬".repeat(1000) })).toBe(true);
    expect(validImageVideoCommand({ ...command, imageBase64: "A".repeat(Math.ceil(IMAGE_VIDEO_MAX_BYTES / 3) * 4) })).toBe(false);
    expect(validImageVideoCommand({ ...command, imageBase64: `${"A".repeat(Math.ceil(IMAGE_VIDEO_MAX_BYTES / 3) * 4 - 1)}=` })).toBe(true);
  });
  it("uses only same-origin closed paths and never retries POST", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ok: true, workspace })).mockResolvedValueOnce(Response.json({ ok: true, generation })).mockResolvedValueOnce(Response.json({ ok: true, generation })).mockResolvedValueOnce(Response.json({ ok: true, environment })).mockRejectedValueOnce(new TypeError("network failure"));
    vi.stubGlobal("fetch", fetch);
    await readImageVideoWorkspace(scope); await createImageVideoGeneration(scope, command); await readImageVideoGeneration(scope, generation.generationRef); await readRuntimeEnvironment(scope);
    expect(fetch.mock.calls[0][0]).toBe("/api/creator/episode-production-runs/run-one/image-video-generations?projectRef=project-one&seriesRef=series-one&episodeRef=episode-one");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(command);
    expect(fetch.mock.calls[2][0]).toContain("/image-video-generations/generation-one?");
    expect(fetch.mock.calls[3][0]).toBe("/api/creator/runtime-environment?projectRef=project-one&seriesRef=series-one&episodeRef=episode-one&productionRunRef=run-one");
    await expect(createImageVideoGeneration(scope, command)).rejects.toThrow("network failure");
    expect(fetch).toHaveBeenCalledTimes(5);
  });
  it("accepts only the closed read-only environment projection", () => {
    expect(parseRuntimeEnvironment({ ok: true, environment }, scope)).toEqual(environment);
    expect(parseRuntimeEnvironment({ ok: true, environment: { ...environment, observedAt: null, gpu: "UNAVAILABLE", comfyui: "UNAVAILABLE", queue: { state: "UNAVAILABLE", runningCount: null, pendingCount: null } } }, scope).gpu).toBe("UNAVAILABLE");
    for (const changed of [
      { ...environment, endpoint: "http://private" },
      { ...environment, projectRef: "other" },
      { ...environment, readOnly: false },
      { ...environment, queue: { state: "IDLE", runningCount: 1, pendingCount: 0 } },
      { ...environment, gpu: "UNAVAILABLE", comfyui: "UNAVAILABLE" },
    ]) expect(() => parseRuntimeEnvironment({ ok: true, environment: changed }, scope)).toThrow();
  });
  it("plays only the returned successful exact-spec artifact", () => {
    const current = parseImageVideoGeneration({ ok: true, generation }, scope);
    expect(imageVideoContentUrl(current)).toBeUndefined();
    const complete = { ...generation, state: "SUCCEEDED", attemptCount: 1, mediaJobRef: "new-job", artifact: { sha256: "c".repeat(64), byteSize: 100, mediaType: "video/mp4", width: 704, height: 1280, durationFrames: 48, frameRate: 24 } };
    const valid = parseImageVideoGeneration({ ok: true, generation: complete }, scope);
    expect(imageVideoContentUrl(valid)).toBe(`/api/creator/episode-production-runs/run-one/image-video-generations/generation-one/content?projectRef=project-one&seriesRef=series-one&episodeRef=episode-one&sha256=${"c".repeat(64)}`);
    expect(() => parseImageVideoGeneration({ ok: true, generation: { ...complete, artifact: { ...complete.artifact, durationFrames: 49 } } }, scope)).toThrow();
  });
});
