import type { Metadata } from "next";
import { ProjectCenterV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "项目 · 镜构智能",
  description: "查找、创建并继续真实 Creator Core 项目。",
};

export default function ProjectsPage() {
  return <ProjectCenterV3 />;
}
