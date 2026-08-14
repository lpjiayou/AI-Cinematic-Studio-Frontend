import type { Metadata } from "next";
import { CreateProjectPage } from "./create-project";

export const metadata: Metadata = {
  title: "创建影片 · 镜构智能",
  description: "从一个创意开始构建 AI 影片导演方案。",
};

export default function CreatePage() {
  return <CreateProjectPage />;
}
