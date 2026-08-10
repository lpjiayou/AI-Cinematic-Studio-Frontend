import type { HTMLAttributes, ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./layouts.module.css";

export interface WorkspaceLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  sidebar?: ReactNode;
  projectNavigator?: ReactNode;
  topbar?: ReactNode;
  inspector?: ReactNode;
  bottomDrawer?: ReactNode;
  sidebarCollapsed?: boolean;
  inspectorOpen?: boolean;
  bottomDrawerOpen?: boolean;
  contentLabel?: string;
}

export function WorkspaceLayout({
  children,
  sidebar,
  projectNavigator,
  topbar,
  inspector,
  bottomDrawer,
  sidebarCollapsed = false,
  inspectorOpen = true,
  bottomDrawerOpen = false,
  contentLabel = "工作区内容",
  className,
  ...props
}: WorkspaceLayoutProps) {
  const hasProjectNavigator = Boolean(projectNavigator);
  const hasInspector = Boolean(inspector && inspectorOpen);
  const hasBottomDrawer = Boolean(bottomDrawer && bottomDrawerOpen);

  return (
    <div
      className={mergeClassNames(styles.workspaceLayout, className)}
      data-has-sidebar={Boolean(sidebar) || undefined}
      data-sidebar-collapsed={sidebarCollapsed || undefined}
      {...props}
    >
      {sidebar && (
        <aside className={styles.workspaceSidebar} aria-label="全局工作区">
          {sidebar}
        </aside>
      )}
      <div className={styles.workspaceFrame}>
        {topbar && <header className={styles.workspaceTopbar}>{topbar}</header>}
        <div
          className={styles.workspaceBody}
          data-project-navigator-open={hasProjectNavigator || undefined}
          data-inspector-open={hasInspector || undefined}
        >
          {hasProjectNavigator && (
            <aside className={styles.workspaceProjectNavigator} aria-label="项目导航器">
              {projectNavigator}
            </aside>
          )}
          <main className={styles.workspaceContent} aria-label={contentLabel}>
            {children}
          </main>
          {hasInspector && (
            <aside className={styles.workspaceInspector} aria-label="工作区检查器">
              {inspector}
            </aside>
          )}
        </div>
        {hasBottomDrawer && (
          <section className={styles.workspaceDrawer} aria-label="工作区底部抽屉">
            {bottomDrawer}
          </section>
        )}
      </div>
    </div>
  );
}
