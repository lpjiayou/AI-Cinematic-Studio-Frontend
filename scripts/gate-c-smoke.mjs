const frontendOrigin = process.env.CREATOR_FRONTEND_ORIGIN ?? "http://127.0.0.1:3100";
const coreOrigin = process.env.CREATOR_CORE_BASE_URL ?? "http://127.0.0.1:8765";
const expectedWorkspace = process.env.CREATOR_EXPECTED_WORKSPACE_REF ?? "workspace-gate-c";
const expectedProfile =
  process.env.CREATOR_EXPECTED_CONTENT_PROFILE_REF ?? "content-profile-gate-c";
const frontend = `${frontendOrigin.replace(/\/$/, "")}/api/creator/`;
const core = `${coreOrigin.replace(/\/$/, "")}/creator/api/v1/`;

async function call(base, path, init = {}) {
  const response = await fetch(base + path, init);
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  return {
    status: response.status,
    origin: response.headers.get("x-creator-data-origin"),
    body,
  };
}

function post(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const runRef = new Date().toISOString();
const capabilities = await call(frontend, "capabilities");
const series = await call(
  frontend,
  "series",
  post({
    workspaceRef: "forged-browser-workspace",
    contentProfileRef: "forged-browser-profile",
    title: `Gate C Series ${runRef}`,
    description: "Real Browser → Experience Adapter → Creator Public API flow",
    plannedEpisodeCount: 6,
  }),
);
if (!series.body?.ok) throw new Error(`Series creation failed: ${JSON.stringify(series)}`);
const seriesRef = series.body.series.seriesRef;

const project = await call(
  frontend,
  "projects",
  post({
    workspaceRef: "forged-browser-workspace",
    contentProfileRef: "forged-browser-profile",
    projectType: "series",
    seriesRef,
    title: `Gate C Project ${runRef}`,
    description: "Authoritative project round trip",
    targetPlatform: "streaming",
    aspectRatio: "16:9",
    defaultDurationSec: 90,
    plannedEpisodeCount: 6,
  }),
);
if (!project.body?.ok) throw new Error(`Project creation failed: ${JSON.stringify(project)}`);
const projectRef = project.body.project.projectRef;

const list = await call(frontend, "projects?workspaceRef=forged-browser-workspace");
const detail = await call(frontend, `projects/${encodeURIComponent(projectRef)}`);
const providerGate = await call(
  frontend,
  "ai-director/candidates",
  post({
    brief: {
      topic: "Gate C accurate mapping",
      theme: "truth",
      audience: "reviewer",
      duration: "90 seconds",
      platform: "streaming",
      style: "cinematic",
      character: "tester",
    },
  }),
);
const m6Gate = await call(
  frontend,
  `series-intelligence-workspaces?projectRef=${encodeURIComponent(projectRef)}&seriesRef=${encodeURIComponent(seriesRef)}`,
);
const forgedScope = await call(core, "projects?workspaceRef=forged-browser-workspace");
const trustedScope = await call(
  core,
  `projects?workspaceRef=${encodeURIComponent(expectedWorkspace)}`,
);

const states = capabilities.body?.capabilities?.reduce((result, capability) => {
  result[capability.state] = (result[capability.state] ?? 0) + 1;
  return result;
}, {});
const summary = {
  capabilities: {
    status: capabilities.status,
    origin: capabilities.origin,
    count: capabilities.body?.capabilities?.length,
    states,
  },
  series: {
    status: series.status,
    origin: series.origin,
    seriesRef,
    workspaceRef: series.body.series.workspaceRef,
    contentProfileRef: series.body.series.contentProfileRef,
  },
  project: {
    status: project.status,
    origin: project.origin,
    projectRef,
    seriesRefs: project.body.project.seriesRefs,
  },
  browserList: {
    status: list.status,
    containsCreatedProject: list.body?.projects?.some(
      (item) => item.projectRef === projectRef,
    ),
  },
  browserDetail: {
    status: detail.status,
    projectRef: detail.body?.project?.projectRef,
  },
  providerGate: {
    status: providerGate.status,
    ok: providerGate.body?.ok,
    code: providerGate.body?.error?.code,
  },
  m6Gate: {
    status: m6Gate.status,
    ok: m6Gate.body?.ok,
    code: m6Gate.body?.error?.code,
  },
  scopeIsolation: {
    forgedCount: forgedScope.body?.projects?.length,
    trustedContainsCreatedProject: trustedScope.body?.projects?.some(
      (item) => item.projectRef === projectRef,
    ),
  },
};

const failures = [];
if (summary.capabilities.count !== 19 || summary.capabilities.origin !== "CORE") {
  failures.push("capability projection");
}
if (
  summary.series.workspaceRef !== expectedWorkspace ||
  summary.series.contentProfileRef !== expectedProfile
) {
  failures.push("server scope injection");
}
if (summary.project.seriesRefs?.[0] !== seriesRef) {
  failures.push("project-series binding");
}
if (
  !summary.browserList.containsCreatedProject ||
  summary.browserDetail.projectRef !== projectRef
) {
  failures.push("project round trip");
}
if (summary.providerGate.code !== "provider_unavailable") {
  failures.push("provider fail-closed");
}
if (summary.m6Gate.code !== "authority_unavailable") {
  failures.push("M6 authority fail-closed");
}
if (
  summary.scopeIsolation.forgedCount !== 0 ||
  !summary.scopeIsolation.trustedContainsCreatedProject
) {
  failures.push("workspace isolation");
}

console.log(JSON.stringify({ ok: failures.length === 0, failures, ...summary }, null, 2));
if (failures.length) process.exitCode = 1;
