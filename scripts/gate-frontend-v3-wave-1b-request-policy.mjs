export const EXPECTED_NEXT_RSC_ABORT =
  "EXPECTED_NEXT_RSC_ABORT";

export const UNEXPECTED_REQUEST_FAILURE =
  "UNEXPECTED_REQUEST_FAILURE";

export function classifyWave1BRequestFailure({
  baseOrigin,
  method,
  url,
  errorText,
  isNavigationRequest,
  resourceType,
}) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      classification: UNEXPECTED_REQUEST_FAILURE,
      reason: "INVALID_REQUEST_URL",
      evidence: {
        method,
        pathname: null,
        resourceType,
        errorText,
        isNavigationRequest,
      },
    };
  }

  const isExpectedNextRscAbort =
    method === "GET"
    && parsedUrl.origin === baseOrigin
    && parsedUrl.searchParams.has("_rsc")
    && isNavigationRequest === false
    && errorText === "net::ERR_ABORTED";

  if (isExpectedNextRscAbort) {
    return {
      classification: EXPECTED_NEXT_RSC_ABORT,
      reason: "NEXT_RSC_BACKGROUND_REQUEST_CANCELLED",
      evidence: {
        method,
        pathname: parsedUrl.pathname,
        resourceType,
        errorText,
        isNavigationRequest,
      },
    };
  }

  return {
    classification: UNEXPECTED_REQUEST_FAILURE,
    reason: "REQUEST_FAILURE_NOT_ALLOWLISTED",
    evidence: {
      method,
      pathname: parsedUrl.pathname,
      resourceType,
      errorText,
      isNavigationRequest,
    },
  };
}
