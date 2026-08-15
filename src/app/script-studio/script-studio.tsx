"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from "react";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSDrawer,
  ACSModal,
  AIAssistantPanel,
  AICandidateCard,
  AIThinkingState,
  InspectorDrawer,
  UnifiedAppHeader,
  VersionTimeline,
} from "@/components";
import { EditorLayout } from "@/layouts";
import {
  initialCandidate,
  initialLocalHistory,
  initialScenes,
  narrativeFindings,
  scriptWorkspaceContext,
} from "./script-studio.fixtures";
import {
  applyCandidateToScenes,
  cloneScenes,
  fingerprintDocument,
  fingerprintScene,
  generateLocalCandidate,
} from "./script-studio.local-service";
import type {
  CandidateId,
  NarrativeFindingPreview,
  PendingUnsavedAction,
  ScriptBlockKind,
  ScriptBlockPresentation,
  ScriptBottomDrawerTab,
  ScriptCanvasSelection,
  ScriptCandidateKind,
  ScriptCandidateOperationState,
  ScriptCompareState,
  ScriptFreshnessState,
  ScriptLocalSnapshot,
  ScriptRecoveryState,
  ScriptRewriteCandidate,
  ScriptSceneProjection,
  ScriptStudioPageState,
  ScriptUnsavedResolution,
  UIBlockKey,
  UISceneKey,
  UpstreamConstraintOwner,
} from "./script-studio.types";
import styles from "./script-studio.module.css";

const iconSources = {
  add: "/assets/workspace-home/icons/action-new-project.svg",
  director: "/assets/workspace-home/icons/action-ai-director.svg",
  script: "/assets/workspace-home/icons/action-upload-script.svg",
  import: "/assets/workspace-home/icons/action-import-assets.svg",
  storyboard: "/assets/workspace-home/icons/action-storyboard.svg",
  template: "/assets/workspace-home/icons/action-template.svg",
  edit: "/assets/workspace-home/icons/tool-smart-edit.svg",
  insights: "/assets/workspace-home/icons/tool-insights.svg",
  search: "/assets/workspace-home/icons/utility-search.svg",
  light: "/assets/workspace-home/icons/utility-theme-light.svg",
  dark: "/assets/workspace-home/icons/utility-theme-dark.svg",
  notification: "/assets/workspace-home/icons/utility-notification.svg",
  help: "/assets/workspace-home/icons/utility-help.svg",
  menu: "/assets/workspace-home/icons/utility-menu.svg",
} as const;

type ScriptStudioIconName = keyof typeof iconSources;
type IconStyle = CSSProperties & { "--script-studio-icon": string };
type GuidedMessage = { title: string; description: string };

const toolbarActions = [
  { label: "视图", icon: "template" },
  { label: "格式", icon: "edit" },
  { label: "插入", icon: "add" },
  { label: "动作", icon: "director" },
  { label: "对白", icon: "script" },
  { label: "镜头", icon: "storyboard" },
  { label: "场景", icon: "template" },
  { label: "查找", icon: "search" },
  { label: "标记", icon: "insights" },
  { label: "批注", icon: "notification" },
] as const satisfies ReadonlyArray<{ label: string; icon: ScriptStudioIconName }>;

const candidateKinds = [
  { value: "rewrite", label: "改写" },
  { value: "condense", label: "精简" },
  { value: "expand", label: "扩写" },
  { value: "dialogue", label: "对白调整" },
  { value: "pacing", label: "节奏调整" },
] as const satisfies ReadonlyArray<{ value: ScriptCandidateKind; label: string }>;

const blockKindLabels: Record<ScriptBlockKind, string> = {
  "scene-heading": "场景标题",
  action: "动作描述",
  character: "人物",
  dialogue: "对白",
  parenthetical: "括注",
  transition: "转场",
};

function ScriptStudioIcon({
  name,
  className,
}: {
  name: ScriptStudioIconName;
  className?: string;
}) {
  const style = {
    "--script-studio-icon": `url("${iconSources[name]}")`,
  } as IconStyle;

  return <span aria-hidden="true" className={`${styles.icon} ${className ?? ""}`} style={style} />;
}

function useViewportWidth() {
  const [width, setWidth] = useState(1920);

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return width;
}

function ScriptStudioHeader({
  dirty,
  onNavigate,
}: {
  dirty: boolean;
  onNavigate: (intent: "route-navigation" | "back-navigation", href: string) => void;
}) {
  return (
    <UnifiedAppHeader
      editorLabel="剧本工作台"
      mode="editor"
      onNavigate={(event, href) => {
        if (!dirty) return;
        event.preventDefault();
        onNavigate("back-navigation", href);
      }}
    />
  );
}

function ScriptContextBar({
  dirty,
  onSwitch,
}: {
  dirty: boolean;
  onSwitch: (intent: "project-switch" | "episode-switch", label: string) => void;
}) {
  return (
    <section className={styles.contextBar} aria-label="剧本制作上下文">
      <h1 className={styles.visuallyHidden}>剧本制作工作台</h1>
      <div className={styles.contextSelectors}>
        <button onClick={() => onSwitch("project-switch", scriptWorkspaceContext.projectTitle)} type="button">
          <span className={styles.contextLabel}>项目</span>
          <strong>{scriptWorkspaceContext.projectTitle}</strong>
        </button>
        <button onClick={() => onSwitch("project-switch", scriptWorkspaceContext.seriesTitle)} type="button">
          <span className={styles.contextLabel}>系列</span>
          <strong>{scriptWorkspaceContext.seriesTitle}</strong>
        </button>
        <button onClick={() => onSwitch("episode-switch", scriptWorkspaceContext.episodeLabel)} type="button">
          <span className={styles.contextLabel}>剧集</span>
          <strong>{scriptWorkspaceContext.episodeLabel}</strong>
        </button>
      </div>
      <div className={styles.contextStatus}>
        <ACSBadge tone="primary">{scriptWorkspaceContext.stageLabel}</ACSBadge>
        <span className={styles.localState} data-dirty={dirty || undefined}>
          <span aria-hidden="true" />
          {dirty ? "尚有本地修改" : "本地草稿"}
        </span>
      </div>
    </section>
  );
}

