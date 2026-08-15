import Image from "next/image";
import Link from "next/link";
import { ACSBadge, ACSCard } from "@/components";
import { CustomerLayout } from "@/layouts";
import styles from "./workspace-home.module.css";

const availableTasks = [
  {
    title: "建立创意简报",
    description: "从核心创意、影片形态、首发场景和视觉基调开始。",
    href: "/creator/projects/new",
    action: "新建本地方案",
    icon: "/assets/workspace-home/icons/action-new-project.svg",
    status: "可用",
  },
  {
    title: "整理导演方案",
    description: "明确故事意图、目标观众、情绪与参考风格。",
    href: "/creator/ai-director",
    action: "进入 AI 导演",
    icon: "/assets/workspace-home/icons/action-ai-director.svg",
    status: "本地预览",
  },
  {
    title: "管理项目",
    description: "查看项目数据连接状态，并在连接后继续已有项目。",
    href: "/creator/projects",
    action: "打开项目中心",
    icon: "/assets/workspace-home/icons/action-template.svg",
    status: "待连接",
  },
  {
    title: "编辑剧本",
    description: "进入场景导航、正文编辑、恢复保护和改写比较工作区。",
    href: "/script-studio",
    action: "打开剧本工作室",
    icon: "/assets/workspace-home/icons/action-upload-script.svg",
    status: "本地工作区",
  },
] as const;

const productionPath = [
  { label: "创意与导演方案", state: "当前可用", tone: "success" },
  { label: "故事世界与角色", state: "工作区可用", tone: "primary" },
  { label: "剧本编辑", state: "本地工作区", tone: "primary" },
  { label: "分镜、资产与渲染", state: "尚未开放", tone: "neutral" },
] as const;

function WorkspaceFooter() {
  return (
    <div className={styles.footerInner}>
      <span>© 2026 镜构智能</span>
      <span>当前界面仅展示已实现能力与明确的数据边界</span>
    </div>
  );
}

function LaunchHero() {
  return (
    <section className={styles.hero} aria-labelledby="creator-home-title">
      <div className={styles.heroMedia} aria-hidden="true">
        <Image
          alt=""
          className={styles.heroImage}
          fill
          priority
          sizes="(max-width: 720px) 100vw, 42vw"
          src="/assets/workspace-home/hero/workspace-hero-dark.webp"
        />
      </div>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>CREATOR WORKSPACE</p>
        <h1 id="creator-home-title">从明确任务开始创作</h1>
        <p className={styles.heroDescription}>
          选择当前真正可用的创作入口。项目集合、账户配额和制作活动尚未连接权威数据，因此不会在这里生成示例数字或虚构项目。
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} href="/creator/projects/new">
            新建本地方案
          </Link>
          <Link className={styles.secondaryAction} href="/creator/projects">
            查看项目连接状态
          </Link>
        </div>
      </div>
    </section>
  );
}

function TaskLaunchpad() {
  return (
    <section aria-labelledby="available-tasks-title" className={styles.taskSection}>
      <div className={styles.sectionHeading}>
        <div>
          <p>AVAILABLE TASKS</p>
          <h2 id="available-tasks-title">现在可以完成的工作</h2>
        </div>
        <span>4 个真实入口</span>
      </div>
      <div className={styles.taskGrid}>
        {availableTasks.map((task) => (
          <ACSCard className={styles.taskCard} key={task.href} padding="compact">
            <div className={styles.taskCardContent}>
              <span className={styles.taskIcon}>
                <Image alt="" height={24} src={task.icon} width={24} />
              </span>
              <div className={styles.taskCopy}>
                <div className={styles.taskTitleRow}>
                  <h3>{task.title}</h3>
                  <ACSBadge tone={task.status === "待连接" ? "neutral" : "primary"}>
                    {task.status}
                  </ACSBadge>
                </div>
                <p>{task.description}</p>
              </div>
              <Link className={styles.taskAction} href={task.href}>
                {task.action}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </ACSCard>
        ))}
      </div>
    </section>
  );
}

function ConnectionPanel() {
  return (
    <ACSCard
      className={styles.connectionCard}
      description="界面只展示能够被当前前端证明的状态。"
      title="数据与能力边界"
    >
      <dl className={styles.connectionList}>
        <div>
          <dt>权威项目集合</dt>
          <dd><ACSBadge tone="neutral">未连接</ACSBadge></dd>
        </div>
        <div>
          <dt>账户、团队与配额</dt>
          <dd><ACSBadge tone="neutral">未连接</ACSBadge></dd>
        </div>
        <div>
          <dt>本地创意与导演预览</dt>
          <dd><ACSBadge tone="success">可用</ACSBadge></dd>
        </div>
        <div>
          <dt>GPU 与生产队列</dt>
          <dd><ACSBadge tone="neutral">本页面不提供</ACSBadge></dd>
        </div>
      </dl>
    </ACSCard>
  );
}

function ProductionPath() {
  return (
    <ACSCard
      className={styles.pathCard}
      description="按可验证能力逐步推进，未开放阶段不会伪装成可执行入口。"
      title="制作路径"
    >
      <ol className={styles.pathList}>
        {productionPath.map((step, index) => (
          <li key={step.label}>
            <span className={styles.pathIndex}>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.label}</strong>
            <ACSBadge tone={step.tone}>{step.state}</ACSBadge>
          </li>
        ))}
      </ol>
    </ACSCard>
  );
}

export function WorkspaceHomePage() {
  return (
    <CustomerLayout className={styles.workspaceLayout} footer={<WorkspaceFooter />}>
      <div className={styles.page}>
        <LaunchHero />
        <TaskLaunchpad />
        <section aria-label="创作边界与制作路径" className={styles.supportGrid}>
          <ConnectionPanel />
          <ProductionPath />
        </section>
      </div>
    </CustomerLayout>
  );
}
