import type { Metadata } from "next";
import { ConnectedProductionWorkspace, type ProductionWorkspaceStage } from "./production-workspace";

export const metadata: Metadata = {
  title: "单集制作 · 镜构智能",
  description: "连接真实 Core 单集运行，查看镜头图、资产与媒体任务。",
};

export default async function ProductionRoute({
  params,
  searchParams,
}: {
  params: Promise<{ projectRef: string }>;
  searchParams: Promise<{ stage?: string }>;
}) {
  const [{ projectRef }, query] = await Promise.all([params, searchParams]);
  const stage: ProductionWorkspaceStage = query.stage === "assets" ? "assets" : "shots";
  return <ConnectedProductionWorkspace initialStage={stage} projectRef={projectRef} />;
}