function ScriptToolbar({
  compact,
  candidateReady,
  onOpenCompare,
  onOpenNavigator,
  onOpenInspector,
  onOpenBottomDrawer,
  onGuide,
}: {
  compact: boolean;
  candidateReady: boolean;
  onOpenCompare: () => void;
  onOpenNavigator: () => void;
  onOpenInspector: () => void;
  onOpenBottomDrawer: () => void;
  onGuide: (message: GuidedMessage) => void;
}) {
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="剧本编辑工具栏">
      {compact ? <div className={styles.responsiveToolbarActions}>
        <ACSButton aria-label="打开场景导航" leadingIcon={<ScriptStudioIcon name="template" />} onClick={onOpenNavigator} size="small" variant="ghost">
          场景
        </ACSButton>
        <ACSButton aria-label="打开剧本检查器" leadingIcon={<ScriptStudioIcon name="insights" />} onClick={onOpenInspector} size="small" variant="ghost">
          检查器
        </ACSButton>
        <ACSButton aria-label="打开候选与本地历史" leadingIcon={<ScriptStudioIcon name="script" />} onClick={onOpenBottomDrawer} size="small" variant="ghost">
          版本/候选
        </ACSButton>
      </div> : <div className={styles.desktopToolbarActions}>
        {toolbarActions.map((action) => (
          <ACSButton
            key={action.label}
            leadingIcon={<ScriptStudioIcon name={action.icon} />}
            onClick={() => {
              if (action.label === "查找") {
                onGuide({ title: "查找剧本内容", description: "当前场景已准备好，可在后续迭代加入页内查找定位。" });
              } else {
                onGuide({ title: action.label, description: `${action.label}工具会在保持当前剧本和选择状态的前提下工作。` });
              }
            }}
            size="small"
            variant="ghost"
          >
            {action.label}
          </ACSButton>
        ))}
      </div>}
      <div className={styles.toolbarTrailing}>
        <ACSButton disabled={!candidateReady} onClick={onOpenCompare} size="small" variant="secondary">
          比较候选
        </ACSButton>
      </div>
    </div>
  );
}

function sceneStatusLabel(scene: ScriptSceneProjection, active: boolean) {
  if (active) return "当前";
  if (scene.status === "edited") return "已修改";
  if (scene.candidateCount > 0) return "有候选";
  if (scene.findingCount > 0) return "有发现";
  return "只读";
}

function sceneStatusTone(scene: ScriptSceneProjection, active: boolean) {
  if (active) return "primary" as const;
  if (scene.status === "edited") return "neutral" as const;
  if (scene.candidateCount > 0) return "ai" as const;
  if (scene.findingCount > 0) return "warning" as const;
  return "neutral" as const;
}

