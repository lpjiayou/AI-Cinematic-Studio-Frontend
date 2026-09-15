import { describe, expect, it, vi, afterEach } from "vitest";
import { generationContentUrl, parseGenerationWorkspace, readGeneration, startGeneration, type GenerationView } from "./generation-workspace-client";

export const generationFixture: GenerationView = {
  schemaVersion: "creator.generation-workspace.v1", workspaceRef: "workspace-test", projectRef: "project-test", seriesRef: "series-test", episodeRef: "episode-test", productionRunRef: "run-test",
  mediaJobRef: "job-test", jobRevision: 1, approvedPlanDigest: "a".repeat(64), creativeShotVersionRef: "shot-v1", beatRef: "beat-test",
  state: "QUEUED", attemptCount: 0, activity: "IDLE", errorCode: null, artifact: null,
  canPrepare: true, canExecute: true, publicationAllowed: false, automaticRetryAllowed: false,
};
afterEach(() => vi.unstubAllGlobals());
describe("generation workspace contract", () => {
  it("validates the closed public projection", () => {
    expect(parseGenerationWorkspace({ ok: true, generation: generationFixture })).toEqual(generationFixture);
    expect(() => parseGenerationWorkspace({ ok: true, generation: generationFixture, privatePath: "private" })).toThrow();
    const run = { ...generationFixture, state: "CREATED", sourceVersionRef: "source-v1" };
    expect(parseGenerationWorkspace({ ok: true, generation: generationFixture }, run)).toEqual(generationFixture);
    for (const extra of [{ endpoint: "private" }, { publicationAllowed: true }, { automaticRetryAllowed: true }, { state: "UNKNOWN" }, { attemptCount: 2 }]) {
      expect(() => parseGenerationWorkspace({ ok: true, generation: { ...generationFixture, ...extra } })).toThrow();
    }
    expect(() => parseGenerationWorkspace({ ok: true, generation: generationFixture }, { ...generationFixture, projectRef: "other" })).toThrow();
  });
  it("reads and executes only through same-origin API with exact refs", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ ok: true, generation: generationFixture })).mockResolvedValueOnce(Response.json({ ok: true, accepted: true }));
    vi.stubGlobal("fetch", fetch);
    await readGeneration(generationFixture); await startGeneration(generationFixture, "EXECUTE_APPROVED");
    expect(fetch.mock.calls[0][0]).toBe("/api/creator/episode-production-runs/run-test/generation?projectRef=project-test&seriesRef=series-test&episodeRef=episode-test");
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ projectRef: "project-test", seriesRef: "series-test", episodeRef: "episode-test", operation: "EXECUTE_APPROVED", mediaJobRef: "job-test", expectedJobRevision: 1, approvedPlanDigest: "a".repeat(64) });
  });
  it("builds a scoped content link only for a returned artifact", () => {
    expect(generationContentUrl(generationFixture)).toBeUndefined();
    const completed: GenerationView = { ...generationFixture, state: "SUCCEEDED", attemptCount: 1, canExecute: false, canPrepare: false,
      artifact: { sha256: "b".repeat(64), byteSize: 100, width: 704, height: 1280, durationFrames: 48, frameRate: 24, mediaType: "video/mp4" } };
    expect(parseGenerationWorkspace({ ok: true, generation: completed })).toEqual(completed);
    expect(generationContentUrl(completed)).toContain("/generation/content?projectRef=project-test&seriesRef=series-test&episodeRef=episode-test&mediaJobRef=job-test&sha256=");
  });
});
