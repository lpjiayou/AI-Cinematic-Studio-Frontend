import {
  CreatorClientError,
  type CreatorError,
} from "@/features/core-integration";

export type WorkspaceReadState<TReady, TBlocked = CreatorError> =
  | { status: "loading" }
  | ({ status: "ready" } & TReady)
  | { status: "absent"; error: CreatorError }
  | { status: "blocked"; blocker: TBlocked }
  | { status: "disconnected"; error: CreatorError }
  | { status: "error"; error: CreatorError };

export const UNKNOWN_WORKSPACE_ERROR: CreatorError = {
  code: "core_disconnected",
  message: "当前无法读取 Creator Core 工作区",
};

export function workspaceErrorFromUnknown(error: unknown): CreatorError {
  if (error instanceof CreatorClientError) {
    return {
      code: error.detail.code,
      message: error.detail.message,
      ...(error.detail.fields ? { fields: error.detail.fields } : {}),
    };
  }
  return UNKNOWN_WORKSPACE_ERROR;
}

export function isWorkspaceAbsent(error: unknown) {
  return error instanceof CreatorClientError && error.status === 404;
}

export function isWorkspaceDisconnected(error: unknown) {
  if (!(error instanceof CreatorClientError)) return true;
  return (
    error.status === 503 ||
    error.status === 504 ||
    error.detail.code === "core_disconnected" ||
    error.detail.code === "core_timeout"
  );
}
