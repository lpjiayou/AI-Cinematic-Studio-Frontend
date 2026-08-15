import type { Metadata } from "next";
import { getLocalProjectPresentation, ProjectPresentationProvider } from "@/features/project-data";
import { CharacterStudioPage } from "./character-studio";

export const metadata: Metadata = {
  title: "角色工作室 · 镜构智能",
  description: "建立可持续保持的电影角色身份、行为、关系与视觉方向。",
};

export default async function CharacterStudioRoute({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  return (
    <ProjectPresentationProvider value={getLocalProjectPresentation(projectRef)}>
      <CharacterStudioPage />
    </ProjectPresentationProvider>
  );
}
