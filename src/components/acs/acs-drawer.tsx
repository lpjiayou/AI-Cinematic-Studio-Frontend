"use client";

import {
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { mergeClassNames } from "@/lib/merge-class-names";
import { useClientReady } from "./use-client-ready";
import { useOverlayLifecycle } from "./use-overlay-lifecycle";
import styles from "./acs.module.css";

export interface ACSDrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right" | "bottom";
  size?: "narrow" | "medium" | "wide";
  closeLabel?: string;
  dismissOnBackdrop?: boolean;
  className?: string;
}

export function ACSDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "medium",
  closeLabel = "关闭抽屉",
  dismissOnBackdrop = true,
  className,
}: ACSDrawerProps) {
  const clientReady = useClientReady();
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useOverlayLifecycle({ open, onClose, containerRef: drawerRef });

  if (!open || !clientReady) return null;

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div className={styles.drawerBackdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={mergeClassNames(styles.drawer, className)}
        data-side={side}
        data-size={size}
      >
        <header className={styles.overlayHeader}>
          <div className={styles.overlayHeading}>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={closeLabel}
          >
            <span aria-hidden="true">&#10005;</span>
          </button>
        </header>
        <div className={styles.overlayBody}>{children}</div>
        {footer && <footer className={styles.overlayFooter}>{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
