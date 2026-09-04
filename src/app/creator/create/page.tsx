import type { Metadata } from "next";
import { BlockedGlobalDestinationV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "快速创作 · 镜构智能",
  description: "查看快速创作运行时与产品界面的当前开放边界。",
};

export default function QuickCreatePage() {
  return <BlockedGlobalDestinationV3 destinationKey="quick-create" />;
}
