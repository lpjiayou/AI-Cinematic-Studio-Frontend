import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreatorClientError, type CreatorSeriesPlanCandidate } from "@/features/core-integration";
import { useStoryWorkspaceV3 } from "./use-story-workspace-v3";

const core = vi.hoisted(() => ({ request: vi.fn(), refresh: vi.fn(), connection: { status: "connected" } }));
vi.mock("@/features/core-integration", async () => ({
  ...await vi.importActual<typeof import("@/features/core-integration")>("@/features/core-integration"),
  creatorRequest: core.request, useCreatorIntegration: () => ({ state: core.connection, refresh: core.refresh }),
}));
const candidate: CreatorSeriesPlanCandidate = {
  schemaVersion: "creator.series-plan.candidate.v1", seriesConcept: "A 的候选", premise: "测试", logline: "测试",
  mainNarrativeDirection: "测试", mainArcs: [], subArcs: [], characterArcIntents: [], episodePlanItems: [],
  narrativeRhythm: "测试", worldIntent: "测试", continuityIntent: [], foreshadowingContext: [], productionAssumptions: [],
};
function reads(path: string) {
  if (path.startsWith("projects/")) {
    const projectRef = path.slice("projects/".length);
    return { project: { projectRef, seriesRefs: [`series-${projectRef}`] } };
  }
  if (path.startsWith("series-planning-workspaces?")) return { workspace: { plan: null, versions: [] } };
  if (path.startsWith("series-intelligence-workspaces?")) return { workspace: {} };
  if (path === "series-plan-candidates") return { candidate };
  if (path === "series-plans/confirm-candidate") return { ok: true };
  throw new Error(path);
}

