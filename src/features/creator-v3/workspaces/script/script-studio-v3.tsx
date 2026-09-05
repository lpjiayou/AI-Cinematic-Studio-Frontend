"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSModal,
  CapabilityBlocker,
  EmptyProductState,
  type AuthorityLayerView,
  type EvidenceFieldView,
  type WorkbenchOverlay,
} from "@/components";
import type {
  CreatorProject,
  CreatorScriptVersion,
} from "@/features/core-integration";
import { CreatorProjectShell } from "../../shell";
import {
  internalNavigationHref,
  protectScriptBeforeUnload,
} from "./script-unsaved-guard";
import { useScriptWorkspaceV3 } from "./use-script-workspace-v3";
import styles from "./script-studio-v3.module.css";

type PendingNavigation =
  | { kind: "episode"; episodeRef: string }
  | { kind: "href"; href: string }
  | { kind: "overlay"; overlay: Exclude<WorkbenchOverlay, null> }
  | { kind: "back" };

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
        contentLabel="剧本项目不存在"
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
      contentLabel={status === "disconnected" ? "剧本工作区连接中断" : "剧本工作区读取错误"}
    />
  );
}

function ScopeBlocker({ code, message }: { code: string; message: string }) {
  const multiple = code === "series_context_selection_required";
  return (
    <CapabilityBlocker
      blockerClass="authority_required"
      severity="warning"
      affectedCapability="剧本工作区系列上下文"
      title={multiple ? "需要选择系列上下文" : "需要绑定系列"}
      cause={message}
      consequence="当前不会猜测 Series，也不会读取或创建 Episode 与 Script。"
      owner={multiple ? "未来 Series Context Selector 波次" : "Project / Series Foundation"}
    />
  );
}

function ReviewedImportBlocker() {
  return (
    <CapabilityBlocker
      blockerClass="ui_missing"
      severity="warning"
      affectedCapability="Reviewed Import"
      title="Reviewed Import 尚未接入当前 Frontend Adapter"
      cause="当前 Adapter 没有 reviewed-import 与 accept 路由。"
      consequence="本页不会展示可执行的导入或接受按钮。"
      owner="后续 M3 Adapter 波次"
    />
  );
}

