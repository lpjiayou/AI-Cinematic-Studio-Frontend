import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.K2_GATE_FRONTEND_ORIGIN ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const projectRef = process.env.K2_GATE_PROJECT_REF ?? "project-k2-1";
const browserChannel = process.env.K2_GATE_BROWSER_CHANNEL;
const artifactRoot = path.resolve(process.env.K2_GATE_ARTIFACT_ROOT ?? "artifacts/gate-c-k2");
fs.mkdirSync(artifactRoot, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForHeading(page, name) {
  await page.getByRole("heading", { name, exact: true }).waitFor({ timeout: 120_000 });
}

async function layoutEvidence(page, stage, { requireFluidWorkspace = true } = {}) {
  const evidence = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const main = document.querySelector("main");
    const workspace = main?.querySelector(":scope > div[class*='workspace']");
    const mainRect = main?.getBoundingClientRect();
    const workspaceRect = workspace?.getBoundingClientRect();
    return {
      viewportWidth: root.clientWidth,
      documentScrollWidth: root.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
      mainWidth: Math.round(mainRect?.width || 0),
      workspaceWidth: Math.round(workspaceRect?.width || 0),
      mainViewportRatio: mainRect ? Number((mainRect.width / root.clientWidth).toFixed(3)) : 0,
      workspaceViewportRatio: workspaceRect
        ? Number((workspaceRect.width / root.clientWidth).toFixed(3))
        : 0,
    };
  });
  assert(evidence.horizontalOverflow === 0, `${stage}: root horizontal overflow ${evidence.horizontalOverflow}`);
  if (requireFluidWorkspace) {
    assert(evidence.mainViewportRatio >= 0.95, `${stage}: main is not fluid (${evidence.mainViewportRatio})`);
    assert(
      evidence.workspaceViewportRatio >= 0.9,
      `${stage}: production workspace is not fluid (${evidence.workspaceViewportRatio})`,
    );
  }
  return evidence;
}

