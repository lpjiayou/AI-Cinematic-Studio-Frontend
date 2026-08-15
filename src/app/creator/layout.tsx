import type { ReactNode } from "react";
import { UnifiedAppHeader } from "@/components";
import styles from "./global-shell.module.css";

interface CreatorLayoutProps {
  children: ReactNode;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return (
    <div className={styles.shell}>
      <UnifiedAppHeader mode="auto" />

      <div className={styles.content}>{children}</div>
    </div>
  );
}
