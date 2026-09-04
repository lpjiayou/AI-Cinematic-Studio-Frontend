import type { ReactNode } from "react";
import { ACSBadge } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import type { EmptyProductVariant } from "./presentation-types";
import styles from "./empty-product-state.module.css";

export interface EmptyProductStateProps {
  variant: EmptyProductVariant;
  title: string;
  explanation: string;
  prerequisite?: string;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  approvedVisual?: ReactNode;
  contentLabel: string;
  className?: string;
}

const variantLabels: Record<EmptyProductVariant, string> = {
  no_data: "暂无数据",
  no_results: "没有匹配结果",
  disconnected: "连接已断开",
  authentication_required: "需要登录",
  authority_required: "需要授权",
  policy_blocked: "策略阻止",
  runtime_blocked: "运行时不可用",
  not_implemented: "尚未实施",
  unknown: "状态未验证",
};

export function EmptyProductState({
  variant,
  title,
  explanation,
  prerequisite,
  primaryAction,
  secondaryAction,
  approvedVisual,
  contentLabel,
  className,
}: EmptyProductStateProps) {
  const failClosed = variant === "not_implemented" || variant === "unknown";

  return (
    <section
      aria-label={contentLabel}
      className={mergeClassNames(styles.emptyState, className)}
      data-variant={variant}
    >
      {approvedVisual && <div className={styles.visual}>{approvedVisual}</div>}
      <div className={styles.copy}>
        <ACSBadge tone={failClosed ? "warning" : "neutral"}>{variantLabels[variant]}</ACSBadge>
        <h2>{title}</h2>
        <p>{explanation}</p>
        {prerequisite && (
          <p className={styles.prerequisite}><strong>前置条件：</strong>{prerequisite}</p>
        )}
      </div>
      {(secondaryAction || (!failClosed && primaryAction)) && (
        <div className={styles.actions}>
          {!failClosed && primaryAction}
          {secondaryAction}
        </div>
      )}
    </section>
  );
}
