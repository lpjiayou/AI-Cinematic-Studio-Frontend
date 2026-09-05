"use client";

import Link from "next/link";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  CapabilityBlocker,
  EmptyProductState,
  type AuthorityLayerView,
  type EvidenceFieldView,
} from "@/components";
import type { CreatorProject } from "@/features/core-integration";
import { useV3ProjectCollection } from "../data";
import { CreatorProjectShell } from "../shell";
import styles from "./project-overview-v3.module.css";

const authorityLayers: readonly AuthorityLayerView[] = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "项目概览和迁移导航已可用" },
  { id: "runtime", label: "运行时", state: "unverified", stateLabel: "尚未核验", message: "本页未执行或核验生成运行时" },
  { id: "authority", label: "授权", state: "unverified", stateLabel: "尚未核验", message: "本页未读取生产 Approval Authority" },
  { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "本页未读取项目级生产策略" },
];

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "进行中",
    DRAFT: "草稿",
    ARCHIVED: "已归档",
    COMPLETED: "已完成记录",
  };
  return labels[status.toUpperCase()] ?? "状态未验证";
}

function formattedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未验证";
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ProjectSummary({ project }: { project: CreatorProject }) {
  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>项目概览</span>
          <h1>{project.title || "未命名项目"}</h1>
          <p>{project.description || "暂无项目说明"}</p>
        </div>
        <ACSBadge>{statusLabel(project.status)}</ACSBadge>
      </header>

      <section aria-labelledby="project-summary-title" className={styles.section}>
        <h2 id="project-summary-title">项目摘要</h2>
        <dl className={styles.summaryGrid}>
          <div><dt>类型</dt><dd>{project.projectType || "未设置"}</dd></div>
          <div><dt>目标平台</dt><dd>{project.targetPlatform || "未设置"}</dd></div>
          <div><dt>画幅</dt><dd>{project.aspectRatio || "未设置"}</dd></div>
          <div><dt>默认时长</dt><dd>{project.defaultDurationSec} 秒</dd></div>
          <div><dt>计划分集</dt><dd>{project.plannedEpisodeCount}</dd></div>
          <div><dt>状态</dt><dd>{statusLabel(project.status)}</dd></div>
          <div><dt>最近更新</dt><dd>{formattedDate(project.updatedAt)}</dd></div>
          <div><dt>项目版本</dt><dd>v{project.version}</dd></div>
        </dl>
      </section>
    </>
  );
}

function OverviewCanvas({ project }: { project: CreatorProject }) {
  const projectRoot = `/creator/projects/${encodeURIComponent(project.projectRef)}`;
  return (
    <div className={styles.canvas}>
      <ProjectSummary project={project} />

      <section aria-labelledby="next-safe-action-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="next-safe-action-title">下一安全动作</h2>
            <p>从当前真实工作区继续，不推断生产准备度。</p>
          </div>
        </div>
        <div className={styles.actionRow}>
          <Link className={styles.primaryLink} href={`${projectRoot}/story`}>进入故事</Link>
          <Link className={styles.secondaryLink} href={`${projectRoot}/script`}>打开剧本</Link>
          <Link className={styles.secondaryLink} href={`${projectRoot}/characters`}>查看角色</Link>
        </div>
      </section>

      <section aria-labelledby="available-workspaces-title" className={styles.section}>
        <h2 id="available-workspaces-title">当前可用工作区</h2>
        <div className={styles.workspaceGrid}>
          {[
            ["故事", "V3 工作区已可用"],
            ["剧本", "V3 工作区已可用"],
            ["角色", "V3 只读/受权威约束工作区已可用"],
            ["审片", "当前 fail-closed 兼容工作区可用"],
            ["交付", "当前 fail-closed 兼容工作区可用"],
          ].map(([label, state]) => (
            <ACSCard key={label} title={label} padding="compact">
              <p className={styles.compatibleState}>{state}</p>
              <small>{["故事", "剧本", "角色"].includes(label) ? "真实 Core 工作区入口。" : "迁移期兼容入口，不表示 V3 页面已完成。"}</small>
            </ACSCard>
          ))}
        </div>
      </section>

      <section aria-labelledby="blocked-destinations-title" className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="blocked-destinations-title">未开放目的地</h2>
            <p>这些位置可发现，但不提供执行按钮。</p>
          </div>
        </div>
        <div className={styles.blockerGrid}>
          <div id="destination-storyboard">
            <CapabilityBlocker blockerClass="ui_missing" severity="warning" affectedCapability="分镜" title="分镜" cause="分镜与服务器方法计划界面将在 Wave 2 实施" consequence="当前不能在此建立新的分镜或服务器方法计划" owner="Frontend Wave 2" compact />
          </div>
          <div id="destination-generation">
            <CapabilityBlocker
              blockerClass="runtime_unavailable"
              severity="warning"
              affectedCapability="生成"
              title="生成"
              cause="新的 Method-aware Generation Studio 尚未实施"
              consequence="当前不能从概览提交新的生成任务"
              owner="Frontend Wave 2 与 M10–M13 Runtime"
              evidenceAction={<Link className={styles.compatibilityLink} href={`${projectRoot}/production`}>查看历史兼容生产记录 · 只读/现有证据 · 不是新的 Generation Studio</Link>}
              compact
            />
          </div>
          <div id="destination-audio">
            <CapabilityBlocker blockerClass="runtime_unavailable" severity="warning" affectedCapability="音频" title="音频" cause="显式音频需求界面尚未实施，M12 Runtime G0 未完成" consequence="当前不能提交新的音频生产任务" owner="Frontend Wave 2 与 M12" compact />
          </div>
          <div id="destination-timeline">
            <CapabilityBlocker blockerClass="ui_missing" severity="warning" affectedCapability="剪辑" title="剪辑" cause="M13 Timeline Studio 产品界面尚未实施" consequence="当前不能在此创建或修改 Timeline" owner="Frontend Wave 2 与 M13" compact />
          </div>
        </div>
      </section>
    </div>
  );
}

