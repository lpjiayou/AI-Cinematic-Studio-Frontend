import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "vitest";

import {
  EXPECTED_NEXT_RSC_ABORT,
  UNEXPECTED_REQUEST_FAILURE,
  classifyWave1BRequestFailure,
} from "./gate-frontend-v3-wave-1b-request-policy.mjs";
import {
  isApprovedPendingRequestToken,
  isApprovedProductionWorkspaceToken,
} from "./gate-frontend-v3-wave-1c.mjs";

const baseOrigin = "http://127.0.0.1:3101";

function classify(overrides = {}) {
  return classifyWave1BRequestFailure({
    baseOrigin,
    method: "GET",
    url: `${baseOrigin}/creator/projects?_rsc=opaque-token`,
    errorText: "net::ERR_ABORTED",
    isNavigationRequest: false,
    resourceType: "fetch",
    ...overrides,
  });
}

test("classifies a same-origin cancelled background RSC GET as expected", () => {
  const result = classify();

  assert.equal(result.classification, EXPECTED_NEXT_RSC_ABORT);
  assert.equal(result.reason, "NEXT_RSC_BACKGROUND_REQUEST_CANCELLED");
  assert.deepEqual(result.evidence, {
    method: "GET",
    pathname: "/creator/projects",
    resourceType: "fetch",
    errorText: "net::ERR_ABORTED",
    isNavigationRequest: false,
  });
  assert.equal(JSON.stringify(result.evidence).includes("opaque-token"), false);
});

