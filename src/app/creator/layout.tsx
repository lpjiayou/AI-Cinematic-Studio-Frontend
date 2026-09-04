import type { ReactNode } from "react";
import { CreatorIntegrationProvider } from "@/features/core-integration";
import { CreatorRouteShellBoundary } from "./creator-route-shell-boundary";

interface CreatorLayoutProps {
  children: ReactNode;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return (
    <CreatorIntegrationProvider>
      <CreatorRouteShellBoundary>{children}</CreatorRouteShellBoundary>
    </CreatorIntegrationProvider>
  );
}
