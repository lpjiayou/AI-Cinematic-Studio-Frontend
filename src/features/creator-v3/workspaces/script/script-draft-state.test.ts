import { describe, expect, it } from "vitest";
import { applySavedScript, captureScriptSave, editScriptDraft, initialScriptDraft, scriptDraftDirty } from "./script-draft-state";

describe("Script draft and saved baseline", () => {
  it("captures an immutable normalized snapshot and an exact edit revision", () => {
    const draft = editScriptDraft(initialScriptDraft("scope-a", "v1", "A"), " B ");
    expect(captureScriptSave(draft)).toEqual({ saveScopeKey: "scope-a", scriptVersionRef: "v1", saveSnapshot: "B", saveDraftRevision: 1 });
    expect(scriptDraftDirty(editScriptDraft(draft, " A "))).toBe(false);
  });
  it("preserves newer typing while moving only the saved baseline", () => {
    const submitted = editScriptDraft(initialScriptDraft("scope-a", "v1", "A"), "B");
    const result = applySavedScript(editScriptDraft(submitted, "C"), captureScriptSave(submitted)!, "v2", "B");
    expect(result.currentDraft).toBe("C"); expect(result.savedBaseline).toBe("B"); expect(scriptDraftDirty(result)).toBe(true);
  });
  it.each([["scope-b", "v1"], ["scope-a", "other-version"]])("rejects a save from another scope or version: %s %s", (scopeKey, version) => {
    const submitted = editScriptDraft(initialScriptDraft("scope-a", "v1", "A"), "B");
    const current = initialScriptDraft(scopeKey, version, "keep");
    expect(applySavedScript(current, captureScriptSave(submitted)!, "v2", "B")).toBe(current);
  });
});
