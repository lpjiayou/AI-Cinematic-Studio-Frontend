import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCreatorExperienceRequest } from "./experience-adapter";

const scope = { projectRef: "project-test", seriesRef: "series-test", episodeRef: "episode-test" };
const path = ["episode-production-runs", "run-test", "generation"];
const url = "http://frontend.test/api/creator/episode-production-runs/run-test/generation";
const query = new URLSearchParams(scope).toString();
const command = { ...scope, operation: "EXECUTE_APPROVED", mediaJobRef: "job-test", expectedJobRevision: 1, approvedPlanDigest: "a".repeat(64) };
function view() { return { schemaVersion: "creator.generation-workspace.v1", ...scope, productionRunRef: "run-test", workspaceRef: "workspace-test",
  mediaJobRef: "job-test", jobRevision: 1, approvedPlanDigest: "a".repeat(64), creativeShotVersionRef: "shot-v1", beatRef: "beat-test",
  state: "QUEUED", attemptCount: 0, activity: "IDLE", errorCode: null, artifact: null,
  canPrepare: true, canExecute: true, publicationAllowed: false, automaticRetryAllowed: false }; }
function post(body: unknown, origin = "http://frontend.test") { return new Request(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.stubEnv("CREATOR_CORE_TOKEN", "fixture-only-server-token"); vi.stubEnv("CREATOR_CORE_BASE_URL", "http://core.test:8765"); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("original generation Operator ExperienceAdapter", () => {
  it("forwards exact authenticated commands without browser authority claims", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true, accepted: true }, { status: 202 }));
    const response = await handleCreatorExperienceRequest(post({ ...command, workspaceRef: "forged", tenantId: "forged", productionRunRef: "forged" }), path);
    expect(response.status).toBe(202); expect(fetch).toHaveBeenCalledOnce();
    expect(String(fetch.mock.calls[0][0])).toBe("http://core.test:8765/creator/api/v1/episode-production-runs/run-test/generation");
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual(command);
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer fixture-only-server-token");
    expect(JSON.stringify([...response.headers])).not.toContain("fixture-only-server-token");
  });
  it("rejects cross-site requests and new approval or GPU inputs before Core", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    expect((await handleCreatorExperienceRequest(post(command, "https://attacker.test"), path)).status).toBe(403);
    for (const field of ["grant", "approval", "endpoint", "provider", "internalPath", "actorRef", "publicationAllowed"]) {
      expect((await handleCreatorExperienceRequest(post({ ...command, [field]: "forged" }), path)).status).toBe(400);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
  it("uses the real Host when Next normalizes its internal listener URL", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true, accepted: true }, { status: 202 }));
    const request = new Request("http://localhost:3031/api/creator/episode-production-runs/run-test/generation", {
      method: "POST", headers: { "Content-Type": "application/json", Host: "127.0.0.1:3031", Origin: "http://127.0.0.1:3031" }, body: JSON.stringify(command),
    });
    expect((await handleCreatorExperienceRequest(request, path)).status).toBe(202);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("validates both scope and closed result before displaying Core state", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({ ok: true, generation: view() }))
      .mockResolvedValueOnce(Response.json({ ok: true, generation: { ...view(), episodeRef: "other" } }))
      .mockResolvedValueOnce(Response.json({ ok: true, generation: view(), privatePath: "private-value" }));
    expect((await handleCreatorExperienceRequest(new Request(`${url}?${query}`), path)).status).toBe(200);
    for (let i = 0; i < 2; i++) {
      const response = await handleCreatorExperienceRequest(new Request(`${url}?${query}`), path);
      expect(response.status).toBe(502); expect(await response.text()).not.toContain("private-value");
    }
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("streams only same-origin scoped content and cannot use a supplied path", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "video/mp4", "Content-Length": "3" } }));
    const content = `${url}/content?${query}&mediaJobRef=job-test&sha256=${"b".repeat(64)}`;
    const response = await handleCreatorExperienceRequest(new Request(content), [...path, "content"]);
    expect(response.status).toBe(200); expect(response.headers.get("Content-Type")).toBe("video/mp4");
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([1, 2, 3]);
    expect((await handleCreatorExperienceRequest(new Request(`${content}&internalPath=forged`), [...path, "content"])).status).toBe(400);
    expect(fetch).toHaveBeenCalledOnce();
  });
  it.each([403, 404, 409, 503])("preserves Core %i without retrying", async status => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: false, error: { code: "generation_not_restartable", message: "不允许重试" } }, { status }));
    const response = await handleCreatorExperienceRequest(post(command), path);
    expect(response.status).toBe(status); expect(fetch).toHaveBeenCalledOnce();
    expect(await response.json()).toMatchObject({ error: { code: "generation_not_restartable" } });
  });
});
