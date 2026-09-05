import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import {
  EXPECTED_NEXT_RSC_ABORT,
  classifyWave1BRequestFailure,
} from "./gate-frontend-v3-wave-1b-request-policy.mjs";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (process.env.K2_CONTROL_PLANE_FRONTEND_ORIGIN ?? "http://127.0.0.1:3101").replace(/\/$/, "");
const baseOrigin = new URL(baseUrl).origin;
const parentArtifactRoot = path.resolve(
  process.env.K2_CONTROL_PLANE_ARTIFACT_ROOT ?? "artifacts/k2-control-plane-e2e",
);
const artifactRoot = path.resolve(
  process.env.FRONTEND_V3_WAVE_1C_ARTIFACT_ROOT
    ?? path.join(parentArtifactRoot, "frontend-v3-wave-1c"),
);
const projectRef = process.env.K2_CONTROL_PLANE_PROJECT_REF;
const seriesRef = process.env.K2_CONTROL_PLANE_SERIES_REF;
const episodeRef = process.env.K2_CONTROL_PLANE_EPISODE_REF;
const browserChannel = process.env.K2_CONTROL_PLANE_BROWSER_CHANNEL;
const browserExecutable = process.env.K2_CONTROL_PLANE_BROWSER_EXECUTABLE;

if (!projectRef || !seriesRef || !episodeRef) {
  throw new Error("Wave 1C requires projectRef, seriesRef and episodeRef from the live control-plane fixture");
}
fs.mkdirSync(artifactRoot, { recursive: true });

const projectNavigationOrder = ["概览", "故事", "剧本", "角色", "分镜", "生成", "音频", "剪辑", "审片", "交付"];
const screenshotNames = [
  "01-wave-1c-story-dark-1920x1080.png",
  "02-wave-1c-script-light-1440x900.png",
  "03-wave-1c-script-unsaved-guard-1440x900.png",
  "04-wave-1c-characters-dark-1920x1080.png",
  "05-wave-1c-mobile-story-390x844.png",
  "06-wave-1c-mobile-script-guard-390x844.png",
  "07-wave-1c-mobile-characters-390x844.png",
];

const protectedFiles = {
  "src/app/creator/projects/[projectRef]/planning/bible/connected-story-world.tsx": "c24f5c040bbc40542b5870925da44cd4304eebd3e62f3d9ff29018b9035d67a3",
  "src/app/creator/projects/[projectRef]/planning/bible/story-world.tsx": "f21bfe4e70d90ad92f50b00164def4a43022bccbcc16e4989d73f74169d45782",
  "src/app/creator/projects/[projectRef]/planning/bible/story-world.module.css": "3efec5a5608ab4c004de8b3766bb94ea7244377e13e60db65658ca6097488b81",
  "src/app/creator/projects/[projectRef]/planning/connected-workspace.module.css": "b6e6d85cc7efefd80ebde6225d70a878bfbe0beaf3392158bf9ece63b527d23d",
  "src/app/creator/projects/[projectRef]/content/script/connected-script-studio.tsx": "6431109120aa392f1152ddebe1bb33dd204ba4aa01826ebf6b0109bbe004194a",
  "src/app/creator/projects/[projectRef]/content/script/script-workspace.module.css": "057dd4dd7f130da308289c8725318a464038d5f8d9033193f12f900ec19e65cb",
  "src/app/creator/projects/[projectRef]/planning/characters/connected-character-studio.tsx": "608052b41867d1eaa61ca48550ece6bb3812f478d4dafc89ba0e42318adef6c4",
  "src/app/creator/projects/[projectRef]/planning/characters/character-studio.tsx": "ecc169adc9bf28537e240544dfeeeff79e52323fd3b5cd9d07e943e6949e2472",
  "src/app/creator/projects/[projectRef]/planning/characters/character-studio.module.css": "cd4f7d8a6d71d093fd78efbd71a1d536c960b897a0a6ada810bb499dd96bbd1f",
  "src/features/core-integration/experience-adapter.ts": "3866ab83b93e01a5a26d8a67b847fb3eca29dd8929b44b54cd550cdca05e8781",
  "src/features/core-integration/browser-client.ts": "8c13e670a491f175d4986cd4f4308ca689e3e966817f28f0adcbc964a6ab7635",
  "src/features/core-integration/contracts.ts": "832423f03fbb3de6ec920c66d5ee111bdd4ef44324a8819e329b8a824f451804",
  "package.json": "f6341832103f45b79f4d6171afb9a4c40964e0c2eeed824cf43b35e251207348",
  "package-lock.json": "02db16eb14d209ca0329f963de11cc4ff6112395d98375ba8588a2c3c604abe0",
  ".github/workflows/frontend-ci.yml": "73973667d0638aa9088839c8ce41fd3ea49fb64e6e36065b97cb9caa8ddd41db",
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function gitValue(...arguments_) {
  return execFileSync("git", ["-C", frontendRoot, ...arguments_], { encoding: "utf8" }).trim();
}

function sha256Buffer(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
  });
}

