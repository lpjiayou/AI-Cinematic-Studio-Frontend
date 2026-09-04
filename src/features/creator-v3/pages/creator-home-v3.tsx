"use client";

import Link from "next/link";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  EmptyProductState,
  type AuthorityLayerView,
  type EvidenceFieldView,
} from "@/components";
import type { CreatorProject } from "@/features/core-integration";
import { useV3ProjectCollection } from "../data";
import { CreatorGlobalShell, type CreatorGlobalConnectionState } from "../shell";
import styles from "./creator-home-v3.module.css";

const authorityLayers: readonly AuthorityLayerView[] = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "本页面和项目入口已可用" },
  { id: "runtime", label: "运行时", state: "not_applicable", stateLabel: "不适用", message: "本页面不执行生成运行时" },
  { id: "authority", label: "授权", state: "unverified", stateLabel: "尚未核验", message: "当前未读取具体项目生产授权" },
  { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "当前未读取具体项目生产策略" },
];

function connectionState(status: string): CreatorGlobalConnectionState {
  if (status === "ready" || status === "empty") return "connected";
  if (status === "disconnected") return "disconnected";
  if (status === "error") return "error";
  return "loading";
}

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
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ProjectCard({ project }: { project: CreatorProject }) {
  return (
    <ACSCard
      title={project.title || "未命名项目"}
      description={project.description || "暂无项目说明"}
      headerAction={<ACSBadge>{statusLabel(project.status)}</ACSBadge>}
      footer={(
        <Link className={styles.primaryLink} href={`/creator/projects/${encodeURIComponent(project.projectRef)}/overview`}>
          继续项目
        </Link>
      )}
      interactive
    >
      <dl className={styles.projectFacts}>
        <div><dt>类型</dt><dd>{project.projectType || "未设置"}</dd></div>
        <div><dt>画幅</dt><dd>{project.aspectRatio || "未设置"}</dd></div>
        <div><dt>计划分集</dt><dd>{project.plannedEpisodeCount}</dd></div>
        <div><dt>版本</dt><dd>v{project.version}</dd></div>
        <div className={styles.wideFact}><dt>最近更新</dt><dd>{formattedDate(project.updatedAt)}</dd></div>
      </dl>
    </ACSCard>
  );
}

export function CreatorHomeV3() {
  const { state, refresh } = useV3ProjectCollection();
  const evidenceFields: readonly EvidenceFieldView[] = state.status === "error" || state.status === "disconnected"
    ? [
        { id: "collection-state", label: "项目集合状态", value: state.status, sensitivity: "ordinary", copyAllowed: false },
        { id: "error-code", label: "技术错误代码", value: state.error.code, sensitivity: "restricted", copyAllowed: true },
        { id: "credentials", label: "认证与账号信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "不在产品界面展示" },
      ]
    : [
        { id: "collection-source", label: "项目来源", value: "Creator Core 项目集合", sensitivity: "ordinary", copyAllowed: false },
        { id: "sort", label: "排序范围", value: "当前已加载集合内按更新时间降序", sensitivity: "ordinary", copyAllowed: false },
        { id: "credentials", label: "认证与账号信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "不在产品界面展示" },
      ];

  let recentProjects;
  if (state.status === "ready") {
    recentProjects = (
      <div className={styles.projectGrid}>
        {state.projects.slice(0, 3).map((project) => <ProjectCard key={project.projectRef} project={project} />)}
      </div>
    );
  } else if (state.status === "empty") {
    recentProjects = (
      <EmptyProductState
        variant="no_data"
        title="还没有已保存的项目"
        explanation="Creator Core 当前返回了空项目集合。"
        primaryAction={<Link className={styles.primaryLink} href="/creator/projects/new">新建项目</Link>}
        contentLabel="空项目集合"
      />
    );
  } else if (state.status === "disconnected") {
    recentProjects = (
      <EmptyProductState
        variant="disconnected"
        title="暂时无法读取 Creator Core"
        explanation={state.error.message}
        primaryAction={<ACSButton onClick={refresh}>重新连接</ACSButton>}
        contentLabel="Creator Core 未连接"
      />
    );
  } else if (state.status === "error") {
    recentProjects = (
      <EmptyProductState
        variant="unknown"
        title="项目集合无法读取"
        explanation={state.error.message}
        secondaryAction={<ACSButton variant="secondary" onClick={refresh}>重新读取</ACSButton>}
        contentLabel="项目集合读取错误"
      />
    );
  } else {
    recentProjects = <p className={styles.loading} role="status">正在读取项目</p>;
  }

  return (
    <CreatorGlobalShell
      activeDestinationId="home"
      title="创作首页"
      description="继续项目制作，或查看尚未开放的快速创作能力。"
      connectionState={connectionState(state.status)}
      authorityLayers={authorityLayers}
      authoritySummary="界面、运行时、授权和策略分别呈现，不聚合为整体就绪。"
      evidenceFields={evidenceFields}
      evidenceSummary="只展示项目集合连接与客户端排序边界。"
      primaryCanvas={(
        <div className={styles.canvas}>
          <header className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}>Creator V3</span>
              <h1>创作首页</h1>
              <p>继续项目制作，或查看尚未开放的快速创作能力。</p>
            </div>
            <div className={styles.headerActions}>
              <Link className={styles.primaryLink} href="/creator/projects/new">新建项目</Link>
              <Link className={styles.secondaryLink} href="/creator/projects">查看全部项目</Link>
            </div>
          </header>

          <section aria-labelledby="creation-modes-title" className={styles.section}>
            <div className={styles.sectionHeading}>
              <h2 id="creation-modes-title">选择创作方式</h2>
              <p>先选择任务边界，再进入对应工作区。</p>
            </div>
            <div className={styles.modeGrid}>
              <ACSCard
                title="项目制作"
                description="用于系列、分集、剧本、角色、镜头、生成、剪辑和交付的长流程。"
                headerAction={<ACSBadge tone="primary">可进入</ACSBadge>}
                footer={<Link className={styles.primaryLink} href="/creator/projects">打开项目</Link>}
                interactive
              >
                <p className={styles.cardCopy}>从真实 Creator Core 项目集合继续工作。</p>
              </ACSCard>
              <ACSCard
                title="快速创作"
                description="用于单个图像、视频或音频任务；当前生成运行时尚未开放。"
                headerAction={<ACSBadge tone="warning">受限</ACSBadge>}
                footer={<Link className={styles.secondaryLink} href="/creator/create">查看开放条件</Link>}
              >
                <p className={styles.cardCopy}>此入口只解释阻断条件，不提交生成任务。</p>
              </ACSCard>
            </div>
          </section>

          <section aria-labelledby="recent-projects-title" className={styles.section}>
            <div className={styles.sectionHeading}>
              <h2 id="recent-projects-title">最近项目</h2>
              <p>最多显示三个项目；排序仅作用于当前已加载集合。</p>
            </div>
            {recentProjects}
          </section>

          <section aria-labelledby="creative-assistance-title" className={styles.assistance}>
            <div>
              <span className={styles.aiLabel}>创意辅助</span>
              <h2 id="creative-assistance-title">在建项前整理创作方向</h2>
              <p>在建立项目之前整理故事意图、观众和视觉方向。</p>
            </div>
            <Link className={styles.secondaryLink} href="/creator/ai-director">打开 AI 导演</Link>
          </section>
        </div>
      )}
    />
  );
}
