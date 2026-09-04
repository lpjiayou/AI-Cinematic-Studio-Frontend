"use client";

import type { ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import type {
  DestinationAvailability,
  ProjectDestinationId,
} from "./presentation-types";
import { useRovingFocus } from "./use-roving-focus";
import styles from "./project-navigator-v3.module.css";

interface ProjectDestinationBase {
  id: ProjectDestinationId;
  label: string;
  description: string;
  icon?: ReactNode;
}

interface AvailableProjectDestination extends ProjectDestinationBase {
  availability: "available";
  href: string;
  blockedReason?: never;
  explanationHref?: never;
}

interface UnavailableProjectDestination extends ProjectDestinationBase {
  availability: Exclude<DestinationAvailability, "available">;
  href?: never;
  blockedReason: string;
  explanationHref: string;
}

export type ProjectDestinationView =
  | AvailableProjectDestination
  | UnavailableProjectDestination;

export interface ProjectNavigatorV3Props {
  destinations: readonly ProjectDestinationView[];
  activeDestinationId?: ProjectDestinationId;
  mode: "full" | "compact" | "overlay";
  navigationLabel: string;
  header?: ReactNode;
  footer?: ReactNode;
  onRequestClose?: () => void;
  className?: string;
}

export function ProjectNavigatorV3({
  destinations,
  activeDestinationId,
  mode,
  navigationLabel,
  header,
  footer,
  onRequestClose,
  className,
}: ProjectNavigatorV3Props) {
  const { getRovingProps } = useRovingFocus<HTMLAnchorElement>(
    destinations.length,
    mode === "overlay" ? onRequestClose : undefined,
  );

  return (
    <nav
      aria-label={navigationLabel}
      className={mergeClassNames(styles.navigator, className)}
      data-mode={mode}
    >
      {header && <header className={styles.header}>{header}</header>}
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
                data-availability={destination.availability}
                data-destination-id={destination.id}
              >
                {destination.icon && (
                  <span className={styles.icon} aria-hidden="true">{destination.icon}</span>
                )}
                <span className={styles.copy}>
                  <span className={styles.label}>{destination.label}</span>
                  <span className={styles.description}>{destination.description}</span>
                  {destination.availability !== "available" && (
                    <span className={styles.blockedReason}>{destination.blockedReason}</span>
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </nav>
  );
}
