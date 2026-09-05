import type { Metadata } from "next";
import { ScriptStudioV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "剧本 · 镜构智能",
  description: "在真实项目和分集范围内生成、修订、比较并确认剧本版本。",
};

export default async function ScriptPage({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  return <ScriptStudioV3 projectRef={projectRef} />;
}
