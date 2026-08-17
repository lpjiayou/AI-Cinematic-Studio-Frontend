import type { Metadata } from "next";
import { ConnectedProductionWorkspace } from "../production/production-workspace";

export const metadata: Metadata = {
  title: "预览与质检 · 镜构智能",
  description: "播放 K2 单集预览，核对机器质检并提交外部人工审批引用。",
};

export default async function PostRoute({ params }: { params: Promise<{ projectRef: string }> }) {
  const { projectRef } = await params;
  return <ConnectedProductionWorkspace initialStage="review" projectRef={projectRef} />;
}
