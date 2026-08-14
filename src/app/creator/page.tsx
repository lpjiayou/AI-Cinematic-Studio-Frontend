import type { Metadata } from "next";
import { WorkspaceHomePage } from "./workspace-home";

export const metadata: Metadata = {
  title: "创作工作台 · 镜构智能",
  description: "镜构智能 AI Cinematic Studio 创作工作台。",
};

export default function WorkspacePage() {
  return <WorkspaceHomePage />;
}
