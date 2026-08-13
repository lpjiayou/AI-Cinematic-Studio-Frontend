"use client";

import Image from "next/image";
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

function BrandLockup() {
  return (
    <div className={styles.brandLockup} aria-label="镜构智能 AI Cinematic Studio">
      <Image
        alt=""
        className={styles.brandMark}
        height={40}
        src="/assets/acs/brand/jinggou-mark.webp"
        width={40}
      />
      <span className={styles.brandCopy}>
        <strong>镜构智能</strong>
        <span>AI Cinematic Studio</span>
      </span>
    </div>
  );
}

function CreateProjectHeader() {
  const { theme, toggleTheme } = useACSTheme();
  const nextThemeLabel = theme === "dark" ? "浅色" : "深色";

  return (
    <div className={styles.headerInner}>
      <BrandLockup />
      <div className={styles.headerContext}>
        <ACSBadge tone="primary">创意启动台</ACSBadge>
        <ACSButton
          aria-label={`切换至${nextThemeLabel}模式`}
          onClick={toggleTheme}
          size="small"
          variant="ghost"
        >
          <span aria-hidden="true" className={styles.themeIcon}>
            {theme === "dark" ? "☀" : "◐"}
          </span>
          <span className={styles.themeLabel}>{nextThemeLabel}模式</span>
        </ACSButton>
      </div>
    </div>
  );
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
                      sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1439px) 220px, 240px"
                      src={option.image}
                    />
                    <span className={styles.selectedIndicator} aria-hidden="true">
                      {selected ? "✓" : ""}
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
        id="creative-idea"
        maxLength={500}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：在永夜未来城，一位失去记忆的仿生人开始寻找创造者留下的最后一段影像……"
        value={value}
      />
      <p id="creative-idea-description">
        写下人物、世界或一瞬间的画面，AI 会把它理解为可继续创作的导演方向。
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
      description="先捕捉创作意图，再让 AI 帮你看见影片的第一种可能。"
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
        <ACSBadge tone="ai">AI 创意预览</ACSBadge>
        <span>第一幕 · 世界与人物初次相遇</span>
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
        ? "从创意中的关键选择切入，让人物在一次不可逆的行动中推动故事。"
        : "写下核心创意后，这里会呈现故事的起点、冲突与情绪走向。"}
    </DirectionCard>
  );
}

export function CharacterDirectionCard({ projectType }: { projectType: string }) {
  const type = getOption(projectTypeOptions, projectType);

  return (
    <DirectionCard index="02" title="人物方向">
      为{type.label}建立一位目标清晰、内心仍有秘密的核心人物，让选择成为情绪支点。
    </DirectionCard>
  );
}

export function VisualDirectionCard({ visualStyle }: { visualStyle: string }) {
  const style = getOption(visualStyleOptions, visualStyle);

  return (
    <DirectionCard index="03" title="视觉方向">
      以“{style.label}”为基调，{style.description}，保持画面统一而有呼吸感。
    </DirectionCard>
  );
}

export function ProductionSuggestionCard({ platform }: { platform: string }) {
  const platformOption = getOption(platformOptions, platform);

  return (
    <DirectionCard index="04" title="制作建议">
      面向{platformOption.label}先建立开场、人物特写与环境全景，快速确认影片气质。
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
  const status = directorReady
    ? "导演方案预览已就绪"
    : idea.trim()
      ? "创意已理解"
      : "等待创意";

  return (
    <AIAssistantPanel
      className={styles.understandingPanel}
      description="将你的创意转译为故事、人物、视觉与制作方向。"
      footer="这是创作方向预览，你可以随时返回左侧继续调整。"
      status={status}
      title="AI 创意理解"
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
      description="确认这次创作的起点，生成后仍可继续完善。"
      headerAction={
        <ACSBadge dot tone={directorReady ? "success" : "neutral"}>
          {directorReady ? "导演方案预览已就绪" : "创作准备中"}
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

export function CreateFilmButton({ onCreate }: { onCreate: () => void }) {
  return (
    <ACSButton
      aria-describedby="create-film-boundary"
      className={styles.createButton}
      onClick={onCreate}
      size="large"
      trailingIcon={<span aria-hidden="true">→</span>}
      variant="primary"
    >
      开始生成导演方案
    </ACSButton>
  );
}

export function CreateProjectPage() {
  const [idea, setIdea] = useState("");
  const [projectType, setProjectType] = useState("sci-fi");
  const [platform, setPlatform] = useState("streaming");
  const [visualStyle, setVisualStyle] = useState("future");
  const [directorReady, setDirectorReady] = useState(false);

  const presentationState = useMemo(() => {
    if (directorReady) return "导演方案预览已准备好，你仍可继续调整创意方向。";
    if (idea.trim()) return "AI 已开始理解你的创意，确认后可生成导演方案预览。";
    return "写下创意并选择方向，生成属于这部影片的导演方案预览。";
  }, [directorReady, idea]);

  return (
    <CustomerLayout
      className={styles.createLayout}
      contained={false}
      header={<CreateProjectHeader />}
    >
      <div className={styles.page}>
        <section className={styles.pageIntro} aria-labelledby="create-project-title">
          <div>
            <p className={styles.eyebrow}>CREATE WITH AI</p>
            <h1 id="create-project-title">让一个创意，成为一部电影</h1>
            <p>
              从故事的第一句话出发，与 AI 一起看见人物、世界与镜头的方向。
            </p>
          </div>
          <ACSBadge tone="ai">AI 导演协作</ACSBadge>
        </section>

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

        <CreationSummaryCard
          directorReady={directorReady}
          idea={idea}
          platform={platform}
          projectType={projectType}
          visualStyle={visualStyle}
        />

        <section className={styles.ctaRegion} aria-label="生成导演方案">
          <CreateFilmButton onCreate={() => setDirectorReady(true)} />
          <p id="create-film-boundary" role="status">
            {presentationState}
          </p>
        </section>
      </div>
    </CustomerLayout>
  );
}
