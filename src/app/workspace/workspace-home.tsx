"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSDrawer,
  ACSModal,
  AIAssistantPanel,
} from "@/components";
import { CustomerLayout } from "@/layouts";
import { useACSTheme } from "@/theme";
import styles from "./workspace-home.module.css";

const iconSources = {
  add: "/assets/workspace-home/icons/action-new-project.svg",
  director: "/assets/workspace-home/icons/action-ai-director.svg",
  script: "/assets/workspace-home/icons/action-upload-script.svg",
  import: "/assets/workspace-home/icons/action-import-assets.svg",
  storyboard: "/assets/workspace-home/icons/action-storyboard.svg",
  template: "/assets/workspace-home/icons/action-template.svg",
  virtual: "/assets/workspace-home/icons/tool-virtual-production.svg",
  edit: "/assets/workspace-home/icons/tool-smart-edit.svg",
  sound: "/assets/workspace-home/icons/tool-sound-design.svg",
  insights: "/assets/workspace-home/icons/tool-insights.svg",
  search: "/assets/workspace-home/icons/utility-search.svg",
  light: "/assets/workspace-home/icons/utility-theme-light.svg",
  dark: "/assets/workspace-home/icons/utility-theme-dark.svg",
  notification: "/assets/workspace-home/icons/utility-notification.svg",
  help: "/assets/workspace-home/icons/utility-help.svg",
  menu: "/assets/workspace-home/icons/utility-menu.svg",
} as const;

type WorkspaceIconName = keyof typeof iconSources;
type DrawerKind = "search" | "notifications" | "help" | "menu" | "account";
type GuidedContent = { title: string; description: string };
type IconStyle = CSSProperties & { "--workspace-icon": string };

const navigationItems: ReadonlyArray<{
  label: string;
  current?: boolean;
  secondary?: boolean;
}> = [
  { label: "工作台首页", current: true },
  { label: "AI导演" },
  { label: "项目工坊" },
  { label: "系列规划", secondary: true },
  { label: "剧本与分镜", secondary: true },
  { label: "资产库" },
  { label: "成片交付", secondary: true },
];

const quickActions = [
  { icon: "add", title: "新建项目", description: "从空白开始创作" },
  { icon: "director", title: "AI导演助手", description: "智能创意与构思" },
  { icon: "script", title: "上传脚本", description: "从文档生成项目" },
  { icon: "import", title: "导入素材", description: "视频 / 图片 / 音频" },
  { icon: "storyboard", title: "智能分镜", description: "AI 生成分镜头" },
  { icon: "template", title: "项目模板", description: "使用模板创建" },
] as const satisfies ReadonlyArray<{
  icon: WorkspaceIconName;
  title: string;
  description: string;
}>;

const assistantSuggestions = [
  "帮我分析剧本的情绪曲线",
  "生成《未来之城》的分镜建议",
  "推荐适合科幻题材的镜头语言",
  "检查当前项目的潜在风险",
] as const;

const projects = [
  {
    title: "未来之城",
    category: "科幻 · 长片",
    status: "进行中",
    tone: "primary",
    progress: 78,
    nextAction: "进入动画预演",
    updated: "20 分钟前更新",
    cover: "/assets/workspace-home/projects/future-city.webp",
    alt: "未来城市中人物面对高耸建筑的科幻电影画面",
    collaborators: ["张", "林", "周"],
  },
  {
    title: "雪落无声",
    category: "悬疑 · 院线电影",
    status: "分镜中",
    tone: "primary",
    progress: 42,
    nextAction: "开始分镜设计",
    updated: "3 小时前更新",
    cover: "/assets/workspace-home/projects/silent-snow.webp",
    alt: "雪山与孤独人物构成的悬疑电影画面",
    collaborators: ["张", "陈"],
  },
  {
    title: "追光者",
    category: "青春 · 院线电影",
    status: "后期制作",
    tone: "primary",
    progress: 65,
    nextAction: "素材收集与整理",
    updated: "昨天更新",
    cover: "/assets/workspace-home/projects/light-chaser.webp",
    alt: "暖色峡谷与晨光中的青春电影画面",
    collaborators: ["王", "李", "周"],
  },
  {
    title: "星际回响",
    category: "科幻 · 短片",
    status: "已交付",
    tone: "success",
    progress: 100,
    nextAction: "查看项目交付包",
    updated: "2 天前更新",
    cover: "/assets/workspace-home/projects/stellar-echo.webp",
    alt: "宇航员站在月面眺望宇宙的科幻电影画面",
    collaborators: ["张", "赵"],
  },
] as const;

