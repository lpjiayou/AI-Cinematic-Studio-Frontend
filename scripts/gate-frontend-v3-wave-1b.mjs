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
  process.env.FRONTEND_V3_WAVE_1B_ARTIFACT_ROOT
    ?? path.join(parentArtifactRoot, "frontend-v3-wave-1b"),
);
const projectRef = process.env.K2_CONTROL_PLANE_PROJECT_REF;
const browserChannel = process.env.K2_CONTROL_PLANE_BROWSER_CHANNEL;
const browserExecutable = process.env.K2_CONTROL_PLANE_BROWSER_EXECUTABLE;

if (!projectRef) throw new Error("K2_CONTROL_PLANE_PROJECT_REF must come from the live control-plane fixture");
fs.mkdirSync(artifactRoot, { recursive: true });

const globalNavigationOrder = ["首页", "项目", "快速创作", "资产", "任务", "作品"];
const projectNavigationOrder = ["概览", "故事", "剧本", "角色", "分镜", "生成", "音频", "剪辑", "审片", "交付"];
const projectNavigationIds = ["overview", "story", "script", "characters", "storyboard", "generation", "audio", "timeline", "review", "delivery"];
const screenshotNames = [
  "01-wave-1b-home-dark-1920x1080.png",
  "02-wave-1b-projects-light-1440x900.png",
  "03-wave-1b-overview-dark-1920x1080.png",
  "04-wave-1b-quick-create-blocked-1440x900.png",
  "05-wave-1b-mobile-home-navigation-390x844.png",
  "06-wave-1b-mobile-overview-navigation-390x844.png",
  "07-wave-1b-mobile-overview-evidence-390x844.png",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitValue(...arguments_) {
  return execFileSync("git", ["-C", frontendRoot, ...arguments_], { encoding: "utf8" }).trim();
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  });
}

