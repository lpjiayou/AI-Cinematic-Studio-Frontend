"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSDrawer,
  ACSModal,
  AIAssistantPanel,
  AIThinkingState,
} from "@/components";
import { useProjectPresentation, type SeriesBibleCatalogItem } from "@/features/project-data";
import { CustomerLayout, WorkspaceLayout } from "@/layouts";
import { projectRoute } from "@/lib/project-navigation";
import { useACSTheme } from "@/theme";
import styles from "./story-world.module.css";

export type StoryWorldPageState =
  | "empty"
  | "editing"
  | "preview-ready"
  | "confirmed-preview"
  | "local-error"
  | "next-route-unavailable";

export type WorldPreviewStatus = "empty" | "editing" | "ready" | "error";

export type WorldAssetKind = "overview" | "timeline" | "map" | "faction-board";

export type WorldContext = {
  worldTitle: string;
  projectTypeLabel: string;
  stageLabel: "世界构建";
  statusLabel:
    | "等待设定"
    | "世界构建中"
    | "世界预览已准备"
    | "本地世界预览已确认";
};

export type WorldRulePreview = {
  id: string;
  title: string;
  description: string;
  influenceLabel: string;
  status: "draft-preview" | "ready-preview";
};

export type TimelineEventPreview = {
  id: string;
  yearLabel: string;
  title: string;
  description: string;
  impactLabel?: string;
};

export type LocationPreview = {
  id: string;
  name: string;
  categoryLabel: string;
  description: string;
  visualAssetUrl?: string;
};

export type FactionPreview = {
  id: string;
  name: string;
  ideology: string;
  goal: string;
  relationshipSummary: string;
  visualMarkerLabel?: string;
};

export type CulturePreview = {
  language: string;
  belief: string;
  customs: string;
  art: string;
  socialStructure: string;
};

export type VisualLanguagePreview = {
  colorDirection: string;
  architectureDirection: string;
  costumeDirection: string;
  lightingDirection: string;
  cameraDirection: string;
};

export type StoryWorldPreview = {
  title: string;
  premise: string;
  status: WorldPreviewStatus;
  rules: readonly WorldRulePreview[];
  timeline: readonly TimelineEventPreview[];
  locations: readonly LocationPreview[];
  factions: readonly FactionPreview[];
  culture: CulturePreview;
  visualLanguage: VisualLanguagePreview;
  assets: Readonly<Record<WorldAssetKind, string>>;
};

function CatalogList({
  items,
  title,
}: {
  items: readonly SeriesBibleCatalogItem[];
  title: string;
}) {
  return (
    <section className={styles.catalogGroup}>
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.clientKey}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
              <small>{item.authoritativeRef ? "可信 Ref 已连接" : "LOCAL · Ref 未连接"}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>当前本地项目没有可展示条目。</p>
      )}
    </section>
  );
}

function SeriesBibleCatalogPanel() {
  const project = useProjectPresentation();

  return (
    <ACSCard className={styles.catalogPanel} padding="spacious">
      <div className={styles.catalogHeading}>
        <div>
          <p className={styles.sectionEyebrow}>ACCEPTED SERIES BIBLE SURFACES</p>
          <h2>术语、道具与叙事约束</h2>
        </div>
        <ACSBadge tone="neutral">{project.dataOrigin} · 非权威</ACSBadge>
      </div>
      <div className={styles.catalogGrid}>
        <CatalogList items={project.storyWorld.glossaryTerms} title="术语表" />
        <CatalogList items={project.storyWorld.props} title="道具目录" />
        <CatalogList items={project.storyWorld.prohibitedNarrativePatterns} title="禁止叙事模式" />
      </div>
    </ACSCard>
  );
}

const worldAssets = {
  overview: "/assets/story-world/overview/world-overview.webp",
  timeline: "/assets/story-world/timeline/world-timeline.webp",
  map: "/assets/story-world/map/world-map.webp",
  "faction-board": "/assets/story-world/faction/faction-board.webp",
} as const satisfies Readonly<Record<WorldAssetKind, string>>;

const assetMetadata = [
  {
    kind: "overview" as const,
    title: "世界全景",
    description: "未来之城的时代环境、城市尺度与空间层次。",
    src: worldAssets.overview,
    alt: "电影世界全景中展示未来城市、时代环境和空间规模的概念视觉",
  },
  {
    kind: "timeline" as const,
    title: "历史演变",
    description: "文明从技术城市走向记忆信用时代的视觉线索。",
    src: worldAssets.timeline,
    alt: "展示电影世界历史演变、文明变化和关键时代节点的视觉规划图",
  },
  {
    kind: "map" as const,
    title: "空间地图",
    description: "中央城区、外环区域与关键地点的空间关系。",
    src: worldAssets.map,
    alt: "展示电影世界中城市区域、特殊地点和空间关系的概念地图",
  },
  {
    kind: "faction-board" as const,
    title: "阵营设计",
    description: "不同阵营的服装、材料、文化和关系张力。",
    src: worldAssets["faction-board"],
    alt: "展示电影世界中不同阵营的视觉符号、文化元素和关系结构的设计板",
  },
] as const;

const initialRules: readonly WorldRulePreview[] = [
  {
    id: "memory-is-identity",
    title: "记忆决定身份",
    description: "公民的关键记忆被记录为身份凭证，也决定他们能够进入的城市区域。",
    influenceLabel: "身份与社会秩序",
    status: "ready-preview",
  },
  {
    id: "ai-autonomy",
    title: "AI 拥有有限自治权",
    description: "获得公民担保的 AI 可以独立工作与迁徙，但不能修改人类的原始记忆。",
    influenceLabel: "人与 AI 关系",
    status: "ready-preview",
  },
  {
    id: "memory-cost",
    title: "记忆交换必有代价",
    description: "转移一段记忆会削弱与它相连的情绪，使每次交换都成为不可逆的选择。",
    influenceLabel: "剧情冲突",
    status: "ready-preview",
  },
  {
    id: "city-layers",
    title: "城市按记忆信用分层",
    description: "中央档案区保存城市共同记忆，外环居民则依靠口述和实体媒介维持身份。",
    influenceLabel: "空间与阶层",
    status: "draft-preview",
  },
];

