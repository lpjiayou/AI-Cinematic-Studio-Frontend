import "server-only";

const DEFAULT_CORE_BASE_URL = "http://127.0.0.1:8765";
const DEFAULT_WORKSPACE_REF = "workspace-local-creator";
const DEFAULT_CONTENT_PROFILE_REF = "content-profile-local-creator";

function cleanRef(value: string | undefined, fallback: string) {
  const ref = value?.trim() || fallback;
  if (!ref || !/^\S{1,200}$/.test(ref)) {
    throw new Error("Creator scope configuration is invalid");
  }
  return ref;
}

function coreBaseUrl() {
  const configured = process.env.CREATOR_CORE_BASE_URL?.trim() || DEFAULT_CORE_BASE_URL;
  const url = new URL(configured);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("CREATOR_CORE_BASE_URL must use http or https");
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function getCreatorServerConfig() {
  return {
    coreBaseUrl: coreBaseUrl(),
    workspaceRef: cleanRef(
      process.env.CREATOR_WORKSPACE_REF,
      DEFAULT_WORKSPACE_REF,
    ),
    contentProfileRef: cleanRef(
      process.env.CREATOR_CONTENT_PROFILE_REF,
      DEFAULT_CONTENT_PROFILE_REF,
    ),
  } as const;
}