test("rejects a navigation request even when the other RSC conditions match", () => {
  assert.equal(
    classify({ isNavigationRequest: true }).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

test("rejects a POST even when the other RSC conditions match", () => {
  assert.equal(
    classify({ method: "POST" }).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

test("rejects an external-origin RSC abort", () => {
  assert.equal(
    classify({ url: "https://example.com/creator/projects?_rsc=opaque-token" }).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

test("rejects an aborted GET without the RSC query parameter", () => {
  assert.equal(
    classify({ url: `${baseOrigin}/creator/projects` }).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

test("rejects an RSC request with a non-abort failure", () => {
  assert.equal(
    classify({ errorText: "net::ERR_FAILED" }).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

test("rejects an aborted Creator API request without the RSC query parameter", () => {
  assert.equal(
    classify({ url: `${baseOrigin}/api/creator/projects` }).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

test("rejects a malformed request URL", () => {
  const result = classify({ url: "not a URL" });

  assert.equal(result.classification, UNEXPECTED_REQUEST_FAILURE);
  assert.equal(result.reason, "INVALID_REQUEST_URL");
  assert.equal(result.evidence.pathname, null);
});

test("exports a closed classification vocabulary", () => {
  assert.equal(EXPECTED_NEXT_RSC_ABORT, "EXPECTED_NEXT_RSC_ABORT");
  assert.equal(UNEXPECTED_REQUEST_FAILURE, "UNEXPECTED_REQUEST_FAILURE");
  assert.notEqual(EXPECTED_NEXT_RSC_ABORT, UNEXPECTED_REQUEST_FAILURE);
});

test("does not default unknown input to expected", () => {
  assert.equal(
    classifyWave1BRequestFailure({}).classification,
    UNEXPECTED_REQUEST_FAILURE,
  );
});

const pendingRequestPath = "src/features/creator-v3/workspaces/generation/image-video-composer.tsx";
const pendingRequestSource = fs.readFileSync(path.join(process.cwd(), pendingRequestPath), "utf8");

test("Wave 1C permits only the exact accepted pending-request blob and its two non-Domain tokens", () => {
  for (const token of ["sessionStorage", "crypto.randomUUID"]) {
    assert.equal(pendingRequestSource.includes(token), true);
    assert.equal(isApprovedPendingRequestToken(pendingRequestPath, pendingRequestSource, token), true);
  }
});

test("Wave 1C rejects an approved blob in an unknown file or workspace scope", () => {
  for (const relativePath of [
    "src/features/creator-v3/workspaces/story/image-video-composer.tsx",
    "src/features/creator-v3/workspaces/generation/unknown.tsx",
    `outside/${pendingRequestPath}`,
    `/${pendingRequestPath}`,
    "",
  ]) {
    for (const token of ["sessionStorage", "crypto.randomUUID"]) {
      assert.equal(isApprovedPendingRequestToken(relativePath, pendingRequestSource, token), false);
    }
  }
});

test("Wave 1C rejects any changed content including a changed latch or an added byte", () => {
  for (const source of [
    `${pendingRequestSource}\n`,
    `${pendingRequestSource}// added authority\n`,
    pendingRequestSource.replace("acs-image-video-pending:", "domain-facts:"),
    pendingRequestSource.replace("const idempotencyKey = crypto.randomUUID()", "const projectRef = crypto.randomUUID()"),
  ]) {
    assert.notEqual(source, pendingRequestSource);
    for (const token of ["sessionStorage", "crypto.randomUUID"]) {
      assert.equal(isApprovedPendingRequestToken(pendingRequestPath, source, token), false);
    }
  }
});

test("Wave 1C never exempts a third forbidden token even for the accepted blob", () => {
  for (const token of [
    "ConnectedStoryWorld", "ConnectedScriptStudio", "ConnectedCharacterStudio",
    "StoryWorldPage", "CharacterStudioPage", "WorkspaceHomePage", "LOCAL_PROJECT_CLIENT_KEYS",
    "getLocalProjectPresentation", "ConnectedProductionWorkspace", "NEXT_PUBLIC_CORE",
    "axios", "localStorage", "executionMethod", "nanoid", "sessionStorage.setItem", "",
  ]) assert.equal(isApprovedPendingRequestToken(pendingRequestPath, pendingRequestSource, token), false);
  assert.equal(isApprovedPendingRequestToken(pendingRequestPath, `${pendingRequestSource}\nlocalStorage`, "sessionStorage"), false);
});

test("Wave 1C compares canonical LF content without accepting other content normalization", () => {
  const lfSource = pendingRequestSource.replace(/\r\n/g, "\n");
  assert.equal(isApprovedPendingRequestToken(pendingRequestPath, lfSource, "sessionStorage"), true);
  assert.equal(isApprovedPendingRequestToken(pendingRequestPath, lfSource.replace(/\n/g, "\r\n"), "sessionStorage"), true);
  assert.equal(isApprovedPendingRequestToken(pendingRequestPath, lfSource.replace(/\n/g, "\r"), "sessionStorage"), false);
});

test("Wave 1C fails closed for absent source or a token outside the closed vocabulary", () => {
  assert.equal(isApprovedPendingRequestToken(pendingRequestPath, null, "sessionStorage"), false);
  assert.equal(isApprovedPendingRequestToken(pendingRequestPath, pendingRequestSource, undefined), false);
});

const productionWorkspaceApprovals = [
  [
    "src/features/creator-v3/workspaces/production-studio/storyboard-workspace.tsx",
    "executionMethod",
  ],
  [
    "src/features/creator-v3/workspaces/production-studio/timeline-workspace.tsx",
    "crypto.randomUUID",
  ],
];

test("Wave 1C permits only the exact production-workspace blob and its single approved token", () => {
  for (const [relativePath, token] of productionWorkspaceApprovals) {
    const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
    assert.equal(source.includes(token), true);
    assert.equal(isApprovedProductionWorkspaceToken(relativePath, source, token), true);
    assert.equal(isApprovedProductionWorkspaceToken(relativePath, `${source}\n`, token), false);
    assert.equal(isApprovedProductionWorkspaceToken(`outside/${relativePath}`, source, token), false);
    assert.equal(isApprovedProductionWorkspaceToken(relativePath, source, "localStorage"), false);
  }
});
