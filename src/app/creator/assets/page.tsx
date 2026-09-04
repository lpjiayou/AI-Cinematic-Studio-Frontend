import type { Metadata } from "next";
import { BlockedGlobalDestinationV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "资产 · 镜构智能",
  description: "查看统一资产、候选、版权与血缘产品面的当前开放边界。",
};

export default function AssetsPage() {
  return <BlockedGlobalDestinationV3 destinationKey="assets" />;
}
