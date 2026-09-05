"use client";

import {
  useMemo,
  useRef,
  useState,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ACSButton,
  AuthorityStatus,
  EvidenceDisclosure,
  GlobalRail,
  JobShelf,
  ProjectContextBar,
  ProjectNavigatorV3,
  type AuthorityLayerView,
  type EvidenceFieldView,
  type ProjectDestinationId,
  type ProjectReadinessState,
  type WorkbenchOverlay,
} from "@/components";
import type { CreatorProject } from "@/features/core-integration";
import { WorkbenchShell } from "@/layouts";
import { useACSTheme } from "@/theme";
import {
  GLOBAL_V3_DESTINATIONS,
  buildProjectV3Destinations,
} from "../navigation";
import styles from "./creator-project-shell.module.css";

export interface CreatorProjectShellProps {
  project: CreatorProject | null;
  projectRef: string;
  activeDestinationId: ProjectDestinationId;
  primaryCanvas: ReactNode;
  inspector?: ReactNode;
  authorityEvidence: {
    layers: readonly AuthorityLayerView[];
    summary: string;
    fields: readonly EvidenceFieldView[];
    evidenceSummary: string;
  };
  jobShelf?: ReactNode;
  activeOverlay?: WorkbenchOverlay;
  onActiveOverlayChange?: (overlay: WorkbenchOverlay) => void;
  overlayContent?: ReactNode;
  overlayReturnFocusRef?: React.RefObject<HTMLElement | null>;
  contextBar?: {
    seriesLabel?: string;
    episodeLabel?: string;
    versionLabel: string;
    versionStateText: string;
    readinessSummary: string;
    readinessState: ProjectReadinessState;
    contextLabel: string;
  };
  contentLabel?: string;
  inspectorLabel?: string;
  authorityLabel?: string;
  onNavigationCapture?: MouseEventHandler<HTMLDivElement>;
}

function Trigger({
  label,
  glyph,
  triggerRef,
  onClick,
}: {
  label: string;
  glyph: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}) {
  return (
    <ACSButton
      ref={triggerRef}
      variant="ghost"
      size="small"
      className={styles.trigger}
      aria-label={label}
      onClick={onClick}
    >
      <span aria-hidden="true">{glyph}</span>
    </ACSButton>
  );
}

function projectStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "进行中",
    DRAFT: "草稿",
    ARCHIVED: "已归档",
    COMPLETED: "已完成记录",
  };
  return labels[status.toUpperCase()] ?? "状态未验证";
}

