import { isScriptSynopsisDirty } from "./script-unsaved-guard";

export type ScriptDraftState = {
  scopeKey: string | null;
  scriptVersionRef: string | null;
  currentDraft: string;
  savedBaseline: string;
  draftRevision: number;
};

export type ScriptSaveSnapshot = {
  saveScopeKey: string;
  scriptVersionRef: string;
  saveSnapshot: string;
  saveDraftRevision: number;
};

export function initialScriptDraft(scopeKey: string | null = null, scriptVersionRef: string | null = null, synopsis = ""): ScriptDraftState {
  return { scopeKey, scriptVersionRef, currentDraft: synopsis, savedBaseline: synopsis, draftRevision: 0 };
}

export function editScriptDraft(draft: ScriptDraftState, currentDraft: string): ScriptDraftState {
  return { ...draft, currentDraft, draftRevision: draft.draftRevision + 1 };
}

export function captureScriptSave(draft: ScriptDraftState): ScriptSaveSnapshot | null {
  if (!draft.scopeKey || !draft.scriptVersionRef) return null;
  return { saveScopeKey: draft.scopeKey, scriptVersionRef: draft.scriptVersionRef,
    saveSnapshot: draft.currentDraft.trim(), saveDraftRevision: draft.draftRevision };
}

export function applySavedScript(draft: ScriptDraftState, snapshot: ScriptSaveSnapshot, scriptVersionRef: string, savedSynopsis: string): ScriptDraftState {
  if (draft.scopeKey !== snapshot.saveScopeKey || draft.scriptVersionRef !== snapshot.scriptVersionRef) return draft;
  return { ...draft, scriptVersionRef, savedBaseline: savedSynopsis,
    currentDraft: draft.draftRevision === snapshot.saveDraftRevision ? savedSynopsis : draft.currentDraft };
}

export function scriptDraftDirty(draft: ScriptDraftState) {
  return isScriptSynopsisDirty(draft.currentDraft, draft.savedBaseline);
}
