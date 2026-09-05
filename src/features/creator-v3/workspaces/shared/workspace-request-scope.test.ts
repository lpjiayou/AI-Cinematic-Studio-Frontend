import { describe, expect, it } from "vitest";
import { WorkspaceRequestScope } from "./workspace-request-scope";

describe("workspace request identity", () => {
  it("invalidates an old request even after switching A to B and back to A", () => {
    const scope = new WorkspaceRequestScope();
    scope.activate("A"); scope.bind("A/series");
    const request = scope.beginMutation("A", "A/series")!;
    scope.activate("B"); scope.bind("B/series");
    scope.activate("A"); scope.bind("A/series");
    expect(request.signal.aborted).toBe(true); expect(request.current()).toBe(false);
    expect(scope.beginMutation("A", "A/series")?.current()).toBe(true);
  });
  it("prevents overlapping mutations or writes before the scope read finishes", () => {
    const scope = new WorkspaceRequestScope(); scope.activate("A");
    const read = scope.beginRead(); scope.bind("A/series");
    expect(scope.beginMutation("A", "A/series")).toBeNull();
    read.finish();
    const mutation = scope.beginMutation("A", "A/series")!;
    expect(scope.beginMutation("A", "A/series")).toBeNull();
    mutation.finish(); expect(scope.beginMutation("B", "A/series")).toBeNull();
  });
  it("keeps a same-scope mutation current during refresh but rejects it when the resolved Series changes", () => {
    const scope = new WorkspaceRequestScope(); scope.activate("A"); scope.bind("A/one");
    const mutation = scope.beginMutation("A", "A/one")!;
    const read = scope.beginRead();
    expect(scope.bind("A/one")).toBe(false); expect(mutation.current()).toBe(true);
    expect(scope.bind("A/two")).toBe(true); expect(mutation.current()).toBe(false);
    expect(mutation.signal.aborted).toBe(true); expect(read.current()).toBe(true);
  });
  it("rejects superseded reads and never lets their completion unlock a newer read", () => {
    const scope = new WorkspaceRequestScope(); scope.activate("A"); scope.bind("A/series");
    const first = scope.beginRead(); const second = scope.beginRead();
    first.finish(); expect(first.current()).toBe(false); expect(second.current()).toBe(true);
    expect(scope.beginMutation("A", "A/series")).toBeNull();
    scope.dispose(); expect(second.signal.aborted).toBe(true); expect(second.current()).toBe(false);
  });
});
