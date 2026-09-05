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
import { CreatorProjectShell } from "../../shell";
import { useCharacterWorkspaceV3 } from "./use-character-workspace-v3";
import styles from "./character-studio-v3.module.css";

const sections = [
  ["continuity-versions", "连续性版本"],
  ["state-intervals", "状态区间"],
  ["relationship-boundaries", "关系边界"],
  ["source-status", "来源状态"],
] as const;

function LocalNavigation() {
  return (
    <>
      <nav className={styles.sectionRail} aria-label="角色连续性区域" data-workspace-local-rail="characters">
        <strong>角色连续性</strong>
        {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <label className={styles.sectionSelector}>
        <span>角色连续性区域</span>
        <select
          aria-label="角色连续性区域"
          data-workspace-section-selector="characters"
          defaultValue={sections[0][0]}
          onChange={(event) => document.getElementById(event.currentTarget.value)?.scrollIntoView({ block: "start" })}
        >
          {sections.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
    </>
  );
}

function ReadFailure({
  status,
  title,
  message,
  refresh,
}: {
  status: "absent" | "disconnected" | "error";
  title: string;
  message: string;
  refresh: () => void;
}) {
  if (status === "absent") {
    return (
      <EmptyProductState
        variant="no_results"
        title={title}
        explanation={message}
        primaryAction={<Link className={styles.primaryLink} href="/creator/projects">返回项目中心</Link>}
        contentLabel="角色项目不存在"
      />
    );
  }
  return (
    <EmptyProductState
      variant={status === "disconnected" ? "disconnected" : "unknown"}
      title={title}
      explanation={message}
      primaryAction={status === "disconnected" ? <ACSButton onClick={refresh}>重新连接</ACSButton> : undefined}
      secondaryAction={status === "error" ? <ACSButton variant="secondary" onClick={refresh}>重新读取</ACSButton> : undefined}
      contentLabel={status === "disconnected" ? "角色工作区连接中断" : "角色工作区读取错误"}
    />
  );
}

function ScopeBlocker({ code, message }: { code: string; message: string }) {
  const multiple = code === "series_context_selection_required";
  return (
    <CapabilityBlocker
      blockerClass="authority_required"
      severity="warning"
      affectedCapability="角色连续性系列上下文"
      title={multiple ? "需要选择系列上下文" : "需要绑定系列"}
      cause={message}
      consequence="当前不会猜测 Series，也不会读取或创建角色连续性。"
      owner={multiple ? "未来 Series Context Selector 波次" : "Project / Series Foundation"}
    />
  );
}

type ClosedCount = number | null;

function continuityCounts(versions: Array<Record<string, unknown>>): {
  stateIntervals: ClosedCount;
  relationships: ClosedCount;
} {
  const latest = versions.at(-1);
  const content =
    latest && typeof latest.content === "object" && latest.content !== null
      ? (latest.content as Record<string, unknown>)
      : null;
  return {
    stateIntervals: Array.isArray(content?.stateIntervals)
      ? content.stateIntervals.length
      : null,
    relationships: Array.isArray(content?.relationships)
      ? content.relationships.length
      : null,
  };
}

function countLabel(value: ClosedCount) {
  return value === null ? "未提供结构化数据" : String(value);
}

function CharacterReadyCanvas({
  workspace,
  projectRef,
}: {
  workspace: ReturnType<typeof useCharacterWorkspaceV3>;
  projectRef: string;
}) {
  const { state } = workspace;
  if (state.status !== "ready") return null;
  const intelligence = state.intelligence;
  const pageState =
    intelligence.status === "source-missing"
      ? "source-missing"
      : intelligence.status === "blocked"
        ? "authority-blocked"
        : intelligence.workspace.characterContinuityVersions.length === 0
          ? "ready-empty"
          : "ready";
  const counts =
    intelligence.status === "ready"
      ? continuityCounts(intelligence.workspace.characterContinuityVersions)
      : { stateIntervals: null, relationships: null };

  return (
    <div className={styles.workspace} data-character-state={pageState}>
      <LocalNavigation />
      <div className={styles.canvas}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>连续性版本、状态区间、关系边界与来源</span>
            <h1>角色</h1>
            <p>核对当前系列中的角色连续性版本、状态区间、关系边界与权威来源。</p>
          </div>
          <ACSBadge tone={intelligence.status === "ready" ? "primary" : "neutral"}>
            {intelligence.status === "ready" ? "只读投影可读" : "权威前置未满足"}
          </ACSBadge>
        </header>

        {intelligence.status === "source-missing" ? (
          <CapabilityBlocker
            blockerClass="authority_required"
            severity="warning"
            affectedCapability="角色连续性"
            title="先建立系列规划"
            cause="角色连续性必须绑定已确认系列规划来源"
            consequence="当前不能读取或创建权威角色连续性版本"
            owner="Story Workspace"
            nextSafeAction={<Link className={styles.primaryLink} href={`/creator/projects/${encodeURIComponent(projectRef)}/story`}>打开故事工作区</Link>}
          />
        ) : intelligence.status === "blocked" ? (
          <CapabilityBlocker
            blockerClass="authority_required"
            severity="warning"
            affectedCapability="角色连续性"
            title="角色权威尚未开放"
            cause={intelligence.error.message}
            consequence="当前不能把本地人物卡或候选表示为权威角色数据"
            owner="M6 Identity / Scope Authority"
          />
        ) : intelligence.workspace.characterContinuityVersions.length === 0 ? (
          <EmptyProductState
            variant="no_data"
            title="当前还没有角色连续性版本"
            explanation="这是 Creator Core 返回的真实空状态；本页面不会使用本地角色样例替代"
            contentLabel="角色连续性真实空状态"
          />
        ) : null}

        <section id="continuity-versions" className={styles.section} aria-labelledby="versions-title">
          <div className={styles.sectionHeading}><span className={styles.eyebrow}>连续性版本</span><h2 id="versions-title">当前只读版本集合</h2></div>
          <ACSCard padding="spacious">
            <dl className={styles.factGrid}>
              <div><dt>角色连续性版本数</dt><dd>{intelligence.status === "ready" ? intelligence.workspace.characterContinuityVersions.length : "不可读取"}</dd></div>
              <div><dt>世界圣经版本数</dt><dd>{intelligence.status === "ready" ? intelligence.workspace.seriesBibleVersions.length : "不可读取"}</dd></div>
            </dl>
          </ACSCard>
        </section>

        <section id="state-intervals" className={styles.section} aria-labelledby="intervals-title">
          <div className={styles.sectionHeading}><span className={styles.eyebrow}>状态区间</span><h2 id="intervals-title">结构化区间摘要</h2></div>
          <ACSCard padding="spacious"><p className={styles.metric}>{countLabel(counts.stateIntervals)}</p><p>仅统计最新连续性内容中明确存在的 stateIntervals 数组。</p></ACSCard>
        </section>

        <section id="relationship-boundaries" className={styles.section} aria-labelledby="relationships-title">
          <div className={styles.sectionHeading}><span className={styles.eyebrow}>关系边界</span><h2 id="relationships-title">结构化关系摘要</h2></div>
          <ACSCard padding="spacious"><p className={styles.metric}>{countLabel(counts.relationships)}</p><p>仅统计最新连续性内容中明确存在的 relationships 数组。</p></ACSCard>
        </section>

        <section id="source-status" className={styles.section} aria-labelledby="source-title">
          <div className={styles.sectionHeading}><span className={styles.eyebrow}>来源状态</span><h2 id="source-title">权威来源兼容性</h2></div>
          <ACSCard padding="spacious"><p className={styles.metric}>{intelligence.status === "ready" ? intelligence.workspace.sourceCompatibility : "不可读取"}</p><p>只读投影可读不代表身份写入或生产激活已授权。</p></ACSCard>
        </section>
      </div>
    </div>
  );
}

function projectFromWorkspace(workspace: ReturnType<typeof useCharacterWorkspaceV3>) {
  if (workspace.state.status === "ready") return workspace.state.project;
  if (workspace.state.status === "blocked") return workspace.state.blocker.project ?? null;
  return null;
}

function characterAuthorityLayers(
  workspace: ReturnType<typeof useCharacterWorkspaceV3>,
): readonly AuthorityLayerView[] {
  const intelligenceReady =
    workspace.state.status === "ready" &&
    workspace.state.intelligence.status === "ready";
  return [
    { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "Character Studio V3 已可用" },
    { id: "runtime", label: "运行时", state: "not_applicable", stateLabel: "不适用", message: "本页不执行媒体生成运行时" },
    intelligenceReady
      ? { id: "authority", label: "授权", state: "available", stateLabel: "可读取", message: "当前 M6 只读投影可读；不授予写入权限" }
      : { id: "authority", label: "授权", state: "required", stateLabel: "需要授权", message: "需要准确的 M6 范围与身份授权" },
    { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "本页未读取生产策略" },
  ];
}

function characterEvidence(
  workspace: ReturnType<typeof useCharacterWorkspaceV3>,
  projectRef: string,
): readonly EvidenceFieldView[] {
  const state = workspace.state;
  const ready = state.status === "ready" ? state : null;
  const intelligence = ready?.intelligence.status === "ready" ? ready.intelligence.workspace : null;
  const counts = intelligence
    ? continuityCounts(intelligence.characterContinuityVersions)
    : { stateIntervals: null, relationships: null };
  const errorCode =
    state.status === "blocked"
      ? state.blocker.code
      : state.status === "absent" || state.status === "disconnected" || state.status === "error"
        ? state.error.code
        : ready?.intelligence.status === "blocked"
          ? ready.intelligence.error.code
          : undefined;
  return [
    ...(ready ? [{ id: "m5-source", label: "M5 来源状态", value: ready.planning.plan ? "已确认" : "尚未建立", sensitivity: "ordinary" as const, copyAllowed: false }] : []),
    ...(intelligence ? [
      { id: "bible-count", label: "世界圣经版本数", value: String(intelligence.seriesBibleVersions.length), sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "continuity-count", label: "角色连续性版本数", value: String(intelligence.characterContinuityVersions.length), sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "interval-count", label: "状态区间数量", value: countLabel(counts.stateIntervals), sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "relationship-count", label: "关系边界数量", value: countLabel(counts.relationships), sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "source-compatibility", label: "来源兼容性", value: intelligence.sourceCompatibility, sensitivity: "ordinary" as const, copyAllowed: false },
    ] : []),
    { id: "project-ref", label: "项目引用", value: projectRef, sensitivity: "restricted", copyAllowed: true },
    ...(ready ? [{ id: "series-ref", label: "系列引用", value: ready.seriesRef, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    ...(errorCode ? [{ id: "error-code", label: "技术错误代码", value: errorCode, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    { id: "credentials", label: "认证与身份内容", sensitivity: "redacted", copyAllowed: false, redactedReason: "认证信息、账号信息与 Identity bundle 内容始终隐藏" },
  ];
}

export function CharacterStudioV3({ projectRef }: { projectRef: string }) {
  const workspace = useCharacterWorkspaceV3(projectRef);
  const project: CreatorProject | null = projectFromWorkspace(workspace);
  let primaryCanvas;
  if (workspace.state.status === "loading") {
    primaryCanvas = <div className={styles.centerState} role="status">正在读取角色连续性工作区</div>;
  } else if (workspace.state.status === "blocked") {
    primaryCanvas = <div className={styles.centerState}><ScopeBlocker code={workspace.state.blocker.code} message={workspace.state.blocker.message} /></div>;
  } else if (workspace.state.status === "absent") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="absent" title="未找到角色项目" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else if (workspace.state.status === "disconnected") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="disconnected" title="Creator Core 未连接" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else if (workspace.state.status === "error") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="error" title="角色工作区无法读取" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else {
    primaryCanvas = <CharacterReadyCanvas workspace={workspace} projectRef={projectRef} />;
  }

  const ready = workspace.state.status === "ready" ? workspace.state : null;
  const intelligence = ready?.intelligence.status === "ready" ? ready.intelligence.workspace : null;
  const versionLabel = intelligence ? `角色连续性版本数 ${intelligence.characterContinuityVersions.length}` : "角色连续性版本数待核验";
  return (
    <CreatorProjectShell
      project={project}
      projectRef={projectRef}
      activeDestinationId="characters"
      primaryCanvas={primaryCanvas}
      contextBar={{
        seriesLabel: ready ? "唯一绑定 Series" : "系列上下文待核验",
        episodeLabel: "跨分集连续性",
        versionLabel,
        versionStateText: intelligence ? "只读投影可读" : "尚未开放",
        readinessSummary: "只读连续性可读不代表身份写入或生产激活已授权",
        readinessState: intelligence ? "available" : "required",
        contextLabel: "Character Studio V3 项目上下文",
      }}
      authorityEvidence={{
        layers: characterAuthorityLayers(workspace),
        summary: "角色连续性读取、身份写入、媒体运行时与生产策略保持独立状态。",
        fields: characterEvidence(workspace, projectRef),
        evidenceSummary: "身份引用、错误代码与敏感身份内容按证据等级分隔。",
      }}
      contentLabel="角色连续性主要画布"
      authorityLabel="角色授权与证据"
    />
  );
}
