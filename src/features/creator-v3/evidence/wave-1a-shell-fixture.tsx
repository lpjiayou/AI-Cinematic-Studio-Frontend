"use client";

import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ACSBadge,
  ACSButton,
  AuthorityStatus,
  CapabilityBlocker,
  EmptyProductState,
  EvidenceDisclosure,
  GlobalRail,
  JobShelf,
  ProjectContextBar,
  ProjectNavigatorV3,
  type EvidenceFieldView,
  type GlobalRailDestinationView,
  type JobShelfItemView,
  type ProjectDestinationView,
  type WorkbenchOverlay,
} from "@/components";
import { WorkbenchShell } from "@/layouts";
import styles from "./wave-1a-shell-fixture.module.css";

const globalDestinations: readonly GlobalRailDestinationView[] = [
  { id: "home", label: "首页", description: "继续最近工作", icon: "首", availability: "available", href: "#wave-home" },
  { id: "projects", label: "项目", description: "查看验证项目", icon: "项", availability: "available", href: "#wave-projects" },
  { id: "quick-create", label: "快速创作", description: "等待后续页面实施", icon: "快", availability: "not_open", blockedReason: "Wave 1A 不实施产品页面", explanationHref: "#wave-capability-blocker" },
  { id: "assets", label: "资产", description: "检查资产边界", icon: "资", availability: "blocked", blockedReason: "当前仅验证组件", explanationHref: "#wave-capability-blocker" },
  { id: "jobs", label: "任务", description: "查看活动任务状态", icon: "任", availability: "available", href: "#wave-jobs" },
  { id: "works", label: "作品", description: "等待后续页面实施", icon: "作", availability: "not_open", blockedReason: "Wave 1A 不实施产品页面", explanationHref: "#wave-capability-blocker" },
];

const projectDestinationInputs = [
  ["overview", "概览"],
  ["story", "故事"],
  ["script", "剧本"],
  ["characters", "角色"],
  ["storyboard", "分镜"],
  ["generation", "生成"],
  ["audio", "音频"],
  ["timeline", "剪辑"],
  ["review", "审片"],
  ["delivery", "交付"],
] as const;

const projectDestinations: readonly ProjectDestinationView[] = projectDestinationInputs.map(
  ([id, label], index) => index === 0
    ? { id, label, description: "当前验证画布", availability: "available", href: "#wave-canvas" }
    : {
        id,
        label,
        description: "目标位置可发现",
        availability: "not_open",
        blockedReason: "对应 canonical 页面尚未实施",
        explanationHref: "#wave-capability-blocker",
      },
);

const authorityLayers = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "Wave 1A presentation 组件已加载" },
  { id: "runtime", label: "运行时", state: "blocked", stateLabel: "不可用", message: "本证据页不执行媒体运行时", owner: "运行时负责人" },
  { id: "authority", label: "授权", state: "required", stateLabel: "未授权", message: "没有生产执行授权", owner: "领域负责人" },
  { id: "policy", label: "策略", state: "not_applicable", stateLabel: "不适用", message: "本地证据不产生产品事实" },
] as const;

const evidenceFields: readonly EvidenceFieldView[] = [
  { id: "fixture-mode", label: "证据模式", value: "LOCAL_FIXTURE", sensitivity: "ordinary", copyAllowed: true },
  { id: "scope", label: "验证范围", value: "Wave 1A presentation only", sensitivity: "restricted", copyAllowed: false },
  { id: "protected", label: "受保护字段", sensitivity: "redacted", copyAllowed: false, redactedReason: "已按证据策略隐藏；不存在可显示值" },
];

const jobs: readonly JobShelfItemView[] = [
  { id: "fixture-queued", label: "排队验证项", state: "queued", stateLabel: "排队", progressText: "等待检查" },
  { id: "fixture-running", label: "运行验证项", state: "running", stateLabel: "运行", progressText: "2 / 5" },
  { id: "fixture-blocked", label: "阻塞验证项", state: "blocked", stateLabel: "阻塞", progressText: "等待授权", blockedReason: "生产执行未授权" },
  { id: "fixture-failed", label: "失败验证项", state: "failed", stateLabel: "失败", progressText: "已保留", failedReason: "测试输入冲突" },
];

