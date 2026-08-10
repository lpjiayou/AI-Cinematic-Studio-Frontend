import { forwardRef, type HTMLAttributes } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./acs.module.css";

export type ACSBadgeTone =
  | "neutral"
  | "primary"
  | "ai"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface ACSBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ACSBadgeTone;
  dot?: boolean;
}

export const ACSBadge = forwardRef<HTMLSpanElement, ACSBadgeProps>(
  function ACSBadge(
    { children, className, tone = "neutral", dot = false, ...props },
    ref,
  ) {
    return (
      <span
        ref={ref}
        className={mergeClassNames(styles.badge, className)}
        data-tone={tone}
        {...props}
      >
        {dot && <span className={styles.badgeDot} aria-hidden="true" />}
        {children}
      </span>
    );
  },
);