export function CreatorProjectShell({
  project,
  projectRef,
  activeDestinationId,
  primaryCanvas,
  inspector,
  authorityEvidence,
  jobShelf,
  activeOverlay: controlledOverlay,
  onActiveOverlayChange,
  overlayContent: controlledOverlayContent,
  overlayReturnFocusRef: controlledReturnFocusRef,
  contextBar,
  contentLabel = "项目概览主要画布",
  inspectorLabel = "项目概览检查器",
  authorityLabel = "项目概览授权与证据",
  onNavigationCapture,
}: CreatorProjectShellProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useACSTheme();
  const destinations = useMemo(() => buildProjectV3Destinations(projectRef), [projectRef]);
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [jobsExpanded, setJobsExpanded] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [internalOverlay, setInternalOverlay] = useState<WorkbenchOverlay>(null);
  const internalReturnFocusRef = useRef<HTMLElement | null>(null);
  const globalTriggerRef = useRef<HTMLButtonElement>(null);
  const projectTriggerRef = useRef<HTMLButtonElement>(null);
  const evidenceTriggerRef = useRef<HTMLButtonElement>(null);
  const jobsTriggerRef = useRef<HTMLButtonElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const activeOverlay = controlledOverlay === undefined ? internalOverlay : controlledOverlay;
  const setActiveOverlay = onActiveOverlayChange ?? setInternalOverlay;

  function openOverlay(
    overlay: Exclude<WorkbenchOverlay, null>,
    trigger: React.RefObject<HTMLButtonElement | null>,
  ) {
    internalReturnFocusRef.current = trigger.current;
    setActiveOverlay(overlay);
  }

  const defaultOverlayContent = useMemo<ReactNode>(() => {
    if (activeOverlay === "global-navigation") {
      return (
        <GlobalRail
          destinations={GLOBAL_V3_DESTINATIONS}
          activeDestinationId="projects"
          expanded={false}
          onExpandedChange={() => undefined}
          brand="ACS"
          navigationLabel="移动端全局导航"
          mode="drawer"
        />
      );
    }
    if (activeOverlay === "project-navigation") {
      return (
        <ProjectNavigatorV3
          destinations={destinations}
          activeDestinationId={activeDestinationId}
          mode="overlay"
          navigationLabel="移动端项目导航"
          header={<strong>{project?.title ?? "项目导航"}</strong>}
          onRequestClose={() => setActiveOverlay(null)}
        />
      );
    }
    if (activeOverlay === "evidence") {
      return (
        <EvidenceDisclosure
          title="项目技术证据"
          summary={authorityEvidence.evidenceSummary}
          fields={authorityEvidence.fields}
          open
          onOpenChange={() => undefined}
          mode="inline"
          copyAction={(field) => void navigator.clipboard?.writeText(field.value)}
          closeLabel="关闭项目技术证据"
        />
      );
    }
    if (activeOverlay === "jobs") {
      return jobShelf ?? (
        <JobShelf
          jobs={[]}
          expanded
          onExpandedChange={() => undefined}
          onOpenJobCenter={() => router.push("/creator/jobs")}
          label="当前没有可由本页核验的活动任务"
        />
      );
    }
    if (activeOverlay === "inspector") return inspector ?? null;
    return null;
  }, [activeDestinationId, activeOverlay, authorityEvidence, destinations, inspector, jobShelf, project?.title, router, setActiveOverlay]);

  const navigationTrigger = (
    <div className={styles.triggerGroup}>
      <Trigger label="打开全局导航" glyph="全" triggerRef={globalTriggerRef} onClick={() => openOverlay("global-navigation", globalTriggerRef)} />
      <Trigger label="打开项目导航" glyph="项" triggerRef={projectTriggerRef} onClick={() => openOverlay("project-navigation", projectTriggerRef)} />
    </div>
  );

  return (
    <div
      className={styles.shellRoot}
      data-creator-v3-shell="project"
      onClickCapture={onNavigationCapture}
    >
      <WorkbenchShell
        globalRail={(
          <GlobalRail
            destinations={GLOBAL_V3_DESTINATIONS}
            activeDestinationId="projects"
            expanded={globalExpanded}
            onExpandedChange={setGlobalExpanded}
            brand="ACS"
            navigationLabel="V3 全局导航"
          />
        )}
        projectContextBar={(
          <ProjectContextBar
            projectTitle={project?.title ?? "项目概览"}
            seriesLabel={contextBar?.seriesLabel ?? (project ? (project.seriesRefs.length > 0 ? `已绑定 ${project.seriesRefs.length} 个系列` : "尚未绑定系列") : "项目记录未读取")}
            episodeLabel={contextBar?.episodeLabel ?? "分集上下文未选择"}
            versionLabel={contextBar?.versionLabel ?? (project ? `项目 v${project.version}` : "项目版本")}
            versionStateText={contextBar?.versionStateText ?? (project ? projectStatusLabel(project.status) : "状态未验证")}
            readinessSummary={contextBar?.readinessSummary ?? (project ? "项目基础记录已读取；生产准备度尚未在本页核验" : "生产准备度尚未核验")}
            readinessState={contextBar?.readinessState ?? "unverified"}
            navigationTrigger={navigationTrigger}
            inspectorTrigger={inspector ? <Trigger label="打开检查器" glyph="检" triggerRef={inspectorTriggerRef} onClick={() => openOverlay("inspector", inspectorTriggerRef)} /> : undefined}
            evidenceTrigger={<Trigger label="打开 Authority/Evidence" glyph="证" triggerRef={evidenceTriggerRef} onClick={() => openOverlay("evidence", evidenceTriggerRef)} />}
            jobTrigger={<Trigger label="打开任务" glyph="任" triggerRef={jobsTriggerRef} onClick={() => openOverlay("jobs", jobsTriggerRef)} />}
            actions={(
              <ACSButton variant="secondary" size="small" onClick={toggleTheme}>
                {theme === "dark" ? "切换为浅色主题" : "切换为深色主题"}
              </ACSButton>
            )}
            contextLabel={contextBar?.contextLabel ?? "V3 项目上下文"}
          />
        )}
        projectNavigator={(
          <ProjectNavigatorV3
            destinations={destinations}
            activeDestinationId={activeDestinationId}
            mode="full"
            navigationLabel="V3 项目导航"
            header={<strong>项目工作区</strong>}
            footer={<span className={styles.footer}>项目导航 · 10 个目的地</span>}
          />
        )}
        primaryCanvas={primaryCanvas}
        inspector={inspector}
        authorityEvidence={(
          <div className={styles.sideStack}>
            <AuthorityStatus
              statusLabel="项目能力与授权边界"
              summary={authorityEvidence.summary}
              layers={authorityEvidence.layers}
              compact
            />
            <EvidenceDisclosure
              title="项目技术证据"
              summary={authorityEvidence.evidenceSummary}
              fields={authorityEvidence.fields}
              open={evidenceOpen}
              onOpenChange={setEvidenceOpen}
              mode="panel"
              copyAction={(field) => void navigator.clipboard?.writeText(field.value)}
              closeLabel="关闭项目技术证据"
            />
          </div>
        )}
        jobShelf={jobShelf ?? (
          <JobShelf
            jobs={[]}
            expanded={jobsExpanded}
            onExpandedChange={setJobsExpanded}
            onOpenJobCenter={() => router.push("/creator/jobs")}
            label="当前没有可由本页核验的活动任务"
          />
        )}
        activeOverlay={activeOverlay}
        onActiveOverlayChange={setActiveOverlay}
        overlayContent={controlledOverlayContent ?? defaultOverlayContent}
        overlayReturnFocusRef={controlledReturnFocusRef ?? internalReturnFocusRef}
        contentLabel={contentLabel}
        inspectorLabel={inspectorLabel}
        authorityLabel={authorityLabel}
        density="compact"
      />
    </div>
  );
}
