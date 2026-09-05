import type { Metadata } from "next";
import { StoryWorkspaceV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "故事 · 镜构智能",
  description: "建立系列规划并核对真实世界与角色连续性来源。",
};

export default async function StoryPage({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  return <StoryWorkspaceV3 projectRef={projectRef} />;
}
