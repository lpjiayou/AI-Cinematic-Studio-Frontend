"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalProjectPresentation } from "@/features/project-data";
import { PLANNING_NAVIGATION, projectRoute } from "@/lib/project-navigation";
import styles from "./project-context-bar.module.css";

export function ProjectWorkspaceChrome({ clientKey }: { clientKey: string }) {
  const pathname = usePathname();
  const isPlanning = pathname.includes("/planning/");
  const project = getLocalProjectPresentation(clientKey);

  return (
    <section aria-label="项目上下文" className={styles.contextBar}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <div className={styles.boundary}>
            <strong>本地工作区</strong>
            <span>未连接正式项目数据</span>
          </div>
          <div className={styles.workspaceKey}>
            <span>当前项目</span>
            <strong>{project.display.projectTitle}</strong>
          </div>
        </div>

        {isPlanning ? (
          <nav aria-label="项目策划导航" className={styles.subnavigation}>
            <ul>
              {PLANNING_NAVIGATION.map((item) => {
                const href = projectRoute(clientKey, `planning/${item.segment}`);
                const current = pathname.endsWith(`/planning/${item.segment}`);

                return (
                  <li key={item.segment}>
                    {item.available ? (
                      <Link
                        aria-current={current ? "page" : undefined}
                        aria-label={item.label}
                        href={href}
                      >
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </Link>
                    ) : (
                      <span aria-disabled="true" title={item.unavailableReason}>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                        <em>尚未开放</em>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
