"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSModal,
  AIAssistantPanel,
  AIThinkingState,
} from "@/components";
import { CustomerLayout } from "@/layouts";
import { useACSTheme } from "@/theme";
import styles from "./ai-director.module.css";

export type DirectorStatus =
  | "empty"
  | "editing"
  | "analysis-ready"
  | "plan-ready"
  | "confirmed-preview"
  | "error";

export type AudienceOption =
  | "general"
  | "young"
  | "brand"
  | "platform"
  | "family"
  | "professional";

export type ToneOption =
  | "warm"
  | "tense"
  | "dark"
  | "epic"
  | "healing"
  | "restrained";

export type ReferenceStyleOption =
  | "hollywood-sci-fi"
  | "eastern-aesthetic"
  | "realism"
  | "animation-film"
  | "film-noir"
  | "custom";

export type SelectorOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  iconName?: string;
  disabled?: boolean;
};

export type DirectorContext = {
  projectTitle: string;
  projectTypeLabel: string;
  stageLabel: "导演方案";
  statusLabel:
    | "等待输入"
    | "分析预览中"
    | "输入检查已通过"
    | "本地预览已确认";
};

export type DirectorInputState = {
  storyIntent: string;
  audience: AudienceOption | null;
  tone: ToneOption | null;
  referenceStyle: ReferenceStyleOption | null;
  customReference: string;
};

export type DirectorInputField =
  | "storyIntent"
  | "audience"
  | "tone"
  | "referenceStyle"
  | "customReference";

export type DirectorInputChangePayload =
  | { field: "storyIntent"; value: string }
  | { field: "audience"; value: AudienceOption | null }
  | { field: "tone"; value: ToneOption | null }
  | { field: "referenceStyle"; value: ReferenceStyleOption | null }
  | { field: "customReference"; value: string };

export type DirectorAnalysisState = {
  status: "empty" | "editing" | "ready" | "error";
  storyAnalysis: string;
  themeAnalysis: string;
  characterDirection: string;
  visualLanguage: string;
  productionStrategy: string;
  visualAssetUrl: string;
  errorMessage?: string;
};

export type DirectorPlanPreview = {
  status: "draft-preview" | "ready-preview" | "confirmed-preview";
  concept: string;
  structure: readonly string[];
  characterDirection: string;
  visualDirection: string;
  productionRoadmap: readonly string[];
};

export type AIDirectorPageState =
  | "empty"
  | "editing"
  | "analysis-ready"
  | "plan-ready"
  | "confirmed-preview"
  | "local-error"
  | "next-route-unavailable";

const audienceOptions = [
  {
    value: "general",
    label: "大众观众",
    description: "建立清晰情绪入口与广泛共鸣",
  },
  {
    value: "young",
    label: "年轻用户",
    description: "强调当代议题与鲜明视觉节奏",
  },
  {
    value: "brand",
    label: "品牌受众",
    description: "兼顾故事感染力与品牌表达",
  },
  {
    value: "platform",
    label: "影视平台",
    description: "面向连续观看与内容传播场景",
  },
  {
    value: "family",
    label: "儿童 / 家庭",
    description: "保持友好表达与共同观看体验",
  },
  {
    value: "professional",
    label: "专业行业观众",
    description: "聚焦专业语境与行业真实感",
  },
] as const satisfies readonly SelectorOption<AudienceOption>[];

const toneOptions = [
  { value: "warm", label: "温暖", description: "让关系与希望成为情绪底色" },
  { value: "tense", label: "紧张", description: "以持续压力推动人物选择" },
  { value: "dark", label: "黑暗", description: "探索困境、代价与未知边界" },
  { value: "epic", label: "史诗", description: "用宏大空间承载命运转折" },
  { value: "healing", label: "治愈", description: "在伤痕中寻找连接与修复" },
  { value: "restrained", label: "克制", description: "以留白、停顿和细节传递情绪" },
] as const satisfies readonly SelectorOption<ToneOption>[];

