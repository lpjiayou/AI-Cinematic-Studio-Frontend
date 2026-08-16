"use client";

import Image from "next/image";
import Link from "next/link";
import {
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
  AIAssistantPanel,
} from "@/components";
import { CustomerLayout } from "@/layouts";
import { useACSTheme } from "@/theme";
import styles from "./create-project.module.css";

type SelectorOption = {
  value: string;
  label: string;
  description: string;
  image?: string;
  alt?: string;
};

type SelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

const minimumIdeaLength = 20;

const projectTypeOptions = [
  {
    value: "drama",
    label: "剧情短片",
    description: "以人物关系与情绪推进故事",
    image: "/assets/create-project/drama.webp",
    alt: "暖色电影光线下人物表达情绪的短片场景",
  },
  {
    value: "sci-fi",
    label: "科幻影片",
    description: "构建未来世界与想象空间",
    image: "/assets/create-project/sci-fi.webp",
    alt: "未来城市或航天空间中的科幻电影场景",
  },
  {
    value: "commercial",
    label: "品牌影片",
    description: "用电影语言表达品牌价值",
    image: "/assets/create-project/commercial.webp",
    alt: "专业影棚灯光下的高端品牌影片拍摄场景",
  },
  {
    value: "animation",
    label: "动画短片",
    description: "让风格化世界承载创意",
    image: "/assets/create-project/animation.webp",
    alt: "色彩丰富且具有电影构图的动画世界场景",
  },
  {
    value: "documentary",
    label: "纪实影像",
    description: "从真实环境中提炼叙事",
    image: "/assets/create-project/documentary.webp",
    alt: "真实环境中记录人物活动的电影感纪录片画面",
  },
  {
    value: "series",
    label: "连续短剧",
    description: "为连续观看设计人物与悬念",
    image: "/assets/create-project/series.webp",
    alt: "多位主要角色构成的连续短剧电影场景",
  },
] as const satisfies ReadonlyArray<SelectorOption>;

const platformOptions = [
  { value: "streaming", label: "流媒体", description: "适合连续、沉浸式观看" },
  { value: "social", label: "社交媒体", description: "快速建立情绪与记忆点" },
  { value: "cinema", label: "大银幕", description: "强调空间、表演与视听规模" },
  { value: "brand", label: "品牌发布", description: "聚焦清晰表达与高级质感" },
] as const satisfies ReadonlyArray<SelectorOption>;

const visualStyleOptions = [
  { value: "cinematic", label: "电影写实", description: "自然光影与真实质感" },
  { value: "future", label: "未来科幻", description: "冷暖对比与未来建筑" },
  { value: "oriental", label: "东方幻想", description: "东方意境与奇观空间" },
  { value: "humanist", label: "温暖人文", description: "克制镜头与细腻情绪" },
] as const satisfies ReadonlyArray<SelectorOption>;

function getOption(
  options: ReadonlyArray<SelectorOption>,
  value: string,
) {
  return options.find((option) => option.value === value) ?? options[0];
}

type SelectionGroupProps = {
  description: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<SelectorOption>;
  value: string;
  visual?: boolean;
};

function SelectionGroup({
  description,
  id,
  label,
  onChange,
  options,
  value,
  visual = false,
}: SelectionGroupProps) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const descriptionId = `${id}-description`;

  function focusOption(index: number) {
    const nextIndex = (index + options.length) % options.length;
    setActiveIndex(nextIndex);
    optionRefs.current[nextIndex]?.focus();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    optionValue: string,
  ) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(index - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange(optionValue);
      setActiveIndex(index);
    }
  }

  return (
    <fieldset className={styles.selectorFieldset} aria-describedby={descriptionId}>
      <legend>{label}</legend>
      <p id={descriptionId}>{description}</p>
      <div className={styles.selectorGrid} data-visual={visual || undefined}>
        {options.map((option, index) => {
          const selected = option.value === value;

          return (
            <ACSCard
              className={styles.selectorCard}
              interactive
              key={option.value}
              padding="compact"
              tone={selected ? "selected" : "default"}
            >
              <button
                aria-pressed={selected}
                className={styles.selectorButton}
                onClick={() => {
                  onChange(option.value);
                  setActiveIndex(index);
                }}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleKeyDown(event, index, option.value)}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                tabIndex={activeIndex === index ? 0 : -1}
                type="button"
              >
                {option.image && (
                  <span className={styles.optionVisual}>
                    <Image
                      alt={option.alt ?? ""}
                      fill
                      loading={index < 3 ? "eager" : "lazy"}
                      sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1439px) 220px, 240px"
                      src={option.image}
                    />
                    <span className={styles.selectedIndicator} aria-hidden="true">
                      {selected ? "已选" : ""}
                    </span>
                  </span>
                )}
                <span className={styles.optionCopy}>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </button>
            </ACSCard>
          );
        })}
      </div>
    </fieldset>
  );
}