const initialTimeline: readonly TimelineEventPreview[] = [
  {
    id: "ai-autonomy-era",
    yearLabel: "2100",
    title: "人工智能获得自治权",
    description: "首批具备自我判断能力的 AI 被允许进入公共生活，城市开始重写人与机器的边界。",
    impactLabel: "新秩序诞生",
  },
  {
    id: "memory-credit",
    yearLabel: "2120",
    title: "记忆信用系统启用",
    description: "城市将可信记忆转化为公共信用，身份、工作与居住空间由此重新分配。",
    impactLabel: "核心规则建立",
  },
  {
    id: "outer-ring",
    yearLabel: "2136",
    title: "外环记忆断层",
    description: "一次档案事故让外环居民失去共同历史，独立的记忆交易网络随之形成。",
    impactLabel: "阵营分化",
  },
  {
    id: "story-begins",
    yearLabel: "2148",
    title: "故事开始",
    description: "一段不属于任何公民的记忆出现，迫使城市重新审视身份与真实。",
    impactLabel: "主线事件",
  },
];

const initialLocations: readonly LocationPreview[] = [
  {
    id: "memory-archive",
    name: "中央记忆档案城",
    categoryLabel: "城市核心",
    description: "保存城市共同记忆的巨型建筑群，也是信用秩序最坚固的象征。",
  },
  {
    id: "reflection-harbor",
    name: "镜湖港",
    categoryLabel: "公共空间",
    description: "人类与 AI 共同生活的水岸区，城市灯光在这里显得最接近真实。",
  },
  {
    id: "quiet-district",
    name: "静默区",
    categoryLabel: "受限区域",
    description: "网络信号被严格限制，居民依靠实体档案和面对面的叙述保留身份。",
  },
  {
    id: "outer-market",
    name: "外环记忆集市",
    categoryLabel: "边缘聚落",
    description: "旧媒介、私人记忆和未经认证的故事在这里流通，规则由信任维系。",
  },
];

const initialFactions: readonly FactionPreview[] = [
  {
    id: "archive-council",
    name: "记忆议会",
    ideology: "共同记忆必须被保护，真实需要由城市共同确认。",
    goal: "维持记忆信用系统与中央档案的稳定。",
    relationshipSummary: "与共生联盟合作，同时严密监控外环记忆商。",
    visualMarkerLabel: "石墨黑 · 金属档案纹",
  },
  {
    id: "symbiosis-alliance",
    name: "共生联盟",
    ideology: "人类与 AI 应共同拥有记忆解释权。",
    goal: "建立跨越物种与身份等级的公共记忆协议。",
    relationshipSummary: "在议会与外环之间调停，也不断挑战现有秩序。",
    visualMarkerLabel: "雾白 · 柔性光纤",
  },
  {
    id: "memory-traders",
    name: "外环记忆商",
    ideology: "记忆属于经历它的人，而不是城市。",
    goal: "保存被系统拒绝的私人历史与失落身份。",
    relationshipSummary: "被议会视为威胁，却是许多居民找回过去的唯一途径。",
    visualMarkerLabel: "旧铜 · 手工织物",
  },
];

const initialCulture: CulturePreview = {
  language: "日常语言中会区分“亲历记忆”与“继承记忆”，沉默本身也被视为一种表达。",
  belief: "人们相信真正的身份存在于记忆与选择之间，而不是档案中的单一结论。",
  customs: "成年礼需要向家人讲述一段未经系统保存的私人记忆，并由在场者共同见证。",
  art: "艺术家使用旧胶片、机械投影与 AI 生成片段拼接无法被档案完整记录的情绪。",
  socialStructure: "中央城区依据信用分层，外环社区则通过口述传统和互助关系组织生活。",
};

const initialVisualLanguage: VisualLanguagePreview = {
  colorDirection: "深石板蓝与低饱和青灰构成城市底色，少量琥珀光代表仍被人保存的真实情感。",
  architectureDirection: "纪念碑式档案建筑与层叠公共平台并置，外环保留可修复、可迁移的模块结构。",
  costumeDirection: "身份层级通过面料、连接结构与磨损程度呈现，避免直接使用制服式标签。",
  lightingDirection: "冷色环境光强调秩序尺度，人物附近的暖色实景光用于表现信任、记忆与选择。",
  cameraDirection: "以宽幅空间和克制移动建立世界规模，再通过中近景观察人物与制度之间的距离。",
};

const initialPreview: StoryWorldPreview = {
  title: "未来之城",
  premise:
    "2148 年，人类与 AI 共同生活在一座由记忆信用驱动的城市中。记忆既是身份凭证，也是权力来源；当一段无人认领的记忆出现，城市关于真实、归属与自由的秩序开始松动。",
  status: "ready",
  rules: initialRules,
  timeline: initialTimeline,
  locations: initialLocations,
  factions: initialFactions,
  culture: initialCulture,
  visualLanguage: initialVisualLanguage,
  assets: worldAssets,
};

export type StoryWorldPageIntroProps = {
  eyebrow: "STORY WORLD / IP BIBLE";
  title: string;
  subtitle: string;
};

export function StoryWorldPageIntro({
  eyebrow,
  title,
  subtitle,
}: StoryWorldPageIntroProps) {
  return (
    <section className={styles.pageIntro} aria-labelledby="story-world-page-title">
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="story-world-page-title">{title}</h1>
      <p className={styles.introSubtitle}>{subtitle}</p>
    </section>
  );
}

function WorldWorkspaceNavigator({
  preview,
  onNavigate,
}: {
  preview: StoryWorldPreview;
  onNavigate?: () => void;
}) {
  const project = useProjectPresentation();
  const sections = [
    ["world-overview-workspace", "世界前提与规则", preview.rules.length],
    ["world-timeline-workspace", "历史与时间线", preview.timeline.length],
    ["world-space-workspace", "地点与空间", preview.locations.length],
    ["world-society-workspace", "阵营与文化", preview.factions.length],
    ["world-visual-workspace", "视觉语言", Object.keys(preview.visualLanguage).length],
    [
      "world-catalog-workspace",
      "术语、道具与禁忌",
      project.storyWorld.glossaryTerms.length
        + project.storyWorld.props.length
        + project.storyWorld.prohibitedNarrativePatterns.length,
    ],
  ] as const;

  return (
    <nav aria-label="世界构建任务导航" className={styles.worldTaskNavigator}>
      <div className={styles.worldTaskNavigatorHeading}>
        <span className={styles.sectionEyebrow}>WORLD OBJECTS</span>
        <strong>世界对象</strong>
        <small>当前仅显示已接入的本地集合</small>
      </div>
      <ul>
        {sections.map(([id, label, count]) => (
          <li key={id}>
            <a href={`#${id}`} onClick={onNavigate}>
              <span>{label}</span>
              <small>{count}</small>
            </a>
          </li>
        ))}
      </ul>
      <div className={styles.worldNavigatorBoundary}>
        <strong>LOCAL_FIXTURE</strong>
        <span>权威 Ref 未连接，不补造缺失集合。</span>
      </div>
    </nav>
  );
}

