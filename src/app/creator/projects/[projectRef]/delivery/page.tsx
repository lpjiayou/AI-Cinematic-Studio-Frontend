import type { Metadata } from "next";
import { ConnectedProductionWorkspace } from "../production/production-workspace";

export const metadata: Metadata = {
  title: "母版交付 · 镜构智能",
  description: "查看不可变 K2 单集母版并下载受限本地交付文件。",
};

export default async function DeliveryRoute({ params }: { params: Promise<{ projectRef: string }> }) {
  const { projectRef } = await params;
  return <ConnectedProductionWorkspace initialStage="delivery" projectRef={projectRef} />;
}
