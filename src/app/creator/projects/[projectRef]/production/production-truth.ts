import type { K2ProductionStateProjectionEnvelope } from "@/features/core-integration/contracts";

const STALE_REASONS = {
  revision: {
    title: "素材版本已经变化，需要重新审查",
    description: "当前活动修订绑定的准入或候选血缘已不是最新版本。旧决定继续作为历史证据保留，但不能用于新的预览、审批或交付。",
  },
  qc: {
    title: "视觉质检基于旧候选",
    description: "候选或素材版本已经变化，现有视觉质检不能证明当前版本通过。",
  },
  blockedQc: {
    title: "当前修订已过期，质检保持阻断",
    description: "必须重新完成当前候选的选择、准入和视觉审查，旧质检结果不能继续推进生产。",
  },
} as const;

export function productionTruthHold(projection: K2ProductionStateProjectionEnvelope | null) {
  if (!projection) return [];
  const reasons: Array<{ title: string; description: string }> = [];
  if (projection.activeRevision.state === "STALE_BLOCKED") reasons.push(STALE_REASONS.revision);
  if (projection.visualQcState.state === "STALE") reasons.push(STALE_REASONS.qc);
  if (projection.visualQcState.state === "STALE_BLOCKED") reasons.push(STALE_REASONS.blockedQc);
  return reasons;
}
