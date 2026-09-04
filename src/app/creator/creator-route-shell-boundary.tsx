"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UnifiedAppHeader } from "@/components";
import {
  ProjectOverviewV3,
  classifyCreatorRoute,
} from "@/features/creator-v3";
import styles from "./global-shell.module.css";

export function CreatorRouteShellBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const classification = classifyCreatorRoute(pathname);

  if (classification.shell === "v3") {
    if (classification.route.kind === "project-overview") {
      // The frozen dynamic layout still owns chrome for legacy project routes.
      // Rendering here keeps that layout untouched and unmounted on overview.
      return <ProjectOverviewV3 projectRef={classification.route.projectRef} />;
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