const referenceStyleOptions = [
  {
    value: "hollywood-sci-fi",
    label: "好莱坞科幻",
    description: "电影规模、真实质感与未来奇观",
  },
  {
    value: "eastern-aesthetic",
    label: "东方美学",
    description: "意境、留白与东方视觉秩序",
  },
  {
    value: "realism",
    label: "现实主义",
    description: "真实环境、自然表演与生活细节",
  },
  {
    value: "animation-film",
    label: "动画电影",
    description: "风格化世界、形体语言与色彩叙事",
  },
  {
    value: "film-noir",
    label: "黑色电影",
    description: "高反差光影、阴影空间与道德困境",
  },
  {
    value: "custom",
    label: "自定义参考",
    description: "用一句自然语言描述你的参考方向",
  },
] as const satisfies readonly SelectorOption<ReferenceStyleOption>[];

const initialInput: DirectorInputState = {
  storyIntent: "",
  audience: "general",
  tone: "restrained",
  referenceStyle: "hollywood-sci-fi",
  customReference: "",
};

const exampleCreativeSummary =
  "一位在永夜未来城醒来的仿生人，通过创造者留下的影像寻找自己的来处，也重新理解人与 AI 之间的连接。";

const emptyAnalysisCopy =
  "补充至少 20 个字符的导演意图后，这里会检查故事、受众、情绪和参考风格是否完整。";

function optionLabel<T extends string>(
  options: readonly SelectorOption<T>[],
  value: T | null,
) {
  return options.find((option) => option.value === value)?.label ?? "未选择";
}

function isPlanReady(input: DirectorInputState) {
  return (
    input.storyIntent.trim().length >= 20 &&
    Boolean(input.audience) &&
    Boolean(input.tone) &&
    Boolean(input.referenceStyle) &&
    (input.referenceStyle !== "custom" || Boolean(input.customReference.trim()))
  );
}

function buildAnalysis(
  input: DirectorInputState,
  status: DirectorAnalysisState["status"],
): DirectorAnalysisState {
  const hasIntent = Boolean(input.storyIntent.trim());
  const audience = optionLabel(audienceOptions, input.audience);
  const tone = optionLabel(toneOptions, input.tone);
  const reference = optionLabel(referenceStyleOptions, input.referenceStyle);

  return {
    status,
    storyAnalysis: hasIntent
      ? input.storyIntent.trim()
      : emptyAnalysisCopy,
    themeAnalysis: hasIntent
      ? `当前情绪选择：${tone}。主题命题仍需在后续生成或人工编辑中明确。`
      : "主题命题尚未填写。",
    characterDirection: hasIntent
      ? `目标观众：${audience}。人物目标、关系和表演方式尚未填写。`
      : "人物目标、关系和表演方式尚未填写。",
    visualLanguage: hasIntent
      ? `当前参考风格：${reference}。色彩、构图、光线与镜头规则尚未生成。`
      : "画面色彩、构图、光线与镜头规则尚未填写。",
    productionStrategy: hasIntent
      ? "当前仅完成本地导演输入检查；项目保存、制作排期和生产任务均未创建。"
      : "制作顺序将在项目和导演方案接入权威保存能力后确定。",
    visualAssetUrl: "/assets/ai-director/analysis/director-analysis.webp",
  };
}

function buildPlan(
  input: DirectorInputState,
  analysis: DirectorAnalysisState,
  confirmed: boolean,
): DirectorPlanPreview {
  const ready = isPlanReady(input) && analysis.status === "ready";
  const audience = optionLabel(audienceOptions, input.audience);
  const tone = optionLabel(toneOptions, input.tone);
  const reference = optionLabel(referenceStyleOptions, input.referenceStyle);

  return {
    status: confirmed
      ? "confirmed-preview"
      : ready
        ? "ready-preview"
        : "draft-preview",
    concept: input.storyIntent.trim() || "等待完整导演意图。",
    structure: [
      "故事起点与人物目标：尚待确认",
      "核心冲突与关键转折：尚待确认",
      "结局选择与情绪落点：尚待确认",
    ],
    characterDirection: `目标观众：${audience}。角色目标、缺口、关系和变化弧尚待确认。`,
    visualDirection: `情绪：${tone}；参考风格：${reference}。具体视觉规则尚待确认。`,
    productionRoadmap: [
      "确认导演简报并建立可信项目身份",
      "补全角色、世界与视觉规则",
      "完成剧本、分镜和生产计划后再进入渲染",
    ],
  };
}

