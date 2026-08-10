import type { HTMLAttributes, ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./layouts.module.css";

export interface EditorLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  navigator?: ReactNode;
  toolbar?: ReactNode;
  inspector?: ReactNode;
  actionBar?: ReactNode;
  bottomDrawer?: ReactNode;
  navigatorOpen?: boolean;
  inspectorOpen?: boolean;
  bottomDrawerOpen?: boolean;
  canvasLabel?: string;
}

export function EditorLayout({
  children,
  navigator,
  toolbar,
  inspector,
  actionBar,
  bottomDrawer,
  navigatorOpen = true,
  inspectorOpen = true,
  bottomDrawerOpen = false,
  canvasLabel = "编辑器画布",
  className,
  ...props
}: EditorLayoutProps) {
  const hasNavigator = Boolean(navigator && navigatorOpen);
  const hasInspector = Boolean(inspector && inspectorOpen);
  const hasBottomDrawer = Boolean(bottomDrawer && bottomDrawerOpen);

  return (
    <div className={mergeClassNames(styles.editorLayout, className)} {...props}>
      {toolbar && <header className={styles.editorToolbar}>{toolbar}</header>}
      <div
        className={styles.editorBody}
        data-navigator-open={hasNavigator || undefined}
        data-inspector-open={hasInspector || undefined}
      >
        {hasNavigator && (
          <aside className={styles.editorNavigator} aria-label="对象导航器">
            {navigator}
          </aside>
        )}
        <main className={styles.editorCanvas} aria-label={canvasLabel}>
          {children}
        </main>
        {hasInspector && (
          <aside className={styles.editorInspector} aria-label="编辑器检查器">
            {inspector}
          </aside>
        )}
      </div>
      {hasBottomDrawer && (
        <section className={styles.editorDrawer} aria-label="编辑器底部抽屉">
          {bottomDrawer}
        </section>
      )}
      {actionBar && <footer className={styles.editorActionBar}>{actionBar}</footer>}
    </div>
  );
}