function WorldWorkspaceInspector({
  pageState,
  selectedTimelineEvent,
  selectedLocation,
  selectedFaction,
  canContinue,
  assistantPending,
  premiseReady,
  onRebuild,
  onContinue,
}: {
  pageState: StoryWorldPageState;
  selectedTimelineEvent?: TimelineEventPreview;
  selectedLocation?: LocationPreview;
  selectedFaction?: FactionPreview;
  canContinue: boolean;
  assistantPending: boolean;
  premiseReady: boolean;
  onRebuild: () => void;
  onContinue: () => void;
}) {
  return (
    <aside aria-label="世界工作区检查器" className={styles.worldInspector}>
      <section className={styles.worldInspectorSection}>
        <div className={styles.worldInspectorHeading}>
          <div><span>VALIDATION</span><strong>当前完成条件</strong></div>
          <ACSBadge tone={canContinue ? "primary" : "warning"}>{canContinue ? "可以推进" : "需要补充"}</ACSBadge>
        </div>
        <ul className={styles.worldValidationList}>
          <li data-ready={premiseReady || undefined}><span>{premiseReady ? "已满足" : "未满足"}</span>世界前提不少于 30 字</li>
          <li data-ready="true"><span>已满足</span>规则、历史、地点与阵营基线</li>
          <li data-ready="true"><span>已满足</span>视觉语言五项方向</li>
          <li data-ready={pageState === "confirmed-preview" || undefined}><span>{pageState === "confirmed-preview" ? "已确认" : "待确认"}</span>本地世界预览确认</li>
        </ul>
      </section>

      <section className={styles.worldInspectorSection}>
        <div className={styles.worldInspectorHeading}><div><span>SELECTION</span><strong>当前选择摘要</strong></div></div>
        <dl className={styles.worldSelectionFacts}>
          <div><dt>历史</dt><dd>{selectedTimelineEvent ? `${selectedTimelineEvent.yearLabel} · ${selectedTimelineEvent.title}` : "未选择"}</dd></div>
          <div><dt>地点</dt><dd>{selectedLocation?.name ?? "未选择"}</dd></div>
          <div><dt>阵营</dt><dd>{selectedFaction?.name ?? "未选择"}</dd></div>
          <div><dt>权威引用</dt><dd>未连接</dd></div>
        </dl>
      </section>

      <AIWorldAssistantPanel
        onRebuild={onRebuild}
        status={assistantPending ? "thinking" : premiseReady ? "ready" : "empty"}
        summary="世界的核心规则已经能够支撑当前故事，但能源来源、记忆继承方式与外环自治边界仍可进一步明确。"
        suggestions={[
          "建议补充城市能源来源，让建筑、交通与生活方式共享同一套视觉依据。",
          "时间线中的“外环记忆断层”可以进一步说明它如何改变记忆议会与外环居民的关系。",
          "优先区分三个阵营的材料触感，再统一到冷色城市与暖色人物光的视觉基线。",
        ]}
      />

      <div className={styles.worldInspectorAction}>
        <strong>下一阶段：角色设计</strong>
        <p>只确认本地预览；正式角色实体与 IP Bible 持久化仍未接入。</p>
        <ContinueCharacterButton disabled={!canContinue} loading={false} onContinue={onContinue} />
      </div>
    </aside>
  );
}

export type WorldContextBarProps = {
  context: WorldContext;
};

export function WorldContextBar({ context }: WorldContextBarProps) {
  const badgeTone =
    context.statusLabel === "本地世界预览已确认"
      ? "primary"
      : context.statusLabel === "等待设定"
        ? "neutral"
        : "ai";

  return (
    <ACSCard className={styles.contextBar} padding="compact">
      <div className={styles.contextContent}>
        <div className={styles.contextIdentity}>
          <strong>{context.worldTitle}</strong>
          <span aria-hidden="true">·</span>
          <span>{context.projectTypeLabel}</span>
          <span aria-hidden="true">·</span>
          <span>{context.stageLabel}</span>
        </div>
        <ACSBadge dot tone={badgeTone}>{context.statusLabel}</ACSBadge>
      </div>
    </ACSCard>
  );
}

export type WorldOverviewVisualProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
};

export function WorldOverviewVisual({
  src,
  alt,
  sizes,
  priority = false,
}: WorldOverviewVisualProps) {
  return (
    <figure className={styles.overviewVisual}>
      <Image
        alt={alt}
        className={styles.mediaImage}
        fill
        priority={priority}
        sizes={sizes}
        src={src}
      />
      <div className={styles.mediaOverlay} aria-hidden="true" />
      <figcaption className={styles.overviewCaption}>
        <span>WORLD ARCHIVE · 2148</span>
        <strong>未来之城</strong>
      </figcaption>
    </figure>
  );
}

export type WorldPremiseCardProps = {
  value: string;
  onChange: (value: string) => void;
  helpTextId: string;
  errorTextId?: string;
  errorText?: string;
  disabled?: boolean;
};

export function WorldPremiseCard({
  value,
  onChange,
  helpTextId,
  errorTextId,
  errorText,
  disabled = false,
}: WorldPremiseCardProps) {
  const describedBy = [helpTextId, errorText ? errorTextId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <ACSCard className={styles.premiseCard} padding="spacious">
      <div className={styles.fieldHeader}>
        <div>
          <p className={styles.sectionEyebrow}>WORLD PREMISE</p>
          <label htmlFor="story-world-premise">世界前提</label>
        </div>
        <span aria-label={`已输入 ${value.length} 个字符`}>{value.length} / 800</span>
      </div>
      <textarea
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(errorText)}
        disabled={disabled}
        id="story-world-premise"
        maxLength={800}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：2148 年的人类与 AI 共同生活在一座由记忆信用驱动的城市中，记忆成为身份和权力的核心。"
        value={value}
      />
      <div className={styles.fieldMeta}>
        <p id={helpTextId}>用一句清晰前提说明时代、核心规则与故事冲突，建议 30–800 字。</p>
        {errorText && errorTextId ? (
          <p className={styles.fieldError} id={errorTextId}>{errorText}</p>
        ) : null}
      </div>
    </ACSCard>
  );
}