export function CreativeIdeaInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.ideaField}>
      <div className={styles.fieldHeading}>
        <label htmlFor="creative-idea">你的创意</label>
        <span>{value.length} / 500</span>
      </div>
      <textarea
        aria-describedby="creative-idea-description"
        aria-invalid={Boolean(value.trim()) && value.trim().length < minimumIdeaLength}
        id="creative-idea"
        maxLength={500}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：在永夜未来城，一位失去记忆的仿生人开始寻找创造者留下的最后一段影像……"
        value={value}
      />
      <p id="creative-idea-description">
        至少输入 {minimumIdeaLength} 个字符，说明人物、世界、目标或关键画面。当前内容仅保留在页面状态中。
      </p>
    </div>
  );
}

export function ProjectTypeSelector({ value, onChange }: SelectorProps) {
  return (
    <SelectionGroup
      description="选择最接近你创作目标的影片形态。"
      id="project-type"
      label="项目类型"
      onChange={onChange}
      options={projectTypeOptions}
      value={value}
      visual
    />
  );
}

export function PlatformSelector({ value, onChange }: SelectorProps) {
  return (
    <SelectionGroup
      description="明确观众最先遇见这部作品的场景。"
      id="platform"
      label="首发平台"
      onChange={onChange}
      options={platformOptions}
      value={value}
    />
  );
}

export function VisualStyleSelector({ value, onChange }: SelectorProps) {
  return (
    <SelectionGroup
      description="选择一条视觉基调，之后仍可继续调整。"
      id="visual-style"
      label="视觉风格"
      onChange={onChange}
      options={visualStyleOptions}
      value={value}
    />
  );
}

export function CreativeBriefCanvas({
  idea,
  onIdeaChange,
  projectType,
  onProjectTypeChange,
  platform,
  onPlatformChange,
  visualStyle,
  onVisualStyleChange,
}: {
  idea: string;
  onIdeaChange: (value: string) => void;
  projectType: string;
  onProjectTypeChange: (value: string) => void;
  platform: string;
  onPlatformChange: (value: string) => void;
  visualStyle: string;
  onVisualStyleChange: (value: string) => void;
}) {
  return (
    <ACSCard
      className={styles.briefCanvas}
      description="先捕捉创作意图，再检查影片形态、首发场景与视觉基调是否完整。"
      padding="spacious"
      title="创意简报"
    >
      <div className={styles.briefContent}>
        <CreativeIdeaInput onChange={onIdeaChange} value={idea} />
        <ProjectTypeSelector onChange={onProjectTypeChange} value={projectType} />
        <PlatformSelector onChange={onPlatformChange} value={platform} />
        <VisualStyleSelector onChange={onVisualStyleChange} value={visualStyle} />
      </div>
    </ACSCard>
  );
}

const previewAlts = {
  dark: "未来城市夜景中一个智能角色站在电影感街道上的科幻画面",
  light: "明亮专业的AI影视创作工作室中摆放摄影机与视觉设计屏幕",
} as const;

export function PreviewVisual() {
  const { theme } = useACSTheme();
  const source = `/assets/create-project/hero/create-${theme}.webp`;

  return (
    <figure className={styles.previewVisual}>
      <Image
        alt={previewAlts[theme]}
        className={styles.previewImage}
        fill
        fetchPriority="high"
        loading="eager"
        sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1023px) calc(100vw - 80px), (max-width: 1439px) 45vw, 520px"
        src={source}
      />
      <div className={styles.previewScrim} aria-hidden="true" />
      <figcaption className={styles.previewCaption}>
        <ACSBadge tone="neutral">视觉基调示意</ACSBadge>
        <span>静态参考图 · 非生成结果</span>
      </figcaption>
    </figure>
  );
}

function DirectionCard({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <ACSCard className={styles.directionCard} padding="compact">
      <div className={styles.directionHeading}>
        <span aria-hidden="true">{index}</span>
        <h3>{title}</h3>
      </div>
      <p>{children}</p>
    </ACSCard>
  );
}

