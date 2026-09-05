import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorClientError } from "@/features/core-integration";
import { useScriptWorkspaceV3 } from "./use-script-workspace-v3";
import { deferred, scriptFixture } from "./script-workspace-test-fixtures";

const core = vi.hoisted(() => ({ request: vi.fn(), refresh: vi.fn(), connection: { status: "connected" } }));
vi.mock("@/features/core-integration", async () => ({
  ...await vi.importActual<typeof import("@/features/core-integration")>("@/features/core-integration"),
  creatorRequest: core.request, useCreatorIntegration: () => ({ state: core.connection, refresh: core.refresh }),
}));

describe("Script workspace state integrity", () => {
  beforeEach(() => { core.request.mockReset(); });

  it("F1 preserves typing C after saving snapshot B and reading B back", async () => {
    const fixture = scriptFixture();
    let saved = fixture.workspace();
    const post = deferred<{ ok: true; script: typeof saved.script }>();
    core.request.mockImplementation(async (path: string) => {
      if (path.startsWith("projects/")) return { project: fixture.project };
      if (path.startsWith("series/")) return { series: fixture.series };
      if (path.startsWith("script-workspaces?")) return { workspace: saved };
      if (path === "script-versions/manual") return post.promise;
      throw new Error(path);
    });
    const { result } = renderHook(() => useScriptWorkspaceV3("project-a"));
    await waitFor(() => expect(result.current.synopsis).toBe("A"));
    act(() => result.current.setSynopsis("B"));
    let saving!: Promise<boolean>;
    act(() => { saving = result.current.saveManualVersion(); });
    act(() => result.current.setSynopsis("C"));
    saved = fixture.workspace("B", 2);
    await act(async () => { post.resolve({ ok: true, script: saved.script }); await saving; });
    await waitFor(() => expect(result.current.latest?.versionNumber).toBe(2));
    expect(result.current.synopsis).toBe("C");
    expect(result.current.dirty).toBe(true);
  });
});

const fixtures = [scriptFixture(), scriptFixture("project-b", "episode-b")];
function installBackend() {
  const versions = new Map(fixtures.flatMap((fixture) => fixture.series.episodes.map((episode) => [
    episode.episodeRef, scriptFixture(fixture.project.projectRef, episode.episodeRef).workspace(episode.episodeRef === "episode-a" ? "A" : episode.title),
  ] as const)));
  const implementation = async (path: string, init?: { signal?: AbortSignal; body?: { episodeRef?: string; content?: { synopsis: string } } }) => {
    if (path.startsWith("projects/")) return { project: fixtures.find((fixture) => path.endsWith(fixture.project.projectRef))!.project };
    if (path.startsWith("series/")) return { series: fixtures.find((fixture) => path.endsWith(fixture.series.seriesRef))!.series };
    if (path.startsWith("script-workspaces?")) return { workspace: versions.get(new URLSearchParams(path.split("?")[1]).get("episodeRef")!) };
    if (path === "script-versions/manual") {
      const episodeRef = init!.body!.episodeRef!;
      const fixture = fixtures.find((item) => item.series.episodes.some((episode) => episode.episodeRef === episodeRef))!;
      const saved = scriptFixture(fixture.project.projectRef, episodeRef).workspace(init!.body!.content!.synopsis, 2);
      versions.set(episodeRef, saved);
      return { ok: true, script: saved.script };
    }
    if (path === "script-versions/confirm") return { ok: true };
    throw new Error(path);
  };
  core.request.mockImplementation(implementation);
  return { versions, implementation };
}
async function readyScript() {
  const hook = renderHook(({ projectRef }) => useScriptWorkspaceV3(projectRef), { initialProps: { projectRef: "project-a" } });
  await waitFor(() => expect(hook.result.current.synopsis).toBe("A"));
  return hook;
}

