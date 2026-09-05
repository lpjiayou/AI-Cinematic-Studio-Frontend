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
import { useStoryWorkspaceV3 } from "./use-story-workspace-v3";
import styles from "./story-workspace-v3.module.css";

const sectionItems = [
  ["series-plan", "系列规划"],
  ["narrative-arcs", "叙事弧"],
  ["episode-plan", "分集计划"],
  ["story-authority", "故事权威"],
] as const;

function LocalSectionNavigation() {
  return (
    <>
      <nav
        aria-label="故事区域"
        className={styles.sectionRail}
        data-workspace-local-rail="story"
      >
        <strong>故事结构</strong>
        {sectionItems.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>
      <label className={styles.sectionSelector}>
        <span>故事区域</span>
        <select
          aria-label="故事区域"
          data-workspace-section-selector="story"
          defaultValue={sectionItems[0][0]}
          onChange={(event) => {
            document.getElementById(event.currentTarget.value)?.scrollIntoView({
              block: "start",
            });
          }}
        >
          {sectionItems.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
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
        contentLabel="故事项目不存在"
      />
    );
  }
  if (status === "disconnected") {
    return (
      <EmptyProductState
        variant="disconnected"
        title={title}
        explanation={message}
        primaryAction={<ACSButton onClick={refresh}>重新连接</ACSButton>}
        contentLabel="故事工作区连接中断"
      />
    );
  }
  return (
    <EmptyProductState
      variant="unknown"
      title={title}
      explanation={message}
      secondaryAction={<ACSButton variant="secondary" onClick={refresh}>重新读取</ACSButton>}
      contentLabel="故事工作区读取错误"
    />
  );
}

function StoryScopeBlocker({
  code,
  message,
}: {
  code: string;
  message: string;
}) {
  const multiple = code === "series_context_selection_required";
  return (
    <CapabilityBlocker
      blockerClass="authority_required"
      severity="warning"
      affectedCapability="故事工作区系列上下文"
      title={multiple ? "需要选择系列上下文" : "需要绑定系列"}
      cause={message}
      consequence="当前不会猜测或创建 Series，也不会继续请求系列规划和故事权威。"
      owner={multiple ? "未来 Series Context Selector 波次" : "Project / Series Foundation"}
    />
  );
}

function StoryReadyCanvas({
  workspace,
}: {
  workspace: ReturnType<typeof useStoryWorkspaceV3>;
}) {
  const { state } = workspace;
  if (state.status !== "ready") return null;
  const latestVersion = state.planning.versions.at(-1) ?? null;
  const planMissing = state.planning.plan === null;
  const intelligenceReady = state.intelligence.status === "ready";
  const storyState = planMissing
    ? "plan-missing"
    : intelligenceReady
      ? "authority-ready"
      : "authority-blocked";

  return (
    <div className={styles.workspace} data-story-state={storyState}>
      <LocalSectionNavigation />
      <div className={styles.storyCanvas}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>系列规划与故事权威</span>
            <h1>故事</h1>
            <p>建立系列叙事规划，并核对当前世界与角色连续性来源。</p>
          </div>
          <ACSBadge tone={planMissing ? "neutral" : "primary"}>
            {planMissing ? "规划尚未建立" : "规划已确认"}
          </ACSBadge>
        </header>

        <section id="series-plan" className={styles.section} aria-labelledby="series-plan-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>系列规划</span>
              <h2 id="series-plan-title">{planMissing ? "先建立系列叙事规划" : "当前系列规划已确认"}</h2>
            </div>
            {!planMissing && state.planning.plan ? (
              <ACSBadge tone="primary">规划 v{state.planning.plan.version}</ACSBadge>
            ) : null}
          </div>

          {planMissing ? (
            <ACSCard padding="spacious">
              <p className={styles.supportingCopy}>
                说明系列主线、阶段转折和分集节奏。生成结果首先是候选，未经明确确认不会成为系列规划版本。
              </p>
              <label className={styles.inputField}>
                <span>系列叙事说明</span>
                <textarea
                  aria-label="系列规划创意输入"
                  maxLength={4000}
                  value={workspace.creativeInput}
                  onChange={(event) => workspace.setCreativeInput(event.target.value)}
                />
                <small>{workspace.creativeInput.trim().length}/4000 · 至少 10 个字符</small>
              </label>
              <div className={styles.actionRow}>
                <ACSButton
                  disabled={
                    workspace.creativeInput.trim().length < 10 ||
                    workspace.operation !== "idle"
                  }
                  loading={workspace.operation === "generating"}
                  onClick={() => void workspace.generateCandidate()}
                >
                  生成规划候选
                </ACSButton>
              </div>
            </ACSCard>
          ) : latestVersion ? (
            <div className={styles.planSummary}>
              <ACSCard title={latestVersion.seriesConcept} padding="spacious">
                <p>{latestVersion.logline}</p>
              </ACSCard>
            </div>
          ) : (
            <EmptyProductState
              variant="unknown"
              title="规划版本状态无法验证"
              explanation="Core 表示规划已存在，但没有返回可展示的当前规划版本。"
              contentLabel="规划版本状态错误"
            />
          )}

          {workspace.candidate ? (
            <ACSCard
              className={styles.candidate}
              tone="ai"
              title={workspace.candidate.seriesConcept}
              description="候选 · 尚未写入系列规划 · 需要人工确认"
              headerAction={<ACSBadge tone="ai">候选</ACSBadge>}
            >
              <p>{workspace.candidate.logline}</p>
              <div className={styles.candidateColumns}>
                <div>
                  <strong>叙事弧</strong>
                  <ul>
                    {workspace.candidate.mainArcs.map((arc) => (
                      <li key={`${arc.arcNumber}-${arc.title}`}>
                        第 {arc.episodeStart}–{arc.episodeEnd} 集 · {arc.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>分集计划</strong>
                  <ul>
                    {workspace.candidate.episodePlanItems.map((episode) => (
                      <li key={episode.episodeNumber}>
                        第 {episode.episodeNumber} 集 · {episode.title}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className={styles.actionRow}>
                <ACSButton
                  disabled={workspace.operation !== "idle"}
                  loading={workspace.operation === "confirming"}
                  onClick={() => void workspace.confirmCandidate()}
                >
                  人工确认并建立版本
                </ACSButton>
                <ACSButton
                  variant="secondary"
                  disabled={workspace.operation !== "idle"}
                  onClick={workspace.discardCandidate}
                >
                  放弃候选
                </ACSButton>
              </div>
            </ACSCard>
          ) : null}
          <p className={styles.operationMessage} role="status" aria-live="polite">
            {workspace.operationMessage}
          </p>
        </section>

        <section id="narrative-arcs" className={styles.section} aria-labelledby="arcs-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>叙事弧</span><h2 id="arcs-title">阶段转折</h2></div>
          </div>
          {latestVersion ? (
            <div className={styles.cardGrid}>
              {latestVersion.mainArcs.map((arc) => (
                <ACSCard key={`${arc.arcNumber}-${arc.title}`} title={arc.title} description={`第 ${arc.episodeStart}–${arc.episodeEnd} 集`}>
                  <p>{arc.objective}</p>
                  <small>转折：{arc.turningPoint}</small>
                </ACSCard>
              ))}
            </div>
          ) : <p className={styles.supportingCopy}>确认系列规划后显示真实叙事弧。</p>}
        </section>

        <section id="episode-plan" className={styles.section} aria-labelledby="episodes-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>分集计划</span><h2 id="episodes-title">分集叙事节奏</h2></div>
          </div>
          {latestVersion ? (
            <ol className={styles.episodeList}>
              {latestVersion.episodePlanItems.map((episode) => (
                <li key={episode.episodeNumber}>
                  <span>{String(episode.episodeNumber).padStart(2, "0")}</span>
                  <div><strong>{episode.title}</strong><p>{episode.logline}</p></div>
                </li>
              ))}
            </ol>
          ) : <p className={styles.supportingCopy}>确认系列规划后显示真实分集计划。</p>}
        </section>

        <section id="story-authority" className={styles.section} aria-labelledby="authority-title">
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>故事权威</span><h2 id="authority-title">世界与角色连续性来源</h2></div>
          </div>
          {state.intelligence.status === "ready" ? (
            <dl className={styles.factGrid}>
              <div><dt>世界圣经版本</dt><dd>{state.intelligence.workspace.seriesBibleVersions.length}</dd></div>
              <div><dt>角色连续性版本</dt><dd>{state.intelligence.workspace.characterContinuityVersions.length}</dd></div>
              <div><dt>来源兼容性</dt><dd>{state.intelligence.workspace.sourceCompatibility}</dd></div>
            </dl>
          ) : (
            <CapabilityBlocker
              blockerClass="authority_required"
              severity="warning"
              affectedCapability="世界与角色连续性"
              title="故事权威尚未开放"
              cause={state.intelligence.error.message}
              consequence="当前只能完成系列规划，不能把本地设定表示为权威世界数据"
              owner="M6 Identity / Scope Authority"
            />
          )}
        </section>
      </div>
    </div>
  );
}

function projectFromWorkspace(workspace: ReturnType<typeof useStoryWorkspaceV3>) {
  if (workspace.state.status === "ready") return workspace.state.project;
  if (workspace.state.status === "blocked") return workspace.state.blocker.project ?? null;
  return null;
}

function storyAuthorityLayers(
  workspace: ReturnType<typeof useStoryWorkspaceV3>,
): readonly AuthorityLayerView[] {
  const intelligenceReady =
    workspace.state.status === "ready" && workspace.state.intelligence.status === "ready";
  return [
    { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "Story Workspace V3 已可用" },
    { id: "runtime", label: "运行时", state: "not_applicable", stateLabel: "不适用", message: "本页不执行媒体生成运行时" },
    intelligenceReady
      ? { id: "authority", label: "授权", state: "available", stateLabel: "可读取", message: "当前 M6 只读投影可读取；不代表写入授权" }
      : { id: "authority", label: "授权", state: "required", stateLabel: "需要授权", message: "需要 M6 外部范围和身份授权" },
    { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "本页未读取后续生产策略" },
  ];
}

function storyEvidence(
  workspace: ReturnType<typeof useStoryWorkspaceV3>,
  projectRef: string,
): readonly EvidenceFieldView[] {
  const state = workspace.state;
  const ready = state.status === "ready" ? state : null;
  const errorCode =
    state.status === "blocked"
      ? state.blocker.code
      : state.status === "absent" || state.status === "disconnected" || state.status === "error"
        ? state.error.code
        : workspace.operationError?.code;
  return [
    ...(ready ? [
      { id: "planning-state", label: "系列规划状态", value: ready.planning.plan ? "已确认" : "尚未建立", sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "planning-version", label: "系列规划版本", value: ready.planning.plan ? `v${ready.planning.plan.version}` : "尚未建立", sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "bible-count", label: "世界圣经版本数", value: ready.intelligence.status === "ready" ? String(ready.intelligence.workspace.seriesBibleVersions.length) : "不可读取", sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "character-count", label: "角色连续性版本数", value: ready.intelligence.status === "ready" ? String(ready.intelligence.workspace.characterContinuityVersions.length) : "不可读取", sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "source-compatibility", label: "来源兼容性", value: ready.intelligence.status === "ready" ? ready.intelligence.workspace.sourceCompatibility : "不可读取", sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "series-ref", label: "系列引用", value: ready.seriesRef, sensitivity: "restricted" as const, copyAllowed: true },
    ] : []),
    { id: "project-ref", label: "项目引用", value: projectRef, sensitivity: "restricted", copyAllowed: true },
    ...(errorCode ? [{ id: "error-code", label: "技术错误代码", value: errorCode, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    { id: "credentials", label: "认证与账号信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "认证信息、账号信息、token 与 cookie 始终隐藏" },
  ];
}

export function StoryWorkspaceV3({ projectRef }: { projectRef: string }) {
  const workspace = useStoryWorkspaceV3(projectRef);
  const project: CreatorProject | null = projectFromWorkspace(workspace);

  let primaryCanvas;
  if (workspace.state.status === "loading") {
    primaryCanvas = <div className={styles.centerState} role="status">正在读取故事工作区</div>;
  } else if (workspace.state.status === "blocked") {
    primaryCanvas = <div className={styles.centerState}><StoryScopeBlocker code={workspace.state.blocker.code} message={workspace.state.blocker.message} /></div>;
  } else if (workspace.state.status === "absent") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="absent" title="未找到故事项目" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else if (workspace.state.status === "disconnected") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="disconnected" title="Creator Core 未连接" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else if (workspace.state.status === "error") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="error" title="故事工作区无法读取" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else {
    primaryCanvas = <StoryReadyCanvas workspace={workspace} />;
  }

  const ready = workspace.state.status === "ready" ? workspace.state : null;
  const versionLabel = ready?.planning.plan ? `规划 v${ready.planning.plan.version}` : "规划尚未建立";
  return (
    <CreatorProjectShell
      project={project}
      projectRef={projectRef}
      activeDestinationId="story"
      primaryCanvas={primaryCanvas}
      contextBar={{
        seriesLabel: ready ? "唯一绑定 Series" : "系列上下文待核验",
        episodeLabel: "系列规划范围",
        versionLabel,
        versionStateText: ready?.planning.plan ? "当前系列规划已确认" : "尚未建立",
        readinessSummary: "系列规划可用不代表世界权威或生产运行时已开放",
        readinessState: ready?.planning.plan ? "available" : "unverified",
        contextLabel: "Story Workspace V3 项目上下文",
      }}
      authorityEvidence={{
        layers: storyAuthorityLayers(workspace),
        summary: "系列规划、故事权威、运行时与策略保持独立状态。",
        fields: storyEvidence(workspace, projectRef),
        evidenceSummary: "项目与系列引用仅在显式打开的受限证据中展示。",
      }}
      contentLabel="故事主要画布"
      authorityLabel="故事授权与证据"
    />
  );
}