export function StoryDirectionCard({ idea }: { idea: string }) {
  return (
    <DirectionCard index="01" title="故事方向">
      {idea.trim()
        ? "已记录当前核心创意。故事冲突、结构与情绪曲线需要在导演方案阶段继续确认。"
        : "写下核心创意后，这里会确认输入是否足以进入导演方案阶段。"}
    </DirectionCard>
  );
}

export function CharacterDirectionCard({ projectType }: { projectType: string }) {
  const type = getOption(projectTypeOptions, projectType);

  return (
    <DirectionCard index="02" title="人物方向">
      当前影片形态为{type.label}。人物目标、关系和连续性规则尚未填写。
    </DirectionCard>
  );
}

export function VisualDirectionCard({ visualStyle }: { visualStyle: string }) {
  const style = getOption(visualStyleOptions, visualStyle);

  return (
    <DirectionCard index="03" title="视觉方向">
      当前选择“{style.label}”：{style.description}。这只是创作约束，不是已生成的视觉方案。
    </DirectionCard>
  );
}

export function ProductionSuggestionCard({ platform }: { platform: string }) {
  const platformOption = getOption(platformOptions, platform);

  return (
    <DirectionCard index="04" title="制作建议">
      首发场景选择为{platformOption.label}。时长、画幅和交付规格尚未连接。
    </DirectionCard>
  );
}

export function AIUnderstandingPanel({
  idea,
  platform,
  projectType,
  visualStyle,
  directorReady,
}: {
  idea: string;
  platform: string;
  projectType: string;
  visualStyle: string;
  directorReady: boolean;
}) {
  const ideaReady = idea.trim().length >= minimumIdeaLength;
  const status = directorReady
    ? "本地预览已确认"
    : ideaReady
      ? "输入条件已满足"
      : "等待完整创意";

  return (
    <AIAssistantPanel
      className={styles.understandingPanel}
      description="检查当前输入、选择和仍缺失的制作条件。"
      footer="这是页面内的结构化预览，未调用生成服务，也未保存为正式项目。"
      status={status}
      title="创意方向检查"
    >
      <PreviewVisual />
      <div className={styles.directionGrid}>
        <StoryDirectionCard idea={idea} />
        <CharacterDirectionCard projectType={projectType} />
        <VisualDirectionCard visualStyle={visualStyle} />
        <ProductionSuggestionCard platform={platform} />
      </div>
    </AIAssistantPanel>
  );
}

export function CreationSummaryCard({
  idea,
  platform,
  projectType,
  visualStyle,
  directorReady,
}: {
  idea: string;
  platform: string;
  projectType: string;
  visualStyle: string;
  directorReady: boolean;
}) {
  const project = getOption(projectTypeOptions, projectType);
  const target = getOption(platformOptions, platform);
  const style = getOption(visualStyleOptions, visualStyle);

  return (
    <ACSCard
      className={styles.summaryCard}
      description="确认这次本地创作预览的输入，后续仍可继续调整。"
      headerAction={
        <ACSBadge dot tone={directorReady ? "success" : "neutral"}>
          {directorReady ? "本地预览已确认" : "创作准备中"}
        </ACSBadge>
      }
      title="创作摘要"
    >
      <dl className={styles.summaryGrid}>
        <div>
          <dt>核心创意</dt>
          <dd>{idea.trim() || "等待你写下第一个画面"}</dd>
        </div>
        <div>
          <dt>影片形态</dt>
          <dd>{project.label}</dd>
        </div>
        <div>
          <dt>首发场景</dt>
          <dd>{target.label}</dd>
        </div>
        <div>
          <dt>视觉基调</dt>
          <dd>{style.label}</dd>
        </div>
      </dl>
    </ACSCard>
  );
}

export function CreateFilmButton({
  disabled,
  onCreate,
}: {
  disabled: boolean;
  onCreate: () => void;
}) {
  return (
    <ACSButton
      aria-describedby="create-film-boundary"
      className={styles.createButton}
      disabled={disabled}
      onClick={onCreate}
      size="large"
      variant="primary"
    >
      确认本地导演方案预览
    </ACSButton>
  );
}

