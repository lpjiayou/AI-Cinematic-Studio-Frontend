"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLANNING_NAVIGATION, projectRoute } from "@/lib/project-navigation";
import styles from "./project-context-bar.module.css";

const EMPTY_CONTEXT = ["项目", "系列", "单集", "阶段", "对象", "版本"] as const;

export function ProjectWorkspaceChrome({ clientKey }: { clientKey: string }) {
  const pathname = usePathname();
  const isPlanning = pathname.includes("/planning/");

  return (
    <section aria-label="项目上下文" className={styles.contextBar}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <div className={styles.boundary}>
            <strong>本地演示</strong>
            <span>非权威项目数据</span>
          </div>
          <div className={styles.workspaceKey}>
            <span>本地工作区键</span>
            <code>{clientKey}</code>
          </div>
        </div>

        <dl className={styles.contextGrid}>
          {EMPTY_CONTEXT.map((label) => (
            <div className={styles.contextItem} key={label}>
              <dt>{label}</dt>
              <dd>未连接</dd>
            </div>
          ))}
        </dl>

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
