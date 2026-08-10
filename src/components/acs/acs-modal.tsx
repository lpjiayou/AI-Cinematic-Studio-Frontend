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

export interface ACSModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "small" | "medium" | "large";
  closeLabel?: string;
  dismissOnBackdrop?: boolean;
  className?: string;
}

export function ACSModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "medium",
  closeLabel = "关闭对话框",
  dismissOnBackdrop = true,
  className,
}: ACSModalProps) {
  const clientReady = useClientReady();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useOverlayLifecycle({ open, onClose, containerRef: dialogRef });

  if (!open || !clientReady) return null;

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (dismissOnBackdrop && event.target === event.currentTarget) onClose();
  }

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={mergeClassNames(styles.modal, className)}
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
