import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCreatorExperienceRequest } from "./experience-adapter";

function coreResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

describe("Creator Experience Adapter", () => {
  let runtimeToken: string;

  beforeEach(() => {
    runtimeToken = randomBytes(32).toString("base64url");
    vi.stubEnv("CREATOR_CORE_TOKEN", runtimeToken);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("keeps the Core origin and credential-owned workspace scope on the server", async () => {
    vi.stubEnv("CREATOR_CORE_BASE_URL", "http://core.test:8765/");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(coreResponse({ ok: true, projects: [] }));

    const response = await handleCreatorExperienceRequest(
      new Request(
        "http://frontend.test/api/creator/projects?workspaceRef=forged&status=active",
      ),
      ["projects"],
    );

    expect(response.status).toBe(200);
    const target = new URL(String(fetchMock.mock.calls[0][0]));
    expect(target.origin).toBe("http://core.test:8765");
    expect(target.pathname).toBe("/creator/api/v1/projects");
    expect(target.searchParams.has("workspaceRef")).toBe(false);
    expect(target.searchParams.get("status")).toBe("active");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${runtimeToken}`);
    const responseText = JSON.stringify(await response.json());
    expect(responseText).not.toContain("core.test");
    expect(responseText).not.toContain(runtimeToken);
  });

  it("removes browser scope claims and injects only the server content profile", async () => {
    vi.stubEnv("CREATOR_CONTENT_PROFILE_REF", "profile-server");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      coreResponse({
        ok: true,
        project: { projectRef: "project-core" },
      }, 201),
    );

    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceRef: "workspace-forged",
          contentProfileRef: "profile-forged",
          tenantId: "tenant-forged",
          title: "可信项目",
          projectType: "series",
          seriesRef: "series-core",
        }),
      }),
      ["projects"],
    );

    expect(response.status).toBe(201);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      title: "可信项目",
      projectType: "series",
      seriesRef: "series-core",
      contentProfileRef: "profile-server",
    });
    expect(new Headers(init.headers).get("Authorization")).toBe(
      `Bearer ${runtimeToken}`,
    );
  });

  it("fails closed before contacting Core when the server credential is missing", async () => {
    vi.stubEnv("CREATOR_CORE_TOKEN", "");
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/projects"),
      ["projects"],
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "adapter_configuration_error",
        message: "Creator 连接配置无效。",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never forwards internal Core paths", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/internal/projects"),
      ["internal", "projects"],
    );
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a disconnected Core without substituting fixture data", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("connection refused"));
    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/projects"),
      ["projects"],
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: {
        code: "core_disconnected",
        message: "当前无法连接 Creator Core。",
      },
    });
  });

  it("rejects malformed browser and Core payloads", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const invalidInput = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "[]",
      }),
      ["projects"],
    );
    expect(invalidInput.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue(new Response("not-json", { status: 200 }));
    const invalidCore = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/projects"),
      ["projects"],
    );
    expect(invalidCore.status).toBe(502);
  });

  it("preserves Core product errors and response status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      coreResponse(
        {
          ok: false,
          error: { code: "version_conflict", message: "版本已更新。" },
        },
        409,
      ),
    );
    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/script-versions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptRef: "script-core" }),
      }),
      ["script-versions", "manual"],
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      ok: false,
      error: { code: "version_conflict", message: "版本已更新。" },
    });
  });

  it("allows only the bounded K2 production routes and keeps scope server-owned", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      coreResponse({ ok: true, state: "QC_READY" }, 201),
    );
    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/episode-production-runs/run-1/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "preview-run-1",
          workspaceRef: "forged-workspace",
          productionRunRef: "forged-run",
        }),
      }),
      ["episode-production-runs", "run-1", "preview"],
    );

    expect(response.status).toBe(201);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toEqual({
      idempotencyKey: "preview-run-1",
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/episode-production-runs/run-1/preview",
    );

    const rejected = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/episode-production-runs/run-1/internal"),
      ["episode-production-runs", "run-1", "internal"],
    );
    expect(rejected.status).toBe(404);
  });

  it("exposes production readiness as read-only browser state", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      coreResponse({
        ok: true,
        policyBundle: null,
        readiness: {
          state: "BLOCKED_POLICY",
          policyRecorded: false,
          rightsState: "MISSING",
          providerPolicyState: "MISSING",
          persistenceClass: "LOCAL_SQLITE_EVIDENCE",
          blockers: ["production_policy_missing"],
          publicationAllowed: false,
        },
      }),
    );

    const getResponse = await handleCreatorExperienceRequest(
      new Request(
        "http://frontend.test/api/creator/episode-production-runs/run-1/production-readiness?workspaceRef=forged",
      ),
      ["episode-production-runs", "run-1", "production-readiness"],
    );
    expect(getResponse.status).toBe(200);
    const getTarget = new URL(String(fetchMock.mock.calls[0][0]));
    expect(getTarget.pathname).toBe(
      "/creator/api/v1/episode-production-runs/run-1/production-readiness",
    );
    expect(getTarget.searchParams.has("workspaceRef")).toBe(false);

    const postResponse = await handleCreatorExperienceRequest(
      new Request(
        "http://frontend.test/api/creator/episode-production-runs/run-1/production-readiness",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productionRunRef: "forged-run",
            workspaceRef: "forged-workspace",
            idempotencyKey: "policy-run-1",
            actorRef: "actor-authority",
            productionPolicy: {},
            rightsManifest: {},
            providerExecutionPolicy: {},
          }),
        },
      ),
      ["episode-production-runs", "run-1", "production-readiness"],
    );
    expect(postResponse.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("streams authenticated preview and export bytes without exposing credentials", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Uint8Array([0, 1, 2, 3]), {
        status: 200,
        headers: {
          "Content-Type": "video/mp4",
          "Content-Length": "4",
          "Content-Disposition": 'inline; filename="preview.mp4"',
        },
      }),
    );
    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/episode-production-runs/run-1/preview/content"),
      ["episode-production-runs", "run-1", "preview", "content"],
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("video/mp4");
    expect(response.headers.get("content-disposition")).toContain("inline");
    expect(response.headers.get("x-creator-data-origin")).toBe("CORE");
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([0, 1, 2, 3]);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe(`Bearer ${runtimeToken}`);
    expect(JSON.stringify([...response.headers])).not.toContain(runtimeToken);
  });

  it.each([
    [401, "authentication_required", "Creator API authentication is required."],
    [403, "authority_unavailable", "Required external authority is unavailable."],
  ] as const)(
    "preserves Core %i %s without collapsing authentication and authority failures",
    async (status, code, message) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        coreResponse({ ok: false, error: { code, message } }, status),
      );

      const response = await handleCreatorExperienceRequest(
        new Request("http://frontend.test/api/creator/projects"),
        ["projects"],
      );

      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({
        ok: false,
        error: { code, message },
      });
    },
  );
});