async function captureReflow(page, width, label) {
  await page.setViewportSize({ width, height: 1000 });
  await page.reload({ waitUntil: "networkidle" });
  await waitForHeading(page, "单集母版与交付证据");
  assert(await page.getByRole("link", { name: "下载本地 MP4" }).isVisible(), `${label}: primary delivery action is unavailable`);
  const evidence = await layoutEvidence(page, label, { requireFluidWorkspace: false });
  await page.screenshot({ path: path.join(artifactRoot, `${label}.png`), fullPage: false });
  return evidence;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(browserChannel ? { channel: browserChannel } : {}),
  });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const expectedAbortedRequests = [];
  const httpErrors = [];
  const mutationRequests = [];
  const historicalReadRequests = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "failed";
    const requestUrl = request.url();
    const isExpectedNavigationAbort =
      request.method() === "GET" &&
      errorText === "net::ERR_ABORTED" &&
      new URL(requestUrl).origin === new URL(baseUrl).origin;
    if (isExpectedNavigationAbort) {
      expectedAbortedRequests.push(`${request.method()} ${requestUrl} ${errorText}`);
      return;
    }
    failedRequests.push(`${request.method()} ${requestUrl} ${errorText}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    if (request.method() === "GET" && /\/api\/creator\/episode-production-runs\/[^/]+\/(assets|media)$/.test(new URL(request.url()).pathname)) {
      historicalReadRequests.push(request.url());
    }
    if (request.method() !== "POST" || !request.url().includes("/api/creator/episode-production-runs/")) return;
    let payload = null;
    try {
      payload = request.postDataJSON();
    } catch {
      payload = request.postData();
    }
    mutationRequests.push({ url: request.url(), payload });
  });

  const evidence = {};
  try {
    await page.goto(`${baseUrl}/creator/projects/${projectRef}/production`, { waitUntil: "networkidle" });
    await waitForHeading(page, "可执行镜头图");
    assert(await page.getByText("4 个镜头", { exact: true }).isVisible(), "shot graph count is missing");
    assert((await page.getByText("禁止发布", { exact: true }).count()) >= 1, "publication lock is missing on the shot graph");
    evidence.shots = await layoutEvidence(page, "shots-1920");
    await page.screenshot({ path: path.join(artifactRoot, "shots-1920.png"), fullPage: false });

    await page.goto(`${baseUrl}/creator/projects/${projectRef}/production?stage=assets`, { waitUntil: "networkidle" });
    await waitForHeading(page, "历史资产与媒体证据");
    assert(await page.getByText("历史兼容", { exact: true }).isVisible(), "historical compatibility label is missing");
    assert(await page.getByText("只读", { exact: true }).isVisible(), "historical read-only label is missing");
    assert((await page.getByRole("button", { name: /^(解析镜头资产需求|解析资产|执行本地媒体任务|执行媒体任务)$/ }).count()) === 0, "legacy asset/media write action is exposed");
    assert(historicalReadRequests.some((url) => url.endsWith("/assets")), "historical assets GET is missing");
    assert(historicalReadRequests.some((url) => url.endsWith("/media")), "historical media GET is missing");
    assert((await page.getByRole("row").count()) === 9, "expected one header plus eight media job rows");
    assert((await page.getByText("CPU · LOCAL_EVIDENCE", { exact: true }).count()) === 8, "media evidence boundary is inaccurate");
    evidence.assets = await layoutEvidence(page, "assets-1920");

    await page.goto(`${baseUrl}/creator/projects/${projectRef}/post`, { waitUntil: "networkidle" });
    evidence.legacyProduction = {
      historicalAssetMediaReadOnly: true,
      historicalReadRequests: [...historicalReadRequests],
      legacyAssetsPostCount: mutationRequests.filter((item) => item.url.endsWith("/assets")).length,
      legacyMediaPostCount: mutationRequests.filter((item) => item.url.endsWith("/media")).length,
    };
    assert(evidence.legacyProduction.legacyAssetsPostCount === 0, "Production issued a legacy assets POST");
    assert(evidence.legacyProduction.legacyMediaPostCount === 0, "Production issued a legacy media POST");
    await waitForHeading(page, "等待合成预览与机器质检");
    assert(mutationRequests.filter((item) => item.url.endsWith("/preview")).length === 0, "preview executed automatically");
    await page.getByRole("button", { name: "生成预览并运行质检" }).click();
    await waitForHeading(page, "先看片，再决定是否生成母版");
    await page.locator("video[aria-label='K2 单集预览']").waitFor();
    await page.waitForFunction(() => {
      const video = document.querySelector("video[aria-label='K2 单集预览']");
      return video && video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0;
    }, null, { timeout: 120_000 });
    const previewMedia = await page.locator("video[aria-label='K2 单集预览']").evaluate((video) => ({
      readyState: video.readyState,
      duration: Number(video.duration.toFixed(3)),
      currentSrc: video.currentSrc,
    }));
    assert((await page.getByText("PASSED", { exact: true }).count()) === 6, "six machine checks are not visible");
    const finalizeButton = page.getByRole("button", { name: "验证审批并生成不可变母版" });
    assert(await finalizeButton.isDisabled(), "finalization is enabled without human evidence");
    await page.getByRole("heading", { name: "四项独立人工审批", exact: true }).waitFor();
    const approvals = [
      ["创作方向", "approval-creative-direction"],
      ["身份连续性", "approval-identity-continuity"],
      ["技术质检", "approval-technical-qc"],
      ["最终母版", "approval-final-master"],
    ];
    for (const [label, approvalRef] of approvals) {
      const approvalInput = page.getByLabel(`${label}审批引用`, { exact: true });
      const actorInput = page.getByLabel(`${label}审批人引用`, { exact: true });
      assert((await approvalInput.count()) === 1, `${label}: approval reference input is missing or duplicated`);
      assert((await actorInput.count()) === 1, `${label}: actor reference input is missing or duplicated`);
      assert((await approvalInput.inputValue()) === "", `${label}: approval reference was auto-filled`);
      assert((await actorInput.inputValue()) === "", `${label}: actor reference was auto-filled`);
      await approvalInput.fill(approvalRef);
      await actorInput.fill("actor-project-lead");
    }
    await page.getByRole("checkbox").check();
    assert(!(await finalizeButton.isDisabled()), "finalization did not enable after explicit evidence");
    await finalizeButton.click();
    await page.getByText("外部审批已验证，母版与本地导出已生成。", { exact: true }).waitFor({ timeout: 120_000 });
    await page.getByText("单集母版已就绪", { exact: true }).first().waitFor({ timeout: 120_000 });
    evidence.review = { ...(await layoutEvidence(page, "review-1920")), previewMedia };

    const previewRequests = mutationRequests.filter((item) => item.url.endsWith("/preview"));
    const finalizeRequests = mutationRequests.filter((item) => item.url.endsWith("/finalize"));
    assert(previewRequests.length === 1, `expected one explicit preview request, got ${previewRequests.length}`);
    assert(finalizeRequests.length === 1, `expected one explicit finalize request, got ${finalizeRequests.length}`);
    assert(finalizeRequests[0].payload.decisions.length === 4, "finalize payload does not contain four decisions");
    assert(finalizeRequests[0].payload.decisions.every((item) => item.decision === "ACCEPT"), "unexpected approval decision payload");

    await page.goto(`${baseUrl}/creator/projects/${projectRef}/delivery`, { waitUntil: "networkidle" });
    await waitForHeading(page, "单集母版与交付证据");
    assert(await page.getByText("不允许", { exact: true }).isVisible(), "delivery publication lock is missing");
    const downloadLink = page.getByRole("link", { name: "下载本地 MP4" });
    const downloadHref = await downloadLink.getAttribute("href");
    assert(downloadHref, "download URL is missing");
    const downloadEvidence = await page.evaluate(async (url) => {
      const response = await fetch(url, { cache: "no-store" });
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        disposition: response.headers.get("content-disposition"),
        byteSize: bytes.length,
        mp4Signature: String.fromCharCode(...bytes.slice(4, 8)),
        sha256: Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join(""),
      };
    }, downloadHref);
    assert(downloadEvidence.status === 200, "download failed");
    assert(downloadEvidence.contentType?.startsWith("video/mp4"), "download is not MP4");
    assert(downloadEvidence.disposition?.includes("attachment"), "download disposition is not an attachment");
    assert(downloadEvidence.byteSize > 0 && downloadEvidence.mp4Signature === "ftyp", "download is not a playable MP4 artifact");
    assert(/^[a-f0-9]{64}$/.test(downloadEvidence.sha256), "download SHA-256 evidence is invalid");
    evidence.delivery = { ...(await layoutEvidence(page, "delivery-1920")), download: downloadEvidence };
    await page.screenshot({ path: path.join(artifactRoot, "delivery-1920.png"), fullPage: false });

    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.reload({ waitUntil: "networkidle" });
    await waitForHeading(page, "单集母版与交付证据");
    evidence.deliveryWide = await layoutEvidence(page, "delivery-2560");
    await page.screenshot({ path: path.join(artifactRoot, "delivery-2560.png"), fullPage: false });

    evidence.reflow200Equivalent = await captureReflow(page, 640, "delivery-640");
    evidence.reflow400Equivalent = await captureReflow(page, 320, "delivery-320");

    assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    assert(failedRequests.length === 0, `failed requests: ${failedRequests.join(" | ")}`);
    assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`);
    assert(mutationRequests.every((item) => !/\/(assets|media)$/.test(item.url)), "legacy asset/media POST occurred");

    const result = {
      ok: true,
      gate: "G7_BROWSER_GATE_C",
      browser: await browser.version(),
      runtime: {
        coreCommit: process.env.K2_GATE_CORE_SHA ?? null,
        frontendCandidateCommit: process.env.K2_GATE_FRONTEND_CANDIDATE_SHA ?? null,
        frontendCommit: process.env.K2_GATE_FRONTEND_SHA ?? null,
        frontendOrigin: baseUrl,
        browserChannel: browserChannel ?? "playwright-chromium",
        projectRef,
      },
      evidence,
      mutations: mutationRequests.map((item) => ({
        resource: item.url.split("/").pop(),
        decisionCount: item.payload?.decisions?.length || 0,
      })),
      consoleErrors,
      pageErrors,
      failedRequests,
      expectedAbortedRequests,
      httpErrors,
    };
    fs.writeFileSync(path.join(artifactRoot, "result.json"), JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const failure = {
      ok: false,
      gate: "G7_BROWSER_GATE_C",
      error: error?.stack || String(error),
      consoleErrors,
      pageErrors,
      failedRequests,
      expectedAbortedRequests,
      httpErrors,
    };
    fs.writeFileSync(path.join(artifactRoot, "result.json"), JSON.stringify(failure, null, 2));
    await page.screenshot({ path: path.join(artifactRoot, "failure.png"), fullPage: false }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
