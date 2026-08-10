import type { HTMLAttributes, ReactNode } from "react";
import { ACSBadge } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./ai.module.css";

export interface AIAssistantPanelProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function AIAssistantPanel({
  children,
  className,
  title = "AI 助手",
  description,
  status,
  actions,
  footer,
  ...props
}: AIAssistantPanelProps) {
  return (
    <aside
      className={mergeClassNames(styles.assistantPanel, className)}
      {...props}
    >
      <header className={styles.assistantHeader}>
        <div className={styles.assistantIdentity}>
          <span className={styles.aiMark} aria-hidden="true">AI</span>
          <div>
            <div className={styles.assistantTitleRow}>
              <h2>{title}</h2>
              {status && <ACSBadge tone="ai" dot>{status}</ACSBadge>}
            </div>
            {description && <p>{description}</p>}
          </div>
        </div>
        {actions && <div className={styles.assistantActions}>{actions}</div>}
      </header>
      <div className={styles.assistantBody}>{children}</div>
      {footer && <footer className={styles.assistantFooter}>{footer}</footer>}
    </aside>
  );
}
