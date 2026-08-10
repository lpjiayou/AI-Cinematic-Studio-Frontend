import Image from "next/image";
import { ACSBadge, ACSButton, ACSCard, WorkflowMap } from "@/components";
import { CustomerLayout } from "@/layouts";
import { LandingThemeToggle } from "./landing-theme-toggle";
import styles from "./landing-page.module.css";

const navigationItems = [
  { href: "#pipeline", label: "生产流程" },
  { href: "#features", label: "制作能力" },
  { href: "#works", label: "创意作品" },
] as const;

const pipelineStages = [
  { id: "director", label: "AI导演" },
  { id: "world", label: "故事世界" },
  { id: "character", label: "角色智能" },
  { id: "script", label: "剧本" },
  { id: "shot", label: "镜头" },
  { id: "delivery", label: "成片" },
] as const;

const monitorContext = [
  { label: "Scene", value: "雨夜未来城" },
  { label: "Character", value: "林澈 · 情绪连贯" },
  { label: "Camera", value: "中近景 · 缓慢推进" },
  { label: "Render", value: "电影光影生成中" },
] as const;

const capabilityItems = [
  {
    title: "AI Director",
    description: "从一句创意生成导演方案。",
    value: "让创意、叙事与视觉从第一步就保持一致。",
    scenarios: ["故事方向", "镜头规划", "视觉风格"],
    image: "/assets/acs/landing/hero-cinema-light.webp",
    imageAlt: "导演在未来电影摄影棚中规划角色镜头",
  },
  {
    title: "Storyboard",
    description: "自动将剧本转换为电影分镜。",
    value: "在制作前看见完整节奏，减少反复试错。",
    scenarios: ["景别", "构图", "运镜"],
    image: "/assets/acs/landing/work-future-city.webp",
    imageAlt: "未来城市电影场景的宽幅构图",
  },
  {
    title: "Timeline",
    description: "AI 辅助完成后期制作。",
    value: "让剪辑、声音与字幕在同一创作节奏中推进。",
    scenarios: ["剪辑", "声音", "字幕"],
    image: "/assets/acs/landing/work-evening-lamp.webp",
    imageAlt: "夜晚室内电影场景的灯光与情绪画面",
  },
  {
    title: "Asset Intelligence",
    description: "保持角色与资产长期一致。",
    value: "让角色、场景与品牌资产跨镜头保持连贯。",
    scenarios: ["身份锁定", "版本管理", "资产追踪"],
    image: "/assets/acs/landing/hero-cinema-dark.webp",
    imageAlt: "未来城市片场中的电影角色",
  },
] as const;

const workItems = [
  {
    title: "晚灯",
    category: "AI 情绪短剧",
    description: "一个关于孤独与陪伴的 AI 短片。",
    image: "/assets/acs/landing/work-evening-lamp.webp",
    imageAlt: "晚灯作品封面，人物在雨夜窗前凝望",
  },
  {
    title: "未来城市",
    category: "AI 科幻短片",
    description: "人类与未来都市共生的电影想象。",
    image: "/assets/acs/landing/work-future-city.webp",
    imageAlt: "未来城市作品封面，人物俯瞰滨海未来都市",
  },
  {
    title: "东方幻想",
    category: "AI 视觉实验",
    description: "在山水与云海之间重构东方叙事意境。",
    image: "/assets/acs/landing/work-eastern-fantasy.webp",
    imageAlt: "东方幻想作品封面，旅人走向云海中的山间宫殿",
  },
] as const;

