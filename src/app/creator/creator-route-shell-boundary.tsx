"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UnifiedAppHeader } from "@/components";
import {
  CharacterStudioV3,
  ProjectOverviewV3,
  ScriptStudioV3,
  StoryWorkspaceV3,
  classifyCreatorRoute,
} from "@/features/creator-v3";
import styles from "./global-shell.module.css";

export function CreatorRouteShellBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const classification = classifyCreatorRoute(pathname);

  if (classification.shell === "v3") {
    if (classification.route.kind === "project") {
      // The frozen dynamic layout still owns chrome for legacy project routes.
      // Rendering here keeps that layout untouched and unmounted on V3 routes.
      const { destinationId, projectRef } = classification.route;
      if (destinationId === "overview") return <ProjectOverviewV3 projectRef={projectRef} />;
      if (destinationId === "story") return <StoryWorkspaceV3 projectRef={projectRef} />;
      if (destinationId === "script") return <ScriptStudioV3 projectRef={projectRef} />;
      return <CharacterStudioV3 projectRef={projectRef} />;
    }
    return children;
  }

  return (
    <div className={styles.shell}>
      <UnifiedAppHeader mode="auto" />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