export type WorldRuleCardProps = {
  rule: WorldRulePreview;
  index: number;
};

export function WorldRuleCard({ rule, index }: WorldRuleCardProps) {
  return (
    <ACSCard className={styles.ruleCard} padding="default">
      <div className={styles.cardIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
      <h3>{rule.title}</h3>
      <p>{rule.description}</p>
      <div className={styles.cardMeta}>
        <span>{rule.influenceLabel}</span>
        <ACSBadge tone={rule.status === "ready-preview" ? "primary" : "neutral"}>
          {rule.status === "ready-preview" ? "预览已准备" : "待完善"}
        </ACSBadge>
      </div>
    </ACSCard>
  );
}

export type WorldOverviewCanvasProps = {
  preview: StoryWorldPreview;
  theme: "light" | "dark";
  onPremiseChange: (value: string) => void;
};

export function WorldOverviewCanvas({
  preview,
  theme,
  onPremiseChange,
}: WorldOverviewCanvasProps) {
  const premiseError =
    preview.premise.trim().length > 0 && preview.premise.trim().length < 30
      ? "世界前提至少需要 30 个字符。"
      : undefined;

  return (
    <section aria-labelledby="world-overview-title" data-theme-preview={theme}>
      <ACSCard className={styles.overviewCanvas} padding="compact">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>WORLD OVERVIEW</p>
            <h2 id="world-overview-title">世界概览</h2>
          </div>
          <ACSBadge dot tone={preview.status === "ready" ? "primary" : "ai"}>
            {preview.status === "ready" ? "世界预览已准备" : "世界构建中"}
          </ACSBadge>
        </header>
        <WorldOverviewVisual
          alt="电影世界全景中展示未来城市、时代环境和空间规模的概念视觉"
          priority
          sizes="(max-width: 767px) 100vw, (max-width: 1439px) calc(100vw - 48px), 1400px"
          src={preview.assets.overview}
        />
        <div className={styles.overviewNarrative}>
          <WorldPremiseCard
            errorText={premiseError}
            errorTextId="story-world-premise-error"
            helpTextId="story-world-premise-help"
            onChange={onPremiseChange}
            value={preview.premise}
          />
          <ACSCard className={styles.worldSummaryCard} padding="spacious" tone="ai">
            <p className={styles.sectionEyebrow}>AI WORLD SUMMARY</p>
            <h3>{preview.title}</h3>
            <p>
              记忆既维系身份，也制造阶层。世界的核心张力来自“共同确认的真实”与“个人拥有的经历”之间的冲突。
            </p>
            <div className={styles.summaryTags}>
              <ACSBadge tone="ai">记忆信用</ACSBadge>
              <ACSBadge tone="neutral">人机共生</ACSBadge>
              <ACSBadge tone="neutral">身份与归属</ACSBadge>
            </div>
          </ACSCard>
        </div>
        <section className={styles.rulesSection} aria-labelledby="world-rules-title">
          <header className={styles.subsectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>WORLD RULES</p>
              <h2 id="world-rules-title">世界规则</h2>
            </div>
            <p>让剧情、人物和视觉选择遵循同一套世界逻辑。</p>
          </header>
          <div className={styles.ruleGrid}>
            {preview.rules.map((rule, index) => (
              <WorldRuleCard index={index} key={rule.id} rule={rule} />
            ))}
          </div>
        </section>
      </ACSCard>
    </section>
  );
}

export type TimelineEventCardProps = {
  event: TimelineEventPreview;
  selected: boolean;
  onSelect: () => void;
};

export function TimelineEventCard({
  event,
  selected,
  onSelect,
}: TimelineEventCardProps) {
  return (
    <li className={styles.timelineItem}>
      <button
        aria-pressed={selected}
        className={styles.timelineButton}
        data-timeline-id={event.id}
        onClick={onSelect}
        tabIndex={selected ? 0 : -1}
        type="button"
      >
        <span className={styles.timelineYear}>{event.yearLabel}</span>
        <span className={styles.timelineMarker} aria-hidden="true" />
        <span className={styles.timelineCopy}>
          <strong>{event.title}</strong>
          <span>{event.description}</span>
          {event.impactLabel ? <em>{event.impactLabel}</em> : null}
        </span>
      </button>
    </li>
  );
}

export type WorldTimelineProps = {
  events: readonly TimelineEventPreview[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
};

export function WorldTimeline({
  events,
  selectedEventId,
  onSelect,
}: WorldTimelineProps) {
  const activeId = selectedEventId ?? events[0]?.id ?? null;

  function handleTimelineKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("button[data-timeline-id]");
    if (!button) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-timeline-id]"),
    );
    const currentIndex = buttons.indexOf(button);
    if (currentIndex < 0) return;

    let nextIndex: number | null = null;
    if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
      nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    } else if (["ArrowRight", "ArrowDown"].includes(event.key)) {
      nextIndex = (currentIndex + 1) % buttons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(button.dataset.timelineId ?? "");
      return;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextButton = buttons[nextIndex];
    onSelect(nextButton.dataset.timelineId ?? "");
    nextButton.focus();
  }

  return (
    <section
      aria-labelledby="world-timeline-title"
      className={styles.timelinePanel}
      onKeyDown={handleTimelineKeyDown}
    >
      <ACSCard className={styles.worldPanel} padding="compact">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>HISTORY ARCHIVE</p>
            <h2 id="world-timeline-title">世界时间线</h2>
          </div>
          <ACSBadge tone="neutral">虚构历史</ACSBadge>
        </header>
        <figure className={styles.supportingVisual}>
          <Image
            alt="展示电影世界历史演变、文明变化和关键时代节点的视觉规划图"
            className={styles.mediaImage}
            fill
            sizes="(max-width: 1439px) calc(100vw - 48px), 690px"
            src={worldAssets.timeline}
          />
          <div className={styles.mediaOverlay} aria-hidden="true" />
        </figure>
        {events.length ? (
          <ol className={styles.timelineList}>
            {events.map((timelineEvent) => (
              <TimelineEventCard
                event={timelineEvent}
                key={timelineEvent.id}
                onSelect={() => onSelect(timelineEvent.id)}
                selected={timelineEvent.id === activeId}
              />
            ))}
          </ol>
        ) : (
          <p className={styles.emptyState}>补充世界前提后，这里会呈现关键历史节点。</p>
        )}
      </ACSCard>
    </section>
  );
}

