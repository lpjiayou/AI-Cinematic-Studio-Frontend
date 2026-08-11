export type UISceneKey = string;
export type UIBlockKey = string;
export type CandidateId = string;
export type LocalSnapshotId = string;
export type FindingId = string;

export type ScriptStudioConnectionMode = "presentation-local" | "m3-connected";

export type ScriptStudioLoadState = "initial" | "loading" | "empty" | "ready";
export type ScriptWorkingBufferState = "clean" | "editing" | "unsaved-changes";
export type ScriptCandidateOperationState =
  | "idle"
  | "candidate-loading"
  | "candidate-ready"
  | "candidate-error"
  | "candidate-adopted"
  | "candidate-stale";

export type ScriptCompareState =
  | { status: "compare-closed" }
  | { status: "compare-open"; candidateId: CandidateId };

export type ScriptStudioPresentationErrorCode =
  | "SCRIPT_UNAVAILABLE"
  | "INVALID_SELECTION"
  | "LOCAL_EDIT_ERROR"
  | "CANDIDATE_UNAVAILABLE"
  | "CANDIDATE_STALE"
  | "LOCAL_HISTORY_UNAVAILABLE"
  | "UPSTREAM_STALE"
  | "PARTIAL_PROJECTION_UNAVAILABLE"
  | "NEXT_ROUTE_UNAVAILABLE";

export type ScriptStudioPresentationError = {
  code: ScriptStudioPresentationErrorCode;
  title: string;
  message: string;
  retryable: boolean;
  affectedArea?: "canvas" | "candidate" | "constraints" | "versions" | "findings" | "progression";
};

export type ScriptRecoveryState =
  | { status: "none" }
  | { status: "validation-error"; error: ScriptStudioPresentationError }
  | { status: "business-error"; error: ScriptStudioPresentationError }
  | { status: "network-error"; error: ScriptStudioPresentationError }
  | { status: "permission-denied"; error: ScriptStudioPresentationError }
  | { status: "partial-failure"; error: ScriptStudioPresentationError }
  | { status: "retry"; operation: ScriptRetryOperation };

export type ScriptFreshnessState = "current" | "upstream-stale" | "concurrent-stale";

export type ScriptUnsavedIntent =
  | "route-navigation"
  | "storyboard-progression"
  | "project-switch"
  | "episode-switch"
  | "back-navigation"
  | "candidate-adopt"
  | "local-history-restore";

export type ScriptGuardState =
  | { status: "guard-idle" }
  | { status: "destructive-confirmation"; intent: ScriptUnsavedIntent };

export type ScriptStudioPageState = {
  load: ScriptStudioLoadState;
  workingBuffer: ScriptWorkingBufferState;
  candidate: ScriptCandidateOperationState;
  compare: ScriptCompareState;
  recovery: ScriptRecoveryState;
  freshness: ScriptFreshnessState;
  guard: ScriptGuardState;
};

export type ScriptBlockKind =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export type ScriptBlockPresentation = {
  uiBlockKey: UIBlockKey;
  kind: ScriptBlockKind;
  text: string;
  speakerLabel?: string;
  readOnly?: boolean;
};

export type ScriptSceneStatus = "current" | "edited" | "candidate" | "finding" | "read-only";

export type ScriptSceneProjection = {
  uiSceneKey: UISceneKey;
  ordinal: number;
  actLabel: string;
  title: string;
  slugline: string;
  status: ScriptSceneStatus;
  candidateCount: number;
  findingCount: number;
  blocks: readonly ScriptBlockPresentation[];
};

export type ScriptWorkspaceContext = {
  projectTitle: string;
  seriesTitle: string;
  episodeLabel: string;
  stageLabel: "剧本制作";
  authorityLabel: "本地演示" | "M3 公共投影";
};

export type ScriptCanvasSelection =
  | { kind: "scene"; uiSceneKey: UISceneKey }
  | { kind: "block"; uiSceneKey: UISceneKey; uiBlockKey: UIBlockKey }
  | {
      kind: "text";
      uiSceneKey: UISceneKey;
      uiBlockKey: UIBlockKey;
      start: number;
      end: number;
    };

export type ScriptCandidateKind = "rewrite" | "condense" | "expand" | "dialogue" | "pacing";

export type ScriptCandidateReplacement = {
  uiBlockKey: UIBlockKey;
  proposedText: string;
  changeLabel: string;
};

export type ScriptRewriteCandidate = {
  candidateId: CandidateId;
  kind: ScriptCandidateKind;
  target: ScriptCanvasSelection;
  title: string;
  proposedText: string;
  rationale: string;
  sourceLabel: "本地 AI 候选";
  status: "available" | "selected" | "adopted" | "stale";
  replacements: readonly ScriptCandidateReplacement[];
  sourceFingerprint: string;
};

export type ScriptLocalSnapshot = {
  localSnapshotId: LocalSnapshotId;
  label: string;
  description: string;
  createdLabel: string;
  source: "entry" | "human-edit" | "candidate-adopt" | "local-restore";
  scenes: readonly ScriptSceneProjection[];
};

export type UpstreamConstraintOwner = "M1" | "M2" | "M4" | "M5" | "M6";

export type UpstreamConstraintItem = {
  owner: UpstreamConstraintOwner;
  category: "director" | "episode" | "series-plan" | "world" | "character" | "relationship" | "character-state";
  title: string;
  summary: string;
  severity?: "info" | "warning";
};

export type NarrativeFindingPreview = {
  findingId: FindingId;
  category: "character" | "world-rule" | "continuity" | "pacing" | "episode-objective";
  title: string;
  description: string;
  severity: "info" | "warning";
  target: ScriptCanvasSelection;
  authority: "local-preview";
};

export type ScriptRetryOperation =
  | "load-script"
  | "generate-candidate"
  | "load-constraints"
  | "load-findings"
  | "load-local-history"
  | "storyboard-progression";

export type ScriptActionResult<T> =
  | { status: "success"; data: T }
  | { status: "cancelled"; reason: "user" | "superseded" | "guard-cancelled" }
  | { status: "failure"; error: ScriptStudioPresentationError };

export type ScriptUnsavedResolution =
  | "preserve-and-continue-editing"
  | "discard-and-proceed"
  | "cancel";

export type ScriptBottomDrawerTab = "candidates" | "local-history" | "findings";

export type ScriptPanelVisibilityPayload = {
  panel: "navigator" | "inspector" | "bottom-drawer";
  open: boolean;
  reason: "trigger" | "close-button" | "escape" | "responsive-change" | "programmatic";
};

export type PendingUnsavedAction =
  | { intent: "route-navigation" | "back-navigation"; href: string }
  | { intent: "storyboard-progression" }
  | { intent: "project-switch" | "episode-switch"; label: string }
  | { intent: "candidate-adopt"; candidateId: CandidateId }
  | { intent: "local-history-restore"; localSnapshotId: LocalSnapshotId };
