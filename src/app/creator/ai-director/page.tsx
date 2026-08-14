import type { Metadata } from "next";
import { AIDirectorPage } from "./ai-director";

export const metadata: Metadata = {
  title: "AI 导演 · 镜构智能",
  description: "与 AI 导演共同整理故事意图、视觉方向与导演方案预览。",
};

export default function DirectorPage() {
  return <AIDirectorPage />;
}