function assertStaticBoundaries() {
  for (const [relativePath, expectedHash] of Object.entries(protectedFiles)) {
    const actualHash = sha256File(path.join(frontendRoot, relativePath));
    assert(actualHash === expectedHash, `${relativePath} changed across the Wave 1C protected boundary`);
  }

  const canonicalEntries = {
    story: "StoryWorkspaceV3",
    script: "ScriptStudioV3",
    characters: "CharacterStudioV3",
  };
  for (const [destination, component] of Object.entries(canonicalEntries)) {
    const entryPath = path.join(frontendRoot, `src/app/creator/projects/[projectRef]/${destination}/page.tsx`);
    assert(fs.existsSync(entryPath), `canonical ${destination} route is missing`);
    const source = fs.readFileSync(entryPath, "utf8");
    assert(source.includes(component), `canonical ${destination} route does not render ${component}`);
    assert(!source.includes('"use client"'), `canonical ${destination} route became a Client Module`);
    assert(!/creatorRequest|force-dynamic|ssr:\s*false/.test(source), `canonical ${destination} route exceeds its entry boundary`);
  }

  const aliases = {
    "planning/bible": "story",
    "content/script": "script",
    "planning/characters": "characters",
  };
  for (const [legacy, canonical] of Object.entries(aliases)) {
    const source = fs.readFileSync(
      path.join(frontendRoot, `src/app/creator/projects/[projectRef]/${legacy}/page.tsx`),
      "utf8",
    );
    assert(source.includes('import { redirect } from "next/navigation";'), `${legacy} is not a server redirect`);
    assert(source.includes(`/${canonical}\`);`), `${legacy} does not preserve projectRef into ${canonical}`);
    assert(!/ConnectedStoryWorld|ConnectedScriptStudio|ConnectedCharacterStudio|useEffect/.test(source), `${legacy} still imports a legacy client body`);
  }

  const workspaceRoot = path.join(frontendRoot, "src/features/creator-v3/workspaces");
  const productionFiles = collectFiles(workspaceRoot).filter(
    (filePath) => !/\.test\.[cm]?[jt]sx?$/.test(filePath),
  );
  const forbidden = [
    "ConnectedStoryWorld",
    "ConnectedScriptStudio",
    "ConnectedCharacterStudio",
    "StoryWorldPage",
    "CharacterStudioPage",
    "WorkspaceHomePage",
    "LOCAL_PROJECT_CLIENT_KEYS",
    "getLocalProjectPresentation",
    "ConnectedProductionWorkspace",
    "NEXT_PUBLIC_CORE",
    "axios",
    "localStorage",
    "sessionStorage",
    "executionMethod",
    "crypto.randomUUID",
    "nanoid",
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

  const storySource = fs.readFileSync(path.join(workspaceRoot, "story/use-story-workspace-v3.ts"), "utf8");
  const scriptSource = fs.readFileSync(path.join(workspaceRoot, "script/use-script-workspace-v3.ts"), "utf8");
  const characterSource = fs.readFileSync(path.join(workspaceRoot, "characters/use-character-workspace-v3.ts"), "utf8");
  for (const token of ["projects/", "series-planning-workspaces", "series-intelligence-workspaces", "series-plan-candidates", "series-plans/confirm-candidate"]) {
    assert(storySource.includes(token), `Story approved resource is missing: ${token}`);
  }
  for (const token of ["projects/", "series/", "script-workspaces", '"episodes"', "script-versions/generate", "script-versions/manual", "script-versions/confirm"]) {
    assert(scriptSource.includes(token), `Script approved resource is missing: ${token}`);
  }
  for (const token of ["projects/", "series-planning-workspaces", "series-intelligence-workspaces"]) {
    assert(characterSource.includes(token), `Character approved resource is missing: ${token}`);
  }
  const combinedDataSource = `${storySource}\n${scriptSource}\n${characterSource}`;
  for (const token of ["execution-method-plan", "method-aware-input-plan", "method-aware-video-route", "explicit-audio-requirement-route"]) {
    assert(!combinedDataSource.includes(token), `Wave 1C illegally reaches ${token}`);
  }

  return {
    protectedFileCount: Object.keys(protectedFiles).length,
    oldImplementationBodyDiff: 0,
    methodAwareAdapterDiff: 0,
    corePinDiff: 0,
  };
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
    link.querySelector("[class*='label']")?.textContent?.trim() ?? ""
  )));
}

