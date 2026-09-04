import type { ReactNode } from "react";
import { ACSBadge, ACSCard } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import type {
  BlockerSeverity,
  CapabilityBlockerClass,
} from "./presentation-types";
import styles from "./capability-blocker.module.css";

export interface CapabilityBlockerProps {
  blockerClass: CapabilityBlockerClass;
  severity: BlockerSeverity;
  affectedCapability: string;
  title: string;
  cause: string;
  consequence: string;
  owner: string;
  nextSafeAction?: ReactNode;
  evidenceAction?: ReactNode;
  compact?: boolean;
  className?: string;
}

const severityLabels: Record<BlockerSeverity, string> = {
  info: "信息",
  warning: "警告",
  danger: "危险",
};

export function CapabilityBlocker({
  blockerClass,
  severity,
  affectedCapability,
  title,
  cause,
  consequence,
  owner,
  nextSafeAction,
  evidenceAction,
  compact = false,
  className,
}: CapabilityBlockerProps) {
  const requiredValues = { affectedCapability, title, cause, consequence, owner };
  for (const [field, value] of Object.entries(requiredValues)) {
    if (!value.trim()) throw new Error(`CapabilityBlocker requires ${field}`);
  }

  const tone = severity === "danger" ? "danger" : severity === "warning" ? "warning" : "info";

  return (
    <ACSCard
      className={mergeClassNames(styles.blocker, className)}
      padding={compact ? "compact" : "default"}
      data-blocker-class={blockerClass}
      data-severity={severity}
      aria-label={`${title}，${severityLabels[severity]}`}
      title={title}
      headerAction={<ACSBadge tone={tone}>{severityLabels[severity]}</ACSBadge>}
    >
      <dl className={styles.details}>
        <div><dt>影响能力</dt><dd>{affectedCapability}</dd></div>
        <div><dt>原因</dt><dd>{cause}</dd></div>
        <div><dt>后果</dt><dd>{consequence}</dd></div>
        <div><dt>负责方</dt><dd>{owner}</dd></div>
      </dl>
      {(nextSafeAction || evidenceAction) && (
        <div className={styles.actions}>
          {nextSafeAction}
          {evidenceAction}
        </div>
      )}
    </ACSCard>
  );
}
