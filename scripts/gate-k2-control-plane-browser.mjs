import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.K2_CONTROL_PLANE_FRONTEND_ORIGIN ?? "http://127.0.0.1:3101").replace(/\/$/, "");
const projectRef = process.env.K2_CONTROL_PLANE_PROJECT_REF ?? "project-k2-1";
const runRef = process.env.K2_CONTROL_PLANE_RUN_REF ?? "episode-production-run-k2-1";
const artifactRoot = path.resolve(
  process.env.K2_CONTROL_PLANE_ARTIFACT_ROOT ?? "artifacts/k2-control-plane-e2e",
);
const browserChannel = process.env.K2_CONTROL_PLANE_BROWSER_CHANNEL;
const browserExecutable = process.env.K2_CONTROL_PLANE_BROWSER_EXECUTABLE;
fs.mkdirSync(artifactRoot, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function route(suffix) {
  return `${baseUrl}/creator/projects/${encodeURIComponent(projectRef)}/${suffix}`;
}

async function waitForControlPlane(page) {
  await page.getByRole("heading", { name: "V5 / V4 四轴状态投影", exact: true }).waitFor({ timeout: 120_000 });
  await page.getByText("根状态 · ROOTS_READY", { exact: true }).waitFor({ timeout: 120_000 });
  await page.getByText("生产状态 · REAL_VIDEO_PLAN_READY", { exact: true }).waitFor({ timeout: 120_000 });
  await page.getByText("语义视觉 QC · FAIL", { exact: true }).waitFor({ timeout: 120_000 });
}

async function assertProjection(page) {
  const response = await page.evaluate(async (productionRunRef) => {
    const result = await fetch(
      `/api/creator/episode-production-runs/${encodeURIComponent(productionRunRef)}/state-projection`,
      { cache: "no-store" },
    );
    return { status: result.status, payload: await result.json() };
  }, runRef);
  assert(response.status === 200, `state projection returned ${response.status}`);
  const projection = response.payload;
  const candidates = projection.candidateLifecycle?.candidates ?? [];
  assert(projection.ok === true, "state projection is not an OK envelope");
  assert(projection.rootState?.state === "ROOTS_READY", "rootState is not ROOTS_READY");
  assert(projection.productionState === "REAL_VIDEO_PLAN_READY", "productionState changed");
  assert(projection.state === projection.productionState, "state compatibility alias diverged");
  assert(projection.visualQcState?.state === "FAIL", "visualQcState is not FAIL");
  assert(typeof projection.runtimeState?.state === "string", "runtimeState is missing");
  assert(projection.activeRevision?.state === "ACTIVE", "active revision is not explicit");
  assert(Boolean(projection.activeRevision?.revisionRef), "active revision ref is empty");
  assert(candidates.length === 4, `expected four candidates, got ${candidates.length}`);
  assert(candidates.every((item) => item.technicalState === "TECHNICALLY_VERIFIED"), "technical validation projection diverged");
  assert(candidates.every((item) => item.visualQcState === "SEMANTIC_QC_FAILED"), "semantic visual QC projection diverged");
  assert(candidates.every((item) => item.selectionState === "UNSELECTED"), "a candidate was selected");
  assert(candidates.every((item) => item.admissionState === "NOT_ADMITTED"), "a candidate was admitted");
  assert(projection.invariants?.runtimeDoesNotAdvanceProduction === true, "runtime can advance production");
  assert(projection.publicationAllowed === false, "publication unexpectedly allowed");
  assert(!JSON.stringify(projection).includes("/data/"), "projection leaks an internal path");
  return projection;
}

const launchOptions = { headless: true };
if (browserChannel) launchOptions.channel = browserChannel;
if (browserExecutable) launchOptions.executablePath = browserExecutable;

(async () => {
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const requestErrors = [];
  const httpErrors = [];
  const mutationRequests = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "failed";
    const expectedNavigationAbort =
      request.method() === "GET" && failure === "net::ERR_ABORTED" && request.url().startsWith(baseUrl);
    if (!expectedNavigationAbort) requestErrors.push(`${request.method()} ${request.url()} ${failure}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    if (request.method() !== "GET") {
      mutationRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  const evidence = {};
  try {
    await page.goto(route("production?stage=assets"), { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "资产需求与媒体任务", exact: true }).waitFor({ timeout: 120_000 });
    await waitForControlPlane(page);
    assert((await page.getByRole("row").count()) === 9, "expected one header and eight historical media rows");
    assert((await page.getByText("候选链 · 4 个候选", { exact: true }).count()) === 1, "candidate count is not rendered");
    assert((await page.getByText("运行时不可推进生产状态", { exact: true }).count()) === 1, "runtime isolation is not rendered");
    const activeRevisionText = await page.getByText(/^活动修订 · /).innerText();
    assert(!activeRevisionText.endsWith("NOT_RECORDED"), "active revision is not rendered");
    evidence.projection = await assertProjection(page);
    await page.screenshot({ path: path.join(artifactRoot, "production-assets.png"), fullPage: true });

    await page.goto(route("post"), { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "先看片，再决定是否生成母版", exact: true }).waitFor({ timeout: 120_000 });
    await waitForControlPlane(page);
    assert((await page.getByRole("button", { name: "生成预览并运行质检" }).count()) === 0, "legacy preview action is exposed");
    assert((await page.getByRole("button", { name: "验证审批并生成不可变母版" }).count()) === 0, "legacy finalize action is exposed");
    assert((await page.getByRole("heading", { name: "四项独立人工审批", exact: true }).count()) === 0, "legacy final approval form is exposed");
    assert((await page.getByText("核对视频候选、视觉质检与选择", { exact: true }).count()) === 1, "current control-plane action is missing");
    await page.screenshot({ path: path.join(artifactRoot, "post-qc-fail.png"), fullPage: true });

    await page.goto(route("delivery"), { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "母版尚未生成", exact: true }).waitFor({ timeout: 120_000 });
    await waitForControlPlane(page);
    assert((await page.getByRole("link", { name: "下载本地 MP4" }).count()) === 0, "a master export is exposed");
    assert((await page.locator("video[aria-label='K2 单集母版']").count()) === 0, "a master video is exposed");
    await page.screenshot({ path: path.join(artifactRoot, "delivery-not-created.png"), fullPage: true });

    assert(mutationRequests.length === 0, `browser emitted mutations: ${mutationRequests.join(" | ")}`);
    assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    assert(requestErrors.length === 0, `request errors: ${requestErrors.join(" | ")}`);
    assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`);

    const result = {
      ok: true,
      gate: "K2_CONTROL_PLANE_REAL_BROWSER_E2E",
      browser: await browser.version(),
      runtime: {
        coreCommit: process.env.K2_CONTROL_PLANE_CORE_SHA ?? null,
        frontendCommit: process.env.K2_CONTROL_PLANE_FRONTEND_SHA ?? null,
        frontendOrigin: baseUrl,
        projectRef,
        productionRunRef: runRef,
        gpuRequired: false,
      },
      evidence: {
        rootState: evidence.projection.rootState.state,
        productionState: evidence.projection.productionState,
        runtimeState: evidence.projection.runtimeState.state,
        visualQcState: evidence.projection.visualQcState.state,
        activeRevisionRef: evidence.projection.activeRevision.revisionRef,
        candidateCount: evidence.projection.candidateLifecycle.candidates.length,
        selectedCount: 0,
        admittedCount: 0,
        masterCreated: false,
        exportCreated: false,
      },
      mutationRequests,
      consoleErrors,
      pageErrors,
      requestErrors,
      httpErrors,
    };
    fs.writeFileSync(path.join(artifactRoot, "result.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const failure = {
      ok: false,
      gate: "K2_CONTROL_PLANE_REAL_BROWSER_E2E",
      error: error?.stack ?? String(error),
      mutationRequests,
      consoleErrors,
      pageErrors,
      requestErrors,
      httpErrors,
    };
    fs.writeFileSync(path.join(artifactRoot, "result.json"), JSON.stringify(failure, null, 2));
    await page.screenshot({ path: path.join(artifactRoot, "failure.png"), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error?.stack ?? String(error));
  process.exitCode = 1;
});
