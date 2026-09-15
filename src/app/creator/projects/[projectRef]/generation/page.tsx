import type { Metadata } from "next";
import { GenerationWorkspaceV3 } from "@/features/creator-v3/workspaces/generation/generation-workspace-v3";

export const metadata: Metadata = { title: "视频生成 · 镜构智能" };
export default async function GenerationPage({ params }: { params: Promise<{ projectRef: string }> }) {
  const { projectRef } = await params;
  return <GenerationWorkspaceV3 key={projectRef} projectRef={projectRef} />;
}