describe("Story frontend scope integrity", () => {
  beforeEach(() => { core.request.mockReset(); core.request.mockImplementation(async (path: string) => reads(path)); });

  it("F4 removes A's candidate on a same-component project switch to B", async () => {
    const { result, rerender } = renderHook(({ projectRef }) => useStoryWorkspaceV3(projectRef), { initialProps: { projectRef: "a" } });
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    act(() => result.current.setCreativeInput("A 项目足够长的系列创意输入"));
    await act(async () => { await result.current.generateCandidate(); });
    expect(result.current.candidate).toEqual(candidate);
    rerender({ projectRef: "b" });
    expect(result.current.candidate).toBeNull();
    expect(result.current.creativeInput).toBe("");
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.candidate).toBeNull();
    expect(result.current.creativeInput).toBe("");
    await act(async () => { await result.current.confirmCandidate(); });
    expect(core.request.mock.calls.filter(([path]) => path === "series-plans/confirm-candidate")).toHaveLength(0);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}
async function readyStory() {
  const hook = renderHook(({ projectRef }) => useStoryWorkspaceV3(projectRef), { initialProps: { projectRef: "a" } });
  await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
  return hook;
}
async function generate(hook: Awaited<ReturnType<typeof readyStory>>) {
  act(() => hook.result.current.setCreativeInput("当前项目的完整系列创意输入"));
  await act(async () => { await hook.result.current.generateCandidate(); });
}

describe("Story scoped asynchronous results", () => {
  beforeEach(() => { core.request.mockReset(); core.request.mockImplementation(async (path: string) => reads(path)); });

  it.each(["projects/", "series-planning-workspaces?", "series-intelligence-workspaces?"])("drops A's late %s response after B becomes ready", async (stage) => {
    const late = deferred<unknown>(); let oldSignal!: AbortSignal; let oldPath = "";
    core.request.mockImplementation(async (path, init) => {
      if (path.startsWith(stage) && (path === "projects/a" || path.includes("projectRef=a"))) {
        oldSignal = init.signal; oldPath = path; return late.promise;
      }
      return reads(path);
    });
    const hook = renderHook(({ projectRef }) => useStoryWorkspaceV3(projectRef), { initialProps: { projectRef: "a" } });
    await waitFor(() => expect(oldSignal).toBeDefined());
    hook.rerender({ projectRef: "b" });
    await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => { late.resolve(reads(oldPath)); });
    expect(hook.result.current.state).toMatchObject({ status: "ready", project: { projectRef: "b" }, seriesRef: "series-b" });
    expect(hook.result.current.candidate).toBeNull(); expect(hook.result.current.operationError).toBeNull();
  });

  it.each(["resolve", "reject"] as const)("drops a late A generation %s and resets operation on project change", async (outcome) => {
    const late = deferred<unknown>(); let signal!: AbortSignal;
    core.request.mockImplementation(async (path, init) => {
      if (path === "series-plan-candidates") { signal = init.signal; return late.promise; }
      return reads(path);
    });
    const hook = await readyStory();
    act(() => hook.result.current.setCreativeInput("A 的系列创意输入足够长"));
    let generating!: Promise<boolean>;
    act(() => { generating = hook.result.current.generateCandidate(); });
    hook.rerender({ projectRef: "b" });
    expect(hook.result.current.operation).toBe("idle"); expect(hook.result.current.creativeInput).toBe("");
    await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
    expect(signal.aborted).toBe(true);
    await act(async () => {
      if (outcome === "resolve") late.resolve({ candidate });
      else late.reject(new CreatorClientError(409, { code: "old_error", message: "旧范围错误" }));
      expect(await generating).toBe(false);
    });
    expect(hook.result.current.candidate).toBeNull(); expect(hook.result.current.operationError).toBeNull();
    expect(hook.result.current.operationMessage).not.toContain("旧范围");
  });

  it("keeps B's pending operation when A's confirmation finishes late", async () => {
    const lateConfirmation = deferred<unknown>(); const bGeneration = deferred<unknown>();
    core.request.mockImplementation(async (path, init) => {
      if (path === "series-plans/confirm-candidate") return lateConfirmation.promise;
      if (path === "series-plan-candidates" && init.body.projectRef === "b") return bGeneration.promise;
      return reads(path);
    });
    const hook = await readyStory(); await generate(hook);
    let confirming!: Promise<boolean>;
    act(() => { confirming = hook.result.current.confirmCandidate(); });
    hook.rerender({ projectRef: "b" });
    await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
    act(() => hook.result.current.setCreativeInput("B 的系列创意输入足够长"));
    let generating!: Promise<boolean>;
    act(() => { generating = hook.result.current.generateCandidate(); });
    const readCount = core.request.mock.calls.filter(([path]) => path.startsWith("projects/")).length;
    await act(async () => { lateConfirmation.resolve({ ok: true }); expect(await confirming).toBe(false); });
    expect(hook.result.current.operation).toBe("generating");
    expect(core.request.mock.calls.filter(([path]) => path.startsWith("projects/"))).toHaveLength(readCount);
    await act(async () => { bGeneration.resolve({ candidate: { ...candidate, seriesConcept: "B 的候选" } }); await generating; });
    expect(hook.result.current.candidate?.seriesConcept).toBe("B 的候选");
  });

  it("resets all client state on a different unique Series and rejects old callbacks", async () => {
    let seriesRef = "series-a";
    core.request.mockImplementation(async (path) => path === "projects/a" ? { project: { projectRef: "a", seriesRefs: [seriesRef] } } : reads(path));
    const hook = await readyStory(); await generate(hook);
    const oldConfirm = hook.result.current.confirmCandidate;
    const oldDiscard = hook.result.current.discardCandidate;
    seriesRef = "series-new";
    act(() => hook.result.current.refresh());
    await waitFor(() => expect(hook.result.current.state).toMatchObject({ status: "ready", seriesRef }));
    expect(hook.result.current.creativeInput).toBe(""); expect(hook.result.current.candidate).toBeNull();
    expect(hook.result.current.operation).toBe("idle"); expect(hook.result.current.operationError).toBeNull();
    await generate(hook);
    await act(async () => { expect(await oldConfirm()).toBe(false); oldDiscard(); });
    expect(hook.result.current.candidate).toEqual(candidate);
    expect(core.request.mock.calls.filter(([path]) => path === "series-plans/confirm-candidate")).toHaveLength(0);
  });

  it("invalidates an in-flight mutation when a refresh resolves another Series", async () => {
    let seriesRef = "series-a"; const late = deferred<unknown>(); let signal!: AbortSignal;
    core.request.mockImplementation(async (path, init) => {
      if (path === "projects/a") return { project: { projectRef: "a", seriesRefs: [seriesRef] } };
      if (path === "series-plan-candidates") { signal = init.signal; return late.promise; }
      return reads(path);
    });
    const hook = await readyStory();
    act(() => hook.result.current.setCreativeInput("系列创意输入足够长的内容"));
    let generating!: Promise<boolean>;
    act(() => { generating = hook.result.current.generateCandidate(); });
    seriesRef = "series-new";
    act(() => hook.result.current.refresh());
    await waitFor(() => expect(hook.result.current.state).toMatchObject({ status: "ready", seriesRef }));
    expect(signal.aborted).toBe(true);
    await act(async () => { late.resolve({ candidate }); expect(await generating).toBe(false); });
    expect(hook.result.current.candidate).toBeNull(); expect(hook.result.current.operation).toBe("idle");
  });

  it("preserves valid input and candidate through a same-scope refresh", async () => {
    const hook = await readyStory(); await generate(hook);
    const input = hook.result.current.creativeInput;
    await act(async () => { hook.result.current.refresh(); });
    expect(hook.result.current.creativeInput).toBe(input); expect(hook.result.current.candidate).toEqual(candidate);
    await act(async () => { expect(await hook.result.current.confirmCandidate()).toBe(true); });
  });

  it("only sends B refs and the unchanged public candidate payload when confirming B", async () => {
    const hook = await readyStory(); await generate(hook);
    const oldConfirm = hook.result.current.confirmCandidate;
    hook.rerender({ projectRef: "b" });
    await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
    await act(async () => { expect(await oldConfirm()).toBe(false); });
    await generate(hook);
    await act(async () => { expect(await hook.result.current.confirmCandidate()).toBe(true); });
    const confirmations = core.request.mock.calls.filter(([path]) => path === "series-plans/confirm-candidate");
    expect(confirmations).toHaveLength(1);
    expect(confirmations[0][1].body).toEqual({ projectRef: "b", seriesRef: "series-b", humanConfirmed: true, candidate });
  });

  it("invalidates a candidate when its input revision changes", async () => {
    const hook = await readyStory(); await generate(hook);
    act(() => hook.result.current.setCreativeInput("新的创意输入替代之前的内容"));
    expect(hook.result.current.candidate).toBeNull();
    await act(async () => { expect(await hook.result.current.confirmCandidate()).toBe(false); });
  });

  it("clears a failed operation's error and input on project switch", async () => {
    core.request.mockImplementation(async (path) => {
      if (path === "series-plan-candidates") throw new CreatorClientError(409, { code: "conflict", message: "A 冲突" });
      return reads(path);
    });
    const hook = await readyStory(); await generate(hook);
    expect(hook.result.current.operationError?.message).toBe("A 冲突");
    hook.rerender({ projectRef: "b" });
    expect(hook.result.current.operationError).toBeNull(); expect(hook.result.current.creativeInput).toBe("");
  });

  it.each(["read", "mutation"] as const)("aborts pending %s work on unmount", async (kind) => {
    const late = deferred<unknown>(); let signal!: AbortSignal;
    core.request.mockImplementation(async (path, init) => {
      if ((kind === "read" && path === "projects/a") || (kind === "mutation" && path === "series-plan-candidates")) {
        signal = init.signal; return late.promise;
      }
      return reads(path);
    });
    const hook = renderHook(() => useStoryWorkspaceV3("a"));
    let generating: Promise<boolean> | undefined;
    if (kind === "mutation") {
      await waitFor(() => expect(hook.result.current.state.status).toBe("ready"));
      act(() => { hook.result.current.setCreativeInput("系列创意输入足够长的内容"); });
      act(() => { generating = hook.result.current.generateCandidate(); });
    }
    await waitFor(() => expect(signal).toBeDefined());
    hook.unmount(); expect(signal.aborted).toBe(true);
    const count = core.request.mock.calls.length;
    await act(async () => { late.resolve(kind === "read" ? reads("projects/a") : { candidate }); if (generating) expect(await generating).toBe(false); });
    expect(core.request).toHaveBeenCalledTimes(count);
  });
});
