import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const scope = { projectRef: "project-one", seriesRef: "series-one", episodeRef: "episode-one", productionRunRef: "run-one" };
const environment = { schemaVersion: "creator.runtime-environment.v1", ...scope, observedAt: "2026-09-15T10:00:00Z", core: "CONNECTED", operator: "READY", gpu: "CONNECTED", comfyui: "CONNECTED", queue: { state: "IDLE", runningCount: 0, pendingCount: 0 }, readOnly: true };
const url = `http://frontend.test/api/creator/runtime-environment?${new URLSearchParams(scope)}`;

beforeEach(() => {
  vi.stubEnv("CREATOR_CORE_TOKEN", "fixture-only-server-token");
  vi.stubEnv("CREATOR_CORE_BASE_URL", "http://core.test:8765");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("runtime environment read-only BFF route", () => {
  it("forwards the exact scope with server-only credentials and returns a closed projection", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ ok: true, environment }));
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, environment });
    expect(String(fetch.mock.calls[0][0])).toBe("http://core.test:8765/creator/api/v1/episode-production-runs/run-one/image-video-generations/runtime-environment?projectRef=project-one&seriesRef=series-one&episodeRef=episode-one");
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get("authorization")).toBe("Bearer fixture-only-server-token");
  });

  it("rejects forged scope and closes invalid or oversized Core responses", async () => {
    const fetch = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ ok: true, environment: { ...environment, endpoint: "http://private" } }))
      .mockResolvedValueOnce(new Response("x".repeat(64_001)));
    expect((await GET(new Request(`${url}&workspaceRef=forged`))).status).toBe(400);
    expect((await GET(new Request(url))).status).toBe(502);
    expect((await GET(new Request(url))).status).toBe(502);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
