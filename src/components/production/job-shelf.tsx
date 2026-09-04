"use client";

import { useRef, type KeyboardEvent } from "react";
import { ACSBadge, ACSButton } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import type { ActiveJobState } from "./presentation-types";
import styles from "./job-shelf.module.css";

export interface JobShelfItemView {
  id: string;
  label: string;
  state: ActiveJobState;
  stateLabel: string;
  progressText: string;
  projectLabel?: string;
  blockedReason?: string;
  failedReason?: string;
}

export interface JobShelfProps {
  jobs: readonly JobShelfItemView[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onOpenJob?: (jobId: string) => void;
  onOpenJobCenter?: () => void;
  label: string;
  maxVisibleJobs?: number;
  className?: string;
}

const recognizedJobStates = new Set<ActiveJobState>([
  "queued",
  "running",
  "blocked",
  "failed",
]);

function normalizeJobState(state: ActiveJobState): ActiveJobState {
  return recognizedJobStates.has(state) ? state : "failed";
}

export function JobShelf({
  jobs,
  expanded,
  onExpandedChange,
  onOpenJob,
  onOpenJobCenter,
  label,
  maxVisibleJobs = 4,
  className,
}: JobShelfProps) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const normalizedJobs = jobs.map((job) => ({
    ...job,
    normalizedState: normalizeJobState(job.state),
    verified: recognizedJobStates.has(job.state),
  }));
  const counts = {
    queued: normalizedJobs.filter((job) => job.normalizedState === "queued").length,
    running: normalizedJobs.filter((job) => job.normalizedState === "running").length,
    blocked: normalizedJobs.filter((job) => job.normalizedState === "blocked").length,
    failed: normalizedJobs.filter((job) => job.normalizedState === "failed").length,
  };

  function closeAndRestoreFocus() {
    onExpandedChange(false);
    window.requestAnimationFrame(() => toggleRef.current?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && expanded) {
      event.preventDefault();
      closeAndRestoreFocus();
    }
  }

  return (
    <section
      aria-label={label}
      className={mergeClassNames(styles.shelf, className)}
      data-expanded={expanded || undefined}
      data-job-shelf="true"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.summary} aria-live="polite">
        <ACSButton
          ref={toggleRef}
          variant="ghost"
          size="small"
          aria-expanded={expanded}
          onClick={() => onExpandedChange(!expanded)}
        >
          {expanded ? "收起任务" : "展开任务"}
        </ACSButton>
        <span>{label}</span>
        <span className={styles.counts}>
          <ACSBadge>排队 {counts.queued}</ACSBadge>
          <ACSBadge tone="info">运行 {counts.running}</ACSBadge>
          <ACSBadge tone="warning">阻塞 {counts.blocked}</ACSBadge>
          <ACSBadge tone="danger">失败 {counts.failed}</ACSBadge>
        </span>
        {onOpenJobCenter && (
          <ACSButton variant="secondary" size="small" onClick={onOpenJobCenter}>
            打开任务中心
          </ACSButton>
        )}
      </div>
      {expanded && (
        <div className={styles.expandedContent}>
          {normalizedJobs.length === 0 ? (
            <p className={styles.empty}>当前没有活动任务</p>
          ) : (
            <ul className={styles.jobs}>
              {normalizedJobs.slice(0, maxVisibleJobs).map((job) => {
                const content = (
                  <>
                    <span className={styles.jobCopy}>
                      <strong>{job.label}</strong>
                      <span>{job.projectLabel || "未关联项目"}</span>
                    </span>
                    <span className={styles.jobState}>
                      {job.verified ? job.stateLabel : "状态未验证"}
                      <small>{job.progressText}</small>
                    </span>
                    {(job.blockedReason || job.failedReason) && (
                      <span className={styles.reason}>{job.blockedReason || job.failedReason}</span>
                    )}
                  </>
                );
                return (
                  <li key={job.id} data-job-state={job.normalizedState}>
                    {onOpenJob ? (
                      <button type="button" onClick={() => onOpenJob(job.id)}>{content}</button>
                    ) : (
                      <div>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
