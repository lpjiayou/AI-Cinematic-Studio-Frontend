"use client";

import Link from "next/link";
import {
  CapabilityBlocker,
  type AuthorityLayerView,
  type CapabilityBlockerClass,
  type EvidenceFieldView,
  type GlobalRailDestinationId,
} from "@/components";
import { useCreatorIntegration } from "@/features/core-integration";
import { CreatorGlobalShell, type CreatorGlobalConnectionState } from "../shell";
import styles from "./blocked-global-destination-v3.module.css";

export type BlockedGlobalDestinationKey = "quick-create" | "assets" | "jobs" | "works";

export interface BlockedGlobalDestinationConfiguration {
  destinationId: GlobalRailDestinationId;
  title: string;
  description: string;
  statusLabel: string;
  blockerClass: CapabilityBlockerClass;
  affectedCapability: string;
  blockerTitle: string;
  cause: string;
  consequence: string;
  owner: string;
  safeActionLabel: string;
  safeActionHref: string;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

export interface BlockedGlobalDestinationV3Props {
  destinationKey: BlockedGlobalDestinationKey;
}

const BLOCKED_GLOBAL_DESTINATIONS: Record<
  BlockedGlobalDestinationKey,
  BlockedGlobalDestinationConfiguration
> = {
  "quick-create": {
    destinationId: "quick-create",
    title: "快速创作",
    description: "了解单个图像、视频或音频任务的当前开放边界。",
    statusLabel: "运行时受阻",
    blockerClass: "runtime_unavailable",
    affectedCapability: "图像、视频和音频快速生成",
    blockerTitle: "快速创作尚未开放执行",
    cause: "Method-aware 前端接线和对应运行时尚未完成",
    consequence: "当前不能提交真实生成任务",
    owner: "M10–M13 前端与运行时实施波次",
    safeActionLabel: "进入项目中心",
    safeActionHref: "/creator/projects",
    secondaryActionLabel: "打开 AI 导演",
    secondaryActionHref: "/creator/ai-director",
  },
  assets: {
    destinationId: "assets",
    title: "资产",
    description: "统一查看素材、候选、版本、版权与血缘的产品面边界。",
    statusLabel: "界面未完成",
    blockerClass: "ui_missing",
    affectedCapability: "统一资产、候选、版权和血缘浏览",
    blockerTitle: "统一资产库产品面尚未完成",
    cause: "当前尚未完成全局 AssetVersion 索引和产品级读取接线",
    consequence: "当前不能通过此页面上传、选择或准入资产",
    owner: "Frontend Wave 5A",
    safeActionLabel: "返回项目中心",
    safeActionHref: "/creator/projects",
  },
  jobs: {
    destinationId: "jobs",
    title: "任务",
    description: "跨项目查看排队、运行、阻断和失败任务的产品面边界。",
    statusLabel: "界面未完成",
    blockerClass: "ui_missing",
    affectedCapability: "跨项目任务监控与恢复",
    blockerTitle: "跨项目任务投影尚未接入",
    cause: "当前没有经过批准的跨项目 Job projection",
    consequence: "本页面不能读取内部 queue，也不能安全提供重试或取消",
    owner: "Frontend Wave 5B",
    safeActionLabel: "返回创作首页",
    safeActionHref: "/creator",
  },
  works: {
    destinationId: "works",
    title: "作品",
    description: "查看跨项目 Master、交付和未来发布对象的授权边界。",
    statusLabel: "需要授权",
    blockerClass: "authority_required",
    affectedCapability: "跨项目 Master、交付和发布对象",
    blockerTitle: "作品与发布权限尚未开放",
    cause: "M15 之后的 Master、发布和商业化 Authority 尚未完成",
    consequence: "当前不能把 PreviewCandidate 或 Restricted Export 表示为作品",
    owner: "M15–M17 后端与授权波次",
    safeActionLabel: "打开项目中心",
    safeActionHref: "/creator/projects",
  },
};

function connectionState(status: string): CreatorGlobalConnectionState {
  if (status === "connected") return "connected";
  if (status === "disconnected") return "disconnected";
  if (status === "error") return "error";
  return "loading";
}

function authorityLayers(config: BlockedGlobalDestinationConfiguration): readonly AuthorityLayerView[] {
  return [
    { id: "ui", label: "界面", state: config.blockerClass === "runtime_unavailable" ? "available" : "not_open", stateLabel: config.blockerClass === "runtime_unavailable" ? "说明页可用" : "尚未开放", message: config.blockerClass === "runtime_unavailable" ? "阻断说明和安全入口已可用" : config.blockerTitle },
    { id: "runtime", label: "运行时", state: config.blockerClass === "runtime_unavailable" ? "blocked" : "unverified", stateLabel: config.blockerClass === "runtime_unavailable" ? "不可用" : "尚未核验", message: config.blockerClass === "runtime_unavailable" ? config.cause : "本页面不执行或核验运行时" },
    { id: "authority", label: "授权", state: config.blockerClass === "authority_required" ? "required" : "unverified", stateLabel: config.blockerClass === "authority_required" ? "需要授权" : "尚未核验", message: config.blockerClass === "authority_required" ? config.cause : "未读取具体对象的生产授权" },
    { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "未读取具体对象的生产策略" },
  ];
}

export function BlockedGlobalDestinationV3({
  destinationKey,
}: BlockedGlobalDestinationV3Props) {
  const config = BLOCKED_GLOBAL_DESTINATIONS[destinationKey];

  if (!config) {
    throw new Error(
      `Unknown blocked global destination: ${String(destinationKey)}`,
    );
  }

  const { state } = useCreatorIntegration();
  const evidenceFields: readonly EvidenceFieldView[] = [
    { id: "destination-state", label: "目的地状态", value: config.statusLabel, sensitivity: "ordinary", copyAllowed: false },
    { id: "blocker-class", label: "阻断类型", value: config.blockerClass, sensitivity: "restricted", copyAllowed: true },
    { id: "credentials", label: "认证与账号信息", sensitivity: "redacted", copyAllowed: false, redactedReason: "不在产品界面展示" },
  ];

  return (
    <CreatorGlobalShell
      activeDestinationId={config.destinationId}
      title={config.title}
      description={config.description}
      connectionState={connectionState(state.status)}
      authorityLayers={authorityLayers(config)}
      authoritySummary="界面、运行时、授权与策略分别呈现；此页面不会把阻断状态包装为可执行能力。"
      evidenceFields={evidenceFields}
      evidenceSummary="技术详情仅说明当前阻断类别，不包含生产对象。"
      primaryCanvas={(
        <div className={styles.canvas}>
          <header className={styles.pageHeader}>
            <span className={styles.eyebrow}>{config.statusLabel}</span>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </header>
          <CapabilityBlocker
            blockerClass={config.blockerClass}
            severity="warning"
            affectedCapability={config.affectedCapability}
            title={config.blockerTitle}
            cause={config.cause}
            consequence={config.consequence}
            owner={config.owner}
            nextSafeAction={(
              <Link className={styles.primaryLink} href={config.safeActionHref}>
                {config.safeActionLabel}
              </Link>
            )}
            evidenceAction={config.secondaryActionHref ? (
              <Link className={styles.secondaryLink} href={config.secondaryActionHref}>
                {config.secondaryActionLabel}
              </Link>
            ) : undefined}
          />
          <section className={styles.boundaryNote} aria-labelledby={`${config.destinationId}-boundary-title`}>
            <h2 id={`${config.destinationId}-boundary-title`}>当前页面边界</h2>
            <p>此目的地真实存在，但只提供可读阻断原因与安全返回路径，不执行写入或生产动作。</p>
          </section>
        </div>
      )}
    />
  );
}
