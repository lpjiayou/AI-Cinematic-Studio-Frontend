import type { Metadata } from "next";
import {
  getLocalProjectPresentation,
  LOCAL_PROJECT_CLIENT_KEYS,
  ProjectPresentationProvider,
} from "@/features/project-data";
import { ConnectedStoryWorld } from "./connected-story-world";
import { StoryWorldPage } from "./story-world";

export const metadata: Metadata = {
  title: "故事世界 · 镜构智能",
  description: "建立电影世界的规则、历史、地点、阵营、文化与视觉语言。",
};

export default async function StoryWorldRoute({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  const local = new Set<string>(LOCAL_PROJECT_CLIENT_KEYS).has(projectRef);
  if (!local) return <ConnectedStoryWorld projectRef={projectRef} />;
  return (
    <ProjectPresentationProvider value={getLocalProjectPresentation(projectRef)}>
      <StoryWorldPage />
    </ProjectPresentationProvider>
  );
}
