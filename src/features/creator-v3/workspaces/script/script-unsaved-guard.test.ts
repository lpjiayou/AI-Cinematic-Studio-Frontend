import { describe, expect, it, vi } from "vitest";
import {
  internalNavigationHref,
  installScriptHistoryGuard,
  isScriptSynopsisDirty,
  protectScriptBeforeUnload,
} from "./script-unsaved-guard";

describe("script unsaved guard", () => {
  it("compares trimmed synopsis content", () => {
    expect(isScriptSynopsisDirty(" same ", "same")).toBe(false);
    expect(isScriptSynopsisDirty("changed", "same")).toBe(true);
  });

  it("prevents unload only while dirty", () => {
    const cleanEvent = { preventDefault: vi.fn(), returnValue: "unset" } as unknown as BeforeUnloadEvent;
    expect(protectScriptBeforeUnload(cleanEvent, false)).toBe(false);
    expect(cleanEvent.preventDefault).not.toHaveBeenCalled();

    const dirtyEvent = { preventDefault: vi.fn(), returnValue: "unset" } as unknown as BeforeUnloadEvent;
    expect(protectScriptBeforeUnload(dirtyEvent, true)).toBe(true);
    expect(dirtyEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dirtyEvent.returnValue).toBe("");
  });

  it("extracts same-origin navigation without accepting external targets", () => {
    const anchor = document.createElement("a");
    anchor.href = "http://localhost/creator/projects/p/story?tab=one#plan";
    const label = document.createElement("span");
    anchor.append(label);
    expect(internalNavigationHref(label, "http://localhost")).toBe(
      "/creator/projects/p/story?tab=one#plan",
    );

    anchor.href = "https://example.test/creator";
    expect(internalNavigationHref(label, "http://localhost")).toBeNull();
    anchor.href = "http://localhost/creator";
    anchor.target = "_blank";
    expect(internalNavigationHref(label, "http://localhost")).toBeNull();
  });
});

function historyBrowser() {
  const events = new window.EventTarget();
  const opaqueRouterState = { __NA: true, routerTree: ["opaque"] };
  const entries = [
    { state: {}, url: new URL("http://localhost/creator/projects/project-a/overview") },
    { state: opaqueRouterState, url: new URL("http://localhost/creator/projects/project-a/script") },
  ] as Array<{ state: Record<string, unknown>; url: URL }>;
  let cursor = 1;
  const history = {
    get state() { return entries[cursor].state; },
    replaceState: vi.fn((state: Record<string, unknown>, _title: string, url: string) => {
      entries[cursor] = { state, url: new URL(url, entries[cursor].url) };
    }),
    pushState: vi.fn((state: Record<string, unknown>, _title: string, url: string) => {
      entries.splice(cursor + 1); entries.push({ state, url: new URL(url, entries[cursor].url) }); cursor += 1;
    }),
    go: vi.fn((delta: number) => {
      const next = cursor + delta;
      if (next < 0 || next >= entries.length) return;
      cursor = next;
      events.dispatchEvent(new window.PopStateEvent("popstate", { state: entries[cursor].state }));
    }),
  };
  const browser = { history, get location() { return entries[cursor].url; },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) } as unknown as Window;
  return { browser, history, entries, opaqueRouterState };
}

describe("bounded Script history sentinel", () => {
  it("restores the current URL before prompting, without growing history on repeated stays", () => {
    const { browser, history, entries, opaqueRouterState } = historyBrowser();
    const request = vi.fn(() => expect(browser.location.pathname).toBe("/creator/projects/project-a/script"));
    const guard = installScriptHistoryGuard(browser, request);
    expect(history.state.routerTree).toBe(opaqueRouterState.routerTree);
    history.go(-1); history.go(-1); history.go(-1);
    expect(request).toHaveBeenCalledTimes(3); expect(entries).toHaveLength(3);
    guard.leave();
    expect(browser.location.pathname).toBe("/creator/projects/project-a/overview");
    expect(request).toHaveBeenCalledTimes(3);
  });
  it("reuses a sentinel when an effect is reattached", () => {
    const { browser, entries } = historyBrowser();
    installScriptHistoryGuard(browser, vi.fn()).dispose();
    const guard = installScriptHistoryGuard(browser, vi.fn());
    expect(entries).toHaveLength(3); guard.dispose();
  });
  it("does not prompt for a same-page hash traversal", () => {
    const { browser, history } = historyBrowser(); const request = vi.fn();
    const guard = installScriptHistoryGuard(browser, request);
    history.pushState(history.state, "", "#scene");
    history.go(-1);
    expect(request).not.toHaveBeenCalled(); guard.dispose();
  });
  it("disarms before approved back traversal so another pop cannot recurse", () => {
    const { browser, history } = historyBrowser();
    const request = vi.fn(() => guard.leave());
    const guard = installScriptHistoryGuard(browser, request);
    history.go(-1);
    expect(request).toHaveBeenCalledOnce();
    expect(history.go.mock.calls).toEqual([[-1], [-2]]);
    expect(browser.location.pathname).toBe("/creator/projects/project-a/overview");
  });
});
