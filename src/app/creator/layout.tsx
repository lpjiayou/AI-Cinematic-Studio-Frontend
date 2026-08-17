import type { ReactNode } from "react";
import { UnifiedAppHeader } from "@/components";
import { CreatorIntegrationProvider } from "@/features/core-integration";
import styles from "./global-shell.module.css";

interface CreatorLayoutProps {
  children: ReactNode;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return (
    <CreatorIntegrationProvider>
      <div className={styles.shell}>
        <UnifiedAppHeader mode="auto" />

        <div className={styles.content}>{children}</div>
      </div>
    </CreatorIntegrationProvider>
  );
}
