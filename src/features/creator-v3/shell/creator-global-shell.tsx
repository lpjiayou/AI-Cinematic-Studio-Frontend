"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ACSButton,
  AuthorityStatus,
  EvidenceDisclosure,
  GlobalRail,
  JobShelf,
  type AuthorityLayerView,
  type EvidenceFieldView,
  type GlobalRailDestinationId,
  type WorkbenchOverlay,
} from "@/components";
import { WorkbenchShell } from "@/layouts";
import { useACSTheme } from "@/theme";
import { GLOBAL_V3_DESTINATIONS } from "../navigation";
import {
  CreatorGlobalContextBar,
  type CreatorGlobalConnectionState,
} from "./creator-global-context-bar";
import styles from "./creator-global-shell.module.css";

export interface CreatorGlobalShellProps {
  activeDestinationId: GlobalRailDestinationId;
  title: string;
  description: string;
  connectionState: CreatorGlobalConnectionState;
  primaryCanvas: ReactNode;
  authorityLayers: readonly AuthorityLayerView[];
  authoritySummary: string;
  evidenceFields: readonly EvidenceFieldView[];
  evidenceSummary: string;
  inspector?: ReactNode;
  actions?: ReactNode;
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

export function CreatorGlobalShell({
  activeDestinationId,
  title,
  description,
  connectionState,
  primaryCanvas,
  authorityLayers,
  authoritySummary,
  evidenceFields,
  evidenceSummary,
  inspector,
  actions,
}: CreatorGlobalShellProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useACSTheme();
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [jobsExpanded, setJobsExpanded] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<WorkbenchOverlay>(null);
  const overlayReturnFocusRef = useRef<HTMLElement | null>(null);
  const globalTriggerRef = useRef<HTMLButtonElement>(null);
  const evidenceTriggerRef = useRef<HTMLButtonElement>(null);
  const jobsTriggerRef = useRef<HTMLButtonElement>(null);

  function openOverlay(
    overlay: Exclude<WorkbenchOverlay, null>,
    trigger: React.RefObject<HTMLButtonElement | null>,
  ) {
    overlayReturnFocusRef.current = trigger.current;
    setActiveOverlay(overlay);
  }

  const authorityEvidence = (
    <div className={styles.sideStack}>
      <AuthorityStatus
        statusLabel="能力与授权边界"
        summary={authoritySummary}
        layers={authorityLayers}
        compact
      />
      <EvidenceDisclosure
        title="技术证据"
        summary={evidenceSummary}
        fields={evidenceFields}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
        mode="panel"
        closeLabel="关闭技术证据"
      />
    </div>
  );

  const overlayContent = useMemo<ReactNode>(() => {
    if (activeOverlay === "global-navigation") {
      return (
        <GlobalRail
          destinations={GLOBAL_V3_DESTINATIONS}
          activeDestinationId={activeDestinationId}
          expanded={false}
          onExpandedChange={() => undefined}
          brand="ACS"
          navigationLabel="移动端全局导航"
          mode="drawer"
        />
      );
    }
    if (activeOverlay === "evidence") {
      return (
        <EvidenceDisclosure
          title="技术证据"
          summary={evidenceSummary}
          fields={evidenceFields}
          open
          onOpenChange={() => undefined}
          mode="inline"
          closeLabel="关闭技术证据"
        />
      );
    }
    if (activeOverlay === "jobs") {
      return (
        <JobShelf
          jobs={[]}
          expanded
          onExpandedChange={() => undefined}
          onOpenJobCenter={() => router.push("/creator/jobs")}
          label="跨项目任务投影尚未接入"
        />
      );
    }
    if (activeOverlay === "inspector") return inspector ?? null;
    return null;
  }, [activeDestinationId, activeOverlay, evidenceFields, evidenceSummary, inspector, router]);

  const globalTrigger = (
    <Trigger
      label="打开全局导航"
      glyph="全"
      triggerRef={globalTriggerRef}
      onClick={() => openOverlay("global-navigation", globalTriggerRef)}
    />
  );
  const evidenceTrigger = (
    <Trigger
      label="打开证据"
      glyph="证"
      triggerRef={evidenceTriggerRef}
      onClick={() => openOverlay("evidence", evidenceTriggerRef)}
    />
  );
  const jobsTrigger = (
    <Trigger
      label="打开任务"
      glyph="任"
      triggerRef={jobsTriggerRef}
      onClick={() => openOverlay("jobs", jobsTriggerRef)}
    />
  );

  return (
    <div className={styles.shellRoot} data-creator-v3-shell="global">
      <WorkbenchShell
        globalRail={(
          <GlobalRail
            destinations={GLOBAL_V3_DESTINATIONS}
            activeDestinationId={activeDestinationId}
            expanded={globalExpanded}
            onExpandedChange={setGlobalExpanded}
            brand="ACS"
            navigationLabel="V3 全局导航"
          />
        )}
        projectContextBar={(
          <CreatorGlobalContextBar
            title={title}
            description={description}
            connectionState={connectionState}
            navigationTrigger={globalTrigger}
            evidenceTrigger={evidenceTrigger}
            jobTrigger={jobsTrigger}
            themeTrigger={(
              <ACSButton variant="secondary" size="small" onClick={toggleTheme}>
                {theme === "dark" ? "切换为浅色主题" : "切换为深色主题"}
              </ACSButton>
            )}
            actions={actions}
          />
        )}
        primaryCanvas={primaryCanvas}
        inspector={inspector}
        authorityEvidence={authorityEvidence}
        jobShelf={(
          <JobShelf
            jobs={[]}
            expanded={jobsExpanded}
            onExpandedChange={setJobsExpanded}
            onOpenJobCenter={() => router.push("/creator/jobs")}
            label="跨项目任务投影尚未接入"
          />
        )}
        activeOverlay={activeOverlay}
        onActiveOverlayChange={setActiveOverlay}
        overlayContent={overlayContent}
        overlayReturnFocusRef={overlayReturnFocusRef}
        contentLabel={`${title}主要画布`}
        inspectorLabel={`${title}检查器`}
        authorityLabel={`${title}授权与证据`}
        density="compact"
      />
    </div>
  );
}
