"use client";

import type { ReactNode, RefObject } from "react";
import { ACSDrawer } from "@/components/acs";
import type {
  WorkbenchDensity,
  WorkbenchOverlay,
} from "@/components/production";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./workbench-shell.module.css";

export interface WorkbenchOverlayDefinition {
  id: Exclude<WorkbenchOverlay, null>;
  title: string;
  side: "left" | "right" | "bottom";
  size: "narrow" | "medium" | "wide";
}

export interface WorkbenchShellProps {
  globalRail?: ReactNode;
  projectContextBar: ReactNode;
  projectNavigator?: ReactNode;
  primaryCanvas: ReactNode;
  inspector?: ReactNode;
  authorityEvidence?: ReactNode;
  jobShelf?: ReactNode;
  activeOverlay: WorkbenchOverlay;
  onActiveOverlayChange: (overlay: WorkbenchOverlay) => void;
  overlayContent?: ReactNode;
  overlayReturnFocusRef?: RefObject<HTMLElement | null>;
  contentLabel: string;
  inspectorLabel: string;
  authorityLabel: string;
  density: WorkbenchDensity;
  className?: string;
}

const overlayDefinitions: Record<Exclude<WorkbenchOverlay, null>, WorkbenchOverlayDefinition> = {
  "global-navigation": {
    id: "global-navigation",
    title: "全局导航",
    side: "left",
    size: "wide",
  },
  "project-navigation": {
    id: "project-navigation",
    title: "项目导航",
    side: "left",
    size: "medium",
  },
  inspector: {
    id: "inspector",
    title: "检查器",
    side: "right",
    size: "narrow",
  },
  evidence: {
    id: "evidence",
    title: "技术证据",
    side: "right",
    size: "wide",
  },
  jobs: {
    id: "jobs",
    title: "任务",
    side: "bottom",
    size: "wide",
  },
};

export function WorkbenchShell({
  globalRail,
  projectContextBar,
  projectNavigator,
  primaryCanvas,
  inspector,
  authorityEvidence,
  jobShelf,
  activeOverlay,
  onActiveOverlayChange,
  overlayContent,
  overlayReturnFocusRef,
  contentLabel,
  inspectorLabel,
  authorityLabel,
  density,
  className,
}: WorkbenchShellProps) {
  const hasSide = Boolean(inspector || authorityEvidence);
  const activeDefinition = activeOverlay ? overlayDefinitions[activeOverlay] : null;

  function closeOverlay() {
    onActiveOverlayChange(null);
    window.requestAnimationFrame(() => overlayReturnFocusRef?.current?.focus());
  }

  return (
    <div
      className={mergeClassNames(styles.shell, className)}
      data-wave-shell="true"
      data-density={density}
      data-has-global={Boolean(globalRail) || undefined}
      data-has-project={Boolean(projectNavigator) || undefined}
      data-has-side={hasSide || undefined}
      data-has-jobs={Boolean(jobShelf) || undefined}
    >
      {globalRail && (
        <div className={styles.globalRail} data-wave-region="global-rail-fixed">
          {globalRail}
        </div>
      )}
      <header className={styles.contextBar} data-wave-region="context-bar">
        {projectContextBar}
      </header>
      {projectNavigator && (
        <div className={styles.projectNavigator} data-wave-region="project-navigator-fixed">
          {projectNavigator}
        </div>
      )}
      <main className={styles.primaryCanvas} aria-label={contentLabel} data-wave-region="primary-canvas">
        {primaryCanvas}
      </main>
      {hasSide && (
        <div className={styles.side} data-wave-region="side-fixed">
          {inspector && (
            <aside className={styles.inspector} aria-label={inspectorLabel} data-wave-region="inspector-fixed">
              {inspector}
            </aside>
          )}
          {authorityEvidence && (
            <aside className={styles.authority} aria-label={authorityLabel} data-wave-region="authority-fixed">
              {authorityEvidence}
            </aside>
          )}
        </div>
      )}
      {jobShelf && (
        <section className={styles.jobShelf} aria-label="工作台任务" data-wave-region="job-shelf-fixed">
          {jobShelf}
        </section>
      )}
      {activeDefinition && overlayContent && (
        <ACSDrawer
          open
          onClose={closeOverlay}
          title={activeDefinition.title}
          side={activeDefinition.side}
          size={activeDefinition.size}
          closeLabel={`关闭${activeDefinition.title}`}
        >
          <div data-wave-overlay={activeDefinition.id}>{overlayContent}</div>
        </ACSDrawer>
      )}
    </div>
  );
}