function statusLabelForAnalysis(status: DirectorAnalysisState["status"]) {
  if (status === "editing") return "正在检查当前输入";
  if (status === "ready") return "输入完整性检查通过";
  if (status === "error") return "导演意图不足 20 个字符";
  return "等待导演意图";
}

export type DirectorPageIntroProps = {
  eyebrow: "AI DIRECTOR STUDIO";
  title: string;
  subtitle: string;
};

export function DirectorPageIntro({
  eyebrow,
  title,
  subtitle,
}: DirectorPageIntroProps) {
  return (
    <section className={styles.pageIntro} aria-labelledby="director-page-title">
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 id="director-page-title">{title}</h1>
      <p className={styles.introSubtitle}>{subtitle}</p>
    </section>
  );
}

export type DirectorContextBarProps = {
  context: DirectorContext;
};

export function DirectorContextBar({ context }: DirectorContextBarProps) {
  const badgeTone =
    context.statusLabel === "本地预览已确认"
      ? "primary"
      : context.statusLabel === "等待输入"
        ? "neutral"
        : "ai";

  return (
    <ACSCard className={styles.contextBar} padding="compact">
      <div className={styles.contextContent}>
        <div className={styles.contextIdentity}>
          <strong>{context.projectTitle}</strong>
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

export type StoryIntentInputProps = {
  value: string;
  onChange: (value: string) => void;
  helpTextId: string;
  errorTextId?: string;
  errorText?: string;
  disabled?: boolean;
};

export function StoryIntentInput({
  value,
  onChange,
  helpTextId,
  errorTextId,
  errorText,
  disabled = false,
}: StoryIntentInputProps) {
  const describedBy = [helpTextId, errorText ? errorTextId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.storyIntentField}>
      <div className={styles.fieldHeading}>
        <label htmlFor="director-story-intent">你希望观众感受到什么？</label>
        <span>{value.length} / 600</span>
      </div>
      <textarea
        aria-describedby={describedBy}
        aria-invalid={Boolean(errorText) || undefined}
        disabled={disabled}
        id="director-story-intent"
        maxLength={600}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：在冷峻的未来城市中，让观众感受到孤独、希望，以及人与 AI 建立连接的可能。"
        value={value}
      />
      <div className={styles.inputMeta}>
        <p id={helpTextId}>至少 20 个字符，用自然语言描述情绪、人物与故事期待。</p>
        {errorText && errorTextId && (
          <p className={styles.fieldError} id={errorTextId}>{errorText}</p>
        )}
      </div>
      <div className={styles.inputActions}>
        <ACSButton
          disabled={disabled}
          onClick={() =>
            onChange(
              "在冷峻的未来城市中，让观众感受到孤独、希望，以及人与 AI 建立连接的可能。",
            )
          }
          size="small"
          variant="ghost"
        >
          使用示例
        </ACSButton>
        <ACSButton
          disabled={disabled}
          onClick={() => onChange(exampleCreativeSummary)}
          size="small"
          variant="ghost"
        >
          使用示例摘要
        </ACSButton>
        <ACSButton
          disabled={disabled || !value}
          onClick={() => onChange("")}
          size="small"
          variant="ghost"
        >
          清空
        </ACSButton>
      </div>
    </div>
  );
}

export type DirectorSelectorProps<T extends string> = {
  groupLabelId: string;
  value: T | null;
  options: readonly SelectorOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function DirectorSelector<T extends string>({
  groupLabelId,
  value,
  options,
  onChange,
  disabled = false,
}: DirectorSelectorProps<T>) {
  const firstEnabledIndex = Math.max(
    0,
    options.findIndex((option) => !option.disabled),
  );
  const selectedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled,
  );
  const [rovingIndex, setRovingIndex] = useState(
    selectedIndex >= 0 ? selectedIndex : firstEnabledIndex,
  );
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIndices = options.reduce<number[]>((indices, option, index) => {
    if (!option.disabled) indices.push(index);
    return indices;
  }, []);

  function focusIndex(nextIndex: number) {
    if (disabled || enabledIndices.length === 0) return;
    setRovingIndex(nextIndex);
    refs.current[nextIndex]?.focus();
  }

  function moveFocus(index: number, direction: -1 | 1) {
    const currentPosition = enabledIndices.indexOf(index);
    const fallbackPosition = 0;
    const position = currentPosition >= 0 ? currentPosition : fallbackPosition;
    const nextPosition =
      (position + direction + enabledIndices.length) % enabledIndices.length;
    focusIndex(enabledIndices[nextPosition]);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    option: SelectorOption<T>,
  ) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(index, 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(index, -1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusIndex(enabledIndices[0]);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusIndex(enabledIndices[enabledIndices.length - 1]);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(option.value);
      setRovingIndex(index);
    }
  }

  return (
    <div
      aria-labelledby={groupLabelId}
      className={styles.selectorGrid}
      role="group"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const optionDisabled = disabled || option.disabled;

        return (
          <ACSCard
            className={styles.selectorCard}
            interactive={!optionDisabled}
            key={option.value}
            padding="compact"
            tone={selected ? "selected" : "default"}
          >
            <button
              aria-pressed={selected}
              className={styles.selectorButton}
              disabled={optionDisabled}
              onClick={() => {
                onChange(option.value);
                setRovingIndex(index);
              }}
              onFocus={() => setRovingIndex(index)}
              onKeyDown={(event) => handleKeyDown(event, index, option)}
              ref={(node) => {
                refs.current[index] = node;
              }}
              tabIndex={optionDisabled ? -1 : rovingIndex === index ? 0 : -1}
              type="button"
            >
              <span className={styles.selectorCopy}>
                <strong>{option.label}</strong>
                {option.description && <small>{option.description}</small>}
              </span>
              <span className={styles.selectionIndicator} aria-hidden="true">
                {selected ? "✓" : ""}
              </span>
            </button>
          </ACSCard>
        );
      })}
    </div>
  );
}

