import type { Metadata } from "next";
import {
  BLOCKED_GLOBAL_DESTINATIONS,
  BlockedGlobalDestinationV3,
} from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "作品 · 镜构智能",
  description: "查看跨项目 Master、交付与发布对象的当前授权边界。",
};

export default function WorksPage() {
  return <BlockedGlobalDestinationV3 config={BLOCKED_GLOBAL_DESTINATIONS.works} />;
}
