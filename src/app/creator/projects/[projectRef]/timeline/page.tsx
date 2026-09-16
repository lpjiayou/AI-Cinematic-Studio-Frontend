import type { Metadata } from "next";
import { TimelineWorkspaceV3 } from "@/features/creator-v3/workspaces";

export const metadata: Metadata = { title: "Timeline Studio · 镜构智能" };
export default async function TimelinePage({ params }: { params: Promise<{ projectRef: string }> }) {
  const { projectRef } = await params;
  return <TimelineWorkspaceV3 key={projectRef} projectRef={projectRef} />;
}