function assertStaticBoundaries() {
  const featureRoot = path.join(frontendRoot, "src", "features", "creator-v3");
  const productionFiles = collectFiles(featureRoot).filter(
    (filePath) => !/\.test\.[cm]?[jt]sx?$/.test(filePath),
  );
  const forbidden = [
    "LOCAL_PROJECT_CLIENT_KEYS",
    "getLocalProjectPresentation",
    "ConnectedProductionWorkspace",
    "WorkspaceHomePage",
    "Provider token",
    "NEXT_PUBLIC_CORE",
    "executionMethod selector",
    "localStorage fixture fallback",
    "sessionStorage fixture fallback",
  ];
  for (const filePath of productionFiles) {
    const source = fs.readFileSync(filePath, "utf8");
    for (const token of forbidden) {
      assert(!source.includes(token), `${path.relative(frontendRoot, filePath)} contains forbidden token ${token}`);
    }
    if (filePath.endsWith(".css")) {
      assert(!/(?:#[\da-f]{3,8}|rgba?\(|hsla?\()/i.test(source), `${path.relative(frontendRoot, filePath)} contains a raw color`);
    }
  }

  const homeEntry = fs.readFileSync(path.join(frontendRoot, "src/app/creator/page.tsx"), "utf8");
  const projectsEntry = fs.readFileSync(path.join(frontendRoot, "src/app/creator/projects/page.tsx"), "utf8");
  assert(homeEntry.includes("CreatorHomeV3") && !homeEntry.includes("WorkspaceHomePage"), "Creator Home route was not atomically cut over");
  assert(projectsEntry.includes("ProjectCenterV3") && !projectsEntry.includes("ConnectedProjectBrowser"), "Project Center route was not atomically cut over");
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

async function requiredBox(locator, label) {
  const box = await locator.boundingBox();
  assert(box, `${label} is not visible`);
  return box;
}

async function navigationLabels(navigation) {
  return navigation.locator("[data-destination-id]").evaluateAll((links) => links.map((link) => (
    link.getAttribute("aria-label")
      ?? link.querySelector("[class*='destinationHeading'] > span:first-child")?.textContent?.trim()
      ?? link.querySelector("[class*='label']")?.textContent?.trim()
      ?? ""
  )));
}

async function visit(page, pathname, heading) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  assert(response && response.status() === 200, `${pathname} returned ${response?.status() ?? "no response"}`);
  if (heading) await page.locator("h1").filter({ hasText: heading }).first().waitFor({ timeout: 120_000 });
  return response;
}

async function ensureTheme(page, theme) {
  const current = await page.locator("html").getAttribute("data-theme");
  if (current === theme) return;
  const label = theme === "light" ? "切换为浅色主题" : "切换为深色主题";
  await page.getByRole("button", { name: label }).click();
  await page.locator(`html[data-theme="${theme}"]`).waitFor({ state: "attached" });
}

assertStaticBoundaries();

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
  const routesVisited = [];
  const legacyRouteResults = [];
  const blockedRouteResults = [];
  const measuredGeometry = {};
  const drawerFocusRestore = {};

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
    if (request.method() !== "GET") mutationRequests.push(`${request.method()} ${requestUrl.pathname}`);
    if (requestUrl.pathname.startsWith("/api/creator/")) {
      creatorApiRequests.push(`${request.method()} ${requestUrl.pathname}`);
    }
    if (requestUrl.origin !== baseUrl) externalRequests.push(`${request.method()} ${requestUrl.origin}`);
  });

  async function recordedVisit(pathname, heading) {
    await visit(page, pathname, heading);
    routesVisited.push(pathname);
  }

  async function openAndCloseDrawer(triggerName, expectedTitle, screenshotName, inspect) {
    const trigger = page.getByRole("button", { name: triggerName });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: expectedTitle });
    await dialog.waitFor({ state: "visible" });
    assert(await page.getByRole("dialog").count() === 1, `${triggerName} opened more than one dialog`);
    if (inspect) await inspect(dialog);
    if (screenshotName) await page.screenshot({ path: path.join(artifactRoot, screenshotName), fullPage: true });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    drawerFocusRestore[triggerName] = await focusIs(page, trigger);
    assert(drawerFocusRestore[triggerName], `${triggerName} did not restore focus`);
  }

  try {
    await recordedVisit("/creator", "创作首页");
    await ensureTheme(page, "dark");
    const homeGlobalNavigation = page.getByRole("navigation", { name: "V3 全局导航" });
    assert(await page.getByRole("banner").count() === 0, "Creator Home still renders UnifiedAppHeader");
    assert(JSON.stringify(await navigationLabels(homeGlobalNavigation)) === JSON.stringify(globalNavigationOrder), "Creator Home global navigation order changed");
    assert(await homeGlobalNavigation.getByText("AI 导演", { exact: true }).count() === 0, "AI Director appears in GlobalRail");
    assert(await page.getByRole("heading", { name: "项目制作", exact: true }).count() === 1, "Project mode is missing");
    assert(await page.getByRole("heading", { name: "快速创作", exact: true }).count() === 1, "Quick Create mode is missing");
    assert(await page.getByText("受限", { exact: true }).count() >= 1, "Quick Create is not visibly restricted");
    assert(await page.getByRole("button", { name: /生成/ }).count() === 0, "Creator Home exposes an enabled generation button");
    const overviewHref = `/creator/projects/${encodeURIComponent(projectRef)}/overview`;
    const homeProjectLink = page.locator(`a[href="${overviewHref}"]`).filter({ hasText: "继续项目" }).first();
    await homeProjectLink.waitFor({ state: "visible" });
    const homeProjectCard = homeProjectLink.locator("xpath=ancestor::article");
    const projectTitle = (await homeProjectCard.locator("h3").innerText()).trim();
    assert(projectTitle.length > 0, "Creator Home project title is missing");
    assert(!(await page.locator("body").innerText()).includes(projectRef), "Creator Home exposes projectRef as ordinary text");
    assert(!(await hasHorizontalOverflow(page)), "Creator Home has horizontal overflow at 1920px");
    measuredGeometry.home1920 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[0]), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await recordedVisit("/creator/projects", "项目");
    await ensureTheme(page, "light");
    assert(await page.locator('[data-creator-v3-shell="global"]').count() === 1, "Project Center does not use the V3 shell");
    assert(await page.getByRole("link", { name: "新建项目", exact: true }).count() === 1, "Project Center new-project entry changed");
    const centerProjectLink = page.locator(`a[href="${overviewHref}"]`).filter({ hasText: "打开项目" }).first();
    await centerProjectLink.waitFor({ state: "visible" });
    assert((await page.getByText("LOCAL_FIXTURE", { exact: true }).count()) === 0, "Project Center exposes LOCAL_FIXTURE content");
    assert(!(await page.locator("body").innerText()).includes(projectRef), "Project Center exposes projectRef as ordinary text");
    const search = page.getByRole("textbox", { name: "搜索当前集合" });
    await search.fill("__wave_1b_no_match__");
    await page.getByRole("heading", { name: "当前筛选没有匹配项目" }).waitFor({ state: "visible" });
    await search.fill("");
    await centerProjectLink.waitFor({ state: "visible" });
    assert(!(await hasHorizontalOverflow(page)), "Project Center has horizontal overflow at 1440px");
    measuredGeometry.projects1440 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[1]), fullPage: true });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await recordedVisit(overviewHref, projectTitle);
    await ensureTheme(page, "dark");
    assert(await page.getByRole("banner").count() === 0, "Project Overview still renders UnifiedAppHeader");
    assert(await page.locator('[data-creator-v3-shell="project"]').count() === 1, "Project Overview does not use the project V3 shell");
    assert((await page.locator("h1").first().innerText()).trim() === projectTitle, "Project Overview title did not come from Core");
    const projectNavigation = page.getByRole("navigation", { name: "V3 项目导航" });
    const ids = await projectNavigation.locator("[data-destination-id]").evaluateAll((links) => links.map((link) => link.getAttribute("data-destination-id")));
    assert(JSON.stringify(ids) === JSON.stringify(projectNavigationIds), "Project navigation order changed");
    assert(await projectNavigation.locator('[data-destination-id="overview"]').getAttribute("aria-current") === "page", "Overview is not active");
    const projectRoot = `/creator/projects/${encodeURIComponent(projectRef)}`;
    const expectedAvailable = {
      story: `${projectRoot}/planning/bible`,
      script: `${projectRoot}/content/script`,
      characters: `${projectRoot}/planning/characters`,
      review: `${projectRoot}/post`,
      delivery: `${projectRoot}/delivery`,
    };
    for (const [id, href] of Object.entries(expectedAvailable)) {
      assert(await projectNavigation.locator(`[data-destination-id="${id}"]`).getAttribute("href") === href, `${id} migration href changed`);
    }
    for (const id of ["storyboard", "generation", "audio", "timeline"]) {
      assert(await projectNavigation.locator(`[data-destination-id="${id}"]`).getAttribute("data-availability") === "blocked", `${id} is not blocked`);
    }
    const compatibilityLink = page.getByRole("link", { name: /查看历史兼容生产记录/ });
    assert(await compatibilityLink.getAttribute("href") === `${projectRoot}/production`, "history compatibility route changed");
    assert((await compatibilityLink.innerText()).includes("不是新的 Generation Studio"), "history route is not explicitly marked as non-Generation Studio");
    assert(await page.locator('[data-layer="ui"], [data-layer="runtime"], [data-layer="authority"], [data-layer="policy"]').count() === 4, "Project Overview authority layers changed");
    const overviewText = await page.locator("body").innerText();
    for (const prohibited of ["READY", "100%", "全部通过", "可发布", projectRef]) {
      assert(!overviewText.includes(prohibited), `Project Overview ordinary UI exposes ${prohibited}`);
    }
    const evidenceTrigger = page.getByRole("button", { name: "查看技术证据" });
    await evidenceTrigger.click();
    assert(await page.getByText(projectRef, { exact: true }).isVisible(), "restricted projectRef is missing from opened evidence");
    const evidenceClose = page.getByRole("button", { name: "收起技术证据" });
    await evidenceClose.click();
    const closedEvidenceTrigger = page.getByRole("button", { name: "查看技术证据" });
    assert(await focusIs(page, closedEvidenceTrigger), "desktop evidence close did not retain focus");
    assert(!(await hasHorizontalOverflow(page)), "Project Overview has horizontal overflow at 1920px");
    measuredGeometry.overview1920 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[2]), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await recordedVisit("/creator/create", "快速创作");
    await ensureTheme(page, "dark");
    assert(await page.locator('[data-blocker-class="runtime_unavailable"]').count() === 1, "Quick Create runtime blocker is missing");
    for (const required of [
      "Method-aware 前端接线和对应运行时尚未完成",
      "当前不能提交真实生成任务",
      "M10–M13 前端与运行时实施波次",
    ]) {
      assert(await page.getByText(required, { exact: true }).first().isVisible(), `Quick Create missing ${required}`);
    }
    for (const forbiddenButton of [/生成/, /模型/, /Provider/, /候选/]) {
      assert(await page.getByRole("button", { name: forbiddenButton }).count() === 0, `Quick Create exposes ${forbiddenButton}`);
    }
    assert(await page.getByRole("link", { name: "进入项目中心" }).getAttribute("href") === "/creator/projects", "Quick Create safe action changed");
    blockedRouteResults.push({ route: "/creator/create", title: "快速创作", blockerClass: "runtime_unavailable", ok: true });
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[3]), fullPage: true });

    const otherBlockedRoutes = [
      { route: "/creator/assets", title: "资产", blocker: "统一资产库产品面尚未完成", forbidden: /上传|选择|准入/ },
      { route: "/creator/jobs", title: "任务", blocker: "跨项目任务投影尚未接入", forbidden: /重试|取消/ },
      { route: "/creator/works", title: "作品", blocker: "作品与发布权限尚未开放", forbidden: /发布|下载 Master/ },
    ];
    for (const blocked of otherBlockedRoutes) {
      await recordedVisit(blocked.route, blocked.title);
      assert(await page.getByText(blocked.blocker, { exact: true }).first().isVisible(), `${blocked.route} blocker is missing`);
      assert(await page.getByRole("button", { name: blocked.forbidden }).count() === 0, `${blocked.route} exposes a fake action`);
      blockedRouteResults.push({ ...blocked, forbidden: String(blocked.forbidden), ok: true });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await recordedVisit("/creator", "创作首页");
    await ensureTheme(page, "dark");
    assert(await visibleCount(page.locator('[data-wave-region="global-rail-fixed"]')) === 0, "fixed GlobalRail is visible on mobile Home");
    assert(await visibleCount(page.locator("main")) === 1, "mobile Home requires exactly one main");
    assert(!(await hasHorizontalOverflow(page)), "mobile Home has horizontal overflow");
    await openAndCloseDrawer("打开全局导航", "全局导航", screenshotNames[4], async (dialog) => {
      const navigation = dialog.getByRole("navigation", { name: "移动端全局导航" });
      assert(JSON.stringify(await navigationLabels(navigation)) === JSON.stringify(globalNavigationOrder), "mobile global navigation order changed");
    });
    await openAndCloseDrawer("打开证据", "技术证据", null, async (dialog) => {
      assert(await dialog.getByText("Creator Core 项目集合", { exact: true }).count() >= 1, "mobile Home evidence is missing");
    });
    await openAndCloseDrawer("打开任务", "任务", null, async (dialog) => {
      assert(await dialog.getByText("跨项目任务投影尚未接入", { exact: true }).count() >= 1, "mobile Home job boundary is missing");
      assert(await dialog.getByText("当前没有活动任务", { exact: true }).count() === 1, "mobile Home invents jobs");
    });
    measuredGeometry.mobileHome390 = { fixedGlobalRailCount: 0, mainCount: 1, horizontalOverflow: false };

    await recordedVisit(overviewHref, projectTitle);
    const mobileContext = await requiredBox(page.locator('[data-wave-region="context-bar"]'), "mobile ProjectContextBar");
    assert(Math.abs(mobileContext.height - 56) <= 1, `mobile ProjectContextBar expected 56 ±1, got ${mobileContext.height}`);
    assert(await visibleCount(page.locator('[data-wave-region="project-navigator-fixed"]')) === 0, "fixed ProjectNavigator is visible on mobile Overview");
    assert(await visibleCount(page.locator("main")) === 1, "mobile Overview requires exactly one main");
    assert(!(await page.locator("body").innerText()).includes(projectRef), "mobile Overview exposes projectRef before evidence opens");
    assert(!(await hasHorizontalOverflow(page)), "mobile Overview has horizontal overflow");
    await openAndCloseDrawer("打开项目导航", "项目导航", screenshotNames[5], async (dialog) => {
      const navigation = dialog.getByRole("navigation", { name: "移动端项目导航" });
      assert(await navigation.getByRole("link").count() === 10, "mobile project navigation count changed");
      for (const id of ["storyboard", "generation", "audio", "timeline"]) {
        assert(await navigation.locator(`[data-destination-id="${id}"]`).getAttribute("data-availability") === "blocked", `mobile ${id} reason is not discoverable`);
      }
    });
    await openAndCloseDrawer("打开 Authority/Evidence", "技术证据", screenshotNames[6], async (dialog) => {
      assert(await dialog.getByText(projectRef, { exact: true }).isVisible(), "mobile explicit evidence does not reveal restricted projectRef");
    });
    measuredGeometry.mobileOverview390 = {
      contextBarHeight: mobileContext.height,
      fixedProjectNavigatorCount: 0,
      mainCount: 1,
      horizontalOverflow: false,
    };

    const legacyProjectRef = "future-city";
    const legacyRoutes = [
      "/creator/ai-director",
      "/creator/projects/new",
      `/creator/projects/${legacyProjectRef}/planning/bible`,
      `/creator/projects/${legacyProjectRef}/content/script`,
      `/creator/projects/${legacyProjectRef}/production`,
      `/creator/projects/${legacyProjectRef}/post`,
      `/creator/projects/${legacyProjectRef}/delivery`,
    ];
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of legacyRoutes) {
      await recordedVisit(route);
      await page.getByRole("banner").waitFor({ state: "visible", timeout: 120_000 });
      assert(await page.locator('[data-creator-v3-shell]').count() === 0, `${route} incorrectly uses V3 shell`);
      assert(await page.getByText("404", { exact: true }).count() === 0, `${route} is a 404`);
      legacyRouteResults.push({ route, shell: "legacy", httpStatus: 200, ok: true });
    }

    const allowedCreatorRequest = /^GET \/api\/creator\/(?:capabilities|projects(?:\/[^/]+)?)$/;
    const unexpectedCreatorRequests = creatorApiRequests.filter((entry) => !allowedCreatorRequest.test(entry));
    assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    assert(requestErrors.length === 0, `request errors: ${requestErrors.join(" | ")}`);
    assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`);
    assert(mutationRequests.length === 0, `mutation requests: ${mutationRequests.join(" | ")}`);
    assert(unexpectedCreatorRequests.length === 0, `unexpected Creator API requests: ${unexpectedCreatorRequests.join(" | ")}`);
    assert(externalRequests.length === 0, `external requests: ${externalRequests.join(" | ")}`);
    assert(screenshotNames.every((name) => fs.existsSync(path.join(artifactRoot, name))), "one or more Wave 1B screenshots are missing");

    const screenshotSha256 = Object.fromEntries(
      screenshotNames.map((name) => [name, sha256File(path.join(artifactRoot, name))]),
    );
    const result = {
      schema: "acs.frontend-v3-wave-1b-browser-evidence.v1",
      frontendCommit: process.env.K2_CONTROL_PLANE_FRONTEND_SHA ?? gitValue("rev-parse", "HEAD"),
      frontendTree: process.env.K2_CONTROL_PLANE_FRONTEND_TREE ?? gitValue("rev-parse", "HEAD^{tree}"),
      coreCommit: process.env.K2_CONTROL_PLANE_CORE_SHA,
      coreTree: process.env.K2_CONTROL_PLANE_CORE_TREE,
      browserVersion: await browser.version(),
      projectRefSource: "control-plane-fixture",
      routesVisited,
      viewports: [
        { route: "/creator", width: 1920, height: 1080, theme: "dark" },
        { route: "/creator/projects", width: 1440, height: 900, theme: "light" },
        { route: overviewHref, width: 1920, height: 1080, theme: "dark" },
        { route: "/creator/create", width: 1440, height: 900, theme: "dark" },
        { route: "/creator", width: 390, height: 844, theme: "dark" },
        { route: overviewHref, width: 390, height: 844, theme: "dark" },
      ],
      globalNavigationOrder,
      projectNavigationOrder,
      legacyRouteResults,
      blockedRouteResults,
      measuredGeometry,
      drawerFocusRestore,
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
    console.log(`WAVE_1B_EVIDENCE_RESULT_SHA256=${sha256File(resultPath)}`);
  } catch (error) {
    const failure = {
      schema: "acs.frontend-v3-wave-1b-browser-evidence.v1",
      ok: false,
      error: error?.stack ?? String(error),
      consoleErrors,
      pageErrors,
      requestErrors,
      httpErrors,
      mutationRequests,
      creatorApiRequests,
      routesVisited,
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