function IconTrigger({
  label,
  icon,
  triggerRef,
  onClick,
}: {
  label: string;
  icon: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}) {
  return (
    <ACSButton
      ref={triggerRef}
      variant="ghost"
      size="small"
      className={styles.iconTrigger}
      aria-label={label}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span>
    </ACSButton>
  );
}

function InspectorFixture() {
  return (
    <section className={styles.inspectorFixture} aria-label="当前选择属性">
      <ACSBadge tone="primary">已选择</ACSBadge>
      <h2>画布区域</h2>
      <p>这是调用方提供的中性选择状态，不包含生产对象或权威事实。</p>
    </section>
  );
}

export function Wave1AShellFixture() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [globalExpanded, setGlobalExpanded] = useState(false);
  const [jobExpanded, setJobExpanded] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [activeOverlay, setActiveOverlay] = useState<WorkbenchOverlay>(null);
  const overlayReturnFocusRef = useRef<HTMLElement | null>(null);
  const globalTriggerRef = useRef<HTMLButtonElement>(null);
  const projectTriggerRef = useRef<HTMLButtonElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const evidenceTriggerRef = useRef<HTMLButtonElement>(null);
  const jobsTriggerRef = useRef<HTMLButtonElement>(null);

  function openOverlay(
    overlay: Exclude<WorkbenchOverlay, null>,
    trigger: React.RefObject<HTMLButtonElement | null>,
  ) {
    overlayReturnFocusRef.current = trigger.current;
    setActiveOverlay(overlay);
  }

  const overlayContent = useMemo<ReactNode>(() => {
    if (activeOverlay === "global-navigation") {
      return (
        <GlobalRail
          destinations={globalDestinations}
          activeDestinationId="home"
          expanded={false}
          onExpandedChange={() => undefined}
          brand="ACS V3"
          navigationLabel="移动端全局导航"
          mode="drawer"
        />
      );
    }
    if (activeOverlay === "project-navigation") {
      return (
        <ProjectNavigatorV3
          destinations={projectDestinations}
          activeDestinationId="overview"
          mode="overlay"
          navigationLabel="移动端项目导航"
          header={<strong>V3 Shell 验证项目</strong>}
          onRequestClose={() => setActiveOverlay(null)}
        />
      );
    }
    if (activeOverlay === "inspector") return <InspectorFixture />;
    if (activeOverlay === "evidence") {
      return (
        <EvidenceDisclosure
          title="移动端技术证据"
          summary="仅展示显式中性 fixture"
          fields={evidenceFields}
          open
          onOpenChange={() => undefined}
          mode="inline"
          closeLabel="关闭移动端技术证据"
        />
      );
    }
    if (activeOverlay === "jobs") {
      return (
        <JobShelf
          jobs={jobs}
          expanded
          onExpandedChange={() => undefined}
          onOpenJob={() => undefined}
          label="移动端活动任务"
        />
      );
    }
    return null;
  }, [activeOverlay]);

  const triggerGroup = (
    <div className={styles.triggerGroup}>
      <IconTrigger label="打开全局导航" icon="全" triggerRef={globalTriggerRef} onClick={() => openOverlay("global-navigation", globalTriggerRef)} />
      <IconTrigger label="打开项目导航" icon="项" triggerRef={projectTriggerRef} onClick={() => openOverlay("project-navigation", projectTriggerRef)} />
    </div>
  );

  return (
    <div className={styles.fixture} data-theme={theme} data-wave-fixture="true">
      <WorkbenchShell
        globalRail={(
          <GlobalRail
            destinations={globalDestinations}
            activeDestinationId="home"
            expanded={globalExpanded}
            onExpandedChange={setGlobalExpanded}
            brand="ACS"
            utilities={<span className={styles.utilityLabel}>验证</span>}
            navigationLabel="V3 全局导航"
          />
        )}
        projectContextBar={(
          <ProjectContextBar
            projectTitle="V3 Shell 验证项目"
            seriesLabel="测试系列"
            episodeLabel="EP-TEST"
            versionLabel="证据版本"
            versionStateText="本地 fixture"
            readinessSummary="生产执行未授权"
            readinessState="blocked"
            navigationTrigger={triggerGroup}
            inspectorTrigger={<IconTrigger label="打开检查器" icon="检" triggerRef={inspectorTriggerRef} onClick={() => openOverlay("inspector", inspectorTriggerRef)} />}
            evidenceTrigger={<IconTrigger label="查看技术证据" icon="证" triggerRef={evidenceTriggerRef} onClick={() => openOverlay("evidence", evidenceTriggerRef)} />}
            jobTrigger={<IconTrigger label="查看任务" icon="任" triggerRef={jobsTriggerRef} onClick={() => openOverlay("jobs", jobsTriggerRef)} />}
            actions={(
              <ACSButton
                variant="secondary"
                size="small"
                onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "切换为浅色主题" : "切换为深色主题"}
              </ACSButton>
            )}
            contextLabel="V3 项目上下文"
          />
        )}
        projectNavigator={(
          <ProjectNavigatorV3
            destinations={projectDestinations}
            activeDestinationId="overview"
            mode="full"
            navigationLabel="V3 项目导航"
            header={<strong>项目工作区</strong>}
            footer={<span className={styles.utilityLabel}>10 个目标位置</span>}
          />
        )}
        primaryCanvas={(
          <div className={styles.canvas} id="wave-canvas">
            <div className={styles.evidenceBanner} role="note" aria-label="证据环境边界">
              <strong>LOCAL_FIXTURE</strong>
              <span>EVIDENCE ONLY</span>
              <span>NOT PRODUCT DATA</span>
              <span>NO AUTHORITY</span>
              <span>NO RUNTIME EXECUTION</span>
            </div>
            <section className={styles.canvasIntro} aria-labelledby="wave-1a-heading">
              <span className={styles.eyebrow}>Frontend V3 · Wave 1A</span>
              <h1 id="wave-1a-heading">工作台壳层与真实性呈现组件</h1>
              <p>该画布只验证可复用 presentation 对象，不是 canonical 产品页面。</p>
            </section>
            <div className={styles.canvasGrid}>
              <CapabilityBlocker
                blockerClass="runtime_unavailable"
                severity="warning"
                affectedCapability="媒体运行时执行"
                title="运行时尚未开放"
                cause="Wave 1A 不包含 M12 或 M13 执行"
                consequence="生成与渲染操作保持关闭"
                owner="M12 / M13 领域负责人"
                evidenceAction={<button type="button" onClick={() => openOverlay("evidence", evidenceTriggerRef)}>查看显式证据</button>}
              />
              <EmptyProductState
                variant="not_implemented"
                title="Canonical 页面尚未实施"
                explanation="本轮只交付基础壳层与真实性组件。"
                prerequisite="Wave 1B 的独立授权与验收"
                contentLabel="未实施产品状态"
              />
            </div>
          </div>
        )}
        inspector={<InspectorFixture />}
        authorityEvidence={(
          <div className={styles.authorityStack}>
            <AuthorityStatus
              summary="四层状态独立，不聚合为伪造的全部就绪"
              layers={authorityLayers}
              statusLabel="执行边界"
              compact
            />
            <EvidenceDisclosure
              title="技术证据"
              summary="仅显示调用方提供并分类的字段"
              fields={evidenceFields}
              open={evidenceOpen}
              onOpenChange={setEvidenceOpen}
              mode="panel"
              closeLabel="关闭技术证据"
            />
          </div>
        )}
        jobShelf={(
          <JobShelf
            jobs={jobs}
            expanded={jobExpanded}
            onExpandedChange={setJobExpanded}
            onOpenJob={() => undefined}
            onOpenJobCenter={() => undefined}
            label="活动任务"
          />
        )}
        activeOverlay={activeOverlay}
        onActiveOverlayChange={setActiveOverlay}
        overlayContent={overlayContent}
        overlayReturnFocusRef={overlayReturnFocusRef}
        contentLabel="Wave 1A 主要画布"
        inspectorLabel="Wave 1A 选择检查器"
        authorityLabel="Wave 1A 授权与证据"
        density="comfortable"
      />
    </div>
  );
}
