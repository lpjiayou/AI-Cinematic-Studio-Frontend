export function isScriptSynopsisDirty(draft: string, savedBaseline: string) {
  return draft.trim() !== savedBaseline.trim();
}

export function protectScriptBeforeUnload(
  event: BeforeUnloadEvent,
  dirty: boolean,
) {
  if (!dirty) return false;
  event.preventDefault();
  event.returnValue = "";
  return true;
}

export function internalNavigationHref(
  target: EventTarget | null,
  currentOrigin: string,
): string | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return null;

  const targetUrl = new URL(anchor.href, currentOrigin);
  if (targetUrl.origin !== currentOrigin) return null;
  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}

type HistoryGuardMarker = { role: "base" | "sentinel"; page: string };

/** One same-page sentinel; only its own base entry is intercepted, never a pop loop. */
export function installScriptHistoryGuard(browser: Window, requestBack: () => void) {
  const page = `${browser.location.pathname}${browser.location.search}`;
  const currentState = browser.history.state ?? {};
  const existing = currentState.acsScriptUnsavedGuard as HistoryGuardMarker | undefined;
  const baseState = { ...currentState, acsScriptUnsavedGuard: { role: "base", page } };
  const sentinelState = { ...currentState, acsScriptUnsavedGuard: { role: "sentinel", page } };
  // Reuse the sentinel after an effect reattachment, including React Strict Mode.
  if (existing?.role !== "sentinel" || existing.page !== page) {
    browser.history.replaceState(baseState, "", browser.location.href);
    browser.history.pushState(sentinelState, "", browser.location.href);
  }
  let active = true;
  function onPopState(event: PopStateEvent) {
    if (!active) return;
    const marker = event.state?.acsScriptUnsavedGuard as HistoryGuardMarker | undefined;
    if (marker?.role !== "base" || marker.page !== page ||
      `${browser.location.pathname}${browser.location.search}` !== page) return;
    event.stopImmediatePropagation();
    // Restore this page before asking the single application navigation entry.
    browser.history.pushState(sentinelState, "", browser.location.href);
    requestBack();
  }
  function dispose() {
    active = false;
    browser.removeEventListener("popstate", onPopState, true);
  }
  browser.addEventListener("popstate", onPopState, true);
  return {
    dispose,
    leave: () => { dispose(); browser.history.go(-2); },
  };
}