const activityItems = [
  { title: "未来之城", detail: "更新了分镜版本 v3.2", time: "1 小时前", tone: "primary" },
  { title: "雪落无声", detail: "AI 分镜生成完成", time: "3 小时前", tone: "ai" },
  { title: "追光者", detail: "成片制作完成", time: "昨天 18:30", tone: "info" },
  { title: "星际回响", detail: "项目已交付", time: "2 天前", tone: "success" },
] as const;

const inspirationItems = [
  { quote: "电影不是生活的复制品，而是生活的升华和提炼。", source: "侯孝贤" },
  { quote: "镜头真正记录的，是人物没有说出口的那一部分。", source: "创作札记" },
  { quote: "先找到情绪，再让光影替故事开口。", source: "镜构灵感库" },
] as const;

const moreTools = [
  { icon: "virtual", title: "虚拟制片", label: "即将开放" },
  { icon: "edit", title: "智能剪辑", label: "即将开放" },
  { icon: "sound", title: "声音设计", label: "即将开放" },
  { icon: "insights", title: "数据洞察", label: "规划中" },
] as const satisfies ReadonlyArray<{
  icon: WorkspaceIconName;
  title: string;
  label: string;
}>;

const chartSeries = {
  "7": "20,140 110,116 200,124 290,76 380,88 470,42 560,58",
  "30": "20,132 80,120 140,126 200,92 260,100 320,68 380,82 440,48 500,62 560,36",
} as const;

function WorkspaceIcon({ name, className }: { name: WorkspaceIconName; className?: string }) {
  const style = {
    "--workspace-icon": `url("${iconSources[name]}")`,
  } as IconStyle;

  return <span aria-hidden="true" className={`${styles.icon} ${className ?? ""}`} style={style} />;
}

function BrandLockup() {
  return (
    <Link className={styles.brandLockup} href="/workspace" aria-label="镜构智能工作台首页">
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
    </Link>
  );
}

