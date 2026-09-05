import { describe, expect, it, vi } from "vitest";
import {
  internalNavigationHref,
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
