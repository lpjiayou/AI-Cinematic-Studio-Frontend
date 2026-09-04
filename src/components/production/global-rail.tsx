"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import type {
  DestinationAvailability,
  GlobalRailDestinationId,
} from "./presentation-types";
import { useRovingFocus } from "./use-roving-focus";
import styles from "./global-rail.module.css";

interface GlobalRailDestinationBase {
  id: GlobalRailDestinationId;
  label: string;
  description: string;
  icon: ReactNode;
  badgeLabel?: string;
}

interface AvailableGlobalRailDestination extends GlobalRailDestinationBase {
  availability: "available";
  href: string;
  blockedReason?: never;
  explanationHref?: never;
}

interface UnavailableGlobalRailDestination extends GlobalRailDestinationBase {
  availability: Exclude<DestinationAvailability, "available">;
  href?: never;
  blockedReason: string;
  explanationHref: string;
}

export type GlobalRailDestinationView =
  | AvailableGlobalRailDestination
  | UnavailableGlobalRailDestination;

export interface GlobalRailProps {
  destinations: readonly GlobalRailDestinationView[];
  activeDestinationId?: GlobalRailDestinationId;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  brand: ReactNode;
  utilities?: ReactNode;
  navigationLabel: string;
  mode?: "rail" | "drawer";
  className?: string;
}

export function GlobalRail({
  destinations,
  activeDestinationId,
  expanded,
  onExpandedChange,
  brand,
  utilities,
  navigationLabel,
  mode = "rail",
  className,
}: GlobalRailProps) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(expanded);
  const showDetails = mode === "drawer" || expanded;
  const { getRovingProps } = useRovingFocus<HTMLAnchorElement>(destinations.length);

  useEffect(() => {
    if (wasExpanded.current && !expanded && mode === "rail") {
      toggleRef.current?.focus();
    }
    wasExpanded.current = expanded;
  }, [expanded, mode]);

  useEffect(() => {
    if (mode !== "rail" || !expanded) return;
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onExpandedChange(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [expanded, mode, onExpandedChange]);

  const navigation = (
    <nav aria-label={navigationLabel} className={styles.navigation}>
      <ul className={styles.destinationList}>
        {destinations.map((destination, index) => {
          const href = destination.availability === "available"
            ? destination.href
            : destination.explanationHref;
          return (
            <li key={destination.id}>
              <a
                {...getRovingProps(index)}
                href={href}
                className={styles.destination}
                aria-current={destination.id === activeDestinationId ? "page" : undefined}
                aria-label={!showDetails ? destination.label : undefined}
                data-availability={destination.availability}
                data-destination-id={destination.id}
              >
                <span className={styles.icon} aria-hidden="true">{destination.icon}</span>
                {showDetails && (
                  <span className={styles.destinationCopy}>
                    <span className={styles.destinationHeading}>
                      <span>{destination.label}</span>
                      {destination.badgeLabel && (
                        <span className={styles.badge}>{destination.badgeLabel}</span>
                      )}
                    </span>
                    <span className={styles.description}>{destination.description}</span>
                    {destination.availability !== "available" && (
                      <span className={styles.blockedReason}>{destination.blockedReason}</span>
                    )}
                  </span>
                )}
                {!showDetails && destination.availability !== "available" && (
                  <span className={styles.srOnly}>{destination.blockedReason}</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  if (mode === "drawer") {
    return (
      <div className={mergeClassNames(styles.drawerRail, className)} data-mode="drawer">
        <div className={styles.drawerBrand}>{brand}</div>
        {navigation}
        {utilities && <div className={styles.utilities}>{utilities}</div>}
      </div>
    );
  }

  return (
    <div
      className={mergeClassNames(styles.railRoot, className)}
      data-mode="rail"
      data-expanded={expanded || undefined}
    >
      <div className={styles.brand}>{brand}</div>
      <button
        ref={toggleRef}
        type="button"
        className={styles.expandButton}
        aria-expanded={expanded}
        aria-label={expanded ? "收起全局导航" : "展开全局导航"}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span aria-hidden="true">{expanded ? "‹" : "›"}</span>
      </button>
      {!expanded && navigation}
      {utilities && <div className={styles.utilities}>{utilities}</div>}
      {expanded && (
        <div className={styles.expandedOverlay} data-global-overlay="true">
          <div className={styles.overlayHeader}>
            <strong>{brand}</strong>
            <span>全局导航</span>
          </div>
          {navigation}
          {utilities && <div className={styles.overlayUtilities}>{utilities}</div>}
        </div>
      )}
    </div>
  );
}
