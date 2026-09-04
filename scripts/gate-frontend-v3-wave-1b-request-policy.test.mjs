import assert from "node:assert/strict";
import { test } from "vitest";

import {
  EXPECTED_NEXT_RSC_ABORT,
  UNEXPECTED_REQUEST_FAILURE,
  classifyWave1BRequestFailure,
} from "./gate-frontend-v3-wave-1b-request-policy.mjs";

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
