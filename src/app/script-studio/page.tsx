import type { Metadata } from "next";
import { ScriptStudioPage } from "./script-studio";

export const metadata: Metadata = {
  title: "剧本工作台 · 镜构智能",
  description: "镜构智能 AI Cinematic Studio 专业剧本创作与候选比较工作台。",
};

export default function Page() {
  return <ScriptStudioPage />;
}
