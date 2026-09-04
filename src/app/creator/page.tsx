import type { Metadata } from "next";
import { CreatorHomeV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "创作首页 · 镜构智能",
  description: "继续真实 Creator Core 项目，或查看快速创作的开放边界。",
};

export default function WorkspacePage() {
  return <CreatorHomeV3 />;
}
