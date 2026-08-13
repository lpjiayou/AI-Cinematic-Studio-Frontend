import type { ReactNode } from "react";
import styles from "./project-context-bar.module.css";

interface ProjectContextLayoutProps {
  children: ReactNode;
}

const EMPTY_CONTEXT = ["项目", "系列", "单集", "阶段", "对象", "版本"] as const;

export default function ProjectContextLayout({ children }: ProjectContextLayoutProps) {
  return (
    <>
      <section aria-label="项目上下文" className={styles.contextBar}>
        <div className={styles.inner}>
          <div className={styles.heading}>
            <p>PROJECT CONTEXT</p>
            <strong>未连接可信上下文</strong>
          </div>
          <dl className={styles.contextGrid}>
            {EMPTY_CONTEXT.map((label) => (
              <div className={styles.contextItem} key={label}>
                <dt>{label}</dt>
                <dd>未连接</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      {children}
    </>
  );
}