function ACSHeader() {
  return (
    <div className={styles.headerInner}>
      <div className={styles.brandLockup} aria-label="镜构智能 JINGGOU AI">
        <Image
          alt=""
          className={styles.brandMark}
          height={42}
          src="/assets/acs/brand/jinggou-mark.webp"
          width={42}
        />
        <div className={styles.brandText}>
          <strong>镜构智能</strong>
          <span>JINGGOU AI</span>
        </div>
      </div>

      <nav className={styles.primaryNavigation} aria-label="主要导航">
        {navigationItems.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className={styles.headerActions}>
        <LandingThemeToggle />
        <ACSButton className={styles.loginButton} size="small" variant="ghost">
          登录
        </ACSButton>
        <ACSButton className={styles.headerPrimaryButton} size="small">
          进入工作区
        </ACSButton>
      </div>
    </div>
  );
}

function CinemaPreview() {
  return (
    <figure className={styles.cinemaPreview} aria-labelledby="cinema-preview-title">
      <div className={styles.cinemaFrame}>
        <Image
          alt="未来城市夜晚的电影片场，AI 角色正在等待下一组镜头"
          className={`${styles.cinemaImage} ${styles.cinemaImageDark}`}
          fill
          fetchPriority="high"
          loading="eager"
          sizes="(max-width: 1366px) calc(100vw - 160px), 55vw"
          src="/assets/acs/landing/hero-cinema-dark.webp"
          unoptimized
        />
        <Image
          alt="明亮未来摄影棚中，导演正在为电影角色规划镜头"
          className={`${styles.cinemaImage} ${styles.cinemaImageLight}`}
          fill
          fetchPriority="high"
          loading="eager"
          sizes="(max-width: 1366px) calc(100vw - 160px), 55vw"
          src="/assets/acs/landing/hero-cinema-light.webp"
          unoptimized
        />
        <div className={styles.cinemaVignette} aria-hidden="true" />

        <figcaption className={styles.previewOverlay}>
          <div className={styles.monitorHeader}>
            <ACSBadge dot tone="ai">
              AI Director
            </ACSBadge>
            <span className={styles.monitorStatus}>
              <span aria-hidden="true" />
              镜头准备中
            </span>
          </div>
          <p className={styles.monitorTitle} id="cinema-preview-title">
            正在统筹下一组镜头
          </p>
          <dl className={styles.monitorContext} aria-label="AI 导演监看信息">
            {monitorContext.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </figcaption>
      </div>
    </figure>
  );
}

function HeroSection() {
  return (
    <section className={styles.heroSection} aria-labelledby="landing-title">
      <div className={styles.heroContainer}>
        <div className={styles.heroCopy}>
          <p className={styles.heroBrand}>
            <span>AI Cinematic Studio</span>
            <span>镜构智能</span>
          </p>
          <h1
            aria-label="让一个人拥有完整的 AI 影视制作团队"
            id="landing-title"
          >
            <span>让一个人拥有</span>
            <span>完整的 AI 影视</span>
            <span>制作团队</span>
          </h1>
          <p className={styles.heroDescription}>
            从故事创意，
            <br />
            到角色设计，
            <br />
            到镜头生成与成片交付。
          </p>
          <div className={styles.heroActions}>
            <ACSButton className={styles.primaryCTA} size="large">
              开始创作
            </ACSButton>
            <ACSButton
              className={styles.secondaryCTA}
              size="large"
              variant="secondary"
            >
              观看案例
            </ACSButton>
          </div>
        </div>
        <CinemaPreview />
      </div>
    </section>
  );
}

function ProductionPipeline() {
  return (
    <section
      className={styles.contentSection}
      id="pipeline"
      aria-labelledby="pipeline-title"
    >
      <h2 className={styles.sectionTitle} id="pipeline-title">
        AI 影视生产流程
      </h2>
      <WorkflowMap
        ariaLabel="AI 影视生产流程"
        className={styles.productionPipeline}
        stages={pipelineStages}
      />
    </section>
  );
}

function FeatureShowcase() {
  return (
    <section
      className={styles.contentSection}
      id="features"
      aria-labelledby="features-title"
    >
      <h2 className={styles.sectionTitle} id="features-title">
        制作能力
      </h2>
      <div className={styles.featureGrid}>
        {capabilityItems.map((item, index) => (
          <ACSCard
            className={styles.featureCard}
            interactive
            key={item.title}
            padding="compact"
          >
            <div className={styles.featureVisual}>
              <Image
                alt={item.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                src={item.image}
              />
              <span className={styles.cardIndex} aria-hidden="true">
                {(index + 1).toString().padStart(2, "0")}
              </span>
            </div>
            <div className={styles.featureBody}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p className={styles.featureValue}>{item.value}</p>
              <ul aria-label={`${item.title}应用场景`}>
                {item.scenarios.map((scenario) => (
                  <li key={scenario}>{scenario}</li>
                ))}
              </ul>
            </div>
          </ACSCard>
        ))}
      </div>
    </section>
  );
}

function WorkGallery() {
  return (
    <section
      className={styles.contentSection}
      id="works"
      aria-labelledby="works-title"
    >
      <h2 className={styles.sectionTitle} id="works-title">
        创意作品
      </h2>
      <div className={styles.workGrid}>
        {workItems.map((item) => (
          <ACSCard
            className={styles.workCard}
            interactive
            key={item.title}
            padding="compact"
          >
            <div className={styles.workCover}>
              <Image
                alt={item.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                src={item.image}
              />
            </div>
            <div className={styles.workMeta}>
              <ACSBadge>{item.category}</ACSBadge>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </ACSCard>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection} aria-label="进入产品">
      <div>
        <p>镜构智能</p>
        <h2>让企业拥有完整的 AI 影视制作团队。</h2>
        <span>从创意策划到成片交付，让专业制作能力成为可持续的企业资产。</span>
      </div>
      <ACSButton className={styles.primaryCTA} size="large">
        进入 AI Cinematic Studio
      </ACSButton>
    </section>
  );
}

function ACSFooter() {
  return (
    <div className={styles.footerInner}>
      <div className={styles.footerBrand}>
        <Image
          alt=""
          className={styles.footerMark}
          height={48}
          src="/assets/acs/brand/jinggou-mark.webp"
          width={48}
        />
        <div className={styles.footerBrandCopy}>
          <strong>镜构智能</strong>
          <span>AI Cinematic Studio · JINGGOU AI</span>
        </div>
      </div>
      <div className={styles.footerGroups} aria-label="品牌信息">
        <div>
          <strong>产品</strong>
          <span>AI Cinematic Studio</span>
        </div>
        <div>
          <strong>企业服务</strong>
          <span>企业级 AI 影视生产</span>
        </div>
        <div>
          <strong>联系我们</strong>
          <span>商务合作</span>
        </div>
      </div>
    </div>
  );
}

export function CustomerLandingPage() {
  return (
    <CustomerLayout
      contained={false}
      footer={<ACSFooter />}
      header={<ACSHeader />}
    >
      <div className={styles.page}>
        <HeroSection />
        <div className={styles.sectionStack}>
          <ProductionPipeline />
          <FeatureShowcase />
          <WorkGallery />
          <CTASection />
        </div>
      </div>
    </CustomerLayout>
  );
}
