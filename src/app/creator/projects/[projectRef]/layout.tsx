import type { ReactNode } from "react";
import { ProjectWorkspaceChrome } from "./project-workspace-chrome";

interface ProjectContextLayoutProps {
  children: ReactNode;
  params: Promise<{ projectRef: string }>;
}

export default async function ProjectContextLayout({ children, params }: ProjectContextLayoutProps) {
  const { projectRef } = await params;
  return (
    <>
      <ProjectWorkspaceChrome clientKey={projectRef} />
      {children}
    </>
  );
}
