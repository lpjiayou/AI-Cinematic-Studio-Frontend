import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreatorProject } from "@/features/core-integration";
import { CreatorClientError } from "@/features/core-integration";
import { useV3ProjectCollection } from "./use-v3-project-collection";

const integration = vi.hoisted(() => ({
  state: { status: "connected", capabilities: [] } as unknown,
  refresh: vi.fn(),
  request: vi.fn(),
}));

vi.mock("@/features/core-integration", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/core-integration")>();
  return {
    ...actual,
    creatorRequest: integration.request,
    useCreatorIntegration: () => ({ state: integration.state, refresh: integration.refresh }),
  };
});

function project(projectRef: string, updatedAt: string): CreatorProject {
  return {
    schemaVersion: "creator.project.v1",
    projectRef,
    projectType: "SERIES",
    title: `Project ${projectRef}`,
    description: "Description",
    targetPlatform: "Streaming",
    aspectRatio: "16:9",
    defaultDurationSec: 60,
    plannedEpisodeCount: 8,
    status: "ACTIVE",
    seriesRefs: [],
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt,
    version: 1,
  };
}

describe("useV3ProjectCollection", () => {
  beforeEach(() => {
    integration.state = { status: "connected", capabilities: [] };
    integration.refresh.mockReset();
    integration.request.mockReset();
  });

  it("reports loading while the connected collection request is pending", async () => {
    integration.request.mockReturnValue(new Promise(() => undefined));
    const { result, unmount } = renderHook(() => useV3ProjectCollection());
    await waitFor(() => expect(result.current.state.status).toBe("loading"));
    unmount();
  });

  it("returns real projects sorted locally by updatedAt descending", async () => {
    integration.request.mockResolvedValue({
      ok: true,
      projects: [
        project("older", "2026-09-01T00:00:00Z"),
        project("newer", "2026-09-03T00:00:00Z"),
      ],
    });
    const { result } = renderHook(() => useV3ProjectCollection());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    if (result.current.state.status !== "ready") throw new Error("ready state expected");
    expect(result.current.state.projects.map((item) => item.projectRef)).toEqual(["newer", "older"]);
    expect(integration.request).toHaveBeenCalledWith("projects", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("keeps an empty Core response distinct", async () => {
    integration.request.mockResolvedValue({ ok: true, projects: [] });
    const { result } = renderHook(() => useV3ProjectCollection());
    await waitFor(() => expect(result.current.state).toEqual({ status: "empty" }));
  });

  it("keeps a disconnected Provider state distinct without requesting fixtures", () => {
    integration.state = {
      status: "disconnected",
      error: { code: "core_disconnected", message: "Core disconnected" },
    };
    const { result } = renderHook(() => useV3ProjectCollection());
    expect(result.current.state).toEqual({
      status: "disconnected",
      error: { code: "core_disconnected", message: "Core disconnected" },
    });
    expect(integration.request).not.toHaveBeenCalled();
  });

  it("preserves parsed Creator errors and contract mismatches as error states", async () => {
    integration.request.mockRejectedValueOnce(new CreatorClientError(502, {
      code: "upstream_error",
      message: "Project read failed",
    }));
    const first = renderHook(() => useV3ProjectCollection());
    await waitFor(() => expect(first.result.current.state).toMatchObject({ status: "error", error: { code: "upstream_error" } }));
    first.unmount();

    integration.request.mockResolvedValueOnce({ ok: true, projects: [{ title: "partial" }] });
    const second = renderHook(() => useV3ProjectCollection());
    await waitFor(() => expect(second.result.current.state).toMatchObject({ status: "error", error: { code: "project_collection_contract_mismatch" } }));
  });

  it("aborts the collection request during cleanup", async () => {
    let requestSignal: AbortSignal | undefined;
    integration.request.mockImplementation((_path: string, init: { signal: AbortSignal }) => {
      requestSignal = init.signal;
      return new Promise(() => undefined);
    });
    const { unmount } = renderHook(() => useV3ProjectCollection());
    await waitFor(() => expect(requestSignal).toBeDefined());
    unmount();
    expect(requestSignal?.aborted).toBe(true);
  });
});