function WorkspaceHeader({
  onDrawer,
  onGuide,
}: {
  onDrawer: (drawer: DrawerKind) => void;
  onGuide: (content: GuidedContent) => void;
}) {
  const { theme, toggleTheme } = useACSTheme();
  const nextThemeLabel = theme === "dark" ? "浅色" : "深色";

  return (
    <div className={styles.headerInner}>
      <BrandLockup />

      <nav className={styles.primaryNavigation} aria-label="工作台主要导航">
        {navigationItems.map((item) =>
          item.current ? (
            <Link aria-current="page" className={styles.activeNavigation} href="/workspace" key={item.label}>
              {item.label}
            </Link>
          ) : (
            <button
              data-secondary={item.secondary || undefined}
              key={item.label}
              onClick={() =>
                onGuide({
                  title: item.label,
                  description: `${item.label}将在对应创作空间开放。你可以继续使用当前工作台。`,
                })
              }
              type="button"
            >
              {item.label}
            </button>
          ),
        )}
      </nav>

      <div className={styles.headerActions}>
        <ACSButton
          aria-label="打开全局搜索"
          className={styles.iconButton}
          leadingIcon={<WorkspaceIcon name="search" />}
          onClick={() => onDrawer("search")}
          size="small"
          variant="ghost"
        >
          <span className={styles.desktopUtilityLabel}>搜索</span>
        </ACSButton>
        <ACSButton
          aria-label={`切换至${nextThemeLabel}模式`}
          className={styles.iconButton}
          leadingIcon={<WorkspaceIcon name={theme === "dark" ? "light" : "dark"} />}
          onClick={toggleTheme}
          size="small"
          variant="ghost"
        >
          <span className={styles.desktopUtilityLabel}>{nextThemeLabel}</span>
        </ACSButton>
        <ACSButton
          aria-label="查看通知"
          className={`${styles.iconButton} ${styles.notificationButton}`}
          leadingIcon={<WorkspaceIcon name="notification" />}
          onClick={() => onDrawer("notifications")}
          size="small"
          variant="ghost"
        >
          <span className={styles.visuallyHidden}>通知</span>
        </ACSButton>
        <ACSButton
          aria-label="打开帮助"
          className={`${styles.iconButton} ${styles.helpButton}`}
          leadingIcon={<WorkspaceIcon name="help" />}
          onClick={() => onDrawer("help")}
          size="small"
          variant="ghost"
        >
          <span className={styles.visuallyHidden}>帮助</span>
        </ACSButton>
        <ACSButton
          className={styles.headerPrimaryAction}
          leadingIcon={<WorkspaceIcon name="add" />}
          onClick={() =>
            onGuide({
              title: "新建项目",
              description: "从一个创意开始，创建你的下一部 AI 影片。项目创建体验即将开放。",
            })
          }
          size="small"
        >
          新建项目
        </ACSButton>
        <button className={styles.accountButton} onClick={() => onDrawer("account")} type="button">
          <span className={styles.headerAvatar}>张</span>
          <span className={styles.accountCopy}>
            <strong>张导</strong>
            <small>导演工作室</small>
          </span>
        </button>
        <ACSButton
          aria-label="打开工作台菜单"
          className={`${styles.iconButton} ${styles.mobileMenuButton}`}
          leadingIcon={<WorkspaceIcon name="menu" />}
          onClick={() => onDrawer("menu")}
          size="small"
          variant="ghost"
        >
          <span className={styles.visuallyHidden}>菜单</span>
        </ACSButton>
      </div>
    </div>
  );
}

function WelcomeHero({ onGuide }: { onGuide: (content: GuidedContent) => void }) {
  const metrics = [
    { label: "今日创作时长", value: "3.6 小时" },
    { label: "制作处理中", value: "2 项制作中" },
    { label: "存储空间", value: "68.4 / 500 GB" },
    { label: "团队成员", value: "8 人 · 在线 3 人" },
  ] as const;

  return (
    <ACSCard className={styles.heroCard} padding="compact" tone="raised">
      <div className={styles.heroBackdrop}>
        <Image
          alt="电影摄影机俯瞰晨光中的山谷，展现明亮专业的创作空间"
          className={`${styles.heroImage} ${styles.heroImageLight}`}
          fill
          fetchPriority="high"
          loading="eager"
          sizes="(max-width: 1366px) calc(100vw - 48px), 54vw"
          src="/assets/workspace-home/hero/workspace-hero-light.webp"
        />
        <Image
          alt="电影摄影机俯瞰蓝调时刻的山谷，展现沉浸式创作空间"
          className={`${styles.heroImage} ${styles.heroImageDark}`}
          fill
          fetchPriority="high"
          loading="eager"
          sizes="(max-width: 1366px) calc(100vw - 48px), 54vw"
          src="/assets/workspace-home/hero/workspace-hero-dark.webp"
        />
      </div>
      <div className={styles.heroScrim} aria-hidden="true" />
      <div className={styles.heroContent}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>CREATOR WORKSPACE</p>
          <div className={styles.heroProductRow}>
            <span>镜构智能创作云</span>
            <ACSBadge tone="primary">专业版</ACSBadge>
          </div>
          <h1>欢迎回来，张导 <span aria-hidden="true">👋</span></h1>
          <p className={styles.heroDescription}>镜构智能创作云，让每一次创作都更有想象力</p>
          <div className={styles.heroActions}>
            <ACSButton
              onClick={() =>
                onGuide({
                  title: "继续制作《未来之城》",
                  description: "最近项目已准备好。项目工作空间将在后续体验中开放。",
                })
              }
              size="large"
            >
              继续制作
            </ACSButton>
            <ACSButton
              onClick={() =>
                onGuide({
                  title: "查看项目",
                  description: "项目工坊即将开放，你可以先从最近项目继续创作。",
                })
              }
              size="large"
              variant="secondary"
            >
              查看项目
            </ACSButton>
          </div>
        </div>

        <dl className={styles.heroMetrics} aria-label="工作空间概览">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.label}</dt>
              <dd>{metric.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ACSCard>
  );
}