export function ScriptNavigator({
  scenes,
  activeSceneKey,
  onSelectScene,
}: {
  scenes: readonly ScriptSceneProjection[];
  activeSceneKey: UISceneKey | null;
  onSelectScene: (uiSceneKey: UISceneKey) => void;
}) {
  const activeIndex = Math.max(0, scenes.findIndex((scene) => scene.uiSceneKey === activeSceneKey));
  const [focusedIndex, setFocusedIndex] = useState(activeIndex);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const grouped = useMemo(() => {
    const groups = new Map<string, ScriptSceneProjection[]>();
    scenes.forEach((scene) => {
      const group = groups.get(scene.actLabel) ?? [];
      group.push(scene);
      groups.set(scene.actLabel, group);
    });
    return Array.from(groups.entries());
  }, [scenes]);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % scenes.length;
    else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + scenes.length) % scenes.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = scenes.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setFocusedIndex(currentIndex);
      onSelectScene(scenes[currentIndex].uiSceneKey);
      return;
    } else return;

    event.preventDefault();
    setFocusedIndex(nextIndex);
    rowRefs.current[nextIndex]?.focus();
  }

  let absoluteIndex = -1;

  return (
    <nav className={styles.navigator} aria-label="章节与场景">
      <div className={styles.navigatorHeader}>
        <div>
          <p>脚本导航</p>
          <h2>章节与场景</h2>
        </div>
        <ACSBadge tone="neutral">{scenes.length} 场</ACSBadge>
      </div>
      <div className={styles.sceneGroups}>
        {grouped.map(([actLabel, actScenes]) => (
          <section key={actLabel} className={styles.sceneGroup} aria-labelledby={`act-${actScenes[0].uiSceneKey}`}>
            <div className={styles.actHeading}>
              <h3 id={`act-${actScenes[0].uiSceneKey}`}>{actLabel}</h3>
              <span>{actScenes.length}</span>
            </div>
            <div className={styles.sceneList}>
              {actScenes.map((scene) => {
                absoluteIndex += 1;
                const index = absoluteIndex;
                const active = scene.uiSceneKey === activeSceneKey;
                return (
                  <button
                    aria-pressed={active}
                    className={styles.sceneRow}
                    data-active={active || undefined}
                    key={scene.uiSceneKey}
                    onClick={() => {
                      setFocusedIndex(index);
                      onSelectScene(scene.uiSceneKey);
                    }}
                    onKeyDown={(event) => moveFocus(event, index)}
                    ref={(node) => {
                      rowRefs.current[index] = node;
                    }}
                    tabIndex={focusedIndex === index ? 0 : -1}
                    type="button"
                  >
                    <span className={styles.sceneOrdinal}>{scene.ordinal.toString().padStart(2, "0")}</span>
                    <span className={styles.sceneIdentity}>
                      <strong>{scene.title}</strong>
                      <small>{scene.slugline}</small>
                    </span>
                    <span className={styles.sceneState}>
                      <ACSBadge tone={sceneStatusTone(scene, active)}>{sceneStatusLabel(scene, active)}</ACSBadge>
                      {(scene.candidateCount > 0 || scene.findingCount > 0) && (
                        <small>
                          {scene.candidateCount > 0 ? `候选 ${scene.candidateCount}` : ""}
                          {scene.candidateCount > 0 && scene.findingCount > 0 ? " · " : ""}
                          {scene.findingCount > 0 ? `发现 ${scene.findingCount}` : ""}
                        </small>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}

function EditableScriptBlock({
  block,
  selected,
  onFocus,
  onCommit,
}: {
  block: ScriptBlockPresentation;
  selected: boolean;
  onFocus: () => void;
  onCommit: (nextText: string) => void;
}) {
  const [draft, setDraft] = useState(block.text);
  const composing = useRef(false);

  useEffect(() => {
    if (!composing.current) setDraft(block.text);
  }, [block.text]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setDraft(event.target.value);
    if (!composing.current) onCommit(event.target.value);
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
    composing.current = false;
    setDraft(event.currentTarget.value);
    onCommit(event.currentTarget.value);
  }

  const rows = Math.max(1, Math.min(4, draft.split("\n").length + Math.floor(draft.length / 44)));

  return (
    <div className={styles.editableBlock} data-kind={block.kind} data-selected={selected || undefined}>
      <label className={styles.visuallyHidden} htmlFor={`edit-${block.uiBlockKey}`}>
        {blockKindLabels[block.kind]}：{block.speakerLabel ?? block.text.slice(0, 18)}
      </label>
      <textarea
        aria-describedby={`type-${block.uiBlockKey}`}
        id={`edit-${block.uiBlockKey}`}
        onChange={handleChange}
        onCompositionEnd={handleCompositionEnd}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onFocus={onFocus}
        readOnly={block.readOnly}
        rows={rows}
        spellCheck={false}
        value={draft}
      />
      <span className={styles.visuallyHidden} id={`type-${block.uiBlockKey}`}>
        当前块类型：{blockKindLabels[block.kind]}{block.readOnly ? "，只读" : "，可编辑"}
      </span>
    </div>
  );
}

export function ScriptCanvas({
  scene,
  selection,
  candidateState,
  recovery,
  candidateKind,
  onCandidateKindChange,
  onSelectBlock,
  onChangeBlock,
  onGenerateCandidate,
  onDismissRecovery,
}: {
  scene: ScriptSceneProjection | null;
  selection: ScriptCanvasSelection | null;
  candidateState: ScriptCandidateOperationState;
  recovery: ScriptRecoveryState;
  candidateKind: ScriptCandidateKind;
  onCandidateKindChange: (kind: ScriptCandidateKind) => void;
  onSelectBlock: (uiBlockKey: UIBlockKey) => void;
  onChangeBlock: (uiBlockKey: UIBlockKey, nextText: string) => void;
  onGenerateCandidate: () => void;
  onDismissRecovery: () => void;
}) {
  if (!scene) {
    return (
      <div className={styles.canvasEmpty}>
        <h2>当前剧本尚无可用场景投影</h2>
        <p>编辑器结构会保持可见，不会用营销内容替代工作区。</p>
      </div>
    );
  }

  return (
    <section className={styles.scriptCanvas} aria-labelledby="active-scene-title">
      <header className={styles.canvasHeader}>
        <div>
          <p>当前内容 · 场景 {scene.ordinal}</p>
          <h2 id="active-scene-title">{scene.slugline}</h2>
        </div>
        <div className={styles.canvasCandidateControls}>
          <label htmlFor="candidate-kind">候选方式</label>
          <select
            id="candidate-kind"
            onChange={(event) => onCandidateKindChange(event.target.value as ScriptCandidateKind)}
            value={candidateKind}
          >
            {candidateKinds.map((kind) => (
              <option key={kind.value} value={kind.value}>{kind.label}</option>
            ))}
          </select>
          <ACSButton
            leadingIcon={<ScriptStudioIcon name="director" />}
            loading={candidateState === "candidate-loading"}
            onClick={onGenerateCandidate}
            size="small"
            variant="secondary"
          >
            生成候选
          </ACSButton>
        </div>
      </header>

      {recovery.status !== "none" && (
        <div className={styles.recoveryBanner} role="alert">
          <div>
            <strong>{"error" in recovery ? recovery.error.title : "正在重试"}</strong>
            <p>{"error" in recovery ? recovery.error.message : "正在重新执行当前本地操作。"}</p>
          </div>
          <ACSButton onClick={onDismissRecovery} size="small" variant="ghost">关闭</ACSButton>
        </div>
      )}

      <div className={styles.scriptDocument}>
        <div className={styles.pageMarker}>场景 {scene.ordinal} · 本地工作稿</div>
        {scene.blocks.map((block) => (
          <EditableScriptBlock
            block={block}
            key={block.uiBlockKey}
            onCommit={(nextText) => onChangeBlock(block.uiBlockKey, nextText)}
            onFocus={() => onSelectBlock(block.uiBlockKey)}
            selected={selection?.kind !== "scene" && selection?.uiBlockKey === block.uiBlockKey}
          />
        ))}
      </div>
    </section>
  );
}

function ComparisonBlock({
  block,
  candidate,
  side,
}: {
  block: ScriptBlockPresentation;
  candidate: ScriptRewriteCandidate;
  side: "current" | "candidate";
}) {
  const replacement = candidate.replacements.find((item) => item.uiBlockKey === block.uiBlockKey);
  const text = side === "candidate" && replacement ? replacement.proposedText : block.text;

  return (
    <div className={styles.comparisonBlock} data-changed={Boolean(replacement) || undefined} data-kind={block.kind} data-side={side}>
      {replacement && (
        <span className={styles.changeMarker}>
          {side === "current" ? "当前 · 将替换" : `候选 · ${replacement.changeLabel}`}
        </span>
      )}
      <p>{text}</p>
    </div>
  );
}

export function ScriptCompareSurface({
  scene,
  candidate,
  candidateState,
  onClose,
  onAdopt,
  onRestore,
  onRegenerate,
}: {
  scene: ScriptSceneProjection;
  candidate: ScriptRewriteCandidate;
  candidateState: ScriptCandidateOperationState;
  onClose: () => void;
  onAdopt: () => void;
  onRestore: () => void;
  onRegenerate: () => void;
}) {
  const stale = candidate.status === "stale" || candidateState === "candidate-stale";

  return (
    <section className={styles.compareSurface} aria-labelledby="compare-title">
      <header className={styles.compareHeader}>
        <div className={styles.compareIdentity}>
          <ACSButton aria-label="关闭候选比较" onClick={onClose} size="small" variant="ghost">返回编辑</ACSButton>
          <div>
            <h2 id="compare-title">比较候选</h2>
            <p>替换范围：当前场景对白 · {candidate.replacements.length} 处调整</p>
          </div>
        </div>
        <div className={styles.compareActions}>
          <ACSButton disabled={stale} onClick={onAdopt} size="small" variant="primary">采用候选</ACSButton>
          <ACSButton onClick={onRestore} size="small" variant="secondary">恢复当前</ACSButton>
          <ACSButton loading={candidateState === "candidate-loading"} onClick={onRegenerate} size="small" variant="secondary">重新生成</ACSButton>
        </div>
      </header>

      {stale && (
        <div className={styles.staleBanner} role="status">
          <ACSBadge tone="warning">已过期</ACSBadge>
          当前内容已改变。请重新生成候选后再采用。
        </div>
      )}

      <div className={styles.compareColumns}>
        <section aria-labelledby="current-column-title" className={styles.compareColumn}>
          <header>
            <div>
              <p>ORIGINAL</p>
              <h3 id="current-column-title">当前内容</h3>
            </div>
            <ACSBadge tone="neutral">本地工作稿</ACSBadge>
          </header>
          <div className={styles.comparisonDocument}>
            {scene.blocks.map((block) => (
              <ComparisonBlock block={block} candidate={candidate} key={block.uiBlockKey} side="current" />
            ))}
          </div>
        </section>
        <section aria-labelledby="candidate-column-title" className={styles.compareColumn}>
          <header>
            <div>
              <p>ALTERNATIVE</p>
              <h3 id="candidate-column-title">候选内容</h3>
            </div>
            <ACSBadge tone="ai">{candidate.sourceLabel}</ACSBadge>
          </header>
          <div className={styles.comparisonDocument}>
            {scene.blocks.map((block) => (
              <ComparisonBlock block={block} candidate={candidate} key={block.uiBlockKey} side="candidate" />
            ))}
          </div>
        </section>
      </div>
      <footer className={styles.compareContext}>
        <strong>上下文（前后节选）</strong>
        <p>林澈推开旧车站的门，风卷着雨气扑面而来。对话结束后，他沿着站台继续向前。</p>
      </footer>
    </section>
  );
}

function ScriptInspector({
  scene,
  dirty,
  findings,
  onOpenOwner,
  onLocateFinding,
  onNextAction,
}: {
  scene: ScriptSceneProjection | null;
  dirty: boolean;
  findings: readonly NarrativeFindingPreview[];
  onOpenOwner: (owner: UpstreamConstraintOwner) => void;
  onLocateFinding: (finding: NarrativeFindingPreview) => void;
  onNextAction: () => void;
}) {
  return (
    <div className={styles.inspector}>
      <section className={styles.inspectorSection}>
        <div className={styles.inspectorHeading}>
          <h2>当前工作区</h2>
          <ACSBadge tone={dirty ? "warning" : "neutral"}>{dirty ? "已修改" : "本地"}</ACSBadge>
        </div>
        <dl className={styles.workspaceFacts}>
          <div><dt>场景</dt><dd>{scene?.ordinal ?? "—"} · {scene?.slugline ?? "未选择"}</dd></div>
          <div><dt>章节</dt><dd>{scene?.actLabel ?? "—"}</dd></div>
          <div><dt>页数（预计）</dt><dd>2 3/8</dd></div>
          <div><dt>最近修改</dt><dd>{dirty ? "本地 · 刚刚" : "本地 · 今天 10:32"}</dd></div>
        </dl>
      </section>

      <section className={styles.inspectorSection}>
        <div className={styles.inspectorHeading}>
          <h2>人物一致性</h2>
          <ACSButton onClick={() => onOpenOwner("M6")} size="small" variant="ghost">查看</ACSButton>
        </div>
        <strong className={styles.constraintLead}>林澈 · 对白规则：短句、低声、少修饰</strong>
        <ul className={styles.constraintList}>
          <li>回响：克制、内敛、观察优先</li>
          <li>用词：朴素、具体、少形容词</li>
          <li>长度：多为 6–14 字</li>
          <li>避免：解释过多、情绪外露</li>
        </ul>
      </section>

      <section className={styles.inspectorSection}>
        <div className={styles.inspectorHeading}>
          <h2>世界规则</h2>
          <ACSButton onClick={() => onOpenOwner("M6")} size="small" variant="ghost">查看</ACSButton>
        </div>
        <ul className={styles.worldRules}>
          <li>年份：2047</li>
          <li>城市：临港城（雨季常态）</li>
          <li>科技：低调实用，旧城区无全息广告</li>
          <li>社会：信息受控，地下网络活跃</li>
        </ul>
      </section>

      <section className={styles.inspectorSection}>
        <div className={styles.inspectorHeading}>
          <h2>叙事发现</h2>
          <ACSBadge tone="warning">{findings.length}</ACSBadge>
        </div>
        {findings.slice(0, 1).map((finding) => (
          <button className={styles.findingPreview} key={finding.findingId} onClick={() => onLocateFinding(finding)} type="button">
            <strong>{finding.title}</strong>
            <span>{finding.description}</span>
            <small>本地检查 · 定位内容</small>
          </button>
        ))}
      </section>

      <section className={styles.inspectorSection}>
        <div className={styles.inspectorHeading}><h2>下一动作</h2></div>
        <button className={styles.nextSceneButton} onClick={onNextAction} type="button">
          <span>建议推进至</span>
          <strong>13 · 外景 · 天台 · 夜</strong>
        </button>
      </section>
    </div>
  );
}

function CandidatePanel({
  candidateState,
  candidates,
  onCompare,
  onAdopt,
  onRegenerate,
}: {
  candidateState: ScriptCandidateOperationState;
  candidates: readonly ScriptRewriteCandidate[];
  onCompare: (candidateId: CandidateId) => void;
  onAdopt: (candidateId: CandidateId) => void;
  onRegenerate: () => void;
}) {
  const candidate = candidates[0];

  return (
    <AIAssistantPanel
      className={styles.candidateAssistant}
      description="围绕当前选择提供可比较的本地改写，不会自动替换剧本。"
      status="本地预览"
      title="AI 剧本助手"
    >
      {candidateState === "candidate-loading" && (
        <AIThinkingState compact detail="保持当前内容可见，完成后由你决定是否比较。" label="正在准备候选" />
      )}
      {candidateState === "candidate-error" && (
        <div className={styles.candidateError} role="status">
          <strong>候选生成失败</strong>
          <p>当前选择为空或不可用。补充内容后可以重新生成。</p>
          <ACSButton onClick={onRegenerate} size="small" variant="secondary">重试</ACSButton>
        </div>
      )}
      {candidate && (
        <AICandidateCard
          actions={
            <div className={styles.candidateCardActions}>
              <ACSButton disabled={candidate.status === "stale"} onClick={() => onCompare(candidate.candidateId)} size="small" variant="secondary">比较</ACSButton>
              <ACSButton disabled={candidate.status === "stale"} onClick={() => onAdopt(candidate.candidateId)} size="small">采用候选</ACSButton>
              {candidate.status === "stale" && <ACSButton onClick={onRegenerate} size="small" variant="ghost">重新生成</ACSButton>}
            </div>
          }
          description={candidate.rationale}
          label={candidate.status === "stale" ? "已过期" : candidate.sourceLabel}
          metadata={`替换 ${candidate.replacements.length} 处 · 仅写入本地工作稿`}
          selected={candidate.status === "selected"}
          title={candidate.title}
        >
          <p>{candidate.proposedText}</p>
        </AICandidateCard>
      )}
    </AIAssistantPanel>
  );
}

function LocalHistoryPanel({
  localHistory,
  onRestore,
}: {
  localHistory: readonly ScriptLocalSnapshot[];
  onRestore: (localSnapshotId: string) => void;
}) {
  return (
    <section className={styles.localHistoryPanel} aria-labelledby="local-history-title">
      <div className={styles.drawerSectionHeading}>
        <div>
          <h3 id="local-history-title">本地历史</h3>
          <p>仅保留在本次会话中，不是正式 ScriptVersion。</p>
        </div>
        <ACSBadge tone="neutral">会话内</ACSBadge>
      </div>
      <VersionTimeline
        items={localHistory.map((snapshot, index) => ({
          id: snapshot.localSnapshotId,
          label: snapshot.label,
          description: snapshot.description,
          meta: snapshot.createdLabel,
          state: index === localHistory.length - 1 ? "current" : "pending",
        }))}
      />
      <div className={styles.localHistoryActions}>
        {localHistory.map((snapshot) => (
          <ACSButton key={snapshot.localSnapshotId} onClick={() => onRestore(snapshot.localSnapshotId)} size="small" variant="secondary">
            恢复“{snapshot.label}”
          </ACSButton>
        ))}
      </div>
    </section>
  );
}

function FindingsPanel({
  findings,
  onLocate,
}: {
  findings: readonly NarrativeFindingPreview[];
  onLocate: (finding: NarrativeFindingPreview) => void;
}) {
  return (
    <section className={styles.findingsPanel} aria-labelledby="findings-title">
      <div className={styles.drawerSectionHeading}>
        <div>
          <h3 id="findings-title">叙事发现预览</h3>
          <p>来自本地检查，只用于定位与创作判断。</p>
        </div>
        <ACSBadge tone="warning">{findings.length} 项</ACSBadge>
      </div>
      <div className={styles.findingGrid}>
        {findings.map((finding) => (
          <ACSCard
            footer={<ACSButton onClick={() => onLocate(finding)} size="small" variant="ghost">定位到剧本</ACSButton>}
            key={finding.findingId}
            padding="compact"
            title={finding.title}
          >
            <p>{finding.description}</p>
          </ACSCard>
        ))}
      </div>
    </section>
  );
}

function BottomDrawerContent({
  activeTab,
  candidateState,
  candidates,
  localHistory,
  findings,
  onCompare,
  onAdopt,
  onRegenerate,
  onRestore,
  onLocate,
}: {
  activeTab: ScriptBottomDrawerTab;
  candidateState: ScriptCandidateOperationState;
  candidates: readonly ScriptRewriteCandidate[];
  localHistory: readonly ScriptLocalSnapshot[];
  findings: readonly NarrativeFindingPreview[];
  onCompare: (candidateId: CandidateId) => void;
  onAdopt: (candidateId: CandidateId) => void;
  onRegenerate: () => void;
  onRestore: (localSnapshotId: string) => void;
  onLocate: (finding: NarrativeFindingPreview) => void;
}) {
  return (
    <div className={styles.drawerContent} role="tabpanel" aria-label={activeTab === "candidates" ? "候选" : activeTab === "local-history" ? "版本与本地历史" : "叙事发现"}>
      {activeTab === "candidates" && (
        <CandidatePanel candidateState={candidateState} candidates={candidates} onAdopt={onAdopt} onCompare={onCompare} onRegenerate={onRegenerate} />
      )}
      {activeTab === "local-history" && <LocalHistoryPanel localHistory={localHistory} onRestore={onRestore} />}
      {activeTab === "findings" && <FindingsPanel findings={findings} onLocate={onLocate} />}
    </div>
  );
}

const bottomTabs: ReadonlyArray<{ id: ScriptBottomDrawerTab; label: string }> = [
  { id: "candidates", label: "候选" },
  { id: "local-history", label: "版本 / 本地历史" },
  { id: "findings", label: "叙事发现" },
];

function ProductionActionBar({
  activeTab,
  bottomDrawerOpen,
  candidateCount,
  findingCount,
  dirty,
  modifiedSceneCount,
  localCharacterCount,
  onTabChange,
  onContinue,
}: {
  activeTab: ScriptBottomDrawerTab;
  bottomDrawerOpen: boolean;
  candidateCount: number;
  findingCount: number;
  dirty: boolean;
  modifiedSceneCount: number;
  localCharacterCount: number;
  onTabChange: (tab: ScriptBottomDrawerTab) => void;
  onContinue: () => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % bottomTabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + bottomTabs.length) % bottomTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = bottomTabs.length - 1;
    else return;
    event.preventDefault();
    onTabChange(bottomTabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={styles.productionFooter}>
      <div className={styles.bottomRail} role="tablist" aria-label="剧本辅助面板">
        {bottomTabs.map((tab, index) => {
          const count = tab.id === "candidates" ? candidateCount : tab.id === "findings" ? findingCount : undefined;
          const selected = bottomDrawerOpen && activeTab === tab.id;
          return (
            <button
              aria-selected={selected}
              className={styles.bottomTab}
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
              ref={(node) => { tabRefs.current[index] = node; }}
              role="tab"
              tabIndex={selected || (!bottomDrawerOpen && index === 0) ? 0 : -1}
              type="button"
            >
              {tab.label}{count !== undefined ? ` ${count}` : ""}
            </button>
          );
        })}
      </div>
      <div className={styles.actionRow}>
        <div className={styles.dirtySummary} role="status">
          <span aria-hidden="true" data-dirty={dirty || undefined} />
          <strong>{dirty ? "尚有本地修改" : "本地内容已与进入基线一致"}</strong>
          <small>{dirty ? `已修改：${modifiedSceneCount} 场景 · ${localCharacterCount} 字` : "当前会话未写入正式版本"}</small>
        </div>
        <div className={styles.nextStage}>
          <span>下一阶段：分镜设计</span>
          <ACSButton leadingIcon={<ScriptStudioIcon name="storyboard" />} onClick={onContinue} size="medium">
            进入分镜设计
          </ACSButton>
        </div>
      </div>
    </div>
  );
}

function UnsavedGuard({
  pendingAction,
  onResolve,
}: {
  pendingAction: PendingUnsavedAction | null;
  onResolve: (resolution: ScriptUnsavedResolution) => void;
}) {
  const preserveButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingAction) return;
    const focusTask = window.requestAnimationFrame(() => preserveButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(focusTask);
  }, [pendingAction]);

  return (
    <ACSModal
      dismissOnBackdrop
      onClose={() => onResolve("cancel")}
      open={Boolean(pendingAction)}
      size="small"
      title="尚有未保存的本地修改"
      description="这些修改仅保留在当前剧本工作区。离开或替换内容后可能无法恢复。"
      footer={
        <div className={styles.guardActions}>
          <ACSButton ref={preserveButtonRef} onClick={() => onResolve("preserve-and-continue-editing")} variant="secondary">
            保留本地修改并继续编辑
          </ACSButton>
          <ACSButton onClick={() => onResolve("discard-and-proceed")} variant="danger">
            放弃修改并继续
          </ACSButton>
          <ACSButton onClick={() => onResolve("cancel")} variant="ghost">取消</ACSButton>
        </div>
      }
    >
      <p className={styles.guardBody}>当前没有可用的正式保存或自动保存合同。请选择如何处理这次应用内操作。</p>
    </ACSModal>
  );
}

function GuideModal({ message, onClose }: { message: GuidedMessage | null; onClose: () => void }) {
  return (
    <ACSModal
      footer={<ACSButton onClick={onClose}>返回剧本工作台</ACSButton>}
      onClose={onClose}
      open={Boolean(message)}
      size="small"
      title={message?.title ?? "制作提示"}
    >
      <p className={styles.guideBody}>{message?.description}</p>
    </ACSModal>
  );
}

export function ScriptStudioPage() {
  const router = useRouter();
  const viewportWidth = useViewportWidth();
  const [baselineScenes] = useState<ScriptSceneProjection[]>(() => cloneScenes(initialScenes));
  const comparisonSnapshotRef = useRef<ScriptSceneProjection[]>(cloneScenes(initialScenes));
  const sceneStateRef = useRef<ScriptSceneProjection[]>(cloneScenes(initialScenes));
  const requestSequenceRef = useRef(0);
  const snapshotSequenceRef = useRef(1);

  const [scenes, setScenes] = useState<ScriptSceneProjection[]>(() => cloneScenes(initialScenes));
  const [activeSceneKey, setActiveSceneKey] = useState<UISceneKey>("ui-scene-12");
  const [selection, setSelection] = useState<ScriptCanvasSelection>({ kind: "scene", uiSceneKey: "ui-scene-12" });
  const [candidates, setCandidates] = useState<ScriptRewriteCandidate[]>([{ ...initialCandidate, replacements: initialCandidate.replacements.map((item) => ({ ...item })) }]);
  const [candidateState, setCandidateState] = useState<ScriptCandidateOperationState>("candidate-ready");
  const [candidateKind, setCandidateKind] = useState<ScriptCandidateKind>("dialogue");
  const [compare, setCompare] = useState<ScriptCompareState>({ status: "compare-open", candidateId: initialCandidate.candidateId });
  const [recovery, setRecovery] = useState<ScriptRecoveryState>({ status: "none" });
  const [freshness] = useState<ScriptFreshnessState>("current");
  const [localHistory, setLocalHistory] = useState<ScriptLocalSnapshot[]>(() => initialLocalHistory.map((snapshot) => ({ ...snapshot, scenes: cloneScenes(snapshot.scenes) })));
  const [pendingAction, setPendingAction] = useState<PendingUnsavedAction | null>(null);
  const [guidedMessage, setGuidedMessage] = useState<GuidedMessage | null>(null);
  const [navigatorDrawerOpen, setNavigatorDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [bottomDrawerOpen, setBottomDrawerOpen] = useState(false);
  const [bottomDrawerTab, setBottomDrawerTab] = useState<ScriptBottomDrawerTab>("candidates");

  useEffect(() => {
    sceneStateRef.current = scenes;
  }, [scenes]);

  const baselineFingerprint = useMemo(() => fingerprintDocument(baselineScenes), [baselineScenes]);
  const currentFingerprint = useMemo(() => fingerprintDocument(scenes), [scenes]);
  const dirty = currentFingerprint !== baselineFingerprint;
  const currentScene = useMemo(() => scenes.find((scene) => scene.uiSceneKey === activeSceneKey) ?? null, [activeSceneKey, scenes]);
  const selectedCandidate = useMemo(() => {
    if (compare.status === "compare-open") return candidates.find((candidate) => candidate.candidateId === compare.candidateId) ?? null;
    return candidates.find((candidate) => candidate.status === "selected" || candidate.status === "stale") ?? candidates[0] ?? null;
  }, [candidates, compare]);
  const modifiedSceneCount = useMemo(() => scenes.reduce((count, scene, index) => count + (fingerprintScene(scene) !== fingerprintScene(baselineScenes[index]) ? 1 : 0), 0), [baselineScenes, scenes]);
  const localCharacterCount = useMemo(() => scenes.reduce((total, scene) => total + scene.blocks.reduce((sceneTotal, block) => sceneTotal + block.text.length, 0), 0), [scenes]);
  const showFixedNavigator = viewportWidth >= 1024;
  const showFixedInspector = viewportWidth >= 1280;
  const useInlineBottomDrawer = viewportWidth >= 768;

  const pageState: ScriptStudioPageState = {
    load: "ready",
    workingBuffer: dirty ? "unsaved-changes" : "clean",
    candidate: candidateState,
    compare,
    recovery,
    freshness,
    guard: pendingAction
      ? { status: "destructive-confirmation", intent: pendingAction.intent }
      : { status: "guard-idle" },
  };

  useEffect(() => {
    if (!dirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function commitScenes(nextScenes: ScriptSceneProjection[]) {
    sceneStateRef.current = nextScenes;
    setScenes(nextScenes);
  }

  function markCandidatesAgainstScene(nextScene: ScriptSceneProjection) {
    const foundStale = candidates.some((candidate) => (
      candidate.target.uiSceneKey === nextScene.uiSceneKey
      && candidate.sourceFingerprint !== fingerprintScene(nextScene)
      && candidate.status !== "adopted"
    ));
    setCandidates((current) => current.map((candidate) => {
      if (candidate.target.uiSceneKey !== nextScene.uiSceneKey) return candidate;
      if (candidate.sourceFingerprint === fingerprintScene(nextScene) || candidate.status === "adopted") return candidate;
      return { ...candidate, status: "stale" };
    }));
    if (foundStale) setCandidateState("candidate-stale");
  }

  function handleSelectScene(uiSceneKey: UISceneKey) {
    if (candidateState === "candidate-loading") {
      requestSequenceRef.current += 1;
      setCandidateState("candidate-stale");
    }
    setActiveSceneKey(uiSceneKey);
    setSelection({ kind: "scene", uiSceneKey });
    setCompare({ status: "compare-closed" });
    setNavigatorDrawerOpen(false);
  }

  function handleSelectBlock(uiBlockKey: UIBlockKey) {
    setSelection({ kind: "block", uiSceneKey: activeSceneKey, uiBlockKey });
  }

  function handleChangeBlock(uiBlockKey: UIBlockKey, nextText: string) {
    const scene = sceneStateRef.current.find((item) => item.uiSceneKey === activeSceneKey);
    const block = scene?.blocks.find((item) => item.uiBlockKey === uiBlockKey);
    if (!scene || !block || block.readOnly || block.text === nextText) return;

    const nextScenes = sceneStateRef.current.map((item) => {
      if (item.uiSceneKey !== activeSceneKey) return item;
      return {
        ...item,
        status: "edited" as const,
        blocks: item.blocks.map((itemBlock) => itemBlock.uiBlockKey === uiBlockKey ? { ...itemBlock, text: nextText } : itemBlock),
      };
    });
    const nextScene = nextScenes.find((item) => item.uiSceneKey === activeSceneKey)!;
    commitScenes(nextScenes);
    markCandidatesAgainstScene(nextScene);
    setRecovery({ status: "none" });
  }

  async function handleGenerateCandidate() {
    const scene = sceneStateRef.current.find((item) => item.uiSceneKey === activeSceneKey);
    if (!scene) return;
    const target = selection?.uiSceneKey === activeSceneKey ? selection : { kind: "scene" as const, uiSceneKey: activeSceneKey };
    const sourceFingerprint = fingerprintScene(scene);
    const sequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = sequence;
    setCandidateState("candidate-loading");
    setRecovery({ status: "none" });

    try {
      const candidate = await generateLocalCandidate({
        candidateId: `candidate-local-${sequence + 1}`,
        kind: candidateKind,
        scene,
        selection: target,
      });
      const latestScene = sceneStateRef.current.find((item) => item.uiSceneKey === activeSceneKey);
      if (requestSequenceRef.current !== sequence || !latestScene || fingerprintScene(latestScene) !== sourceFingerprint) {
        setCandidateState("candidate-stale");
        return;
      }
      setCandidates([candidate]);
      setCandidateState("candidate-ready");
      setCompare({ status: "compare-closed" });
    } catch {
      if (requestSequenceRef.current !== sequence) return;
      setCandidateState("candidate-error");
      setRecovery({
        status: "validation-error",
        error: {
          code: "INVALID_SELECTION",
          title: "候选生成失败",
          message: "当前选择为空或不可用。补充内容后可以重新生成。",
          retryable: true,
          affectedArea: "candidate",
        },
      });
    }
  }

  function handleOpenCompare(candidateId: CandidateId = selectedCandidate?.candidateId ?? "") {
    const candidate = candidates.find((item) => item.candidateId === candidateId);
    if (!candidate || candidate.status === "stale") {
      setRecovery({
        status: "validation-error",
        error: {
          code: "CANDIDATE_STALE",
          title: "候选已过期",
          message: "当前内容已经改变，请重新生成候选。",
          retryable: true,
          affectedArea: "candidate",
        },
      });
      return;
    }
    comparisonSnapshotRef.current = cloneScenes(sceneStateRef.current);
    setCandidates((current) => current.map((item) => ({ ...item, status: item.candidateId === candidateId ? "selected" : item.status })));
    setCompare({ status: "compare-open", candidateId });
    setBottomDrawerOpen(false);
  }

  function performAdopt(candidateId: CandidateId, sourceScenes = sceneStateRef.current) {
    const candidate = candidates.find((item) => item.candidateId === candidateId);
    if (!candidate || candidate.status === "stale") return;
    const sequence = snapshotSequenceRef.current + 1;
    snapshotSequenceRef.current = sequence;
    const snapshot: ScriptLocalSnapshot = {
      localSnapshotId: `local-snapshot-${sequence}`,
      label: "采用候选前",
      description: `采用“${candidate.title}”之前的本地内容`,
      createdLabel: "刚刚",
      source: "candidate-adopt",
      scenes: cloneScenes(sourceScenes),
    };
    const nextScenes = applyCandidateToScenes(sourceScenes, candidate);
    commitScenes(nextScenes);
    setLocalHistory((current) => [...current, snapshot]);
    setCandidates((current) => current.map((item) => item.candidateId === candidateId ? { ...item, status: "adopted" } : item));
    setCandidateState("candidate-adopted");
    setCompare({ status: "compare-closed" });
    setRecovery({ status: "none" });
  }

  function requestAdopt(candidateId: CandidateId) {
    if (dirty) {
      setPendingAction({ intent: "candidate-adopt", candidateId });
      return;
    }
    performAdopt(candidateId);
  }

  function performRestore(localSnapshotId: string, sourceScenes?: readonly ScriptSceneProjection[]) {
    const snapshotScenes = sourceScenes ?? (localSnapshotId === "local-comparison-snapshot"
      ? comparisonSnapshotRef.current
      : localHistory.find((snapshot) => snapshot.localSnapshotId === localSnapshotId)?.scenes);
    if (!snapshotScenes) {
      setRecovery({
        status: "validation-error",
        error: {
          code: "LOCAL_HISTORY_UNAVAILABLE",
          title: "本地历史不可用",
          message: "所选本地快照已不在本次会话中。",
          retryable: false,
          affectedArea: "versions",
        },
      });
      return;
    }
    const nextScenes = cloneScenes(snapshotScenes);
    commitScenes(nextScenes);
    const restoredScene = nextScenes.find((scene) => scene.uiSceneKey === activeSceneKey);
    if (restoredScene) markCandidatesAgainstScene(restoredScene);
    setCompare({ status: "compare-closed" });
    setRecovery({ status: "none" });
  }

  function requestRestore(localSnapshotId: string) {
    if (dirty) {
      setPendingAction({ intent: "local-history-restore", localSnapshotId });
      return;
    }
    performRestore(localSnapshotId);
  }

  function handleNavigate(intent: "route-navigation" | "back-navigation", href: string) {
    if (dirty) {
      setPendingAction({ intent, href });
      return;
    }
    router.push(href);
  }

  function handleSwitch(intent: "project-switch" | "episode-switch", label: string) {
    if (dirty) {
      setPendingAction({ intent, label });
      return;
    }
    setGuidedMessage({ title: `切换${intent === "project-switch" ? "项目" : "剧集"}`, description: `${label}是当前演示上下文；不会在前端创建或改写正式身份。` });
  }

  function handleOpenOwner(owner: UpstreamConstraintOwner) {
    if (dirty) {
      setPendingAction({ intent: "route-navigation", href: owner === "M6" ? "/character-studio" : "/director" });
      return;
    }
    router.push(owner === "M6" ? "/character-studio" : "/director");
  }

  function handleStoryboardProgression() {
    if (dirty) {
      setPendingAction({ intent: "storyboard-progression" });
      return;
    }
    setRecovery({
      status: "business-error",
      error: {
        code: "NEXT_ROUTE_UNAVAILABLE",
        title: "分镜设计空间尚未开放",
        message: "当前只完成路由可用性检查，没有创建分镜或镜头事实。",
        retryable: false,
        affectedArea: "progression",
      },
    });
  }

  function handleResolveGuard(resolution: ScriptUnsavedResolution) {
    const action = pendingAction;
    if (!action) return;

    if (resolution === "preserve-and-continue-editing" || resolution === "cancel") {
      setPendingAction(null);
      return;
    }

    const restoredBaseline = cloneScenes(baselineScenes);
    commitScenes(restoredBaseline);
    setPendingAction(null);

    if (action.intent === "candidate-adopt") {
      performAdopt(action.candidateId, restoredBaseline);
    } else if (action.intent === "local-history-restore") {
      performRestore(action.localSnapshotId);
    } else if (action.intent === "storyboard-progression") {
      setRecovery({
        status: "business-error",
        error: {
          code: "NEXT_ROUTE_UNAVAILABLE",
          title: "分镜设计空间尚未开放",
          message: "已放弃本地修改，但不会因此创建任何分镜或镜头事实。",
          retryable: false,
          affectedArea: "progression",
        },
      });
    } else if (action.intent === "route-navigation" || action.intent === "back-navigation") {
      router.push(action.href);
    } else if (action.intent === "project-switch" || action.intent === "episode-switch") {
      setGuidedMessage({ title: action.intent === "project-switch" ? "切换项目" : "切换剧集", description: `${action.label}仍是本地演示上下文；当前切换不会创建新的正式身份。` });
    }
  }

  function handleLocateFinding(finding: NarrativeFindingPreview) {
    setActiveSceneKey(finding.target.uiSceneKey);
    setSelection(finding.target);
    setCompare({ status: "compare-closed" });
    setBottomDrawerOpen(false);
    setInspectorDrawerOpen(false);
  }

  function handleBottomTab(tab: ScriptBottomDrawerTab) {
    if (bottomDrawerOpen && bottomDrawerTab === tab) {
      setBottomDrawerOpen(false);
      return;
    }
    setBottomDrawerTab(tab);
    setBottomDrawerOpen(true);
  }

  const navigator = (
    <ScriptNavigator activeSceneKey={activeSceneKey} onSelectScene={handleSelectScene} scenes={scenes} />
  );
  const inspector = (
    <ScriptInspector
      dirty={dirty}
      findings={narrativeFindings}
      onLocateFinding={handleLocateFinding}
      onNextAction={() => handleSelectScene("ui-scene-13")}
      onOpenOwner={handleOpenOwner}
      scene={currentScene}
    />
  );
  const drawerContent = (
    <BottomDrawerContent
      activeTab={bottomDrawerTab}
      candidateState={candidateState}
      candidates={candidates}
      findings={narrativeFindings}
      localHistory={localHistory}
      onAdopt={requestAdopt}
      onCompare={handleOpenCompare}
      onLocate={handleLocateFinding}
      onRegenerate={handleGenerateCandidate}
      onRestore={requestRestore}
    />
  );

  return (
    <div className={styles.pageShell} data-candidate-state={pageState.candidate} data-dirty={dirty || undefined}>
      <ScriptStudioHeader dirty={dirty} onNavigate={handleNavigate} />
      <ScriptContextBar dirty={dirty} onSwitch={handleSwitch} />
      <EditorLayout
        actionBar={
          <ProductionActionBar
            activeTab={bottomDrawerTab}
            bottomDrawerOpen={bottomDrawerOpen}
            candidateCount={candidates.length}
            dirty={dirty}
            findingCount={narrativeFindings.length}
            localCharacterCount={localCharacterCount}
            modifiedSceneCount={modifiedSceneCount}
            onContinue={handleStoryboardProgression}
            onTabChange={handleBottomTab}
          />
        }
        bottomDrawer={useInlineBottomDrawer ? drawerContent : undefined}
        bottomDrawerOpen={useInlineBottomDrawer && bottomDrawerOpen}
        canvasLabel="剧本编辑画布"
        className={styles.editorShell}
        inspector={inspector}
        inspectorOpen={showFixedInspector}
        navigator={navigator}
        navigatorOpen={showFixedNavigator}
        toolbar={
          <ScriptToolbar
            compact={!showFixedNavigator}
            candidateReady={Boolean(selectedCandidate && selectedCandidate.status !== "stale")}
            onGuide={setGuidedMessage}
            onOpenBottomDrawer={() => handleBottomTab("candidates")}
            onOpenCompare={() => handleOpenCompare()}
            onOpenInspector={() => setInspectorDrawerOpen(true)}
            onOpenNavigator={() => setNavigatorDrawerOpen(true)}
          />
        }
      >
        {compare.status === "compare-open" && selectedCandidate && currentScene ? (
          <ScriptCompareSurface
            candidate={selectedCandidate}
            candidateState={candidateState}
            onAdopt={() => requestAdopt(selectedCandidate.candidateId)}
            onClose={() => setCompare({ status: "compare-closed" })}
            onRegenerate={handleGenerateCandidate}
            onRestore={() => requestRestore("local-comparison-snapshot")}
            scene={currentScene}
          />
        ) : (
          <ScriptCanvas
            candidateKind={candidateKind}
            candidateState={candidateState}
            onCandidateKindChange={setCandidateKind}
            onChangeBlock={handleChangeBlock}
            onDismissRecovery={() => setRecovery({ status: "none" })}
            onGenerateCandidate={handleGenerateCandidate}
            onSelectBlock={handleSelectBlock}
            recovery={recovery}
            scene={currentScene}
            selection={selection}
          />
        )}
      </EditorLayout>

      <ACSDrawer
        open={navigatorDrawerOpen}
        onClose={() => setNavigatorDrawerOpen(false)}
        title="场景"
        description="按章节浏览当前剧本投影"
        side="left"
        size="wide"
      >
        {navigator}
      </ACSDrawer>
      <InspectorDrawer
        open={inspectorDrawerOpen}
        onClose={() => setInspectorDrawerOpen(false)}
        title="剧本检查器"
        description="只读约束、发现与下一动作"
      >
        {inspector}
      </InspectorDrawer>
      <ACSDrawer
        open={!useInlineBottomDrawer && bottomDrawerOpen}
        onClose={() => setBottomDrawerOpen(false)}
        title={bottomDrawerTab === "candidates" ? "候选" : bottomDrawerTab === "local-history" ? "版本 / 本地历史" : "叙事发现"}
        side="bottom"
        size="wide"
      >
        {drawerContent}
      </ACSDrawer>

      <UnsavedGuard onResolve={handleResolveGuard} pendingAction={pendingAction} />
      <GuideModal message={guidedMessage} onClose={() => setGuidedMessage(null)} />
    </div>
  );
}
