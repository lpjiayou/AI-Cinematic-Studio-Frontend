import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCreatorExperienceRequest } from "./experience-adapter";
import { IMAGE_VIDEO_MAX_BYTES } from "./image-video-client";

const scope = { projectRef: "project-one", seriesRef: "series-one", episodeRef: "episode-one" };
const path = ["episode-production-runs", "run-one", "image-video-generations"];
const url = "http://frontend.test/api/creator/episode-production-runs/run-one/image-video-generations";
const query = new URLSearchParams(scope).toString();
const generation = { schemaVersion: "creator.image-video-generation.v1", ...scope, productionRunRef: "run-one", generationRef: "generation-one", mediaJobRef: null, state: "PREPARING", attemptCount: 0, description: "人物转头", inputSha256: "a".repeat(64), createdAt: "2026-09-15T09:00:00Z", errorCode: null, artifact: null, publicationAllowed: false, automaticRetryAllowed: false };
const command = { ...scope, description: "人物转头", imageBase64: "aGVsbG8=", imageMediaType: "image/png", idempotencyKey: "00000000-0000-4000-8000-000000000001", expectedPolicyDigest: "b".repeat(64) };
const workspace = { schemaVersion: "creator.image-video-workspace.v1", ...scope, productionRunRef: "run-one", policy: null, available: false, reason: "service_unavailable", generations: [generation] };
const environment = { schemaVersion: "creator.runtime-environment.v1", ...scope, productionRunRef: "run-one", observedAt: "2026-09-15T10:00:00Z", core: "CONNECTED", operator: "READY", gpu: "CONNECTED", comfyui: "CONNECTED", queue: { state: "IDLE", runningCount: 0, pendingCount: 0 }, readOnly: true };
function post(body: unknown, headers: Record<string, string> = {}) { return new Request(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://frontend.test", ...headers }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.stubEnv("CREATOR_CORE_TOKEN", "fixture-only-server-token"); vi.stubEnv("CREATOR_CORE_BASE_URL", "http://core.test:8765"); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("image-video same-origin bounded ExperienceAdapter", () => {
  it("forwards closed new command once with server-only credentials", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true, generation }, { status: 202 }));
    const result = await handleCreatorExperienceRequest(post(command), path);
    expect(result.status).toBe(202); expect(fetch).toHaveBeenCalledOnce();
    expect(String(fetch.mock.calls[0][0])).toBe("http://core.test:8765/creator/api/v1/episode-production-runs/run-one/image-video-generations");
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual(command);
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer fixture-only-server-token");
    expect(await result.text()).not.toContain("fixture-only-server-token");
  });
  it("rejects cross-origin, forged authority, endpoint, unknown fields and unallowed verbs", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await handleCreatorExperienceRequest(post(command, { Origin: "https://evil.test" }), path)).status).toBe(403);
    for (const field of ["workspaceRef", "tenantId", "productionRunRef", "grant", "endpoint", "provider", "publicationAllowed", "model"]) {
      expect((await handleCreatorExperienceRequest(post({ ...command, [field]: "forged" }), path)).status).toBe(400);
    }
    expect((await handleCreatorExperienceRequest(new Request(url, { method: "DELETE" }), path)).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("applies the large JSON allowance only to this upload and streams an undeclared oversized request", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true, generation }, { status: 202 }));
    expect((await handleCreatorExperienceRequest(post({ ...command, imageBase64: "AAAA".repeat(150_000) }), path)).status).toBe(202);
    expect((await handleCreatorExperienceRequest(new Request("http://frontend.test/api/creator/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: "a".repeat(600_000) }) }), ["projects"])).status).toBe(400);
    const cancel = vi.fn(); let sent = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { sent++; controller.enqueue(new Uint8Array(1_048_576)); }, cancel });
    const request = new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: stream, duplex: "half" } as RequestInit);
    expect((await handleCreatorExperienceRequest(request, path)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce(); expect(sent).toBeLessThan(14); expect(fetch).toHaveBeenCalledOnce();
    expect((await handleCreatorExperienceRequest(post(command, { "content-length": String(IMAGE_VIDEO_MAX_BYTES * 2) }), path)).status).toBe(413);
  });
  it("validates scope, generation identity and closed projections before rendering", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ ok: true, workspace })).mockResolvedValueOnce(Response.json({ ok: true, generation })).mockResolvedValueOnce(Response.json({ ok: true, generation: { ...generation, generationRef: "other" } })).mockResolvedValueOnce(Response.json({ ok: true, generation: { ...generation, episodeRef: "other" } })).mockResolvedValueOnce(Response.json({ ok: true, generation, privatePath: "private" }));
    expect((await handleCreatorExperienceRequest(new Request(`${url}?${query}`), path)).status).toBe(200);
    const detailPath = [...path, "generation-one"];
    expect((await handleCreatorExperienceRequest(new Request(`${url}/generation-one?${query}`), detailPath)).status).toBe(200);
    for (let index = 0; index < 3; index++) {
      const result = await handleCreatorExperienceRequest(new Request(`${url}/generation-one?${query}`), detailPath);
      expect(result.status).toBe(502); expect(await result.text()).not.toContain("privatePath");
    }
    expect(fetch).toHaveBeenCalledTimes(5);
  });
  it("forwards only the authenticated read-only runtime environment projection", async () => {
    const environmentPath = [...path, "runtime-environment"];
    const environmentUrl = `${url}/runtime-environment?${query}`;
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ ok: true, environment }))
      .mockResolvedValueOnce(Response.json({ ok: true, environment: { ...environment, endpoint: "http://private" } }));
    const response = await handleCreatorExperienceRequest(new Request(environmentUrl), environmentPath);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, environment });
    expect(String(fetch.mock.calls[0][0])).toBe(`http://core.test:8765/creator/api/v1/episode-production-runs/run-one/image-video-generations/runtime-environment?${query}`);
    expect((await handleCreatorExperienceRequest(new Request(environmentUrl), environmentPath)).status).toBe(502);
    expect((await handleCreatorExperienceRequest(new Request(environmentUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }), environmentPath)).status).toBe(404);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("closes GET query and streams only scoped mp4 bytes", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(new Uint8Array([1, 2]), { headers: { "Content-Type": "video/mp4" } }));
    for (const suffix of ["", `?${query}&workspaceRef=forged`, `?${query}&episodeRef=duplicate`, `?${query}&endpoint=bad`]) expect((await handleCreatorExperienceRequest(new Request(url + suffix), path)).status).toBe(400);
    const content = `${url}/generation-one/content?${query}&sha256=${"c".repeat(64)}`;
    expect([...new Uint8Array(await (await handleCreatorExperienceRequest(new Request(content), [...path, "generation-one", "content"])).arrayBuffer())]).toEqual([1, 2]);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it.each([403, 409, 413, 503])("preserves rejection %i without automatic retry", async status => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: false, error: { code: "image_video_unavailable", message: "当前不可生成" } }, { status }));
    expect((await handleCreatorExperienceRequest(post(command), path)).status).toBe(status); expect(fetch).toHaveBeenCalledOnce();
  });
});
