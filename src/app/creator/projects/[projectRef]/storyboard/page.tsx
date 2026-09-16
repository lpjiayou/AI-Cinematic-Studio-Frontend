import type { Metadata } from "next";
import { StoryboardWorkspaceV3 } from "@/features/creator-v3/workspaces";

export const metadata: Metadata = { title: "分镜工作区 · 镜构智能" };
export default async function StoryboardPage({ params }: { params: Promise<{ projectRef: string }> }) {
  const { projectRef } = await params;
  return <StoryboardWorkspaceV3 key={projectRef} projectRef={projectRef} />;
}