describe("Script save, read and confirmation boundaries", () => {
  beforeEach(() => { core.request.mockReset(); });

  it("updates the saved baseline without further typing and permits confirmation", async () => {
    installBackend();
    const { result } = await readyScript();
    act(() => result.current.setSynopsis("  B  "));
    let saved: boolean | undefined;
    await act(async () => { saved = await result.current.saveManualVersion(); });
    expect(saved).toBe(true);
    expect(result.current.savedBaseline).toBe("B"); expect(result.current.synopsis).toBe("B");
    expect(result.current.dirty).toBe(false); expect(result.current.canConfirm).toBe(true);
    await act(async () => { await result.current.confirmVersion(); });
    const body = core.request.mock.calls.find(([path]) => path === "script-versions/confirm")![1].body;
    expect(body.scriptVersionRef).toBe("version-episode-a-2");
  });

  it("preserves a failed save, baseline, draft revision and persistent error", async () => {
    const backend = installBackend();
    core.request.mockImplementation((path, init) => path === "script-versions/manual"
      ? Promise.reject(new CreatorClientError(409, { code: "conflict", message: "修订冲突" })) : backend.implementation(path, init));
    const { result } = await readyScript();
    act(() => result.current.setSynopsis("B"));
    const revision = result.current.draftRevision;
    await act(async () => { expect(await result.current.saveManualVersion()).toBe(false); });
    expect(result.current.synopsis).toBe("B"); expect(result.current.savedBaseline).toBe("A");
    expect(result.current.dirty).toBe(true); expect(result.current.draftRevision).toBe(revision);
    expect(result.current.latest?.versionNumber).toBe(1); expect(result.current.operationError?.message).toBe("修订冲突");
  });

  it("keeps the editor and guard dirty throughout POST and GET and discards to the saved snapshot", async () => {
    const backend = installBackend();
    const post = deferred<unknown>(); const read = deferred<unknown>();
    let saving = false;
    core.request.mockImplementation((path, init) => {
      if (path === "script-versions/manual") { saving = true; return post.promise; }
      if (saving && path.startsWith("script-workspaces?")) return read.promise;
      return backend.implementation(path, init);
    });
    const { result } = await readyScript();
    act(() => result.current.setSynopsis("B"));
    let request!: Promise<boolean>;
    act(() => { request = result.current.saveManualVersion(); });
    expect(result.current.canConfirm).toBe(false);
    await act(async () => { post.resolve({ ok: true }); });
    expect(result.current.operation).toBe("saving"); expect(result.current.canConfirm).toBe(false);
    act(() => result.current.setSynopsis("C"));
    await act(async () => { read.resolve({ workspace: fixtures[0].workspace("B", 2) }); expect(await request).toBe(false); });
    expect(result.current.synopsis).toBe("C"); expect(result.current.savedBaseline).toBe("B");
    expect(result.current.operationMessage).toBe("保存期间还有新的未保存修改。");
    expect(result.current.canConfirm).toBe(false);
    act(() => result.current.discardDraft());
    expect(result.current.synopsis).toBe("B"); expect(result.current.dirty).toBe(false);
  });

  it.each(["project", "episode"] as const)("rejects a delayed old %s save read and stale confirmation callback", async (kind) => {
    const backend = installBackend(); const oldRead = deferred<unknown>();
    let posted = false; let oldSignal: AbortSignal | undefined;
    core.request.mockImplementation((path, init) => {
      if (path === "script-versions/manual") { posted = true; return Promise.resolve({ ok: true }); }
      if (posted && path.includes("episodeRef=episode-a") && !path.includes("episode-a-next")) { oldSignal = init.signal; return oldRead.promise; }
      return backend.implementation(path, init);
    });
    const { result, rerender } = await readyScript();
    const oldConfirm = result.current.confirmVersion;
    act(() => result.current.setSynopsis("B"));
    let request!: Promise<boolean>;
    act(() => { request = result.current.saveManualVersion(); });
    await waitFor(() => expect(oldSignal).toBeDefined());
    if (kind === "project") rerender({ projectRef: "project-b" });
    else act(() => result.current.selectEpisode("episode-a-next"));
    const newDraft = kind === "project" ? "episode-b" : "episode-a-next";
    await waitFor(() => expect(result.current.synopsis).toBe(newDraft));
    expect(oldSignal!.aborted).toBe(true);
    await act(async () => { oldRead.resolve({ workspace: fixtures[0].workspace("B", 2) }); expect(await request).toBe(false); });
    expect(result.current.synopsis).toBe(newDraft); expect(result.current.savedBaseline).toBe(newDraft);
    await act(async () => { expect(await oldConfirm()).toBe(false); });
    expect(core.request.mock.calls.filter(([path]) => path === "script-versions/confirm")).toHaveLength(0);
  });

  it.each(["project", "episode"] as const)("rejects an old %s refresh read without copying its draft", async (kind) => {
    const backend = installBackend(); const oldRead = deferred<unknown>(); let delaying = false;
    core.request.mockImplementation((path, init) => delaying && path.includes("episodeRef=episode-a") && !path.includes("episode-a-next")
      ? oldRead.promise : backend.implementation(path, init));
    const { result, rerender } = await readyScript();
    act(() => result.current.setSynopsis("unsaved A"));
    delaying = true;
    act(() => result.current.refresh());
    await waitFor(() => expect(core.request.mock.calls.filter(([path]) => path.includes("episodeRef=episode-a"))).toHaveLength(2));
    if (kind === "project") rerender({ projectRef: "project-b" });
    else act(() => result.current.selectEpisode("episode-a-next"));
    const newDraft = kind === "project" ? "episode-b" : "episode-a-next";
    await waitFor(() => expect(result.current.synopsis).toBe(newDraft));
    await act(async () => { oldRead.resolve({ workspace: fixtures[0].workspace("old late", 3) }); });
    expect(result.current.synopsis).toBe(newDraft); expect(result.current.dirty).toBe(false);
  });

  it("keeps a same-version refresh draft but initializes a genuinely different server version", async () => {
    const backend = installBackend(); const { result } = await readyScript();
    act(() => result.current.setSynopsis("unsaved"));
    act(() => result.current.refresh());
    await waitFor(() => expect(core.request.mock.calls.filter(([path]) => path.startsWith("script-workspaces?"))).toHaveLength(2));
    expect(result.current.synopsis).toBe("unsaved"); expect(result.current.savedBaseline).toBe("A");
    backend.versions.set("episode-a", fixtures[0].workspace("new server version", 2));
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.latest?.versionNumber).toBe(2));
    expect(result.current.synopsis).toBe("new server version"); expect(result.current.dirty).toBe(false);
  });

  it("rejects a read that does not verify the saved snapshot", async () => {
    const backend = installBackend();
    core.request.mockImplementation((path, init) => path === "script-versions/manual" ? Promise.resolve({ ok: true }) : backend.implementation(path, init));
    const { result } = await readyScript();
    act(() => result.current.setSynopsis("B"));
    await act(async () => { expect(await result.current.saveManualVersion()).toBe(false); });
    expect(result.current.synopsis).toBe("B"); expect(result.current.savedBaseline).toBe("A");
    expect(result.current.operationError).not.toBeNull(); expect(result.current.dirty).toBe(true);
  });

  it("aborts a pending save on unmount and issues no later read", async () => {
    const backend = installBackend(); const post = deferred<unknown>(); let signal!: AbortSignal;
    core.request.mockImplementation((path, init) => {
      if (path === "script-versions/manual") { signal = init.signal; return post.promise; }
      return backend.implementation(path, init);
    });
    const { result, unmount } = await readyScript();
    act(() => result.current.setSynopsis("B"));
    let saving!: Promise<boolean>;
    act(() => { saving = result.current.saveManualVersion(); });
    unmount(); expect(signal.aborted).toBe(true);
    const count = core.request.mock.calls.length;
    await act(async () => { post.resolve({ ok: true }); expect(await saving).toBe(false); });
    expect(core.request).toHaveBeenCalledTimes(count);
  });
});
