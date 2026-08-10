import type { HTMLAttributes, ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./layouts.module.css";

export interface CustomerLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  announcement?: ReactNode;
  contained?: boolean;
}

export function CustomerLayout({
  children,
  header,
  footer,
  announcement,
  contained = true,
  className,
  ...props
}: CustomerLayoutProps) {
  return (
    <div className={mergeClassNames(styles.customerLayout, className)} {...props}>
      {announcement && <div className={styles.customerAnnouncement}>{announcement}</div>}
      {header && <header className={styles.customerHeader}>{header}</header>}
      <main className={styles.customerMain} data-contained={contained || undefined}>
        {children}
      </main>
      {footer && <footer className={styles.customerFooter}>{footer}</footer>}
    </div>
  );
}
