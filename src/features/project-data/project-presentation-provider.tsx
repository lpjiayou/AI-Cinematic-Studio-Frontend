"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProjectPresentationViewModel } from "./project-presentation";

const ProjectPresentationContext = createContext<ProjectPresentationViewModel | null>(null);

export function ProjectPresentationProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: ProjectPresentationViewModel;
}) {
  return (
    <ProjectPresentationContext.Provider value={value}>
      {children}
    </ProjectPresentationContext.Provider>
  );
}

export function useProjectPresentation() {
  const value = useContext(ProjectPresentationContext);
  if (!value) {
    throw new Error("ProjectPresentationProvider is required for project workspaces");
  }
  return value;
}

