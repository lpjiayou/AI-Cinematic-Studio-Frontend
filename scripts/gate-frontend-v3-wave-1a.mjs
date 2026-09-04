import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const frontendRoot = path.resolve(new URL("..", import.meta.url).pathname);
const baseUrl = (process.env.K2_CONTROL_PLANE_FRONTEND_ORIGIN ?? "http://127.0.0.1:3101").replace(/\/$/, "");
const parentArtifactRoot = path.resolve(
  process.env.K2_CONTROL_PLANE_ARTIFACT_ROOT ?? "artifacts/k2-control-plane-e2e",
);
const artifactRoot = path.resolve(
  process.env.FRONTEND_V3_WAVE_1A_ARTIFACT_ROOT
    ?? path.join(parentArtifactRoot, "frontend-v3-wave-1a"),
);
const browserChannel = process.env.K2_CONTROL_PLANE_BROWSER_CHANNEL;
const browserExecutable = process.env.K2_CONTROL_PLANE_BROWSER_EXECUTABLE;
const evidenceUrl = `${baseUrl}/frontend-v3-evidence/wave-1a`;

fs.mkdirSync(artifactRoot, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitValue(...arguments_) {
  return execFileSync("git", ["-C", frontendRoot, ...arguments_], { encoding: "utf8" }).trim();
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function assertApprox(actual, expected, tolerance, label) {
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${label} expected ${expected} ±${tolerance}, got ${actual}`,
  );
}

async function requiredBox(locator, label) {
  const box = await locator.boundingBox();
  assert(box, `${label} is not visible`);
  return box;
}

async function visibleCount(locator) {
  return locator.evaluateAll((elements) => elements.filter((element) => {
    const style = window.getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
  }).length);
}

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

async function focusIs(page, locator) {
  return locator.evaluate((element) => element === document.activeElement);
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
  const creatorApiRequests = [];
  const externalRequests = [];
  const screenshotNames = [
    "01-wave-1a-dark-1920x1080.png",
    "02-wave-1a-light-1440x900.png",
    "03-wave-1a-mobile-navigation-390x844.png",
    "04-wave-1a-mobile-evidence-390x844.png",
    "05-wave-1a-mobile-jobs-390x844.png",
  ];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    requestErrors.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400) httpErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (request.method() !== "GET") mutationRequests.push(`${request.method()} ${request.url()}`);
    if (requestUrl.pathname.startsWith("/api/creator/")) {
      creatorApiRequests.push(`${request.method()} ${requestUrl.pathname}`);
    }
    if (requestUrl.origin !== baseUrl) externalRequests.push(`${request.method()} ${requestUrl.origin}`);
  });

  const measuredGeometry = {};
  const drawerFocusRestore = {};
  const keyboardResult = {};
  let reducedMotionResult = null;

  try {
    await page.goto(evidenceUrl, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "工作台壳层与真实性呈现组件", exact: true }).waitFor({ timeout: 120_000 });
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    assert(robots?.includes("noindex") && robots.includes("nofollow"), `evidence route robots metadata changed: ${robots}`);
    for (const label of ["LOCAL_FIXTURE", "EVIDENCE ONLY", "NOT PRODUCT DATA", "NO AUTHORITY", "NO RUNTIME EXECUTION"]) {
      assert(await page.getByText(label, { exact: true }).count() === 1, `missing permanent evidence label: ${label}`);
    }

    const globalBox = await requiredBox(page.locator('[data-wave-region="global-rail-fixed"]'), "GlobalRail");
    const projectBox = await requiredBox(page.locator('[data-wave-region="project-navigator-fixed"]'), "ProjectNavigator");
    const inspectorBox = await requiredBox(page.locator('[data-wave-region="side-fixed"]'), "right side");
    const contextBox = await requiredBox(page.locator('[data-wave-region="context-bar"]'), "ProjectContextBar");
    const jobBox = await requiredBox(page.locator('[data-wave-region="job-shelf-fixed"] [data-job-shelf="true"]'), "JobShelf");
    const canvasBox = await requiredBox(page.locator('[data-wave-region="primary-canvas"]'), "PrimaryCanvas");
    assertApprox(globalBox.width, 72, 1, "GlobalRail width");
    assertApprox(projectBox.width, 220, 1, "ProjectNavigator width");
    assertApprox(inspectorBox.width, 360, 1, "right side width");
    assert(contextBox.height >= 56, `ProjectContextBar height expected at least 56, got ${contextBox.height}`);
    assertApprox(jobBox.height, 48, 1, "collapsed JobShelf height");
    assert(canvasBox.width > 0, "PrimaryCanvas has no usable width");
    assert(!(await hasHorizontalOverflow(page)), "1920 viewport has horizontal overflow");
    assert(await page.locator('[data-wave-region="inspector-fixed"]').count() === 1, "selection inspector is not independent");
    assert(await page.locator('[data-wave-region="authority-fixed"]').count() === 1, "authority/evidence is not independent");
    const ordinaryText = await page.locator("body").innerText();
    for (const prohibited of ["workspaceRef", "productionRunRef", "Provider", "queue", "stack trace"]) {
      assert(!ordinaryText.includes(prohibited), `ordinary UI exposes ${prohibited}`);
    }

    const globalNavigation = page.getByRole("navigation", { name: "V3 全局导航" });
    const globalLinks = globalNavigation.getByRole("link");
    await globalLinks.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    keyboardResult.globalArrow = await focusIs(page, globalLinks.nth(1));
    await page.keyboard.press("End");
    keyboardResult.globalEnd = await focusIs(page, globalLinks.nth(5));
    await page.keyboard.press("Home");
    keyboardResult.globalHome = await focusIs(page, globalLinks.nth(0));

    const projectNavigation = page.getByRole("navigation", { name: "V3 项目导航" });
    const projectLinks = projectNavigation.getByRole("link");
    await projectLinks.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    keyboardResult.projectArrow = await focusIs(page, projectLinks.nth(1));
    await page.keyboard.press("End");
    keyboardResult.projectEnd = await focusIs(page, projectLinks.nth(9));
    await page.keyboard.press("Home");
    keyboardResult.projectHome = await focusIs(page, projectLinks.nth(0));
    assert(Object.values(keyboardResult).every(Boolean), `keyboard navigation failed: ${JSON.stringify(keyboardResult)}`);

    const globalToggle = page.getByRole("button", { name: "展开全局导航" });
    await globalToggle.click();
    const globalOverlay = page.locator('[data-global-overlay="true"]');
    await globalOverlay.waitFor({ state: "visible" });
    const globalOverlayBox = await requiredBox(globalOverlay, "GlobalRail expanded overlay");
    assertApprox(globalOverlayBox.width, 240, 1, "GlobalRail expanded width");
    await globalOverlay.getByRole("link").first().focus();
    await page.keyboard.press("Escape");
    await globalOverlay.waitFor({ state: "detached" });
    drawerFocusRestore.globalOverlay = await focusIs(page, page.getByRole("button", { name: "展开全局导航" }));
    assert(drawerFocusRestore.globalOverlay, "GlobalRail overlay did not restore focus");

    const expandJobs = page.getByRole("button", { name: "展开任务" });
    await expandJobs.click();
    const expandedJobShelf = page.locator('[data-wave-region="job-shelf-fixed"] [data-job-shelf="true"]');
    const expandedJobBox = await requiredBox(expandedJobShelf, "expanded JobShelf");
    assert(expandedJobBox.height <= 281, `expanded JobShelf exceeds 280px: ${expandedJobBox.height}`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "展开任务" }).waitFor({ state: "visible" });

    measuredGeometry.dark1920 = {
      globalRailWidth: globalBox.width,
      projectNavigatorWidth: projectBox.width,
      rightSideWidth: inspectorBox.width,
      contextBarHeight: contextBox.height,
      collapsedJobShelfHeight: jobBox.height,
      expandedJobShelfHeight: expandedJobBox.height,
      primaryCanvasWidth: canvasBox.width,
      horizontalOverflow: false,
    };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[0]), fullPage: true });

    await page.getByRole("button", { name: "切换为浅色主题" }).click();
    await page.locator('[data-wave-fixture][data-theme="light"]').waitFor({ state: "visible" });
    await page.setViewportSize({ width: 1440, height: 900 });
    const lightGlobalBox = await requiredBox(page.locator('[data-wave-region="global-rail-fixed"]'), "light GlobalRail");
    const lightProjectBox = await requiredBox(page.locator('[data-wave-region="project-navigator-fixed"]'), "light ProjectNavigator");
    const lightSideBox = await requiredBox(page.locator('[data-wave-region="side-fixed"]'), "light right side");
    const lightCanvasBox = await requiredBox(page.locator('[data-wave-region="primary-canvas"]'), "light PrimaryCanvas");
    assertApprox(lightGlobalBox.width, 72, 1, "light GlobalRail width");
    assertApprox(lightProjectBox.width, 220, 1, "light ProjectNavigator width");
    assertApprox(lightSideBox.width, 360, 1, "light right side width");
    assert(lightCanvasBox.width > 0, "light PrimaryCanvas has no usable width");
    assert(!(await hasHorizontalOverflow(page)), "1440 viewport has horizontal overflow");
    const lightToken = await page.locator('[data-wave-fixture]').evaluate((element) => getComputedStyle(element).getPropertyValue("--acs-bg").trim());
    assert(Boolean(lightToken), "light theme semantic background token is missing");
    assert(await page.locator('[data-wave-fixture] [style*="#"], [data-wave-fixture] [style*="rgb"], [data-wave-fixture] [style*="hsl"]').count() === 0, "feature-local raw color found");
    for (const statusText of [
      "运行时尚未开放",
      "生成与渲染操作保持关闭",
      "尚未实施",
      "可用",
      "不可用",
      "未授权",
      "不适用",
      "排队 1",
      "运行 1",
      "阻塞 1",
      "失败 1",
    ]) {
      assert(await page.getByText(statusText, { exact: true }).first().isVisible(), `major status text is not visible: ${statusText}`);
    }
    assert(await page.getByRole("button", { name: "开始使用" }).count() === 0, "not-implemented state exposes a fake action");
    measuredGeometry.light1440 = {
      globalRailWidth: lightGlobalBox.width,
      projectNavigatorWidth: lightProjectBox.width,
      rightSideWidth: lightSideBox.width,
      primaryCanvasWidth: lightCanvasBox.width,
      horizontalOverflow: false,
    };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[1]), fullPage: true });

    await page.getByRole("button", { name: "切换为深色主题" }).click();
    await page.locator('[data-wave-fixture][data-theme="dark"]').waitFor({ state: "visible" });
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileContextBox = await requiredBox(page.locator('[data-wave-region="context-bar"]'), "mobile ProjectContextBar");
    assertApprox(mobileContextBox.height, 56, 1, "mobile ProjectContextBar height");
    assert(await visibleCount(page.locator('[data-wave-region="global-rail-fixed"]')) === 0, "fixed GlobalRail visible at 390px");
    assert(await visibleCount(page.locator('[data-wave-region="project-navigator-fixed"]')) === 0, "fixed ProjectNavigator visible at 390px");
    assert(await visibleCount(page.locator('[data-wave-region="inspector-fixed"]')) === 0, "fixed inspector visible at 390px");
    assert(await visibleCount(page.locator('[data-wave-region="job-shelf-fixed"]')) === 0, "fixed JobShelf visible at 390px");
    assert(await visibleCount(page.locator('[data-wave-region="primary-canvas"]')) === 1, "mobile PrimaryCanvas count changed");
    assert(await visibleCount(page.locator("main")) === 1, "mobile requires exactly one main landmark");
    assert(!(await hasHorizontalOverflow(page)), "390 viewport has horizontal overflow");

    async function openAndCloseDrawer(triggerName, expectedSide, expectedSize, screenshotName, inspect) {
      const trigger = page.getByRole("button", { name: triggerName });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible" });
      assert(await page.getByRole("dialog").count() === 1, `${triggerName} opened more than one dialog`);
      assert(await dialog.getAttribute("data-side") === expectedSide, `${triggerName} drawer side changed`);
      assert(await dialog.getAttribute("data-size") === expectedSize, `${triggerName} drawer size changed`);
      if (inspect) await inspect(dialog);
      if (screenshotName) {
        await page.screenshot({ path: path.join(artifactRoot, screenshotName), fullPage: true });
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      drawerFocusRestore[triggerName] = await focusIs(page, trigger);
      assert(drawerFocusRestore[triggerName], `${triggerName} did not restore focus`);
    }

    await openAndCloseDrawer("打开全局导航", "left", "wide", screenshotNames[2], async (dialog) => {
      assert(await dialog.getByRole("navigation", { name: "移动端全局导航" }).getByRole("link").count() === 6, "mobile global destinations changed");
    });
    await openAndCloseDrawer("打开项目导航", "left", "medium", null, async (dialog) => {
      assert(await dialog.getByRole("navigation", { name: "移动端项目导航" }).getByRole("link").count() === 10, "mobile project destinations changed");
    });
    await openAndCloseDrawer("打开检查器", "right", "narrow", null, null);
    await openAndCloseDrawer("查看技术证据", "right", "wide", screenshotNames[3], async (dialog) => {
      const redacted = dialog.locator('[data-evidence-sensitivity="redacted"]');
      assert(await redacted.count() === 1, "redacted evidence field is missing");
      assert(await redacted.locator("[data-evidence-value]").count() === 0, "redacted evidence exposes a value");
    });
    await openAndCloseDrawer("查看任务", "bottom", "wide", screenshotNames[4], async (dialog) => {
      assert(await dialog.getByText("失败 1", { exact: true }).count() === 1, "failed Job count is hidden");
    });

    measuredGeometry.mobile390 = {
      contextBarHeight: mobileContextBox.height,
      fixedGlobalRailCount: 0,
      fixedProjectNavigatorCount: 0,
      fixedInspectorCount: 0,
      fixedJobShelfCount: 0,
      primaryCanvasCount: 1,
      maximumDialogCount: 1,
      horizontalOverflow: false,
    };

    await page.emulateMedia({ reducedMotion: "reduce" });
    reducedMotionResult = await page.locator('[data-wave-fixture]').evaluate((root) => {
      const nodes = [root, ...root.querySelectorAll("*")];
      const animationCounts = nodes.flatMap((node) => getComputedStyle(node).animationIterationCount.split(","));
      const transitionDurations = nodes.flatMap((node) => getComputedStyle(node).transitionDuration.split(",").map((value) => {
        const trimmed = value.trim();
        return trimmed.endsWith("ms") ? Number.parseFloat(trimmed) / 1000 : Number.parseFloat(trimmed) || 0;
      }));
      return {
        hasInfiniteAnimation: animationCounts.some((value) => value.trim() === "infinite"),
        maximumTransitionSeconds: Math.max(0, ...transitionDurations),
      };
    });
    assert(!reducedMotionResult.hasInfiniteAnimation, "reduced motion retains an infinite animation");
    assert(reducedMotionResult.maximumTransitionSeconds <= 0.01, `reduced motion transition delay is ${reducedMotionResult.maximumTransitionSeconds}s`);

    assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    assert(requestErrors.length === 0, `request errors: ${requestErrors.join(" | ")}`);
    assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`);
    assert(mutationRequests.length === 0, `mutation requests: ${mutationRequests.join(" | ")}`);
    assert(creatorApiRequests.length === 0, `Creator API requests: ${creatorApiRequests.join(" | ")}`);
    assert(externalRequests.length === 0, `external requests: ${externalRequests.join(" | ")}`);

    const screenshotSha256 = Object.fromEntries(
      screenshotNames.map((name) => [name, sha256File(path.join(artifactRoot, name))]),
    );
    const result = {
      schema: "acs.frontend-v3-wave-1a-browser-evidence.v1",
      frontendCommit: process.env.K2_CONTROL_PLANE_FRONTEND_SHA ?? gitValue("rev-parse", "HEAD"),
      frontendTree: gitValue("rev-parse", "HEAD^{tree}"),
      browserVersion: await browser.version(),
      viewports: [
        { width: 1920, height: 1080, theme: "dark" },
        { width: 1440, height: 900, theme: "light" },
        { width: 390, height: 844, theme: "dark" },
      ],
      measuredGeometry,
      drawerFocusRestore,
      keyboardResult,
      reducedMotionResult,
      consoleErrors,
      pageErrors,
      requestErrors,
      httpErrors,
      mutationRequests,
      creatorApiRequests,
      screenshots: screenshotNames,
      screenshotSha256,
      ok: true,
    };
    const resultPath = path.join(artifactRoot, "result.json");
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    console.log(`EVIDENCE_RESULT_SHA256=${sha256File(resultPath)}`);
  } catch (error) {
    const failure = {
      schema: "acs.frontend-v3-wave-1a-browser-evidence.v1",
      ok: false,
      error: error?.stack ?? String(error),
      consoleErrors,
      pageErrors,
      requestErrors,
      httpErrors,
      mutationRequests,
      creatorApiRequests,
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
