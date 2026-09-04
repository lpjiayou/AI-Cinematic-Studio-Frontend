import type { ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./project-context-bar.module.css";

export type ProjectReadinessState =
  | "available"
  | "blocked"
  | "required"
  | "unverified"
  | "not_open";

export interface ProjectContextBarProps {
  projectTitle: string;
  seriesLabel?: string;
  episodeLabel?: string;
  versionLabel: string;
  versionStateText: string;
  readinessSummary: string;
  readinessState: ProjectReadinessState;
  navigationTrigger?: ReactNode;
  inspectorTrigger?: ReactNode;
  evidenceTrigger?: ReactNode;
  jobTrigger?: ReactNode;
  actions?: ReactNode;
  contextLabel: string;
  className?: string;
}

export function ProjectContextBar({
  projectTitle,
  seriesLabel,
  episodeLabel,
  versionLabel,
  versionStateText,
  readinessSummary,
  readinessState,
  navigationTrigger,
  inspectorTrigger,
  evidenceTrigger,
  jobTrigger,
  actions,
  contextLabel,
  className,
}: ProjectContextBarProps) {
  const resolvedProjectTitle = projectTitle.trim() || "未选择项目";
  const contextItems = [seriesLabel, episodeLabel].filter(Boolean);

  return (
    <section
      aria-label={contextLabel}
      className={mergeClassNames(styles.contextBar, className)}
      data-readiness-state={readinessState}
      data-wave-context-bar="true"
    >
      <div className={styles.identity}>
        <strong className={styles.projectTitle}>{resolvedProjectTitle}</strong>
      </div>
      <div className={styles.context}>
        <span className={styles.contextTrail}>
          {contextItems.length > 0 ? contextItems.join(" / ") : "Series / Episode 未设置"}
        </span>
      </div>
      <div className={styles.version}>
        <span>{versionLabel}</span>
        <strong>{versionStateText || "版本状态未验证"}</strong>
      </div>
      <div className={styles.readiness}>
        <span>就绪状态</span>
        <strong>{readinessSummary || "尚未验证"}</strong>
      </div>
      <div className={styles.triggers} aria-label="工作台面板">
        {navigationTrigger}
        {inspectorTrigger}
        {evidenceTrigger}
        {jobTrigger}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  );
}
