"use client";

import Image from "next/image";
import Link from "next/link";
import { ACSBadge, ACSCard } from "@/components";
import {
  CREATOR_CAPABILITY_CATALOG,
  useCreatorIntegration,
  type CapabilityState,
} from "@/features/core-integration";
import { CustomerLayout } from "@/layouts";
import styles from "./workspace-home.module.css";

const availableTasks = [
  {
    title: "建立创意简报",
    description: "从核心创意、影片形态、首发场景和视觉基调开始。",
    href: "/creator/projects/new",
    action: "新建制作项目",
    icon: "/assets/workspace-home/icons/action-new-project.svg",
    status: "M2 + M4",
  },
  {
    title: "整理导演方案",
    description: "明确故事意图、目标观众、情绪与参考风格。",
    href: "/creator/ai-director",
    action: "进入 AI 导演",
    icon: "/assets/workspace-home/icons/action-ai-director.svg",
    status: "M1",
  },
  {
    title: "管理项目",
    description: "查看项目数据连接状态，并在连接后继续已有项目。",
    href: "/creator/projects",
    action: "打开项目中心",
    icon: "/assets/workspace-home/icons/action-template.svg",
    status: "Core 项目",
  },
  {
    title: "编辑剧本",
    description: "从权威项目中选择 Series 与 Episode，再生成、修订和确认剧本版本。",
    href: "/creator/projects",
    action: "选择项目与集数",
    icon: "/assets/workspace-home/icons/action-upload-script.svg",
    status: "M3",
  },
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
  const { state } = useCreatorIntegration();
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
          {state.status === "connected"
            ? "Creator Core 合同已连接。请按下方实时能力状态，从导演候选、项目与集数、剧本到系列规划继续推进。"
            : "当前无法读取 Creator Core。权威项目和制作状态不会由本地样例替代。"}
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} href="/creator/projects/new">
            开始新项目
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
          <ACSCard className={styles.taskCard} key={task.title} padding="compact">
            <div className={styles.taskCardContent}>
              <span className={styles.taskIcon}>
                <Image alt="" height={24} src={task.icon} width={24} />
              </span>
              <div className={styles.taskCopy}>
                <div className={styles.taskTitleRow}>
                  <h3>{task.title}</h3>
                  <ACSBadge tone="primary">
                    {task.status}
                  </ACSBadge>
                </div>
                <p>{task.description}</p>
              </div>
              <Link className={styles.taskAction} href={task.href}>
                {task.action}
              </Link>
            </div>
          </ACSCard>
        ))}
      </div>
    </section>
  );
}

function ConnectionPanel() {
  const { state } = useCreatorIntegration();
  const connected = state.status === "connected";
  const m6 = connected ? state.capabilities[5] : null;
  return (
    <ACSCard
      className={styles.connectionCard}
      description="界面只展示能够被当前前端证明的状态。"
      title="数据与能力边界"
    >
      <dl className={styles.connectionList}>
        <div>
          <dt>权威项目集合</dt>
          <dd><ACSBadge tone={connected ? "success" : "neutral"}>{connected ? "Core v1" : "未连接"}</ACSBadge></dd>
        </div>
        <div>
          <dt>账户、团队与配额</dt>
          <dd><ACSBadge tone="neutral">未连接</ACSBadge></dd>
        </div>
        <div>
          <dt>前端体验适配层</dt>
          <dd><ACSBadge tone={connected ? "success" : "neutral"}>{connected ? "已验证" : "等待 Core"}</ACSBadge></dd>
        </div>
        <div>
          <dt>M6 外部权限</dt>
          <dd>
            <ACSBadge tone={m6?.state === "authority_required" ? "primary" : "neutral"}>
              {m6 ? capabilityLabel(m6.state) : "待核对"}
            </ACSBadge>
          </dd>
        </div>
      </dl>
    </ACSCard>
  );
}

function capabilityLabel(state: CapabilityState) {
  if (state === "available") return "已映射";
  if (state === "authority_required") return "需外部权限";
  return "尚未开放";
}

function CapabilityMatrix() {
  const { state } = useCreatorIntegration();
  const connected = state.status === "connected";
  const capabilities = connected ? state.capabilities : null;
  return (
    <section aria-labelledby="capability-matrix-title" className={styles.capabilitySection}>
      <div className={styles.sectionHeading}>
        <div>
          <p>CORE CAPABILITY CONTRACT</p>
          <h2 id="capability-matrix-title">M1–M19 前端映射</h2>
        </div>
        <span>{connected ? "来自 /creator/api/v1/capabilities" : "等待 Core 合同"}</span>
      </div>
      <div className={styles.capabilityGrid}>
        {CREATOR_CAPABILITY_CATALOG.map(([id, name], index) => {
          const capability = capabilities?.[index];
          const capabilityState = capability?.state;
          return (
            <article data-state={capabilityState ?? "unknown"} key={id}>
              <span>{id}</span>
              <strong>{name}</strong>
              <small>{capabilityState ? capabilityLabel(capabilityState) : "未核对"}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductionPath() {
  const { state } = useCreatorIntegration();
  const connected = state.status === "connected";
  const groupedState = (start: number, end: number): CapabilityState | null => {
    if (!connected) return null;
    const items = state.capabilities.slice(start - 1, end);
    if (items.some((item) => item.state === "not_open")) return "not_open";
    if (items.some((item) => item.state === "authority_required")) return "authority_required";
    return "available";
  };
  const steps = [
    { label: "M1 导演候选与人工确认", capabilityState: groupedState(1, 1) },
    { label: "M2–M5 项目、分集、剧本与系列规划", capabilityState: groupedState(2, 5) },
    { label: "M6 世界与角色智能", capabilityState: groupedState(6, 6) },
    { label: "M7–M19 后续制作与商业化", capabilityState: groupedState(7, 19) },
  ] as const;
  return (
    <ACSCard
      className={styles.pathCard}
      description="按可验证能力逐步推进，未开放阶段不会伪装成可执行入口。"
      title="制作路径"
    >
      <ol className={styles.pathList}>
        {steps.map((step, index) => (
          <li key={step.label}>
            <span className={styles.pathIndex}>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.label}</strong>
            <ACSBadge
              tone={
                step.capabilityState === "available"
                  ? "success"
                  : step.capabilityState === "authority_required"
                    ? "primary"
                    : "neutral"
              }
            >
              {step.capabilityState ? capabilityLabel(step.capabilityState) : "待核对"}
            </ACSBadge>
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
        <CapabilityMatrix />
      </div>
    </CustomerLayout>
  );
}