async function assertV3ProjectShell(page, label) {
  assert(await page.locator('[data-creator-v3-shell="project"]').count() === 1, `${label} requires exactly one project V3 shell`);
  assert(await page.locator('header[data-wave-region="context-bar"]').count() === 1, `${label} requires exactly one V3 context header`);
  assert(await page.locator("header[data-mode]").count() === 0, `${label} rendered the legacy header`);
}

async function ensureTheme(page, theme) {
  const current = await page.locator("html").getAttribute("data-theme");
  if (current === theme) return;
  const label = theme === "light" ? "切换为浅色主题" : "切换为深色主题";
  await page.getByRole("button", { name: label }).click();
  await page.locator(`html[data-theme="${theme}"]`).waitFor({ state: "attached" });
}

function assertNoOrdinaryRefs(text, label) {
  for (const ref of [projectRef, seriesRef, episodeRef]) {
    assert(!text.includes(ref), `${label} exposes restricted ref ${ref}`);
  }
}

const staticBoundary = assertStaticBoundaries();
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
  const expectedNextRscAborts = [];
  const httpErrors = [];
  const mutationRequests = [];
  const creatorApiRequests = [];
  const externalRequests = [];
  const routesVisited = [];
  const redirectResults = [];
  const workspaceStates = {};
  const measuredGeometry = {};
  const drawerFocusRestore = {};
  const scriptJobCenterUnsavedGuard = {
    modalOpened: false,
    navigationBlocked: false,
    draftPreserved: false,
    focusRestored: false,
  };
  const scriptMobileProjectNavigationGuard = {
    drawerOpenDoesNotPrompt: false,
    routeLinkTriggersPrompt: false,
    navigationBlocked: false,
    draftPreserved: false,
    modalFocusRestoredToRouteLink: false,
    drawerCloseFocusRestoredToTrigger: false,
    mutationRequestCount: 0,
  };
  const unsavedGuardResult = {
    desktopModalActions: [],
    desktopStayFocusRestored: false,
    mobileModalCount: 0,
    mobileStayFocusRestored: false,
    postRequests: 0,
  };

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "failed";
    const classification = classifyWave1BRequestFailure({
      baseOrigin,
      method: request.method(),
      url: request.url(),
      errorText,
      isNavigationRequest: request.isNavigationRequest(),
      resourceType: request.resourceType(),
    });
    if (classification.classification === EXPECTED_NEXT_RSC_ABORT) {
      expectedNextRscAborts.push(classification.evidence);
      return;
    }
    requestErrors.push(`${request.method()} ${request.url()} ${errorText}`);
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
    if (requestUrl.origin !== baseOrigin) externalRequests.push(`${request.method()} ${requestUrl.origin}`);
  });

  async function visit(pathname, heading) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
    assert(response && response.status() === 200, `${pathname} returned ${response?.status() ?? "no response"}`);
    await page.getByRole("heading", { name: heading, level: 1, exact: true }).waitFor({ timeout: 120_000 });
    routesVisited.push(pathname);
    return response;
  }

  async function closeDrawerAndCheckFocus(trigger, dialog, key) {
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    drawerFocusRestore[key] = await focusIs(page, trigger);
    assert(drawerFocusRestore[key], `${key} drawer did not restore focus`);
  }

  const encodedProjectRef = encodeURIComponent(projectRef);
  const projectRoot = `/creator/projects/${encodedProjectRef}`;
  const canonicalRoutes = {
    story: `${projectRoot}/story`,
    script: `${projectRoot}/script`,
    characters: `${projectRoot}/characters`,
  };

  try {
    await visit(canonicalRoutes.story, "故事");
    await ensureTheme(page, "dark");
    await assertV3ProjectShell(page, "Story");
    const storyNavigation = page.getByRole("navigation", { name: "V3 项目导航" });
    assert(JSON.stringify(await navigationLabels(storyNavigation)) === JSON.stringify(projectNavigationOrder), "Story project navigation order changed");
    assert(await storyNavigation.locator('[data-destination-id="story"]').getAttribute("aria-current") === "page", "Story is not active");
    const storyState = await page.locator("[data-story-state]").getAttribute("data-story-state");
    assert(["plan-missing", "plan-ready", "authority-blocked", "authority-ready"].includes(storyState), `unexpected Story state ${storyState}`);
    workspaceStates.story = storyState;
    if (storyState === "plan-missing") {
      assert(await page.getByRole("textbox", { name: "系列规划创意输入" }).isVisible(), "Story plan input is missing");
    }
    if (storyState === "authority-blocked") {
      const blocker = page.locator('[data-blocker-class="authority_required"]');
      for (const label of ["原因", "后果", "负责方"]) assert(await blocker.getByText(label, { exact: true }).count() >= 1, `Story blocker misses ${label}`);
    }
    assert(await page.locator('[data-layer="ui"], [data-layer="runtime"], [data-layer="authority"], [data-layer="policy"]').count() === 4, "Story authority layers changed");
    const storyText = await page.locator("body").innerText();
    assertNoOrdinaryRefs(storyText, "Story");
    assert(!storyText.includes("LOCAL_FIXTURE"), "Story exposes a local fixture fallback");
    assert(!storyText.includes("ConnectedStoryWorld"), "Story exposes a legacy body marker");
    assert(!(await hasHorizontalOverflow(page)), "Story has horizontal overflow at 1920px");
    measuredGeometry.story1920 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[0]), fullPage: true });

    await page.setViewportSize({ width: 1440, height: 900 });
    await visit(canonicalRoutes.script, "剧本");
    await ensureTheme(page, "light");
    await assertV3ProjectShell(page, "Script");
    const scriptNavigation = page.getByRole("navigation", { name: "V3 项目导航" });
    assert(await scriptNavigation.locator('[data-destination-id="script"]').getAttribute("aria-current") === "page", "Script is not active");
    const scriptState = await page.locator("[data-script-state]").getAttribute("data-script-state");
    assert(["no-episode", "no-script", "script-ready"].includes(scriptState), `unexpected Script state ${scriptState}`);
    workspaceStates.script = scriptState;
    assert(await page.getByRole("heading", { name: "Reviewed Import 尚未接入当前 Frontend Adapter" }).count() === 1, "Reviewed Import blocker is missing");
    assertNoOrdinaryRefs(await page.locator("body").innerText(), "Script");
    assert(!(await hasHorizontalOverflow(page)), "Script has horizontal overflow at 1440px");
    measuredGeometry.script1440 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[1]), fullPage: true });

    assert(scriptState === "script-ready", "control-plane fixture must exercise the Script unsaved guard");
    assert(await page.locator('[data-workspace-local-rail="script"]').isVisible(), "Script scene navigator is missing");
    assert(await page.getByRole("tab", { name: "编辑" }).count() === 1 && await page.getByRole("tab", { name: "对比" }).count() === 1, "Script edit/compare controls are missing");
    const desktopSynopsis = page.getByRole("textbox", { name: "故事梗概" });
    const originalSynopsis = await desktopSynopsis.inputValue();
    await desktopSynopsis.fill(`${originalSynopsis}（Wave 1C 未保存验证）`);
    assert(await page.locator('[data-script-dirty="true"]').isVisible(), "Script dirty state is missing");
    const storyLink = scriptNavigation.locator('[data-destination-id="story"]');
    await storyLink.click();
    const unsavedDialog = page.getByRole("dialog", { name: "离开前保存修改？" });
    await unsavedDialog.waitFor({ state: "visible" });
    assert(await page.getByRole("dialog").count() === 1, "desktop unsaved guard opened multiple dialogs");
    unsavedGuardResult.desktopModalActions = ["保存并继续", "放弃修改并继续", "留在当前页面"];
    for (const label of unsavedGuardResult.desktopModalActions) {
      assert(await unsavedDialog.getByRole("button", { name: label, exact: true }).count() === 1, `desktop unsaved guard misses ${label}`);
    }
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[2]), fullPage: true });
    await unsavedDialog.getByRole("button", { name: "留在当前页面", exact: true }).click();
    await unsavedDialog.waitFor({ state: "detached" });
    unsavedGuardResult.desktopStayFocusRestored = await focusIs(page, storyLink);
    assert(unsavedGuardResult.desktopStayFocusRestored, "desktop unsaved guard did not restore focus");
    const jobCenterDraft = await desktopSynopsis.inputValue();
    const desktopJobCenter = page.locator('[data-wave-region="job-shelf-fixed"]').getByRole("button", { name: "打开任务中心", exact: true });
    await desktopJobCenter.click();
    await unsavedDialog.waitFor({ state: "visible" });
    scriptJobCenterUnsavedGuard.modalOpened = await unsavedDialog.isVisible();
    scriptJobCenterUnsavedGuard.navigationBlocked = new URL(page.url()).pathname === canonicalRoutes.script;
    assert(scriptJobCenterUnsavedGuard.navigationBlocked, "Job Center bypassed the Script unsaved guard");
    for (const label of ["保存并继续", "放弃修改并继续", "留在当前页面"]) {
      assert(await unsavedDialog.getByRole("button", { name: label, exact: true }).count() === 1, `Job Center guard misses ${label}`);
    }
    assert(mutationRequests.length === 0, "Job Center guard issued a mutation");
    await unsavedDialog.getByRole("button", { name: "留在当前页面", exact: true }).click();
    await unsavedDialog.waitFor({ state: "detached" });
    await page.waitForFunction((element) => document.activeElement === element, await desktopJobCenter.elementHandle());
    scriptJobCenterUnsavedGuard.focusRestored = await focusIs(page, desktopJobCenter);
    scriptJobCenterUnsavedGuard.draftPreserved = await desktopSynopsis.inputValue() === jobCenterDraft;
    assert(scriptJobCenterUnsavedGuard.focusRestored, "Job Center guard did not restore its trigger focus");
    assert(scriptJobCenterUnsavedGuard.draftPreserved, "Job Center guard lost the Script draft");
    assert(new URL(page.url()).pathname === canonicalRoutes.script, "Job Center guard navigated after staying");
    assert(mutationRequests.length === 0, "Job Center stay issued a mutation");
    await desktopSynopsis.fill(originalSynopsis);
    await page.locator('[data-script-dirty="false"]').waitFor({ state: "visible" });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await visit(canonicalRoutes.characters, "角色");
    await ensureTheme(page, "dark");
    await assertV3ProjectShell(page, "Characters");
    const characterNavigation = page.getByRole("navigation", { name: "V3 项目导航" });
    assert(await characterNavigation.locator('[data-destination-id="characters"]').getAttribute("aria-current") === "page", "Characters is not active");
    const characterState = await page.locator("[data-character-state]").getAttribute("data-character-state");
    assert(["source-missing", "authority-blocked", "ready-empty", "ready"].includes(characterState), `unexpected Character state ${characterState}`);
    workspaceStates.characters = characterState;
    assert(await page.getByRole("button", { name: /AI 生成角色|创建角色|确认角色/ }).count() === 0, "Character exposes a write action");
    assert(!(await page.locator("body").innerText()).includes("本地角色视觉参考"), "Character exposes a legacy local card");
    assert(await page.locator('[data-layer="ui"], [data-layer="runtime"], [data-layer="authority"], [data-layer="policy"]').count() === 4, "Character authority layers changed");
    assertNoOrdinaryRefs(await page.locator("body").innerText(), "Characters");
    assert(!(await hasHorizontalOverflow(page)), "Characters has horizontal overflow at 1920px");
    measuredGeometry.characters1920 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[3]), fullPage: true });

    const aliases = [
      [`${projectRoot}/planning/bible`, canonicalRoutes.story, "故事"],
      [`${projectRoot}/content/script`, canonicalRoutes.script, "剧本"],
      [`${projectRoot}/planning/characters`, canonicalRoutes.characters, "角色"],
    ];
    for (const [legacyRoute, canonicalRoute, heading] of aliases) {
      const response = await page.goto(`${baseUrl}${legacyRoute}`, { waitUntil: "networkidle" });
      const finalPath = new URL(page.url()).pathname;
      assert(response && response.status() === 200, `${legacyRoute} did not finish with HTTP 200`);
      assert(finalPath === canonicalRoute, `${legacyRoute} redirected to ${finalPath}`);
      await page.getByRole("heading", { name: heading, level: 1, exact: true }).waitFor({ timeout: 120_000 });
      await assertV3ProjectShell(page, `redirect ${legacyRoute}`);
      routesVisited.push(legacyRoute);
      redirectResults.push({ from: legacyRoute, to: finalPath, httpStatus: response.status(), shell: "v3", ok: true });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await visit(canonicalRoutes.story, "故事");
    await ensureTheme(page, "dark");
    const storyContext = await requiredBox(page.locator('[data-wave-region="context-bar"]'), "mobile Story context");
    assert(Math.abs(storyContext.height - 56) <= 1, `mobile Story context expected 56 ±1, got ${storyContext.height}`);
    assert(await visibleCount(page.locator('[data-wave-region="global-rail-fixed"]')) === 0, "mobile Story fixed GlobalRail is visible");
    assert(await visibleCount(page.locator('[data-wave-region="project-navigator-fixed"]')) === 0, "mobile Story fixed ProjectNavigator is visible");
    assert(await visibleCount(page.locator("main")) === 1, "mobile Story requires one main");
    assert(await page.locator('[data-workspace-section-selector="story"]').isVisible(), "mobile Story section selector is missing");
    const storyProjectTrigger = page.getByRole("button", { name: "打开项目导航" });
    await storyProjectTrigger.click();
    const storyProjectDrawer = page.getByRole("dialog", { name: "项目导航" });
    await storyProjectDrawer.waitFor({ state: "visible" });
    assert(await page.getByRole("dialog").count() === 1, "mobile Story opened multiple drawers");
    assert(await storyProjectDrawer.getByRole("navigation", { name: "移动端项目导航" }).getByRole("link").count() === 10, "mobile Story project navigation is incomplete");
    await closeDrawerAndCheckFocus(storyProjectTrigger, storyProjectDrawer, "mobileStoryProjectNavigation");
    const storyEvidenceTrigger = page.getByRole("button", { name: "打开 Authority/Evidence" });
    await storyEvidenceTrigger.click();
    const storyEvidenceDrawer = page.getByRole("dialog", { name: "技术证据" });
    await storyEvidenceDrawer.waitFor({ state: "visible" });
    assert(await page.getByRole("dialog").count() === 1, "mobile Story evidence opened multiple dialogs");
    await closeDrawerAndCheckFocus(storyEvidenceTrigger, storyEvidenceDrawer, "mobileStoryEvidence");
    assert(!(await hasHorizontalOverflow(page)), "mobile Story has horizontal overflow");
    measuredGeometry.mobileStory390 = { contextBarHeight: storyContext.height, horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[4]), fullPage: true });

    await visit(canonicalRoutes.script, "剧本");
    assert(await visibleCount(page.locator("main")) === 1, "mobile Script requires one main");
    assert(await visibleCount(page.locator('[data-workspace-local-rail="script"]')) === 0, "mobile Script fixed scene rail is visible");
    assert(await page.getByRole("combobox", { name: "移动端选择分集" }).isVisible(), "mobile Script Episode selector is missing");
    assert(await page.locator('[data-workspace-section-selector="script"]').isVisible(), "mobile Script mode selector is missing");
    assert(await page.locator("details").filter({ hasText: "场景列表" }).isVisible(), "mobile Script scene disclosure is missing");
    const mobileSynopsis = page.getByRole("textbox", { name: "故事梗概" });
    const mobileOriginalSynopsis = await mobileSynopsis.inputValue();
    await mobileSynopsis.fill(`${mobileOriginalSynopsis}（移动端未保存验证）`);
    const mobileDraft = await mobileSynopsis.inputValue();
    const mobileNavigationTrigger = page.getByRole("button", { name: "打开项目导航" });
    await mobileNavigationTrigger.click();
    const mobileProjectDrawer = page.getByRole("dialog", { name: "项目导航", exact: true });
    await mobileProjectDrawer.waitFor({ state: "visible" });
    const mobileGuardDialog = page.getByRole("dialog", { name: "离开前保存修改？" });
    assert(await page.getByRole("dialog").count() === 1, "opening project navigation must open only one Drawer");
    scriptMobileProjectNavigationGuard.drawerOpenDoesNotPrompt = await mobileGuardDialog.count() === 0;
    assert(scriptMobileProjectNavigationGuard.drawerOpenDoesNotPrompt, "opening the project Drawer incorrectly prompts to save");
    assert(new URL(page.url()).pathname === canonicalRoutes.script, "opening the project Drawer navigated");
    assert(await mobileSynopsis.inputValue() === mobileDraft, "opening the project Drawer lost the draft");
    assert(mutationRequests.length === 0, "opening the project Drawer issued a mutation");

    const mobileOverviewLink = mobileProjectDrawer.locator('[data-destination-id="overview"]');
    assert(await mobileOverviewLink.getAttribute("href") === `${projectRoot}/overview`, "mobile overview link targets the wrong project");
    await mobileOverviewLink.click();
    await mobileGuardDialog.waitFor({ state: "visible" });
    scriptMobileProjectNavigationGuard.routeLinkTriggersPrompt = await mobileGuardDialog.isVisible();
    scriptMobileProjectNavigationGuard.navigationBlocked = new URL(page.url()).pathname === canonicalRoutes.script;
    assert(scriptMobileProjectNavigationGuard.navigationBlocked, "mobile route link navigated before a guard decision");
    assert(await mobileSynopsis.inputValue() === mobileDraft, "mobile route guard lost the draft");
    assert(mutationRequests.length === 0, "mobile route guard issued a mutation");
    for (const label of ["保存并继续", "放弃修改并继续", "留在当前页面"]) {
      assert(await mobileGuardDialog.getByRole("button", { name: label, exact: true }).count() === 1, `mobile route guard misses ${label}`);
    }
    unsavedGuardResult.mobileModalCount = await mobileGuardDialog.count();
    assert(unsavedGuardResult.mobileModalCount === 1, "mobile Script guard requires exactly one dialog");
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[5]), fullPage: true });
    await mobileGuardDialog.getByRole("button", { name: "留在当前页面", exact: true }).click();
    await mobileGuardDialog.waitFor({ state: "detached" });
    assert(await mobileProjectDrawer.isVisible(), "staying closed the project Drawer");
    await page.waitForFunction((element) => document.activeElement === element, await mobileOverviewLink.elementHandle());
    unsavedGuardResult.mobileStayFocusRestored = await focusIs(page, mobileOverviewLink);
    assert(unsavedGuardResult.mobileStayFocusRestored, "mobile Script guard did not restore focus");
    scriptMobileProjectNavigationGuard.modalFocusRestoredToRouteLink = unsavedGuardResult.mobileStayFocusRestored;
    scriptMobileProjectNavigationGuard.draftPreserved = await mobileSynopsis.inputValue() === mobileDraft;
    assert(scriptMobileProjectNavigationGuard.draftPreserved, "mobile stay lost the draft");
    assert(await page.locator('[data-script-dirty="true"]').count() === 1, "mobile stay cleared dirty state");
    assert(new URL(page.url()).pathname === canonicalRoutes.script, "mobile stay navigated");
    assert(mutationRequests.length === 0, "mobile stay issued a mutation");

    await page.keyboard.press("Escape");
    await mobileProjectDrawer.waitFor({ state: "detached" });
    await page.waitForFunction((element) => document.activeElement === element, await mobileNavigationTrigger.elementHandle());
    scriptMobileProjectNavigationGuard.drawerCloseFocusRestoredToTrigger = await focusIs(page, mobileNavigationTrigger);
    assert(scriptMobileProjectNavigationGuard.drawerCloseFocusRestoredToTrigger, "closing the project Drawer did not restore its own trigger");
    assert(await mobileGuardDialog.count() === 0, "closing the project Drawer incorrectly prompts to save");
    assert(new URL(page.url()).pathname === canonicalRoutes.script, "closing the project Drawer navigated");
    scriptMobileProjectNavigationGuard.mutationRequestCount = mutationRequests.length;
    assert(scriptMobileProjectNavigationGuard.mutationRequestCount === 0, "closing the project Drawer issued a mutation");
    await mobileSynopsis.fill(mobileOriginalSynopsis);
    assert(!(await hasHorizontalOverflow(page)), "mobile Script has horizontal overflow");
    measuredGeometry.mobileScript390 = { horizontalOverflow: false };

    await visit(canonicalRoutes.characters, "角色");
    assert(await visibleCount(page.locator("main")) === 1, "mobile Characters requires one main");
    assert(await visibleCount(page.locator('[data-workspace-local-rail="characters"]')) === 0, "mobile Characters fixed local rail is visible");
    assert(await page.locator('[data-workspace-section-selector="characters"]').isVisible(), "mobile Characters section selector is missing");
    assert(await page.locator("[data-character-state]").isVisible(), "mobile Characters closed state is missing");
    const characterEvidenceTrigger = page.getByRole("button", { name: "打开 Authority/Evidence" });
    await characterEvidenceTrigger.click();
    const characterEvidenceDrawer = page.getByRole("dialog", { name: "技术证据" });
    await characterEvidenceDrawer.waitFor({ state: "visible" });
    assert(await page.getByRole("dialog").count() === 1, "mobile Characters opened multiple evidence drawers");
    await closeDrawerAndCheckFocus(characterEvidenceTrigger, characterEvidenceDrawer, "mobileCharacterEvidence");
    assert(!(await hasHorizontalOverflow(page)), "mobile Characters has horizontal overflow");
    measuredGeometry.mobileCharacters390 = { horizontalOverflow: false };
    await page.screenshot({ path: path.join(artifactRoot, screenshotNames[6]), fullPage: true });

    const allowedCreatorRequest = /^GET \/api\/creator\/(?:capabilities|projects\/[^/]+|series\/[^/]+|series-planning-workspaces|series-intelligence-workspaces|script-workspaces)$/;
    const unexpectedCreatorRequests = creatorApiRequests.filter((entry) => !allowedCreatorRequest.test(entry));
    unsavedGuardResult.postRequests = mutationRequests.length;
    assert(consoleErrors.length === 0, `console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    assert(requestErrors.length === 0, `unexpected request errors: ${requestErrors.join(" | ")}`);
    assert(httpErrors.length === 0, `HTTP errors: ${httpErrors.join(" | ")}`);
    assert(mutationRequests.length === 0, `mutation requests: ${mutationRequests.join(" | ")}`);
    assert(unexpectedCreatorRequests.length === 0, `unexpected Creator API requests: ${unexpectedCreatorRequests.join(" | ")}`);
    assert(externalRequests.length === 0, `external requests: ${externalRequests.join(" | ")}`);
    assert(screenshotNames.length === 7 && screenshotNames.every((name) => fs.existsSync(path.join(artifactRoot, name))), "Wave 1C requires exactly seven screenshots");

    const requestFailureSummary = {
      rawRequestFailedEventCount: expectedNextRscAborts.length + requestErrors.length,
      expectedNextRscAbortCount: expectedNextRscAborts.length,
      unexpectedRequestFailureCount: requestErrors.length,
    };
    const result = {
      schema: "acs.frontend-v3-wave-1c-browser-evidence.v1",
      frontendCommit: process.env.K2_CONTROL_PLANE_FRONTEND_SHA ?? gitValue("rev-parse", "HEAD"),
      frontendTree: process.env.K2_CONTROL_PLANE_FRONTEND_TREE ?? gitValue("rev-parse", "HEAD^{tree}"),
      coreCommit: process.env.K2_CONTROL_PLANE_CORE_SHA,
      coreTree: process.env.K2_CONTROL_PLANE_CORE_TREE,
      browserVersion: await browser.version(),
      projectRefSource: "control-plane-fixture",
      routesVisited,
      canonicalRoutes,
      redirectResults,
      workspaceStates,
      viewports: [
        { route: canonicalRoutes.story, width: 1920, height: 1080, theme: "dark" },
        { route: canonicalRoutes.script, width: 1440, height: 900, theme: "light" },
        { route: canonicalRoutes.characters, width: 1920, height: 1080, theme: "dark" },
        { route: canonicalRoutes.story, width: 390, height: 844, theme: "dark" },
        { route: canonicalRoutes.script, width: 390, height: 844, theme: "dark" },
        { route: canonicalRoutes.characters, width: 390, height: 844, theme: "dark" },
      ],
      projectNavigationOrder,
      measuredGeometry,
      unsavedGuardResult,
      scriptJobCenterUnsavedGuard,
      scriptMobileProjectNavigationGuard,
      drawerFocusRestore,
      requestFailureSummary,
      expectedNextRscAborts,
      consoleErrors,
      pageErrors,
      httpErrors,
      mutationRequests,
      creatorApiRequests,
      externalRequests,
      staticBoundary,
      screenshots: screenshotNames,
      screenshotSha256: Object.fromEntries(screenshotNames.map((name) => [name, sha256File(path.join(artifactRoot, name))])),
      ok: true,
    };
    const resultPath = path.join(artifactRoot, "result.json");
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    console.log("WAVE_1C_SCREENSHOT_COUNT=7");
    console.log("SCRIPT_JOB_CENTER_UNSAVED_GUARD=PASS");
    console.log(`SCRIPT_JOB_CENTER_NAVIGATION_BLOCKED=${scriptJobCenterUnsavedGuard.navigationBlocked}`);
    console.log(`SCRIPT_DRAFT_PRESERVED=${scriptJobCenterUnsavedGuard.draftPreserved}`);
    console.log(`SCRIPT_GUARD_FOCUS_RESTORED=${scriptJobCenterUnsavedGuard.focusRestored}`);
    console.log(`WAVE_1C_EVIDENCE_RESULT_SHA256=${sha256File(resultPath)}`);
  } catch (error) {
    const failure = {
      schema: "acs.frontend-v3-wave-1c-browser-evidence.v1",
      ok: false,
      error: error?.stack ?? String(error),
      routesVisited,
      redirectResults,
      workspaceStates,
      consoleErrors,
      pageErrors,
      requestErrors,
      httpErrors,
      mutationRequests,
      creatorApiRequests,
      externalRequests,
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
