import type { HTMLAttributes, ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./ai.module.css";

export interface AIThinkingStateProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  detail?: ReactNode;
  compact?: boolean;
}

export function AIThinkingState({
  label = "AI 正在思考",
  detail,
  compact = false,
  className,
  ...props
}: AIThinkingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={mergeClassNames(styles.thinkingState, className)}
      data-compact={compact || undefined}
      {...props}
    >
      <span className={styles.thinkingGlyph} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles.thinkingCopy}>
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
    </div>
  );
}
