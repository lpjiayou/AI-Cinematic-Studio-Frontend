import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCreatorExperienceRequest } from "./experience-adapter";

function coreResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

describe("Creator Experience Adapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("keeps the Core origin and workspace scope on the server", async () => {
    vi.stubEnv("CREATOR_CORE_BASE_URL", "http://core.test:8765/");
    vi.stubEnv("CREATOR_WORKSPACE_REF", "workspace-authoritative");
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
    expect(target.searchParams.get("workspaceRef")).toBe("workspace-authoritative");
    expect(target.searchParams.get("status")).toBe("active");
    expect(JSON.stringify(await response.json())).not.toContain("core.test");
  });

  it("injects trusted scope and removes browser scope claims from commands", async () => {
    vi.stubEnv("CREATOR_WORKSPACE_REF", "workspace-server");
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
      workspaceRef: "workspace-server",
      contentProfileRef: "profile-server",
    });
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
});
