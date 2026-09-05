import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleCreatorExperienceRequest } from "./experience-adapter";
import { METHOD_AWARE_RESOURCES } from "./method-aware-contracts";
import { audioFixture, commandScope, executionCommand, executionFixture, inputCommand, inputFixture, videoFixture } from "./method-aware-test-fixtures";

function coreResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

describe("Method-aware closed Adapter", () => {
  const values = [executionFixture, inputFixture, videoFixture, audioFixture];
  const commands = () => [executionCommand(), inputCommand(), { ...commandScope }, { ...commandScope, audioRequirementRef: "audio-silence" }];
  const query = "projectRef=project-test&seriesRef=series-test&episodeRef=episode-test";
  const url = (resource: string) => `http://frontend.test/api/creator/episode-production-runs/run-test/${resource}`;
  beforeEach(() => { vi.stubEnv("CREATOR_CORE_TOKEN", "test-only-token"); vi.stubEnv("CREATOR_CORE_BASE_URL", "http://core.test:8765"); });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  for (const [i, resource] of METHOD_AWARE_RESOURCES.entries()) {
    it(`${resource}: allows GET with only the closed scope and optional version`, async () => {
      const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(coreResponse(values[i]()));
      const response = await handleCreatorExperienceRequest(new Request(`${url(resource)}?${query}&versionRef=version-test&workspaceRef=forged&productionRunRef=forged&tenantId=forged&contentProfileRef=forged`), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(200); expect(mock).toHaveBeenCalledOnce();
      expect(String(mock.mock.calls[0][0])).toBe(`http://core.test:8765/creator/api/v1/episode-production-runs/run-test/${resource}?${query}&versionRef=version-test`);
      const init = mock.mock.calls[0][1];
      expect(init).toMatchObject({ method: "GET", cache: "no-store" });
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-only-token");
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toEqual(values[i]());
    });
    it(`${resource}: strips forged POST scope and forwards the exact public command`, async () => {
      const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(coreResponse(values[i](), 201));
      const body = { ...commands()[i], workspaceRef: "forged", productionRunRef: "forged", tenantId: "forged", contentProfileRef: "forged" };
      const response = await handleCreatorExperienceRequest(new Request(url(resource), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(201); expect(mock).toHaveBeenCalledOnce();
      expect(JSON.parse(String(mock.mock.calls[0][1]?.body))).toEqual(commands()[i]);
      expect(mock.mock.calls[0][1]?.method).toBe("POST");
    });
    for (const method of ["PUT", "PATCH", "DELETE", "HEAD", "CUSTOM"]) it(`${resource}: rejects ${method} with 404 before Core`, async () => {
      const mock = vi.spyOn(globalThis, "fetch");
      const response = await handleCreatorExperienceRequest(new Request(url(resource), { method }), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(404); expect(await response.json()).toMatchObject({ error: { code: "not_found" } }); expect(mock).not.toHaveBeenCalled();
    });
    for (const suffix of ["&unknown=value", "&executionMethod=forged", "&executionClass=forged", "&provider=forged", "&adapterCapability=forged", "&authorityDigest=forged", "&localPath=forged", "&projectRef=duplicate", "&versionRef="]) it(`${resource}: rejects query ${suffix} before Core`, async () => {
      const mock = vi.spyOn(globalThis, "fetch");
      const response = await handleCreatorExperienceRequest(new Request(`${url(resource)}?${query}${suffix}`), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } }); expect(mock).not.toHaveBeenCalled();
    });
    for (const field of ["executionMethod", "executionClass", "provider", "adapterCapability", "adapterIdentity", "authorityDigest", "publicationAllowed", "fallbackPolicy", "assetVersionDigest", "rightsBinding", "voiceAssetVersion", "storageKey", "internalPath", "unknown"]) it(`${resource}: rejects POST ${field} before Core`, async () => {
      const mock = vi.spyOn(globalThis, "fetch");
      const response = await handleCreatorExperienceRequest(new Request(url(resource), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...commands()[i], [field]: "forged" }) }), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } }); expect(mock).not.toHaveBeenCalled();
    });
    for (const status of [404, 409, 503]) it(`${resource}: preserves Core ${status} and code`, async () => {
      const error = { ok: false, error: { code: "core-specific-error", message: "Core 拒绝" } };
      const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(coreResponse(error, status));
      const response = await handleCreatorExperienceRequest(new Request(`${url(resource)}?${query}`), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(status); expect(await response.json()).toEqual(error); expect(mock).toHaveBeenCalledOnce();
    });
    it(`${resource}: rejects malformed or private success data before returning it to the browser`, async () => {
      const mock = vi.spyOn(globalThis, "fetch").mockResolvedValue(coreResponse({ ...values[i](), secret: "server-private" }));
      const response = await handleCreatorExperienceRequest(new Request(`${url(resource)}?${query}`), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(502); const payload = await response.json();
      expect(payload).toMatchObject({ error: { code: "invalid_method_aware_response" } }); expect(JSON.stringify(payload)).not.toContain("server-private"); expect(mock).toHaveBeenCalledOnce();
    });
  }
  it("keeps the four-resource set closed", async () => {
    const mock = vi.spyOn(globalThis, "fetch");
    for (const resource of ["provider-experiments", "dynamic-media-preflight", "real-media-revision", "real-video-revision", "reviewed-import", "canonical-registrations", "timeline", "render-candidates"]) {
      for (const method of ["GET", "POST"]) {
        const response = await handleCreatorExperienceRequest(new Request(url(resource), { method }), ["episode-production-runs", "run-test", resource]); expect(response.status).toBe(404);
      }
    }
    expect(mock).not.toHaveBeenCalled();
  });
  it("rejects nested digest and unknown shape claims, including incomplete speech source spans", async () => {
    const input = inputCommand(); Object.assign(input.assetBindings[0], { assetVersionDigest: "forged" });
    const badCamera = executionCommand(); Object.assign(badCamera.shots[0].cameraInstruction, { provider: "forged" });
    const badBeat = executionCommand(); Object.assign(badBeat.shots[0].actionExecutionBeats[0].sourceSpan, { unknown: "forged" });
    const badAudio = executionCommand(); Reflect.deleteProperty(badAudio.shots[0].audioIntents[0], "sourceSpan");
    const wrongField = executionCommand(); const audio = wrongField.shots[0].audioIntents[0];
    if (audio.audioType === "DIALOGUE") Object.assign(audio.sourceSpan, { sourceField: "NARRATION" });
    const mock = vi.spyOn(globalThis, "fetch");
    for (const [resource, command] of [["method-aware-input-plan", input], ...[badCamera, badBeat, badAudio, wrongField].map((command) => ["execution-method-plan", command] as const)] as const) {
      const response = await handleCreatorExperienceRequest(new Request(url(resource), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) }), ["episode-production-runs", "run-test", resource]);
      expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } });
    }
    expect(mock).not.toHaveBeenCalled();
  });
  it("requires a nonempty deterministic key and rejects it on every other execution class", async () => {
    const mutations: ((body: ReturnType<typeof executionCommand>) => void)[] = [
      (body) => { Reflect.deleteProperty(body.shots[0].actionExecutionBeats[4], "postprocessRequirementKey"); },
      (body) => { Object.assign(body.shots[0].actionExecutionBeats[4], { postprocessRequirementKey: "" }); },
      ...[0, 1, 2, 3].map((i) => (body: ReturnType<typeof executionCommand>) => { Object.assign(body.shots[0].actionExecutionBeats[i], { postprocessRequirementKey: "event-1" }); }),
    ];
    const mock = vi.spyOn(globalThis, "fetch");
    for (const mutate of mutations) {
      const command = executionCommand(); mutate(command);
      const response = await handleCreatorExperienceRequest(new Request(url("execution-method-plan"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) }), ["episode-production-runs", "run-test", "execution-method-plan"]);
      expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ error: { code: "invalid_request" } });
    }
    expect(mock).not.toHaveBeenCalled();
  });
});

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

  it("exposes the four-axis state projection as GET-only", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      coreResponse({
        ok: true,
        schemaVersion: "v5.k2-production-state-projection.v1",
        productionRunRef: "run-1",
        state: "REAL_VIDEO_PLAN_READY",
      }),
    );

    const response = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/episode-production-runs/run-1/state-projection"),
      ["episode-production-runs", "run-1", "state-projection"],
    );
    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/creator/api/v1/episode-production-runs/run-1/state-projection",
    );

    const rejected = await handleCreatorExperienceRequest(
      new Request("http://frontend.test/api/creator/episode-production-runs/run-1/state-projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotencyKey: "must-not-forward" }),
      }),
      ["episode-production-runs", "run-1", "state-projection"],
    );
    expect(rejected.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes through the bounded real-video review resources without browser scope claims", async () => {
    const resources = [
      "real-video-candidates",
      "semantic-visual-qc",
      "media-selection",
      "real-video-admission",
    ] as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_input, init) => coreResponse(
        { ok: true, state: "REAL_VIDEO_PLAN_READY" },
        init?.method === "POST" ? 201 : 200,
      ),
    );

    for (const resource of resources) {
      const path = ["episode-production-runs", "run-1", resource];
      const getResponse = await handleCreatorExperienceRequest(
        new Request(`http://frontend.test/api/creator/${path.join("/")}`),
        path,
      );
      expect(getResponse.status).toBe(200);

      const postResponse = await handleCreatorExperienceRequest(
        new Request(`http://frontend.test/api/creator/${path.join("/")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: `${resource}-v1`,
            productionRunRef: "forged-run",
            workspaceRef: "forged-workspace",
          }),
        }),
        path,
      );
      expect(postResponse.status).toBe(201);
    }

    expect(fetchMock).toHaveBeenCalledTimes(8);
    for (const [, init] of fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")) {
      expect(JSON.parse(String(init?.body))).toEqual({
        idempotencyKey: expect.any(String),
      });
    }
  });

  it("passes through the unified real-image resources without browser scope claims", async () => {
    const resources = [
      "real-image-candidates",
      "real-image-admission",
      "real-image-successor-admission",
    ] as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (_input, init) => coreResponse(
        { ok: true, state: "REAL_IMAGE_PLAN_READY" },
        init?.method === "POST" ? 201 : 200,
      ),
    );

    for (const resource of resources) {
      const path = ["episode-production-runs", "run-1", resource];
      const getResponse = await handleCreatorExperienceRequest(
        new Request(`http://frontend.test/api/creator/${path.join("/")}`),
        path,
      );
      expect(getResponse.status).toBe(200);

      const postResponse = await handleCreatorExperienceRequest(
        new Request(`http://frontend.test/api/creator/${path.join("/")}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey: `${resource}-v1`,
            productionRunRef: "forged-run",
            workspaceRef: "forged-workspace",
          }),
        }),
        path,
      );
      expect(postResponse.status).toBe(201);
    }

    expect(fetchMock).toHaveBeenCalledTimes(6);
    for (const [, init] of fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")) {
      expect(JSON.parse(String(init?.body))).toEqual({
        idempotencyKey: expect.any(String),
      });
    }
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