export type LocationCardProps = {
  location: LocationPreview;
  selected: boolean;
  onSelect: () => void;
};

export function LocationCard({ location, selected, onSelect }: LocationCardProps) {
  return (
    <ACSCard
      className={styles.selectableCardShell}
      interactive
      padding="compact"
      tone={selected ? "selected" : "default"}
    >
      <button
        aria-label={`查看地点：${location.name}`}
        aria-pressed={selected}
        className={styles.selectableCardButton}
        onClick={onSelect}
        type="button"
      >
        <span className={styles.cardSelectionState}>
          <ACSBadge tone={selected ? "primary" : "neutral"}>{location.categoryLabel}</ACSBadge>
          <span>{selected ? "已选择" : "查看地点"}</span>
        </span>
        <strong>{location.name}</strong>
        <span>{location.description}</span>
        <span className={styles.detailAction}>打开地点档案 <span aria-hidden="true">↗</span></span>
      </button>
    </ACSCard>
  );
}

export type WorldMapCanvasProps = {
  mapAssetUrl: string;
  mapAlt: string;
  locations: readonly LocationPreview[];
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string) => void;
};

export function WorldMapCanvas({
  mapAssetUrl,
  mapAlt,
  locations,
  selectedLocationId,
  onSelectLocation,
}: WorldMapCanvasProps) {
  return (
    <section aria-labelledby="world-map-title">
      <ACSCard className={styles.worldPanel} padding="compact">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>SPATIAL ARCHIVE</p>
            <h2 id="world-map-title">世界地图</h2>
          </div>
          <ACSBadge tone="neutral">概念空间</ACSBadge>
        </header>
        <figure className={styles.supportingVisual}>
          <Image
            alt={mapAlt}
            className={styles.mediaImage}
            fill
            sizes="(max-width: 1439px) calc(100vw - 48px), 690px"
            src={mapAssetUrl}
          />
          <div className={styles.mediaOverlay} aria-hidden="true" />
          <figcaption className={styles.mapCaption}>中央城区 · 外环 · 镜湖水系</figcaption>
        </figure>
        <div className={styles.locationGrid}>
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onSelect={() => onSelectLocation(location.id)}
              selected={location.id === selectedLocationId}
            />
          ))}
        </div>
      </ACSCard>
    </section>
  );
}

export type FactionCardProps = {
  faction: FactionPreview;
  selected: boolean;
  onSelect: () => void;
};

export function FactionCard({ faction, selected, onSelect }: FactionCardProps) {
  return (
    <ACSCard
      className={styles.factionCardShell}
      interactive
      padding="compact"
      tone={selected ? "selected" : "default"}
    >
      <button
        aria-label={`查看阵营：${faction.name}`}
        aria-pressed={selected}
        className={styles.factionButton}
        onClick={onSelect}
        type="button"
      >
        <span className={styles.cardSelectionState}>
          <ACSBadge tone={selected ? "primary" : "neutral"}>
            {faction.visualMarkerLabel ?? "阵营视觉"}
          </ACSBadge>
          <span>{selected ? "已选择" : "查看阵营"}</span>
        </span>
        <strong>{faction.name}</strong>
        <span className={styles.factionField}>
          <small>理念</small>
          {faction.ideology}
        </span>
        <span className={styles.factionField}>
          <small>目标</small>
          {faction.goal}
        </span>
        <span className={styles.factionRelationship}>{faction.relationshipSummary}</span>
        <span className={styles.detailAction}>打开阵营档案 <span aria-hidden="true">↗</span></span>
      </button>
    </ACSCard>
  );
}

export type FactionSystemProps = {
  factions: readonly FactionPreview[];
  selectedFactionId: string | null;
  onSelectFaction: (factionId: string) => void;
};

export function FactionSystem({
  factions,
  selectedFactionId,
  onSelectFaction,
}: FactionSystemProps) {
  return (
    <section aria-labelledby="faction-system-title">
      <ACSCard className={styles.worldPanel} padding="compact">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>FACTION SYSTEM</p>
            <h2 id="faction-system-title">阵营系统</h2>
          </div>
          <ACSBadge tone="neutral">3 个核心阵营</ACSBadge>
        </header>
        <figure className={styles.factionVisual}>
          <Image
            alt="展示电影世界中不同阵营的视觉符号、文化元素和关系结构的设计板"
            className={styles.mediaImage}
            fill
            sizes="(max-width: 1439px) calc(100vw - 48px), 760px"
            src={worldAssets["faction-board"]}
          />
          <div className={styles.mediaOverlay} aria-hidden="true" />
        </figure>
        <div className={styles.factionGrid}>
          {factions.map((faction) => (
            <FactionCard
              faction={faction}
              key={faction.id}
              onSelect={() => onSelectFaction(faction.id)}
              selected={faction.id === selectedFactionId}
            />
          ))}
        </div>
      </ACSCard>
    </section>
  );
}

export type CultureCanvasProps = {
  culture: CulturePreview;
};

