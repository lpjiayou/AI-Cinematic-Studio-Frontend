import type { Metadata } from "next";
import { AudioWorkspaceV3 } from "@/features/creator-v3/workspaces";

export const metadata: Metadata = { title: "音频工作区 · 镜构智能" };
export default async function AudioPage({ params }: { params: Promise<{ projectRef: string }> }) {
  const { projectRef } = await params;
  return <AudioWorkspaceV3 key={projectRef} projectRef={projectRef} />;
}
