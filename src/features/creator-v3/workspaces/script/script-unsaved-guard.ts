export function isScriptSynopsisDirty(draft: string, latest: string) {
  return draft.trim() !== latest.trim();
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
  if (anchor.hasAttribute("download") || anchor.target === "_blank") return null;

  const targetUrl = new URL(anchor.href, currentOrigin);
  if (targetUrl.origin !== currentOrigin) return null;
  return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
}
