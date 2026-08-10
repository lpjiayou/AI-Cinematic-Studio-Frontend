import type { HTMLAttributes, ReactNode } from "react";
import { ACSBadge, ACSCard } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./ai.module.css";

export interface AICandidateCardProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  selected?: boolean;
  label?: ReactNode;
  metadata?: ReactNode;
  actions?: ReactNode;
}

export function AICandidateCard({
  children,
  className,
  title,
  description,
  selected = false,
  label = "AI 候选",
  metadata,
  actions,
  ...props
}: AICandidateCardProps) {
  return (
    <ACSCard
      className={mergeClassNames(styles.candidateCard, className)}
      title={title}
      description={description}
      tone={selected ? "selected" : "ai"}
      interactive
      headerAction={<ACSBadge tone="ai">{label}</ACSBadge>}
      footer={actions}
      data-selected={selected || undefined}
      {...props}
    >
      {children && <div className={styles.candidateContent}>{children}</div>}
      {metadata && <div className={styles.candidateMetadata}>{metadata}</div>}
    </ACSCard>
  );
}