export function CultureCanvas({ culture }: CultureCanvasProps) {
  const sections = [
    ["语言", culture.language],
    ["信仰", culture.belief],
    ["习俗", culture.customs],
    ["艺术", culture.art],
    ["社会结构", culture.socialStructure],
  ] as const;

  return (
    <section aria-labelledby="culture-canvas-title">
      <ACSCard className={styles.worldPanel} padding="spacious">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>CULTURE CANVAS</p>
            <h2 id="culture-canvas-title">文化画布</h2>
          </div>
          <ACSBadge tone="neutral">社会与日常</ACSBadge>
        </header>
        <div className={styles.cultureList}>
          {sections.map(([title, description], index) => (
            <section key={title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </section>
          ))}
        </div>
      </ACSCard>
    </section>
  );
}

function assetForUrl(url: string) {
  return assetMetadata.find((asset) => asset.src === url) ?? assetMetadata[0];
}

export type VisualLanguagePanelProps = {
  value: VisualLanguagePreview;
  assetUrls: readonly string[];
  onOpenAsset: (assetUrl: string) => void;
};

export function VisualLanguagePanel({
  value,
  assetUrls,
  onOpenAsset,
}: VisualLanguagePanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const directions = [
    ["色彩", value.colorDirection],
    ["建筑", value.architectureDirection],
    ["服装", value.costumeDirection],
    ["光线", value.lightingDirection],
    ["摄影", value.cameraDirection],
  ] as const;

  function handleAssetKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("button[data-asset-index]");
    if (!button) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-asset-index]"),
    );
    const currentIndex = buttons.indexOf(button);
    let nextIndex: number | null = null;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = buttons.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    setSelectedIndex(nextIndex);
    buttons[nextIndex].focus();
  }

  return (
    <section aria-labelledby="visual-language-title">
      <ACSCard className={styles.visualLanguagePanel} padding="spacious">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>VISUAL LANGUAGE</p>
            <h2 id="visual-language-title">视觉语言</h2>
          </div>
          <ACSBadge tone="primary">连接角色设计</ACSBadge>
        </header>
        <div className={styles.visualLanguageContent}>
          <div className={styles.directionList}>
            {directions.map(([title, description], index) => (
              <section key={title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}方向</h3>
                  <p>{description}</p>
                </div>
              </section>
            ))}
          </div>
          <div className={styles.assetArchive}>
            <div className={styles.archiveHeading}>
              <div>
                <h3>世界视觉资产</h3>
                <p>这些视觉将作为后续角色设计与场景制作的共同参照。</p>
              </div>
              <span>{assetUrls.length} / 4</span>
            </div>
            <div className={styles.assetGrid} onKeyDown={handleAssetKeyDown}>
              {assetUrls.map((url, index) => {
                const asset = assetForUrl(url);
                const selected = index === selectedIndex;
                return (
                  <button
                    aria-label={`查看${asset.title}`}
                    aria-pressed={selected}
                    className={styles.assetButton}
                    data-asset-index={index}
                    key={url}
                    onClick={() => {
                      setSelectedIndex(index);
                      onOpenAsset(url);
                    }}
                    tabIndex={selected ? 0 : -1}
                    type="button"
                  >
                    <span className={styles.assetThumb}>
                      <Image
                        alt={asset.alt}
                        className={styles.mediaImage}
                        fill
                        sizes="(max-width: 767px) 45vw, 220px"
                        src={asset.src}
                      />
                    </span>
                    <span>
                      <strong>{asset.title}</strong>
                      <small>{asset.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ACSCard>
    </section>
  );
}

export type AIWorldAssistantPanelProps = {
  status: "empty" | "thinking" | "ready" | "error";
  summary: string;
  suggestions: readonly string[];
  onRebuild: () => void;
};

export function AIWorldAssistantPanel({
  status,
  summary,
  suggestions,
  onRebuild,
}: AIWorldAssistantPanelProps) {
  return (
    <AIAssistantPanel
      actions={
        <ACSButton disabled={status === "thinking"} onClick={onRebuild} size="small" variant="secondary">
          重新整理世界建议
        </ACSButton>
      }
      description="检查规则、历史与视觉方向之间的一致性，并提示下一步。"
      status={status === "thinking" ? "正在整理" : status === "ready" ? "建议已准备" : "等待设定"}
      title="AI 世界构建建议"
    >
      {status === "thinking" ? (
        <AIThinkingState
          compact
          detail="正在检查世界规则、历史关系和视觉方向。"
          label="正在整理世界建议"
        />
      ) : (
        <div className={styles.assistantContent}>
          <p className={styles.assistantSummary}>{summary}</p>
          <div className={styles.suggestionGrid}>
            {suggestions.map((suggestion, index) => (
              <ACSCard key={suggestion} padding="compact" tone="ai">
                <span aria-hidden="true">0{index + 1}</span>
                <p>{suggestion}</p>
              </ACSCard>
            ))}
          </div>
        </div>
      )}
    </AIAssistantPanel>
  );
}

export type ContinueCharacterButtonProps = {
  disabled: boolean;
  loading: boolean;
  onContinue: () => void;
};

export function ContinueCharacterButton({
  disabled,
  loading,
  onContinue,
}: ContinueCharacterButtonProps) {
  return (
    <ACSButton
      aria-busy={loading}
      className={styles.continueButton}
      disabled={disabled || loading}
      loading={loading}
      onClick={onContinue}
      size="large"
      variant="primary"
    >
      进入角色设计
    </ACSButton>
  );
}

type DetailContentProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

function DetailContent({ eyebrow, title, children }: DetailContentProps) {
  return (
    <div className={styles.detailContent}>
      <p className={styles.sectionEyebrow}>{eyebrow}</p>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function useSmallViewport() {
  return useMediaQuery("(max-width: 767px)");
}

type ResponsiveDetailProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

function ResponsiveDetail({
  open,
  onClose,
  title,
  description,
  children,
}: ResponsiveDetailProps) {
  const small = useSmallViewport();

  if (small) {
    return (
      <ACSDrawer
        description={description}
        onClose={onClose}
        open={open}
        side="bottom"
        size="wide"
        title={title}
      >
        {children}
      </ACSDrawer>
    );
  }

  return (
    <ACSModal
      description={description}
      onClose={onClose}
      open={open}
      size="large"
      title={title}
    >
      {children}
    </ACSModal>
  );
}

function WorldAssetViewer({
  open,
  assetIndex,
  onAssetIndexChange,
  onClose,
}: {
  open: boolean;
  assetIndex: number;
  onAssetIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const asset = assetMetadata[assetIndex];

  function move(delta: number) {
    setZoom(1);
    onAssetIndexChange((assetIndex + delta + assetMetadata.length) % assetMetadata.length);
  }

  function handleViewerKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  }

  return (
    <ResponsiveDetail
      description={asset.description}
      onClose={() => {
        setZoom(1);
        onClose();
      }}
      open={open}
      title={asset.title}
    >
      <div className={styles.assetViewer} onKeyDown={handleViewerKeyDown}>
        <div className={styles.viewerStage}>
          <Image
            alt={asset.alt}
            className={styles.viewerImage}
            fill
            sizes="(max-width: 767px) 100vw, 900px"
            src={asset.src}
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
        <div className={styles.viewerToolbar}>
          <ACSButton aria-label="上一张世界资产" onClick={() => move(-1)} variant="secondary">上一张</ACSButton>
          <div className={styles.viewerZoom}>
            <ACSButton
              aria-label="缩小世界资产"
              disabled={zoom <= 1}
              onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
              size="small"
              variant="ghost"
            >
              缩小
            </ACSButton>
            <span>{Math.round(zoom * 100)}%</span>
            <ACSButton
              aria-label="放大世界资产"
              disabled={zoom >= 1.5}
              onClick={() => setZoom((value) => Math.min(1.5, value + 0.25))}
              size="small"
              variant="ghost"
            >
              放大
            </ACSButton>
          </div>
          <ACSButton aria-label="下一张世界资产" onClick={() => move(1)} variant="secondary">下一张</ACSButton>
        </div>
      </div>
    </ResponsiveDetail>
  );
}

export function StoryWorldPage() {
  const { theme } = useACSTheme();
  const project = useProjectPresentation();
  const projectInitialPreview = useMemo<StoryWorldPreview>(
    () => ({
      ...initialPreview,
      title: project.display.worldTitle,
      premise: project.display.worldPremise,
    }),
    [project.display.worldPremise, project.display.worldTitle],
  );
  const [premise, setPremise] = useState(projectInitialPreview.premise);
  const [selectedTimelineEventId, setSelectedTimelineEventId] = useState(initialTimeline[1].id);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocations[0].id);
  const [selectedFactionId, setSelectedFactionId] = useState(initialFactions[0].id);
  const [timelineDetailId, setTimelineDetailId] = useState<string | null>(null);
  const [locationDetailId, setLocationDetailId] = useState<string | null>(null);
  const [factionDetailId, setFactionDetailId] = useState<string | null>(null);
  const [assetViewerOpen, setAssetViewerOpen] = useState(false);
  const [assetIndex, setAssetIndex] = useState(0);
  const [assistantPending, setAssistantPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [nextStepOpen, setNextStepOpen] = useState(false);
  const [navigatorDrawerOpen, setNavigatorDrawerOpen] = useState(false);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const navigatorNeedsDrawer = useMediaQuery("(max-width: 767px)");
  const inspectorNeedsDrawer = useMediaQuery("(max-width: 1152px)");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const queueLocalRefresh = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setAssistantPending(true);
    timerRef.current = window.setTimeout(() => {
      setAssistantPending(false);
      timerRef.current = null;
    }, 420);
  }, []);

  const preview: StoryWorldPreview = useMemo(
    () => ({
      ...projectInitialPreview,
      premise,
      status: premise.trim().length < 30 ? "empty" : assistantPending ? "editing" : "ready",
    }),
    [assistantPending, premise, projectInitialPreview],
  );

  const canContinue =
    premise.trim().length >= 30 &&
    preview.rules.length >= 3 &&
    preview.timeline.length >= 2 &&
    preview.locations.length >= 2 &&
    preview.factions.length >= 2 &&
    Object.values(preview.visualLanguage).every((value) => value.trim().length > 0);

  const pageState: StoryWorldPageState = confirmed
    ? "confirmed-preview"
    : assistantPending
      ? "editing"
      : canContinue
        ? "preview-ready"
        : "empty";

  const context: WorldContext = {
    worldTitle: preview.title,
    projectTypeLabel: "科幻短片",
    stageLabel: "世界构建",
    statusLabel: confirmed
      ? "本地世界预览已确认"
      : assistantPending
        ? "世界构建中"
        : canContinue
          ? "世界预览已准备"
          : "等待设定",
  };

  const selectedTimelineEvent = preview.timeline.find((item) => item.id === timelineDetailId);
  const selectedLocation = preview.locations.find((item) => item.id === locationDetailId);
  const selectedFaction = preview.factions.find((item) => item.id === factionDetailId);
  const activeTimelineEvent = preview.timeline.find((item) => item.id === selectedTimelineEventId);
  const activeLocation = preview.locations.find((item) => item.id === selectedLocationId);
  const activeFaction = preview.factions.find((item) => item.id === selectedFactionId);

  const workspaceNavigator = (
    <WorldWorkspaceNavigator
      onNavigate={() => setNavigatorDrawerOpen(false)}
      preview={preview}
    />
  );
  const workspaceInspector = (
    <WorldWorkspaceInspector
      assistantPending={assistantPending}
      canContinue={canContinue}
      onContinue={() => {
        if (!canContinue) return;
        setConfirmed(true);
        setNextStepOpen(true);
      }}
      onRebuild={() => {
        setConfirmed(false);
        queueLocalRefresh();
      }}
      pageState={pageState}
      premiseReady={premise.trim().length >= 30}
      selectedFaction={activeFaction}
      selectedLocation={activeLocation}
      selectedTimelineEvent={activeTimelineEvent}
    />
  );

  return (
    <CustomerLayout
      className={styles.storyWorldLayout}
      contained={false}
      data-page-state={pageState}
    >
      <div className={styles.page}>
        <WorldContextBar context={context} />
        <StoryWorldPageIntro
          eyebrow="STORY WORLD / IP BIBLE"
          subtitle="定义世界前提、规则、历史、地点、阵营、文化和视觉语言，为角色与剧本提供一致的创作基线。"
          title="建立一个可以持续生长的电影世界"
        />

        {navigatorNeedsDrawer || inspectorNeedsDrawer ? (
          <div aria-label="故事世界移动工作区入口" className={styles.workspaceAccessBar}>
            {navigatorNeedsDrawer ? (
              <ACSButton onClick={() => setNavigatorDrawerOpen(true)} variant="secondary">
                打开世界对象导航
              </ACSButton>
            ) : null}
            {inspectorNeedsDrawer ? (
              <ACSButton onClick={() => setInspectorDrawerOpen(true)} variant="secondary">
                打开检查与下一步
              </ACSButton>
            ) : null}
          </div>
        ) : null}

        <WorkspaceLayout
          candidateStripMode="hidden"
          className={styles.worldProductionWorkspace}
          contentLabel="故事世界主要任务区"
          embedded
          inspector={inspectorNeedsDrawer ? undefined : workspaceInspector}
          projectNavigator={navigatorNeedsDrawer ? undefined : workspaceNavigator}
        >
          <div className={styles.worldTaskCanvas}>

            <div id="world-overview-workspace">
              <WorldOverviewCanvas
                onPremiseChange={(value) => {
                  setPremise(value);
                  setConfirmed(false);
                  queueLocalRefresh();
                }}
                preview={preview}
                theme={theme}
              />
            </div>

            <div className={styles.historySpaceGrid}>
              <div id="world-timeline-workspace">
                <WorldTimeline
            events={preview.timeline}
            onSelect={(eventId) => {
              setSelectedTimelineEventId(eventId);
              setTimelineDetailId(eventId);
            }}
            selectedEventId={selectedTimelineEventId}
                />
              </div>
              <div id="world-space-workspace">
                <WorldMapCanvas
            locations={preview.locations}
            mapAlt="展示电影世界中城市区域、特殊地点和空间关系的概念地图"
            mapAssetUrl={preview.assets.map}
            onSelectLocation={(locationId) => {
              setSelectedLocationId(locationId);
              setLocationDetailId(locationId);
            }}
            selectedLocationId={selectedLocationId}
                />
              </div>
            </div>

            <div className={styles.societyCultureGrid} id="world-society-workspace">
              <FactionSystem
            factions={preview.factions}
            onSelectFaction={(factionId) => {
              setSelectedFactionId(factionId);
              setFactionDetailId(factionId);
            }}
            selectedFactionId={selectedFactionId}
              />
              <CultureCanvas culture={preview.culture} />
            </div>

            <div id="world-visual-workspace">
              <VisualLanguagePanel
          assetUrls={Object.values(preview.assets)}
          onOpenAsset={(assetUrl) => {
            const nextIndex = assetMetadata.findIndex((asset) => asset.src === assetUrl);
            setAssetIndex(nextIndex >= 0 ? nextIndex : 0);
            setAssetViewerOpen(true);
          }}
          value={preview.visualLanguage}
              />
            </div>

            <div id="world-catalog-workspace"><SeriesBibleCatalogPanel /></div>

          </div>
        </WorkspaceLayout>
      </div>

      <ACSModal
        description="当前世界预览仍属于本地展示状态。"
        footer={
          <div className={styles.confirmedActions}>
            <Link href={projectRoute(project.clientKey, "planning/characters")}>打开角色工作室</Link>
            <ACSButton onClick={() => setNextStepOpen(false)} variant="primary">留在故事世界</ACSButton>
          </div>
        }
        onClose={() => setNextStepOpen(false)}
        open={nextStepOpen}
        title="世界预览已确认"
      >
        <div className={styles.confirmedState}>
          <ACSBadge dot tone="primary">本地世界预览已确认</ACSBadge>
          <h3>可以进入角色设计继续完善</h3>
          <p>角色工作室已可作为下一页面打开。当前确认不会创建正式角色实体，也不会持久化 IP Bible。</p>
        </div>
      </ACSModal>

      <ACSDrawer
        description="浏览当前本地世界对象与任务区域"
        onClose={() => setNavigatorDrawerOpen(false)}
        open={navigatorDrawerOpen}
        side="left"
        size="narrow"
        title="世界对象导航"
      >
        {workspaceNavigator}
      </ACSDrawer>

      <ACSDrawer
        description="检查完成条件、当前选择和下一步"
        onClose={() => setInspectorDrawerOpen(false)}
        open={inspectorDrawerOpen}
        side="right"
        size="narrow"
        title="世界检查与下一步"
      >
        {workspaceInspector}
      </ACSDrawer>

      <ResponsiveDetail
        description={selectedTimelineEvent?.description}
        onClose={() => setTimelineDetailId(null)}
        open={Boolean(selectedTimelineEvent)}
        title={selectedTimelineEvent ? `${selectedTimelineEvent.yearLabel} · ${selectedTimelineEvent.title}` : "历史事件"}
      >
        {selectedTimelineEvent ? (
          <DetailContent eyebrow="HISTORY EVENT" title={selectedTimelineEvent.title}>
            <p>{selectedTimelineEvent.description}</p>
            {selectedTimelineEvent.impactLabel ? <ACSBadge tone="ai">{selectedTimelineEvent.impactLabel}</ACSBadge> : null}
          </DetailContent>
        ) : null}
      </ResponsiveDetail>

      <ResponsiveDetail
        description={selectedLocation?.description}
        onClose={() => setLocationDetailId(null)}
        open={Boolean(selectedLocation)}
        title={selectedLocation?.name ?? "地点档案"}
      >
        {selectedLocation ? (
          <DetailContent eyebrow="LOCATION ARCHIVE" title={selectedLocation.name}>
            <ACSBadge tone="primary">{selectedLocation.categoryLabel}</ACSBadge>
            <p>{selectedLocation.description}</p>
          </DetailContent>
        ) : null}
      </ResponsiveDetail>

      <ResponsiveDetail
        description={selectedFaction?.relationshipSummary}
        onClose={() => setFactionDetailId(null)}
        open={Boolean(selectedFaction)}
        title={selectedFaction?.name ?? "阵营档案"}
      >
        {selectedFaction ? (
          <DetailContent eyebrow="FACTION ARCHIVE" title={selectedFaction.name}>
            <ACSBadge tone="primary">{selectedFaction.visualMarkerLabel}</ACSBadge>
            <dl className={styles.detailList}>
              <div><dt>理念</dt><dd>{selectedFaction.ideology}</dd></div>
              <div><dt>目标</dt><dd>{selectedFaction.goal}</dd></div>
              <div><dt>关系</dt><dd>{selectedFaction.relationshipSummary}</dd></div>
            </dl>
          </DetailContent>
        ) : null}
      </ResponsiveDetail>

      <WorldAssetViewer
        assetIndex={assetIndex}
        onAssetIndexChange={setAssetIndex}
        onClose={() => setAssetViewerOpen(false)}
        open={assetViewerOpen}
      />

      <div aria-live="polite" className={styles.srOnly}>
        {assistantPending ? "世界构建中" : confirmed ? "本地世界预览已确认" : ""}
      </div>
    </CustomerLayout>
  );
}
