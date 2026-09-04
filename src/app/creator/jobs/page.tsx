import type { Metadata } from "next";
import { BlockedGlobalDestinationV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "任务 · 镜构智能",
  description: "查看跨项目任务投影与恢复产品面的当前开放边界。",
};

export default function JobsPage() {
  return <BlockedGlobalDestinationV3 destinationKey="jobs" />;
}
