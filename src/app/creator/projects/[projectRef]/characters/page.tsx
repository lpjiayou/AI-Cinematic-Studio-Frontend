import type { Metadata } from "next";
import { CharacterStudioV3 } from "@/features/creator-v3";

export const metadata: Metadata = {
  title: "角色 · 镜构智能",
  description: "核对真实角色连续性版本、状态区间、关系与权威来源。",
};

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  return <CharacterStudioV3 projectRef={projectRef} />;
}