export function CreateProjectPage() {
  const [idea, setIdea] = useState("");
  const [projectType, setProjectType] = useState("sci-fi");
  const [platform, setPlatform] = useState("streaming");
  const [visualStyle, setVisualStyle] = useState("future");
  const [directorReady, setDirectorReady] = useState(false);
  const ideaReady = idea.trim().length >= minimumIdeaLength;

  const presentationState = useMemo(() => {
    if (directorReady) return "本地导演方案预览已确认；它尚未保存为正式项目。";
    if (ideaReady) return "输入条件已满足，可以确认页面内的导演方案预览。";
    if (idea.trim()) return `还需至少 ${minimumIdeaLength - idea.trim().length} 个字符才能继续。`;
    return `写下至少 ${minimumIdeaLength} 个字符的核心创意后才能继续。`;
  }, [directorReady, idea, ideaReady]);

  return (
    <CustomerLayout className={styles.createLayout} contained={false}>
      <div className={styles.page}>
        <section className={styles.pageIntro} aria-labelledby="create-project-title">
          <div>
            <p className={styles.eyebrow}>CREATE WITH AI</p>
            <h1 id="create-project-title">让一个创意，成为一部电影</h1>
            <p>
              从故事的第一句话出发，明确人物、世界、发行场景与视觉方向。
            </p>
          </div>
          <ACSBadge tone="neutral">本地方案 · 未保存</ACSBadge>
        </section>

        <ol aria-label="本地创意方案流程" className={styles.workflowSteps}>
          {[
            ["01", "写下核心创意", idea.trim() ? "进行中" : "待开始"],
            ["02", "确认影片约束", "已预选"],
            ["03", "检查导演方向", ideaReady ? "可检查" : "等待创意"],
            ["04", "选择下一工作区", directorReady ? "可选择" : "等待确认"],
          ].map(([index, label, status]) => (
            <li data-ready={status === "可选择" || status === "可检查" || status === "已预选"} key={index}>
              <span>{index}</span>
              <strong>{label}</strong>
              <small>{status}</small>
            </li>
          ))}
        </ol>

        <section className={styles.workspaceGrid} aria-label="影片创意工作区">
          <CreativeBriefCanvas
            idea={idea}
            onIdeaChange={(value) => {
              setIdea(value);
              setDirectorReady(false);
            }}
            onPlatformChange={(value) => {
              setPlatform(value);
              setDirectorReady(false);
            }}
            onProjectTypeChange={(value) => {
              setProjectType(value);
              setDirectorReady(false);
            }}
            onVisualStyleChange={(value) => {
              setVisualStyle(value);
              setDirectorReady(false);
            }}
            platform={platform}
            projectType={projectType}
            visualStyle={visualStyle}
          />
          <AIUnderstandingPanel
            directorReady={directorReady}
            idea={idea}
            platform={platform}
            projectType={projectType}
            visualStyle={visualStyle}
          />
        </section>

        <section className={styles.decisionRegion} aria-label="创意方案确认区">
          <CreationSummaryCard
            directorReady={directorReady}
            idea={idea}
            platform={platform}
            projectType={projectType}
            visualStyle={visualStyle}
          />
          <ACSCard
            className={styles.readinessCard}
            description="这些条件只决定本地页面能否继续，不代表项目已经创建或保存。"
            title="进入下一步前检查"
          >
            <ul>
              <li data-ready={ideaReady}><strong>核心创意不少于 20 个字符</strong><span>{ideaReady ? "已满足" : "待补充"}</span></li>
              <li data-ready><strong>影片形态、平台和视觉基调</strong><span>已选择</span></li>
              <li data-ready={directorReady}><strong>本地导演方向预览</strong><span>{directorReady ? "已确认" : "待确认"}</span></li>
              <li><strong>权威项目身份与保存回执</strong><span>未连接</span></li>
            </ul>
          </ACSCard>
        </section>

        <section className={styles.ctaRegion} aria-label="确认本地导演方案预览">
          <CreateFilmButton
            disabled={!ideaReady}
            onCreate={() => {
              if (!ideaReady) return;
              setDirectorReady(true);
            }}
          />
          <p id="create-film-boundary" role="status">
            {presentationState}
          </p>
        </section>

        {directorReady ? (
          <section aria-labelledby="next-workspace-title" className={styles.nextWorkspace}>
            <div>
              <p className={styles.eyebrow}>NEXT WORKSPACE</p>
              <h2 id="next-workspace-title">选择下一步，不自动转移页面状态</h2>
              <p>
                当前方案仍只存在于本页。你可以进入 AI 导演继续组织导演简报，或返回项目中心选择一个明确标注的本地演示工作区。
              </p>
            </div>
            <div className={styles.nextActions}>
              <Link className={styles.primaryLink} href="/creator/ai-director">进入 AI 导演</Link>
              <Link className={styles.secondaryLink} href="/creator/projects">打开项目中心</Link>
            </div>
          </section>
        ) : null}
      </div>
    </CustomerLayout>
  );
}
