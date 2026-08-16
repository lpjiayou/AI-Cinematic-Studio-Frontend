import {
  creatorErrorFromUnknown,
  type CreatorError,
} from "./contracts";

export class CreatorClientError extends Error {
  constructor(
    readonly status: number,
    readonly detail: CreatorError,
  ) {
    super(detail.message);
  }
}

export async function creatorRequest<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: Record<string, unknown> },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body: string | undefined;
  if (init?.body) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.body);
  }
  const response = await fetch(`/api/creator/${path.replace(/^\/+/, "")}`, {
    ...init,
    body,
    headers,
    cache: "no-store",
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CreatorClientError(response.status, {
      code: "invalid_adapter_response",
      message: "前端适配层返回了无法识别的响应。",
    });
  }
  if (!response.ok || !payload || typeof payload !== "object" || (payload as { ok?: unknown }).ok !== true) {
    throw new CreatorClientError(
      response.status,
      creatorErrorFromUnknown(payload),
    );
  }
  return payload as T;
}
