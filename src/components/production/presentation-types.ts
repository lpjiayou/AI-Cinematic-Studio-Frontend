export type GlobalRailDestinationId =
  | "home"
  | "projects"
  | "quick-create"
  | "assets"
  | "jobs"
  | "works";

export type ProjectDestinationId =
  | "overview"
  | "story"
  | "script"
  | "characters"
  | "storyboard"
  | "generation"
  | "audio"
  | "timeline"
  | "review"
  | "delivery";

export type DestinationAvailability = "available" | "blocked" | "not_open";

export type CapabilityBlockerClass =
  | "ui_missing"
  | "runtime_unavailable"
  | "authority_required"
  | "policy_denied"
  | "stale_input"
  | "conflict"
  | "disconnected"
  | "authentication_required"
  | "not_open"
  | "unknown";

export type BlockerSeverity = "info" | "warning" | "danger";

export type AuthorityLayerId = "ui" | "runtime" | "authority" | "policy";

export type AuthorityLayerState =
  | "available"
  | "blocked"
  | "required"
  | "denied"
  | "unverified"
  | "not_open"
  | "not_applicable";

export type EmptyProductVariant =
  | "no_data"
  | "no_results"
  | "disconnected"
  | "authentication_required"
  | "authority_required"
  | "policy_blocked"
  | "runtime_blocked"
  | "not_implemented"
  | "unknown";

export type ActiveJobState = "queued" | "running" | "blocked" | "failed";

export type WorkbenchOverlay =
  | null
  | "global-navigation"
  | "project-navigation"
  | "inspector"
  | "evidence"
  | "jobs";

export type WorkbenchDensity = "comfortable" | "compact";