function SelectorSection<T extends string>({
  description,
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  description: string;
  disabled?: boolean;
  label: string;
  onChange: (value: T) => void;
  options: readonly SelectorOption<T>[];
  value: T | null;
}) {
  const generatedId = useId();
  const labelId = `director-selector-${generatedId.replaceAll(":", "")}`;

  return (
    <section className={styles.selectorSection}>
      <div className={styles.selectorHeading}>
        <h3 id={labelId}>{label}</h3>
        <p>{description}</p>
      </div>
      <DirectorSelector
        disabled={disabled}
        groupLabelId={labelId}
        onChange={onChange}
        options={options}
        value={value}
      />
    </section>
  );
}

export function AudienceSelector({
  value,
  options,
  onChange,
  disabled,
}: Omit<DirectorSelectorProps<AudienceOption>, "groupLabelId">) {
  return (
    <SelectorSection
      description="选择这部影片最希望与谁建立连接。"
      disabled={disabled}
      label="目标观众"
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}

export function ToneSelector({
  value,
  options,
  onChange,
  disabled,
}: Omit<DirectorSelectorProps<ToneOption>, "groupLabelId">) {
  return (
    <SelectorSection
      description="确定观众离开这个故事时保留的情绪。"
      disabled={disabled}
      label="情绪基调"
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}

export function ReferenceStyleSelector({
  value,
  options,
  onChange,
  disabled,
}: Omit<DirectorSelectorProps<ReferenceStyleOption>, "groupLabelId">) {
  return (
    <SelectorSection
      description="选择最接近你想象的电影语言。"
      disabled={disabled}
      label="参考风格"
      onChange={onChange}
      options={options}
      value={value}
    />
  );
}

export type CreativeDirectionCanvasProps = {
  value: DirectorInputState;
  audienceOptions: readonly SelectorOption<AudienceOption>[];
  toneOptions: readonly SelectorOption<ToneOption>[];
  referenceStyleOptions: readonly SelectorOption<ReferenceStyleOption>[];
  onChange: (payload: DirectorInputChangePayload) => void;
  disabled?: boolean;
};

export function CreativeDirectionCanvas({
  value,
  audienceOptions: audienceChoices,
  toneOptions: toneChoices,
  referenceStyleOptions: referenceChoices,
  onChange,
  disabled = false,
}: CreativeDirectionCanvasProps) {
  const intentError =
    value.storyIntent.length > 0 && value.storyIntent.trim().length < 20
      ? "再补充一些故事与情绪信息，至少需要 20 个字符。"
      : undefined;

  return (
    <ACSCard
      className={styles.directionCanvas}
      description="先明确观众应当感受到什么，再检查导演输入是否完整。"
      padding="spacious"
      title="创作方向"
    >
      <form className={styles.directionForm} onSubmit={(event) => event.preventDefault()}>
        <StoryIntentInput
          disabled={disabled}
          errorText={intentError}
          errorTextId="director-story-intent-error"
          helpTextId="director-story-intent-help"
          onChange={(storyIntent) => onChange({ field: "storyIntent", value: storyIntent })}
          value={value.storyIntent}
        />
        <AudienceSelector
          disabled={disabled}
          onChange={(audience) => onChange({ field: "audience", value: audience })}
          options={audienceChoices}
          value={value.audience}
        />
        <ToneSelector
          disabled={disabled}
          onChange={(tone) => onChange({ field: "tone", value: tone })}
          options={toneChoices}
          value={value.tone}
        />
        <ReferenceStyleSelector
          disabled={disabled}
          onChange={(referenceStyle) =>
            onChange({ field: "referenceStyle", value: referenceStyle })
          }
          options={referenceChoices}
          value={value.referenceStyle}
        />
        {value.referenceStyle === "custom" && (
          <div className={styles.customReferenceField}>
            <label htmlFor="director-custom-reference">自定义参考方向</label>
            <input
              aria-describedby="director-custom-reference-help"
              disabled={disabled}
              id="director-custom-reference"
              onChange={(event) =>
                onChange({ field: "customReference", value: event.target.value })
              }
              placeholder="例如：自然主义表演与东方留白相结合"
              type="text"
              value={value.customReference}
            />
            <p id="director-custom-reference-help">
              用一句创作语言描述方向，不需要技术参数或提示词。
            </p>
          </div>
        )}
      </form>
    </ACSCard>
  );
}

export type DirectorRoomVisualProps = {
  src: string;
  alt: string;
  theme: "light" | "dark";
  priority?: boolean;
  sizes: string;
};

export function DirectorRoomVisual({
  src,
  alt,
  theme,
  priority = false,
  sizes,
}: DirectorRoomVisualProps) {
  return (
    <figure className={styles.directorRoomVisual} data-theme-asset={theme}>
      <Image
        alt={alt}
        className={styles.directorRoomImage}
        fill
        preload={priority}
        sizes={sizes}
        src={src}
      />
    </figure>
  );
}

export type DirectorAnalysisCardKind =
  | "story"
  | "theme"
  | "character"
  | "visual"
  | "production";

export type DirectorAnalysisCardProps = {
  kind: DirectorAnalysisCardKind;
  title: string;
  content: string;
  status: "empty" | "ready" | "error";
};

function DirectorAnalysisCard({
  kind,
  title,
  content,
  status,
}: DirectorAnalysisCardProps) {
  const sequence = {
    story: "01",
    theme: "02",
    character: "03",
    visual: "04",
    production: "05",
  }[kind];

  return (
    <ACSCard
      className={styles.analysisCard}
      data-analysis-kind={kind}
      padding="default"
      tone={status === "ready" ? "default" : "raised"}
    >
      <div className={styles.analysisCardHeading}>
        <span aria-hidden="true">{sequence}</span>
        <h3>{title}</h3>
      </div>
      <p>{content}</p>
    </ACSCard>
  );
}

type NamedAnalysisCardProps = {
  content: string;
  status: DirectorAnalysisCardProps["status"];
};

export function StoryAnalysisCard(props: NamedAnalysisCardProps) {
  return <DirectorAnalysisCard kind="story" title="故事分析" {...props} />;
}

export function ThemeAnalysisCard(props: NamedAnalysisCardProps) {
  return <DirectorAnalysisCard kind="theme" title="主题分析" {...props} />;
}

export function CharacterDirectionCard(props: NamedAnalysisCardProps) {
  return <DirectorAnalysisCard kind="character" title="角色方向" {...props} />;
}

export function VisualLanguageCard(props: NamedAnalysisCardProps) {
  return <DirectorAnalysisCard kind="visual" title="视觉语言" {...props} />;
}

export function ProductionStrategyCard(props: NamedAnalysisCardProps) {
  return <DirectorAnalysisCard kind="production" title="制作策略" {...props} />;
}

export type AIDirectorAnalysisPanelProps = {
  analysis: DirectorAnalysisState;
  theme: "light" | "dark";
  onReanalyze: () => void;
};

export function AIDirectorAnalysisPanel({
  analysis,
  theme,
  onReanalyze,
}: AIDirectorAnalysisPanelProps) {
  const heroSrc = `/assets/ai-director/hero/director-room-${theme}.webp`;
  const heroAlt =
    theme === "dark"
      ? "深色电影导演工作空间中展示分镜规划、电影监视器和摄影设备的 AI 影视制作场景"
      : "明亮现代的 AI 电影导演工作室中展示摄影机、分镜规划屏幕和创作桌面";
  const statusLabel = statusLabelForAnalysis(analysis.status);
  const cardStatus =
    analysis.status === "error"
      ? "error"
      : analysis.status === "ready"
        ? "ready"
        : "empty";

  return (
    <section className={styles.analysisPanel} aria-label="导演输入检查">
      <div className={styles.directorVisualStage}>
        <DirectorRoomVisual
          alt={heroAlt}
          priority
          sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 48px), (max-width: 1439px) 50vw, 55vw"
          src={heroSrc}
          theme={theme}
        />
        <div className={styles.visualOverlay}>
          <div>
            <span className={styles.visualLabel}>DIRECTOR INPUT CHECK</span>
            <p>
              {analysis.status === "ready"
                ? "当前输入已通过页面内完整性检查；未调用生成服务。"
                : emptyAnalysisCopy}
            </p>
          </div>
          <ACSBadge dot tone={analysis.status === "ready" ? "ai" : "neutral"}>
            {statusLabel}
          </ACSBadge>
        </div>
      </div>

      <AIAssistantPanel
        className={styles.assistantPanel}
        description="结构化回显已填写内容，并明确仍缺失的导演决策。"
        status="页面本地检查"
        title="导演输入检查"
        actions={
          <ACSButton
            disabled={analysis.status === "editing" || analysis.status === "empty"}
            onClick={onReanalyze}
            size="small"
            variant="ghost"
          >
            重新检查输入
          </ACSButton>
        }
      >
        <div className={styles.assistantSummary}>
          <div className={styles.assistantSummaryCopy}>
            <span>DIRECTOR&apos;S NOTE</span>
            <p>
              {analysis.status === "ready"
                ? analysis.storyAnalysis
                : emptyAnalysisCopy}
            </p>
          </div>
          <figure className={styles.analysisSupportingVisual}>
            <Image
              alt="导演简报结构、角色方向、色彩和镜头语言的静态规划示意图"
              fill
              loading="eager"
              sizes="(max-width: 1023px) calc(100vw - 96px), (max-width: 1439px) 24vw, 300px"
              src={analysis.visualAssetUrl}
            />
          </figure>
        </div>
        {analysis.status === "editing" ? (
          <AIThinkingState
            compact
            detail="正在重新检查故事意图、观众、情绪和参考风格。"
            label="正在检查当前输入"
          />
        ) : (
          <p className={styles.analysisStatus} aria-live="polite">
            {statusLabel}
          </p>
        )}
      </AIAssistantPanel>

      <div className={styles.analysisCardGrid}>
        <StoryAnalysisCard content={analysis.storyAnalysis} status={cardStatus} />
        <ThemeAnalysisCard content={analysis.themeAnalysis} status={cardStatus} />
        <CharacterDirectionCard content={analysis.characterDirection} status={cardStatus} />
        <VisualLanguageCard content={analysis.visualLanguage} status={cardStatus} />
        <ProductionStrategyCard content={analysis.productionStrategy} status={cardStatus} />
      </div>
    </section>
  );
}

export type DirectorPlanCardProps = {
  plan: DirectorPlanPreview;
  previewBadgeLabel: "本地预览";
};

function PlanSection({
  eyebrow,
  title,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={styles.planSection} data-wide={wide || undefined}>
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function DirectorPlanCard({
  plan,
  previewBadgeLabel,
}: DirectorPlanCardProps) {
  const stateLabel =
    plan.status === "confirmed-preview"
      ? "本地预览已确认"
      : plan.status === "ready-preview"
        ? "等待你的确认"
        : "继续完善导演意图";

  return (
    <ACSCard
      className={styles.directorPlanCard}
      description="把当前输入收束为一份可阅读、可继续补充的本地方案摘要。"
      headerAction={<ACSBadge tone="neutral">{previewBadgeLabel}</ACSBadge>}
      padding="spacious"
      title="导演方案"
    >
      <div className={styles.planStateRow}>
        <span aria-hidden="true" className={styles.planStateMark} />
        <p>{stateLabel}</p>
      </div>
      <div className={styles.planGrid}>
        <PlanSection eyebrow="FILM CONCEPT" title="影片概念" wide>
          <p>{plan.concept}</p>
        </PlanSection>
        <PlanSection eyebrow="STORY STRUCTURE" title="故事结构">
          <ol className={styles.planList}>
            {plan.structure.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </PlanSection>
        <PlanSection eyebrow="CHARACTER DIRECTION" title="角色方向">
          <p>{plan.characterDirection}</p>
        </PlanSection>
        <PlanSection eyebrow="VISUAL DIRECTION" title="视觉方向">
          <p>{plan.visualDirection}</p>
        </PlanSection>
        <PlanSection eyebrow="PRODUCTION ROADMAP" title="制作路线">
          <ol className={styles.roadmapList}>
            {plan.productionRoadmap.map((item, index) => (
              <li key={item}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {item}
              </li>
            ))}
          </ol>
        </PlanSection>
      </div>
    </ACSCard>
  );
}

export type ConfirmDirectorButtonProps = {
  disabled: boolean;
  loading: boolean;
  onConfirm: () => void;
};

export function ConfirmDirectorButton({
  disabled,
  loading,
  onConfirm,
}: ConfirmDirectorButtonProps) {
  return (
    <ACSButton
      aria-busy={loading}
      className={styles.confirmButton}
      disabled={disabled || loading}
      loading={loading}
      onClick={onConfirm}
      size="large"
      trailingIcon={<span aria-hidden="true">→</span>}
      variant="primary"
    >
      确认本地导演方案
    </ACSButton>
  );
}

export type DirectorWorkspaceProps = {
  context: DirectorContext;
  input: DirectorInputState;
  analysis: DirectorAnalysisState;
  plan: DirectorPlanPreview;
  onInputChange: (payload: DirectorInputChangePayload) => void;
  onReanalyze: () => void;
  onConfirmPlan: () => void;
};

export function DirectorWorkspace({
  context,
  input,
  analysis,
  plan,
  onInputChange,
  onReanalyze,
  onConfirmPlan,
}: DirectorWorkspaceProps) {
  const { theme } = useACSTheme();
  const confirmDisabled = plan.status === "draft-preview" || analysis.status === "editing";

  return (
    <>
      <section
        aria-label={`${context.projectTitle}导演工作区`}
        className={styles.workspaceGrid}
      >
        <CreativeDirectionCanvas
          audienceOptions={audienceOptions}
          onChange={onInputChange}
          referenceStyleOptions={referenceStyleOptions}
          toneOptions={toneOptions}
          value={input}
        />
        <AIDirectorAnalysisPanel
          analysis={analysis}
          onReanalyze={onReanalyze}
          theme={theme}
        />
      </section>
      <DirectorPlanCard plan={plan} previewBadgeLabel="本地预览" />
      <section className={styles.ctaRegion} aria-label="确认本地导演方案">
        <ConfirmDirectorButton
          disabled={confirmDisabled}
          loading={false}
          onConfirm={onConfirmPlan}
        />
        <p id="director-confirm-boundary">
          {plan.status === "confirmed-preview"
            ? "本地方案已确认，但尚未保存为正式项目。"
            : confirmDisabled
              ? "完成导演意图与方向选择后，即可确认本地导演方案预览。"
              : "确认只更新当前页面状态，不会调用生成服务或创建正式项目。"}
        </p>
      </section>
    </>
  );
}

function updateInput(
  current: DirectorInputState,
  payload: DirectorInputChangePayload,
): DirectorInputState {
  switch (payload.field) {
    case "storyIntent":
      return { ...current, storyIntent: payload.value };
    case "audience":
      return { ...current, audience: payload.value };
    case "tone":
      return { ...current, tone: payload.value };
    case "referenceStyle":
      return {
        ...current,
        referenceStyle: payload.value,
        customReference: payload.value === "custom" ? current.customReference : "",
      };
    case "customReference":
      return { ...current, customReference: payload.value };
  }
}

export function AIDirectorPage() {
  const [input, setInput] = useState<DirectorInputState>(initialInput);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [nextStepOpen, setNextStepOpen] = useState(false);
  const analysisTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (analysisTimer.current !== null) window.clearTimeout(analysisTimer.current);
    };
  }, []);

  const queueLocalAnalysis = useCallback(() => {
    if (analysisTimer.current !== null) window.clearTimeout(analysisTimer.current);
    setAnalysisPending(true);
    analysisTimer.current = window.setTimeout(() => {
      setAnalysisPending(false);
      analysisTimer.current = null;
    }, 380);
  }, []);

  const handleInputChange = useCallback(
    (payload: DirectorInputChangePayload) => {
      setInput((current) => updateInput(current, payload));
      setConfirmed(false);
      queueLocalAnalysis();
    },
    [queueLocalAnalysis],
  );

  const hasIntent = Boolean(input.storyIntent.trim());
  const analysisStatus: DirectorAnalysisState["status"] = !hasIntent
    ? "empty"
    : input.storyIntent.trim().length < 20
      ? "error"
      : analysisPending
        ? "editing"
        : "ready";
  const analysis = useMemo(
    () => buildAnalysis(input, analysisStatus),
    [analysisStatus, input],
  );
  const plan = useMemo(
    () => buildPlan(input, analysis, confirmed),
    [analysis, confirmed, input],
  );

  const pageState: AIDirectorPageState = confirmed
    ? "confirmed-preview"
    : analysisStatus === "error"
      ? "local-error"
      : analysisPending
        ? "editing"
        : plan.status === "ready-preview"
          ? "plan-ready"
          : hasIntent
            ? "analysis-ready"
            : "empty";

  const context: DirectorContext = {
    projectTitle: "未命名本地方案",
    projectTypeLabel: "未保存项目",
    stageLabel: "导演方案",
    statusLabel: confirmed
      ? "本地预览已确认"
      : analysisPending
        ? "分析预览中"
        : plan.status === "ready-preview"
          ? "输入检查已通过"
          : "等待输入",
  };

  return (
    <CustomerLayout
      className={styles.directorLayout}
      contained={false}
      data-page-state={pageState}
    >
      <div className={styles.page}>
        <DirectorContextBar context={context} />
        <DirectorPageIntro
          eyebrow="AI DIRECTOR STUDIO"
          subtitle="明确故事意图、目标观众、情绪和参考风格；当前页面只完成本地输入检查与方案预览。"
          title="建立可执行的导演简报"
        />
        <DirectorWorkspace
          analysis={analysis}
          context={context}
          input={input}
          onConfirmPlan={() => {
            if (plan.status !== "ready-preview") return;
            setConfirmed(true);
            setNextStepOpen(true);
          }}
          onInputChange={handleInputChange}
          onReanalyze={() => {
            setConfirmed(false);
            queueLocalAnalysis();
          }}
          plan={plan}
        />
      </div>

      <ACSModal
        description="本地导演方案预览"
        footer={
          <ACSButton fullWidth onClick={() => setNextStepOpen(false)} variant="primary">
            继续完善导演方案
          </ACSButton>
        }
        onClose={() => setNextStepOpen(false)}
        open={nextStepOpen}
        title="导演方案预览已确认"
      >
        <div className={styles.nextStepContent}>
          <ACSBadge tone="primary">本地预览已确认</ACSBadge>
          <h3>下一站 · 故事世界 / IP Bible</h3>
          <p>
            故事世界工作区已经可用，但当前导演方案没有可信项目身份，不能自动带入下一页面。
          </p>
          <p className={styles.boundaryNote}>
            此确认不会创建正式项目、保存制作数据或生成作品身份。
          </p>
        </div>
      </ACSModal>
    </CustomerLayout>
  );
}
