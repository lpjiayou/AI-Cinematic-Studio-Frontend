import type { Metadata } from "next";
import {
  BLOCKED_GLOBAL_DESTINATIONS,
  BlockedGlobalDestinationV3,
} from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "快速创作 · 镜构智能",
  description: "查看快速创作运行时与产品界面的当前开放边界。",
};

export default function QuickCreatePage() {
  return <BlockedGlobalDestinationV3 config={BLOCKED_GLOBAL_DESTINATIONS["quick-create"]} />;
}