function SceneList({ version }: { version: CreatorScriptVersion }) {
  if (version.scenes.length === 0) {
    return <p className={styles.muted}>当前版本没有可展示的结构化场景。</p>;
  }
  return (
    <ol className={styles.sceneList}>
      {version.scenes.map((scene) => (
        <li key={scene.scriptSceneRef}>
          <span>{String(scene.sceneNumber).padStart(2, "0")}</span>
          <div>
            <strong>{scene.heading}</strong>
            <small>{scene.location} · {scene.timeOfDay}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ScriptScenes({ version }: { version: CreatorScriptVersion }) {
  return (
    <div className={styles.scriptScenes}>
      {version.scenes.map((scene) => (
        <article key={scene.scriptSceneRef}>
          <header>
            <span>场 {scene.sceneNumber}</span>
            <strong>{scene.heading}</strong>
            <small>{scene.estimatedDurationSec} 秒</small>
          </header>
          <p className={styles.sceneMeta}>
            {scene.location} · {scene.timeOfDay} · {scene.characters.join("、") || "无出场角色"}
          </p>
          <p>{scene.action}</p>
          {scene.dialogue.map((line, index) => (
            <blockquote key={`${scene.scriptSceneRef}-${index}`}>
              <strong>{String(line.speaker ?? "对白")}</strong>
              <p>{String(line.text ?? "")}</p>
            </blockquote>
          ))}
        </article>
      ))}
    </div>
  );
}

function VersionFacts({
  label,
  version,
}: {
  label: string;
  version: CreatorScriptVersion;
}) {
  return (
    <ACSCard title={label} description={`剧本 v${version.versionNumber} · ${version.changeKind}`}>
      <dl className={styles.versionFacts}>
        <div><dt>标题</dt><dd>{version.title}</dd></div>
        <div><dt>一句话梗概</dt><dd>{version.logline}</dd></div>
        <div><dt>故事梗概</dt><dd>{version.synopsis}</dd></div>
        <div><dt>目标时长</dt><dd>{version.targetDurationSec} 秒</dd></div>
        <div><dt>场景数</dt><dd>{version.scenes.length}</dd></div>
      </dl>
    </ACSCard>
  );
}

function ScriptComparison({
  versions,
  latest,
}: {
  versions: CreatorScriptVersion[];
  latest: CreatorScriptVersion;
}) {
  const historical = versions.filter(
    (version) => version.scriptVersionRef !== latest.scriptVersionRef,
  );
  const [comparisonNumber, setComparisonNumber] = useState(
    historical.at(-1)?.versionNumber ?? latest.versionNumber,
  );
  const comparison =
    historical.find((version) => version.versionNumber === comparisonNumber) ??
    historical.at(-1) ??
    null;

  if (!comparison) {
    return (
      <EmptyProductState
        variant="no_results"
        title="当前没有可对比的历史版本"
        explanation="创建新的人工修订版本后，可在这里并排核对真实版本内容。"
        contentLabel="无剧本历史版本"
      />
    );
  }

  return (
    <div className={styles.comparison}>
      <label className={styles.compactField}>
        <span>对比版本</span>
        <select
          aria-label="选择对比版本"
          value={comparison.versionNumber}
          onChange={(event) => setComparisonNumber(Number(event.target.value))}
        >
          {historical.map((version) => (
            <option key={version.scriptVersionRef} value={version.versionNumber}>
              剧本 v{version.versionNumber} · {version.changeKind}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.comparisonColumns}>
        <VersionFacts label="当前版本" version={latest} />
        <VersionFacts label="对比版本" version={comparison} />
      </div>
      <div className={styles.comparisonColumns}>
        <section aria-label="当前版本场景"><h3>当前版本场景</h3><ScriptScenes version={latest} /></section>
        <section aria-label="对比版本场景"><h3>对比版本场景</h3><ScriptScenes version={comparison} /></section>
      </div>
      <p className={styles.muted}>此处只并排展示真实版本，不声称提供自动语义差异分析。</p>
    </div>
  );
}

function ScriptReadyCanvas({
  workspace,
  requestNavigation,
}: {
  workspace: ReturnType<typeof useScriptWorkspaceV3>;
  requestNavigation: (pending: PendingNavigation) => void;
}) {
  const { state } = workspace;
  const [mode, setMode] = useState<"edit" | "compare">("edit");
  if (state.status !== "ready") return null;
  const latest = workspace.latest;
  const pageState = !state.episodeRef
    ? "no-episode"
    : !state.workspace?.script || !latest
      ? "no-script"
      : "script-ready";

  return (
    <div className={styles.workspace} data-script-state={pageState}>
      <aside className={styles.navigator} data-workspace-local-rail="script">
        <div className={styles.navigatorHeading}>
          <span className={styles.eyebrow}>分集与场景</span>
          <strong>剧本结构</strong>
        </div>
        <label className={styles.compactField}>
          <span>当前分集</span>
          {state.series.episodes.length > 0 ? (
            <select
              aria-label="选择分集"
              value={state.episodeRef ?? ""}
              onChange={(event) => {
                const episodeRef = event.target.value;
                if (workspace.dirty) requestNavigation({ kind: "episode", episodeRef });
                else workspace.selectEpisode(episodeRef);
              }}
            >
              {state.series.episodes.map((episode) => (
                <option key={episode.episodeRef} value={episode.episodeRef}>
                  第 {episode.episodeNumber} 集 · {episode.title}
                </option>
              ))}
            </select>
          ) : <strong>尚未建立</strong>}
        </label>
        {latest ? <SceneList version={latest} /> : <p className={styles.muted}>建立剧本后显示场景导航。</p>}
      </aside>

      <div className={styles.mobileToolbar}>
        <label className={styles.mobileSelector}>
          <span>当前分集</span>
          {state.series.episodes.length > 0 ? (
            <select
              aria-label="移动端选择分集"
              value={state.episodeRef ?? ""}
              onChange={(event) => {
                const episodeRef = event.target.value;
                if (workspace.dirty) requestNavigation({ kind: "episode", episodeRef });
                else workspace.selectEpisode(episodeRef);
              }}
            >
              {state.series.episodes.map((episode) => (
                <option key={episode.episodeRef} value={episode.episodeRef}>
                  第 {episode.episodeNumber} 集 · {episode.title}
                </option>
              ))}
            </select>
          ) : <strong>尚未建立</strong>}
        </label>
        <label className={styles.mobileSelector}>
          <span>剧本区域</span>
          <select
            aria-label="剧本区域"
            data-workspace-section-selector="script"
            value={mode}
            onChange={(event) => setMode(event.target.value as "edit" | "compare")}
          >
            <option value="edit">编辑</option>
            <option value="compare">对比</option>
          </select>
        </label>
        <div className={styles.mobileStatus}>
          <span>{latest ? `剧本 v${latest.versionNumber}` : "剧本尚未生成"}</span>
          <strong data-script-mobile-dirty={workspace.dirty ? "true" : "false"}>
            {workspace.dirty ? "有未保存修改" : "所有修改已保存"}
          </strong>
        </div>
        {latest ? (
          <details className={styles.mobileScenes}>
            <summary>场景列表 · {latest.scenes.length} 场</summary>
            <SceneList version={latest} />
          </details>
        ) : null}
      </div>

      <div className={styles.canvas}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>分集、剧本版本、修订与确认</span>
            <h1>剧本</h1>
            <p>选择真实分集，生成、修订、比较并明确确认剧本版本。</p>
          </div>
          <ACSBadge tone={workspace.confirmed ? "success" : "neutral"}>
            {workspace.confirmed ? "当前版本已确认" : latest ? `剧本 v${latest.versionNumber}` : "尚未生成"}
          </ACSBadge>
        </header>

        {!state.episodeRef ? (
          <section className={styles.emptyArea} aria-labelledby="no-episode-title">
            <div>
              <span className={styles.eyebrow}>建立分集前置条件</span>
              <h2 id="no-episode-title">当前系列还没有分集</h2>
              <p>建立 Episode 需要一个已经确认并属于当前工作区的导演方案。</p>
            </div>
            <Link className={styles.primaryLink} href="/creator/ai-director">打开 AI 导演</Link>
            <details className={styles.advancedEpisode}>
              <summary>高级：使用已确认导演方案引用</summary>
              <div className={styles.episodeForm}>
                <label><span>creativePlanRef</span><input aria-label="creativePlanRef" value={workspace.creativePlanRef} onChange={(event) => workspace.setCreativePlanRef(event.target.value)} /></label>
                <label><span>分集序号</span><input aria-label="episodeNumber" type="number" min={1} value={workspace.episodeNumber} onChange={(event) => workspace.setEpisodeNumber(event.currentTarget.valueAsNumber)} /></label>
                <label><span>分集标题</span><input aria-label="episodeTitle" maxLength={500} value={workspace.episodeTitle} onChange={(event) => workspace.setEpisodeTitle(event.target.value)} /></label>
                <ACSButton
                  disabled={workspace.operation !== "idle" || !workspace.creativePlanRef.trim() || !workspace.episodeTitle.trim() || !Number.isInteger(workspace.episodeNumber) || workspace.episodeNumber < 1}
                  loading={workspace.operation === "creating-episode"}
                  onClick={() => void workspace.createEpisode()}
                >
                  建立 Episode
                </ACSButton>
              </div>
            </details>
          </section>
        ) : !state.workspace?.script || !latest ? (
          <section className={styles.emptyArea} aria-labelledby="no-script-title">
            <div>
              <span className={styles.eyebrow}>当前分集已就绪</span>
              <h2 id="no-script-title">当前分集可以建立第一版剧本</h2>
              <p>生成只读取 Episode 已绑定的人工确认导演方案。</p>
            </div>
            <ACSButton
              disabled={workspace.operation !== "idle"}
              loading={workspace.operation === "generating"}
              onClick={() => void workspace.generateScript()}
            >
              生成第一版剧本
            </ACSButton>
          </section>
        ) : (
          <>
            <div className={styles.modeTabs} role="tablist" aria-label="剧本视图">
              <ACSButton variant={mode === "edit" ? "primary" : "ghost"} onClick={() => setMode("edit")} role="tab" aria-selected={mode === "edit"}>编辑</ACSButton>
              <ACSButton variant={mode === "compare" ? "primary" : "ghost"} onClick={() => setMode("compare")} role="tab" aria-selected={mode === "compare"}>对比</ACSButton>
            </div>
            {mode === "edit" ? (
              <section className={styles.editor} aria-labelledby="script-title">
                <div className={styles.scriptHeading}>
                  <div><span className={styles.eyebrow}>当前版本 · {latest.changeKind}</span><h2 id="script-title">{latest.title}</h2></div>
                  <span>{latest.targetDurationSec} 秒 · {latest.scenes.length} 场</span>
                </div>
                <p className={styles.logline}>{latest.logline}</p>
                <label className={styles.synopsisField}>
                  <span>故事梗概（本波次唯一可编辑内容）</span>
                  <textarea aria-label="故事梗概" value={workspace.synopsis} onChange={(event) => workspace.setSynopsis(event.target.value)} />
                </label>
                <div className={styles.dirtyState} data-script-dirty={workspace.dirty ? "true" : "false"} role="status">
                  {workspace.dirty ? "有未保存修改" : "所有修改已保存"}
                </div>
                <ScriptScenes version={latest} />
              </section>
            ) : (
              <ScriptComparison versions={state.workspace.versions} latest={latest} />
            )}
          </>
        )}

        <ReviewedImportBlocker />

        {latest ? (
          <footer className={styles.actionBar} aria-label="剧本版本操作">
            <div>
              <strong>{workspace.dirty ? "有未保存修改" : workspace.confirmed ? "当前版本已确认" : "当前版本尚未确认"}</strong>
              <span role="status" aria-live="polite">{workspace.operationMessage}</span>
            </div>
            <div>
              <ACSButton
                variant="secondary"
                disabled={!workspace.dirty || workspace.operation !== "idle" || !workspace.synopsis.trim()}
                loading={workspace.operation === "saving"}
                onClick={() => void workspace.saveManualVersion()}
              >保存修订</ACSButton>
              <ACSButton
                disabled={workspace.dirty || workspace.confirmed || workspace.operation !== "idle"}
                loading={workspace.operation === "confirming"}
                onClick={() => void workspace.confirmVersion()}
              >确认版本</ACSButton>
            </div>
          </footer>
        ) : (
          <p className={styles.operationMessage} role="status" aria-live="polite">{workspace.operationMessage}</p>
        )}
      </div>
    </div>
  );
}

function projectFromWorkspace(workspace: ReturnType<typeof useScriptWorkspaceV3>) {
  if (workspace.state.status === "ready") return workspace.state.project;
  if (workspace.state.status === "blocked") return workspace.state.blocker.project ?? null;
  return null;
}

function scriptAuthorityLayers(
  workspace: ReturnType<typeof useScriptWorkspaceV3>,
): readonly AuthorityLayerView[] {
  return [
    { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "Script Studio V3 已可用" },
    { id: "runtime", label: "运行时", state: "not_applicable", stateLabel: "不适用", message: "剧本编辑不依赖媒体生成运行时" },
    workspace.confirmed
      ? { id: "authority", label: "授权", state: "available", stateLabel: "已确认", message: "当前 ScriptVersion 已明确确认" }
      : { id: "authority", label: "授权", state: "required", stateLabel: "需要确认", message: "当前版本需要明确人工确认" },
    { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "本页不推断后续生产策略" },
  ];
}

function scriptEvidence(
  workspace: ReturnType<typeof useScriptWorkspaceV3>,
  projectRef: string,
): readonly EvidenceFieldView[] {
  const state = workspace.state;
  const latest = workspace.latest;
  const ready = state.status === "ready" ? state : null;
  const errorCode =
    state.status === "blocked"
      ? state.blocker.code
      : state.status === "absent" || state.status === "disconnected" || state.status === "error"
        ? state.error.code
        : workspace.operationError?.code;
  return [
    ...(workspace.selectedEpisode ? [{ id: "episode-title", label: "分集标题", value: workspace.selectedEpisode.title, sensitivity: "ordinary" as const, copyAllowed: false }] : []),
    ...(latest ? [
      { id: "script-version", label: "剧本版本", value: `v${latest.versionNumber}`, sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "change-kind", label: "变更类型", value: latest.changeKind, sensitivity: "ordinary" as const, copyAllowed: false },
      { id: "confirmation", label: "确认状态", value: workspace.confirmed ? "已确认" : "尚未确认", sensitivity: "ordinary" as const, copyAllowed: false },
    ] : []),
    { id: "project-ref", label: "项目引用", value: projectRef, sensitivity: "restricted", copyAllowed: true },
    ...(ready ? [{ id: "series-ref", label: "系列引用", value: ready.series.seriesRef, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    ...(ready?.episodeRef ? [{ id: "episode-ref", label: "分集引用", value: ready.episodeRef, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    ...(ready?.workspace?.script ? [{ id: "script-ref", label: "剧本引用", value: ready.workspace.script.scriptRef, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    ...(latest ? [
      { id: "script-version-ref", label: "剧本版本引用", value: latest.scriptVersionRef, sensitivity: "restricted" as const, copyAllowed: true },
      { id: "base-script-version-ref", label: "修订基线引用", value: latest.scriptVersionRef, sensitivity: "restricted" as const, copyAllowed: true },
    ] : []),
    ...(errorCode ? [{ id: "error-code", label: "技术错误代码", value: errorCode, sensitivity: "restricted" as const, copyAllowed: true }] : []),
    { id: "credentials", label: "认证信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "认证信息、token 与 cookie 始终隐藏" },
  ];
}

export function ScriptStudioV3({ projectRef }: { projectRef: string }) {
  const router = useRouter();
  const workspace = useScriptWorkspaceV3(projectRef);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [shellOverlay, setShellOverlay] = useState<WorkbenchOverlay>(null);
  const bypassBackGuard = useRef(false);
  const interceptedOverlayTrigger = useRef<HTMLElement | null>(null);
  const dirtyRef = useRef(workspace.dirty);

  useEffect(() => {
    dirtyRef.current = workspace.dirty;
  }, [workspace.dirty]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      protectScriptBeforeUnload(event, workspace.dirty);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [workspace.dirty]);

  useEffect(() => {
    const guardState = { ...window.history.state, acsScriptUnsavedGuard: true };
    window.history.pushState(guardState, "", window.location.href);
    const onPopState = () => {
      if (bypassBackGuard.current) {
        bypassBackGuard.current = false;
        window.history.back();
        return;
      }
      if (dirtyRef.current) {
        window.history.pushState(guardState, "", window.location.href);
        setPendingNavigation({ kind: "back" });
      } else {
        window.history.back();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(pending: PendingNavigation) {
    setPendingNavigation(null);
    if (pending.kind === "episode") {
      workspace.selectEpisode(pending.episodeRef);
    } else if (pending.kind === "href") {
      router.push(pending.href);
    } else if (pending.kind === "overlay") {
      setShellOverlay(pending.overlay);
    } else {
      bypassBackGuard.current = true;
      window.history.back();
    }
  }

  function captureNavigation(event: MouseEvent<HTMLDivElement>) {
    if (!workspace.dirty || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const element = event.target instanceof Element ? event.target : null;
    const button = element?.closest("button");
    const buttonLabel = button?.getAttribute("aria-label");
    const requestedOverlay =
      buttonLabel === "打开项目导航"
        ? "project-navigation"
        : buttonLabel === "打开全局导航"
          ? "global-navigation"
          : null;
    if (requestedOverlay) {
      event.preventDefault();
      event.stopPropagation();
      interceptedOverlayTrigger.current = button ?? null;
      setPendingNavigation({ kind: "overlay", overlay: requestedOverlay });
      return;
    }
    const href = internalNavigationHref(event.target, window.location.origin);
    if (!href) return;
    const current = `${window.location.pathname}${window.location.search}`;
    const next = new URL(href, window.location.origin);
    if (`${next.pathname}${next.search}` === current && next.hash) return;
    event.preventDefault();
    event.stopPropagation();
    setPendingNavigation({ kind: "href", href });
  }

  async function saveAndContinue() {
    if (!pendingNavigation) return;
    const pending = pendingNavigation;
    const saved = await workspace.saveManualVersion();
    if (saved) navigate(pending);
  }

  function discardAndContinue() {
    if (!pendingNavigation) return;
    const pending = pendingNavigation;
    workspace.discardDraft();
    navigate(pending);
  }

  const project: CreatorProject | null = projectFromWorkspace(workspace);
  let primaryCanvas;
  if (workspace.state.status === "loading") {
    primaryCanvas = <div className={styles.centerState} role="status">正在读取剧本工作区</div>;
  } else if (workspace.state.status === "blocked") {
    primaryCanvas = <div className={styles.centerState}><ScopeBlocker code={workspace.state.blocker.code} message={workspace.state.blocker.message} /></div>;
  } else if (workspace.state.status === "absent") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="absent" title="未找到剧本项目" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else if (workspace.state.status === "disconnected") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="disconnected" title="Creator Core 未连接" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else if (workspace.state.status === "error") {
    primaryCanvas = <div className={styles.centerState}><ReadFailure status="error" title="剧本工作区无法读取" message={workspace.state.error.message} refresh={workspace.refresh} /></div>;
  } else {
    primaryCanvas = <ScriptReadyCanvas workspace={workspace} requestNavigation={setPendingNavigation} />;
  }

  const ready = workspace.state.status === "ready" ? workspace.state : null;
  const versionLabel = workspace.latest ? `剧本 v${workspace.latest.versionNumber}` : "剧本尚未生成";
  const seriesLabel = ready?.series.title || (ready ? "已绑定系列" : "系列上下文待核验");
  const episodeLabel = workspace.selectedEpisode?.title ?? (ready ? "尚未建立分集" : "分集上下文待核验");
  const modalIsEpisode = pendingNavigation?.kind === "episode";

  return (
    <>
      <CreatorProjectShell
        project={project}
        projectRef={projectRef}
        activeDestinationId="script"
        primaryCanvas={primaryCanvas}
        contextBar={{
          seriesLabel,
          episodeLabel,
          versionLabel,
          versionStateText: workspace.confirmed ? "当前版本已确认" : workspace.latest ? "当前版本尚未确认" : "尚未生成",
          readinessSummary: "剧本版本状态不代表分镜或媒体生产已开放",
          readinessState: workspace.confirmed ? "available" : "unverified",
          contextLabel: "Script Studio V3 项目上下文",
        }}
        authorityEvidence={{
          layers: scriptAuthorityLayers(workspace),
          summary: "剧本界面、人工确认、媒体运行时与后续策略保持独立状态。",
          fields: scriptEvidence(workspace, projectRef),
          evidenceSummary: "身份引用和技术错误代码仅在显式打开的受限证据中展示。",
        }}
        contentLabel="剧本主要画布"
        authorityLabel="剧本授权与证据"
        onNavigationCapture={captureNavigation}
        activeOverlay={shellOverlay}
        onActiveOverlayChange={(overlay) => {
          setShellOverlay(overlay);
          if (overlay === null && interceptedOverlayTrigger.current) {
            window.requestAnimationFrame(() => interceptedOverlayTrigger.current?.focus());
          }
        }}
      />
      <ACSModal
        open={pendingNavigation !== null}
        onClose={() => setPendingNavigation(null)}
        title={modalIsEpisode ? "切换分集前保存修改？" : "离开前保存修改？"}
        description="当前故事梗概包含未保存修改。"
        dismissOnBackdrop={false}
        closeLabel="关闭未保存修改对话框"
        footer={(
          <div className={styles.modalActions}>
            <ACSButton loading={workspace.operation === "saving"} disabled={workspace.operation !== "idle"} onClick={() => void saveAndContinue()}>
              {modalIsEpisode ? "保存并切换" : "保存并继续"}
            </ACSButton>
            <ACSButton variant="secondary" disabled={workspace.operation !== "idle"} onClick={discardAndContinue}>
              {modalIsEpisode ? "放弃修改并切换" : "放弃修改并继续"}
            </ACSButton>
            <ACSButton variant="ghost" disabled={workspace.operation !== "idle"} onClick={() => setPendingNavigation(null)}>
              {modalIsEpisode ? "留在当前分集" : "留在当前页面"}
            </ACSButton>
          </div>
        )}
      >
        <p>保存失败时会保留当前页面和修改；放弃修改只恢复当前最新版本的故事梗概。</p>
      </ACSModal>
    </>
  );
}