function ProjectUnavailable({
  status,
  message,
  refresh,
}: {
  status: "loading" | "absent" | "disconnected" | "error";
  message?: string;
  refresh: () => void;
}) {
  if (status === "loading") return <p className={styles.loading} role="status">正在读取项目</p>;
  if (status === "absent") {
    return <EmptyProductState variant="no_results" title="未找到该项目" explanation="项目不存在，或当前工作区无权读取该项目" primaryAction={<Link className={styles.primaryLink} href="/creator/projects">返回项目中心</Link>} contentLabel="未找到项目" />;
  }
  if (status === "disconnected") {
    return <EmptyProductState variant="disconnected" title="Core 未连接" explanation={message ?? "当前无法读取 Creator Core。"} primaryAction={<ACSButton onClick={refresh}>重新连接</ACSButton>} contentLabel="项目 Core 未连接" />;
  }
  return <EmptyProductState variant="unknown" title="项目集合无法读取" explanation={message ?? "项目集合无法读取，请稍后重试。"} secondaryAction={<ACSButton variant="secondary" onClick={refresh}>重新读取</ACSButton>} contentLabel="项目读取错误" />;
}

export function ProjectOverviewV3({ projectRef }: { projectRef: string }) {
  const { state, refresh } = useV3ProjectCollection();
  const project = state.status === "ready"
    ? state.projects.find((candidate) => candidate.projectRef === projectRef) ?? null
    : null;

  let primaryCanvas;
  if (project) primaryCanvas = <OverviewCanvas project={project} />;
  else if (state.status === "ready" || state.status === "empty") primaryCanvas = <div className={styles.stateCanvas}><ProjectUnavailable status="absent" refresh={refresh} /></div>;
  else if (state.status === "disconnected") primaryCanvas = <div className={styles.stateCanvas}><ProjectUnavailable status="disconnected" message={state.error.message} refresh={refresh} /></div>;
  else if (state.status === "error") primaryCanvas = <div className={styles.stateCanvas}><ProjectUnavailable status="error" message={state.error.message} refresh={refresh} /></div>;
  else primaryCanvas = <div className={styles.stateCanvas}><ProjectUnavailable status="loading" refresh={refresh} /></div>;

  const evidenceFields: readonly EvidenceFieldView[] = [
    ...(project ? [
      { id: "project-status", label: "项目状态", value: statusLabel(project.status), sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "project-version", label: "项目版本", value: `v${project.version}`, sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "project-updated", label: "最后更新时间", value: formattedDate(project.updatedAt), sensitivity: "ordinary" as const, copyAllowed: false },
    ] : []),
    { id: "project-ref", label: "项目引用", value: projectRef, sensitivity: "restricted", copyAllowed: true },
    ...(state.status === "error" || state.status === "disconnected"
      ? [{ id: "error-code", label: "技术错误代码", value: state.error.code, sensitivity: "restricted" as const, copyAllowed: true }]
      : []),
    { id: "credentials", label: "认证与账号信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "认证和账号信息始终隐藏" },
  ];

  const inspector = project ? (
    <section className={styles.inspector} aria-label="项目摘要检查器">
      <span>当前选择</span>
      <h2>{project.title || "未命名项目"}</h2>
      <p>{project.projectType || "类型未设置"} · {project.aspectRatio || "画幅未设置"}</p>
      <p>此处不推断运行时、授权或发布准备度。</p>
    </section>
  ) : undefined;

  return (
    <CreatorProjectShell
      project={project}
      projectRef={projectRef}
      activeDestinationId="overview"
      primaryCanvas={primaryCanvas}
      inspector={inspector}
      authorityEvidence={{
        layers: authorityLayers,
        summary: "项目基础记录可读不代表生产准备度、授权或策略已通过。",
        fields: evidenceFields,
        evidenceSummary: "项目引用仅在显式打开的受限证据中展示。",
      }}
    />
  );
}