function QuickStartPanel({ onGuide }: { onGuide: (content: GuidedContent) => void }) {
  return (
    <ACSCard className={styles.quickStartCard} padding="default" title="快速开始">
      <div className={styles.quickActionGrid}>
        {quickActions.map((action) => (
          <ACSButton
            className={styles.quickAction}
            fullWidth
            key={action.title}
            leadingIcon={<WorkspaceIcon className={styles.quickActionIcon} name={action.icon} />}
            onClick={() =>
              onGuide({
                title: action.title,
                description: `${action.description}。该创作入口即将开放。`,
              })
            }
            variant="ghost"
          >
            <span className={styles.quickActionCopy}>
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>
          </ACSButton>
        ))}
      </div>
    </ACSCard>
  );
}

function WorkspaceAssistant() {
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantNotice, setAssistantNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = assistantInput.trim();
    if (!request) return;
    setAssistantNotice(`已准备“${request}”的本地建议预览。`);
  }

  return (
    <AIAssistantPanel
      className={styles.assistantPanel}
      description="我是你的 AI 创作搭档，随时为你提供专业支持。"
      footer={<span className={styles.assistantDisclaimer}>内容由 AI 生成，仅供参考</span>}
      status="在线"
      title="AI 助理 · 镜构小构"
    >
      <div className={styles.assistantGreeting}>
        <span className={styles.assistantOrb} aria-hidden="true" />
        <div>
          <strong>你好，张导 <span aria-hidden="true">👋</span></strong>
          <span>今天想从哪一部分开始？</span>
        </div>
      </div>

      <div className={styles.suggestionList} aria-label="AI 制作建议">
        {assistantSuggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => setAssistantInput(suggestion)} type="button">
            <span>{suggestion}</span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>

      {assistantNotice && (
        <p className={styles.assistantNotice} role="status">
          {assistantNotice}
        </p>
      )}

      <form className={styles.assistantForm} onSubmit={handleSubmit}>
        <label className={styles.visuallyHidden} htmlFor="workspace-assistant-input">
          输入创意或制作需求
        </label>
        <input
          id="workspace-assistant-input"
          onChange={(event) => setAssistantInput(event.target.value)}
          placeholder="输入你的创意或制作需求…"
          value={assistantInput}
        />
        <ACSButton aria-label="准备 AI 制作建议" size="small" type="submit">
          发送
        </ACSButton>
      </form>
    </AIAssistantPanel>
  );
}

