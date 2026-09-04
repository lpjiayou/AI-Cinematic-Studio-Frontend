"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSDrawer,
  EmptyProductState,
  type AuthorityLayerView,
  type EvidenceFieldView,
} from "@/components";
import type { CreatorProject } from "@/features/core-integration";
import { useV3ProjectCollection } from "../data";
import { CreatorGlobalShell, type CreatorGlobalConnectionState } from "../shell";
import styles from "./project-center-v3.module.css";

const authorityLayers: readonly AuthorityLayerView[] = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "真实项目集合浏览与客户端筛选已可用" },
  { id: "runtime", label: "运行时", state: "not_applicable", stateLabel: "不适用", message: "项目中心不执行生成运行时" },
  { id: "authority", label: "授权", state: "unverified", stateLabel: "尚未核验", message: "未读取项目级生产授权" },
  { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "未读取项目级生产策略" },
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
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function ProjectFilters({
  projects,
  query,
  status,
  projectType,
  onQueryChange,
  onStatusChange,
  onProjectTypeChange,
}: {
  projects: readonly CreatorProject[];
  query: string;
  status: string;
  projectType: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onProjectTypeChange: (value: string) => void;
}) {
  const statuses = [...new Set(projects.map((project) => project.status))].sort();
  const projectTypes = [...new Set(projects.map((project) => project.projectType))].sort();
  return (
    <div className={styles.filters}>
      <label>
        <span>搜索当前集合</span>
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="项目名称或说明" />
      </label>
      <label>
        <span>状态</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="">全部状态</option>
          {statuses.map((value) => <option key={value} value={value}>{statusLabel(value)}</option>)}
        </select>
      </label>
      <label>
        <span>项目类型</span>
        <select value={projectType} onChange={(event) => onProjectTypeChange(event.target.value)}>
          <option value="">全部类型</option>
          {projectTypes.map((value) => <option key={value} value={value}>{value || "未设置"}</option>)}
        </select>
      </label>
      <p>筛选作用于当前已加载项目</p>
    </div>
  );
}

function ProjectCard({ project }: { project: CreatorProject }) {
  return (
    <ACSCard
      title={project.title || "未命名项目"}
      description={project.description || "暂无项目说明"}
      headerAction={<ACSBadge>{statusLabel(project.status)}</ACSBadge>}
      footer={<Link className={styles.primaryLink} href={`/creator/projects/${encodeURIComponent(project.projectRef)}/overview`}>打开项目</Link>}
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

export function ProjectCenterV3() {
  const { state, refresh } = useV3ProjectCollection();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [projectType, setProjectType] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);
  const projects = useMemo(
    () => state.status === "ready" ? state.projects : [],
    [state],
  );
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
    return projects.filter((project) => {
      const textMatches = !normalizedQuery || `${project.title} ${project.description}`.toLocaleLowerCase("zh-CN").includes(normalizedQuery);
      return textMatches && (!status || project.status === status) && (!projectType || project.projectType === projectType);
    });
  }, [projectType, projects, query, status]);

  const filterProps = {
    projects,
    query,
    status,
    projectType,
    onQueryChange: setQuery,
    onStatusChange: setStatus,
    onProjectTypeChange: setProjectType,
  };

  let collectionContent;
  if (state.status === "ready" && filteredProjects.length > 0) {
    collectionContent = <div className={styles.projectGrid}>{filteredProjects.map((project) => <ProjectCard key={project.projectRef} project={project} />)}</div>;
  } else if (state.status === "ready") {
    collectionContent = <EmptyProductState variant="no_results" title="当前筛选没有匹配项目" explanation="请调整当前已加载项目内的筛选条件。" contentLabel="项目筛选无结果" />;
  } else if (state.status === "empty") {
    collectionContent = <EmptyProductState variant="no_data" title="尚无项目" explanation="Creator Core 当前返回了空项目集合。" contentLabel="空项目集合" />;
  } else if (state.status === "disconnected") {
    collectionContent = <EmptyProductState variant="disconnected" title="Core 未连接" explanation={state.error.message} primaryAction={<ACSButton onClick={refresh}>重新连接</ACSButton>} contentLabel="Core 未连接" />;
  } else if (state.status === "error") {
    collectionContent = <EmptyProductState variant="unknown" title="项目集合无法读取" explanation={state.error.message} secondaryAction={<ACSButton variant="secondary" onClick={refresh}>重新读取</ACSButton>} contentLabel="项目集合读取错误" />;
  } else {
    collectionContent = <p className={styles.loading} role="status">正在读取项目</p>;
  }

  const evidenceFields: readonly EvidenceFieldView[] = [
    { id: "source", label: "数据来源", value: "Creator Core 项目集合", sensitivity: "ordinary", copyAllowed: false },
    { id: "filter-boundary", label: "筛选边界", value: "当前已加载项目", sensitivity: "ordinary", copyAllowed: false },
    ...(state.status === "error" || state.status === "disconnected"
      ? [{ id: "error-code", label: "技术错误代码", value: state.error.code, sensitivity: "restricted" as const, copyAllowed: true }]
      : []),
    { id: "credentials", label: "认证与账号信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "不在产品界面展示" },
  ];

  return (
    <CreatorGlobalShell
      activeDestinationId="projects"
      title="项目"
      description="查找、创建并继续真实 Creator Core 项目。"
      connectionState={connectionState(state.status)}
      authorityLayers={authorityLayers}
      authoritySummary="项目集合可读不代表任何具体项目已获得生产授权。"
      evidenceFields={evidenceFields}
      evidenceSummary="只记录集合来源和客户端筛选边界。"
      primaryCanvas={(
        <div className={styles.canvas}>
          <header className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}>Creator Core 项目集合</span>
              <h1>项目</h1>
              <p>查找、创建并继续真实 Creator Core 项目。</p>
            </div>
            <Link className={styles.primaryLink} href="/creator/projects/new">新建项目</Link>
          </header>

          {state.status === "ready" ? (
            <>
              <div className={styles.desktopFilters}><ProjectFilters {...filterProps} /></div>
              <div className={styles.mobileFilterTrigger}>
                <ACSButton ref={filterTriggerRef} variant="secondary" onClick={() => setFilterDrawerOpen(true)}>筛选项目</ACSButton>
                <ACSDrawer
                  open={filterDrawerOpen}
                  onClose={() => setFilterDrawerOpen(false)}
                  title="筛选项目"
                  description="筛选只作用于当前已加载项目。"
                  side="right"
                  size="wide"
                  closeLabel="关闭项目筛选"
                >
                  <ProjectFilters {...filterProps} />
                </ACSDrawer>
              </div>
            </>
          ) : null}

          <section aria-labelledby="project-list-title" className={styles.collection}>
            <div className={styles.sectionHeading}>
              <h2 id="project-list-title">真实项目</h2>
              <span>{state.status === "ready" ? `${filteredProjects.length} / ${projects.length}` : "等待数据"}</span>
            </div>
            {collectionContent}
          </section>
        </div>
      )}
    />
  );
}
