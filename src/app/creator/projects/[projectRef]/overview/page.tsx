import type { Metadata } from "next";
import { ProjectOverviewV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "项目概览 · 镜构智能",
  description: "查看真实 Creator Core 项目的摘要、迁移导航与下一安全动作。",
};

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  return <ProjectOverviewV3 projectRef={projectRef} />;
}