function ProjectCard({
  project,
  onGuide,
}: {
  project: (typeof projects)[number];
  onGuide: (content: GuidedContent) => void;
}) {
  const progressStyle = { "--project-progress": `${project.progress}%` } as CSSProperties;

  return (
    <ACSCard className={styles.projectCard} interactive padding="compact">
      <div className={styles.projectCover}>
        <Image alt={project.alt} fill sizes="(max-width: 768px) 78vw, 260px" src={project.cover} />
        <ACSBadge className={styles.projectStatus} dot tone={project.tone}>
          {project.status}
        </ACSBadge>
      </div>
      <div className={styles.projectBody}>
        <div>
          <h3>{project.title}</h3>
          <p>{project.category}</p>
        </div>
        <div className={styles.projectProgressRow}>
          <span>制作进度</span>
          <strong>{project.progress}%</strong>
        </div>
        <div
          aria-label={`${project.title}制作进度 ${project.progress}%`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={project.progress}
          className={styles.progressTrack}
          role="progressbar"
          style={progressStyle}
        >
          <span data-complete={project.progress === 100 || undefined} />
        </div>
        <div className={styles.projectMeta}>
          <div className={styles.avatarStack} aria-label={`${project.collaborators.length} 位协作者`}>
            {project.collaborators.map((collaborator, index) => (
              <span key={`${collaborator}-${index}`}>{collaborator}</span>
            ))}
          </div>
          <span>{project.updated}</span>
        </div>
        <ACSButton
          className={styles.projectAction}
          fullWidth
          onClick={() =>
            onGuide({
              title: `${project.title} · ${project.nextAction}`,
              description: "项目工作空间将在后续体验中开放。当前展示为本地创作预览。",
            })
          }
          trailingIcon={<span aria-hidden="true">→</span>}
          variant="secondary"
        >
          {project.nextAction}
        </ACSButton>
      </div>
    </ACSCard>
  );
}

function CreateProjectCard({ onGuide }: { onGuide: (content: GuidedContent) => void }) {
  return (
    <ACSCard className={styles.createProjectCard} padding="compact">
      <div className={styles.createProjectContent}>
        <span className={styles.createProjectIcon} aria-hidden="true">
          <WorkspaceIcon name="add" />
        </span>
        <div>
          <h3>新建项目</h3>
          <p>从一个创意开始新的影片</p>
        </div>
        <ACSButton
          onClick={() =>
            onGuide({
              title: "新建项目",
              description: "项目创建体验即将开放。你可以先继续最近的作品。",
            })
          }
          variant="secondary"
        >
          开始构思
        </ACSButton>
      </div>
    </ACSCard>
  );
}

function RecentProjects({ onGuide }: { onGuide: (content: GuidedContent) => void }) {
  return (
    <section className={styles.recentProjects} aria-labelledby="recent-projects-title">
      <div className={styles.sectionHeader}>
        <div>
          <p>CREATIVE CONTINUITY</p>
          <h2 id="recent-projects-title">最近项目</h2>
        </div>
        <button
          onClick={() =>
            onGuide({ title: "全部项目", description: "项目工坊即将开放。" })
          }
          type="button"
        >
          全部项目 <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className={styles.projectScroller}>
        {projects.map((project) => (
          <ProjectCard key={project.title} onGuide={onGuide} project={project} />
        ))}
        <CreateProjectCard onGuide={onGuide} />
      </div>
    </section>
  );
}

function WorkspaceStatus() {
  return (
    <ACSCard className={styles.statusCard} title="工作空间状态">
      <div className={styles.statusList}>
        <div>
          <span>制作处理中</span>
          <strong>2 项制作中</strong>
        </div>
        <div>
          <span>存储使用</span>
          <strong>68.4 GB / 500 GB</strong>
        </div>
        <div className={styles.storageTrack} aria-label="存储空间已使用百分之十四" role="img">
          <span />
        </div>
        <div>
          <span>成员在线</span>
          <strong>3 / 8 在线</strong>
        </div>
        <div>
          <span>当前套餐</span>
          <ACSBadge tone="primary">专业版</ACSBadge>
        </div>
      </div>
    </ACSCard>
  );
}

function CreativeInspiration() {
  const [inspirationIndex, setInspirationIndex] = useState(0);
  const inspiration = inspirationItems[inspirationIndex];

  return (
    <ACSCard
      className={styles.inspirationCard}
      headerAction={
        <ACSButton
          onClick={() => setInspirationIndex((current) => (current + 1) % inspirationItems.length)}
          size="small"
          variant="ghost"
        >
          换一句
        </ACSButton>
      }
      title="创作灵感"
    >
      <blockquote>“{inspiration.quote}”</blockquote>
      <cite>— {inspiration.source}</cite>
    </ACSCard>
  );
}

function MoreTools({ onGuide }: { onGuide: (content: GuidedContent) => void }) {
  return (
    <ACSCard className={styles.toolsCard} title="更多创作工具">
      <div className={styles.toolsGrid}>
        {moreTools.map((tool) => (
          <button
            key={tool.title}
            onClick={() => onGuide({ title: tool.title, description: `${tool.title}正在准备中。` })}
            type="button"
          >
            <span className={styles.toolIcon}><WorkspaceIcon name={tool.icon} /></span>
            <span>
              <strong>{tool.title}</strong>
              <small>{tool.label}</small>
            </span>
          </button>
        ))}
      </div>
    </ACSCard>
  );
}

function ProductionOverview() {
  const [period, setPeriod] = useState<keyof typeof chartSeries>("7");
  const periodLabel = period === "7" ? "近 7 天" : "近 30 天";

  return (
    <ACSCard
      className={styles.overviewCard}
      headerAction={
        <div className={styles.periodSelector} aria-label="创作活动周期">
          <button aria-pressed={period === "7"} onClick={() => setPeriod("7")} type="button">近 7 天</button>
          <button aria-pressed={period === "30"} onClick={() => setPeriod("30")} type="button">近 30 天</button>
        </div>
      }
      title="制作进度总览"
    >
      <dl className={styles.summaryGrid}>
        <div><dt>项目总数</dt><dd>12</dd></div>
        <div><dt>进行中</dt><dd>5</dd></div>
        <div><dt>即将交付</dt><dd>3</dd></div>
        <div><dt>已完成</dt><dd>4</dd></div>
      </dl>
      <div className={styles.chartWrap}>
        <svg aria-label={`${periodLabel}创作活动趋势`} role="img" viewBox="0 0 580 170">
          <path className={styles.chartGuide} d="M20 38H560M20 86H560M20 134H560" />
          <polyline className={styles.chartAreaLine} points={chartSeries[period]} />
          <polyline className={styles.chartPrimaryLine} points={chartSeries[period]} />
        </svg>
        <div className={styles.chartLegend}>
          <span><i /> 创作活动</span>
          <span>{periodLabel}</span>
        </div>
      </div>
    </ACSCard>
  );
}

function ProjectActivity({ onGuide }: { onGuide: (content: GuidedContent) => void }) {
  return (
    <ACSCard className={styles.activityCard} title="项目状态时间线">
      <ol className={styles.activityList}>
        {activityItems.map((item) => (
          <li key={`${item.title}-${item.detail}`}>
            <span className={styles.activityMarker} data-tone={item.tone} aria-hidden="true" />
            <button
              onClick={() =>
                onGuide({
                  title: item.title,
                  description: `${item.detail}。项目详情将在对应工作空间开放。`,
                })
              }
              type="button"
            >
              <span><strong>{item.title}</strong>{item.detail}</span>
              <time>{item.time}</time>
            </button>
          </li>
        ))}
      </ol>
    </ACSCard>
  );
}

function WorkspaceFooter() {
  return (
    <div className={styles.footerInner}>
      <span>© 2026 镜构智能</span>
      <span>隐私 · 帮助 · 服务状态正常</span>
    </div>
  );
}

function DrawerContent({
  drawer,
  onGuide,
}: {
  drawer: DrawerKind;
  onGuide: (content: GuidedContent) => void;
}) {
  if (drawer === "search") {
    return (
      <div className={styles.drawerStack}>
        <label htmlFor="workspace-search">搜索创作内容</label>
        <div className={styles.searchField}>
          <WorkspaceIcon name="search" />
          <input id="workspace-search" placeholder="搜索项目、剧本或素材…" />
          <kbd>Ctrl K</kbd>
        </div>
        <p>搜索功能正在准备中，当前不会生成或展示虚构结果。</p>
      </div>
    );
  }

  if (drawer === "notifications") {
    return (
      <div className={styles.drawerStack}>
        <div className={styles.drawerNotice}><strong>未来之城</strong><span>分镜版本已更新 · 1 小时前</span></div>
        <div className={styles.drawerNotice}><strong>雪落无声</strong><span>AI 分镜建议已准备 · 3 小时前</span></div>
        <div className={styles.drawerNotice}><strong>星际回响</strong><span>项目已交付 · 2 天前</span></div>
      </div>
    );
  }

  if (drawer === "help") {
    return (
      <div className={styles.drawerStack}>
        <h3>需要创作支持？</h3>
        <p>你可以从 AI 助理获得剧本、分镜和镜头语言建议。</p>
        <ACSButton onClick={() => onGuide({ title: "帮助中心", description: "帮助中心即将开放。" })}>
          查看帮助
        </ACSButton>
      </div>
    );
  }

  if (drawer === "account") {
    return (
      <div className={styles.accountDrawer}>
        <span className={styles.accountDrawerAvatar}>张</span>
        <div><h3>张导</h3><p>张艺谋导演工作室</p></div>
        <ACSBadge tone="primary">专业版</ACSBadge>
      </div>
    );
  }

  return (
    <nav className={styles.mobileNavigation} aria-label="移动端工作台导航">
      {navigationItems.map((item) =>
        item.current ? (
          <Link aria-current="page" href="/workspace" key={item.label}>{item.label}</Link>
        ) : (
          <button
            key={item.label}
            onClick={() => onGuide({ title: item.label, description: `${item.label}即将开放。` })}
            type="button"
          >
            {item.label}<span aria-hidden="true">→</span>
          </button>
        ),
      )}
    </nav>
  );
}

const drawerTitles: Record<DrawerKind, string> = {
  search: "全局搜索",
  notifications: "创作通知",
  help: "帮助与支持",
  menu: "工作台导航",
  account: "工作空间账户",
};

export function WorkspaceHomePage() {
  const [drawer, setDrawer] = useState<DrawerKind | null>(null);
  const [guidedContent, setGuidedContent] = useState<GuidedContent | null>(null);
  const activeDrawerTitle = useMemo(() => (drawer ? drawerTitles[drawer] : "工作台"), [drawer]);

  function openGuide(content: GuidedContent) {
    setDrawer(null);
    setGuidedContent(content);
  }

  return (
    <CustomerLayout
      className={styles.workspaceLayout}
      footer={<WorkspaceFooter />}
      header={<WorkspaceHeader onDrawer={setDrawer} onGuide={openGuide} />}
    >
      <div className={styles.page}>
        <section className={styles.topExperienceGrid} aria-label="工作空间概览">
          <WelcomeHero onGuide={openGuide} />
          <QuickStartPanel onGuide={openGuide} />
          <WorkspaceAssistant />
        </section>

        <div className={styles.productionGrid}>
          <RecentProjects onGuide={openGuide} />
          <aside className={styles.sideRail} aria-label="工作空间辅助信息">
            <WorkspaceStatus />
            <CreativeInspiration />
            <MoreTools onGuide={openGuide} />
          </aside>
        </div>

        <section className={styles.insightGrid} aria-label="制作洞察">
          <ProductionOverview />
          <ProjectActivity onGuide={openGuide} />
        </section>
      </div>

      <ACSDrawer
        description="工作台中的辅助信息与快捷入口"
        onClose={() => setDrawer(null)}
        open={drawer !== null}
        size="medium"
        title={activeDrawerTitle}
      >
        {drawer && <DrawerContent drawer={drawer} onGuide={openGuide} />}
      </ACSDrawer>

      <ACSModal
        description={guidedContent?.description}
        footer={<ACSButton onClick={() => setGuidedContent(null)}>知道了</ACSButton>}
        onClose={() => setGuidedContent(null)}
        open={guidedContent !== null}
        size="small"
        title={guidedContent?.title ?? "工作台提示"}
      >
        <p className={styles.guidedMessage}>保持创作节奏，我们会在体验准备好后引导你继续。</p>
      </ACSModal>
    </CustomerLayout>
  );
}
