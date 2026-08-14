import type { Metadata } from "next";
import { StoryWorldPage } from "./story-world";

export const metadata: Metadata = {
  title: "故事世界 · 镜构智能",
  description: "建立电影世界的规则、历史、地点、阵营、文化与视觉语言。",
};

export default function StoryWorldRoute() {
  return <StoryWorldPage />;
}
