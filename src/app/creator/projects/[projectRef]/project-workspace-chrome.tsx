"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  creatorRequest,
  CreatorClientError,
  useCreatorIntegration,
  type CreatorProject,
  type ProjectEnvelope,
} from "@/features/core-integration";
import { getLocalProjectPresentation, LOCAL_PROJECT_CLIENT_KEYS } from "@/features/project-data";
import { PLANNING_NAVIGATION, projectRoute } from "@/lib/project-navigation";
import styles from "./project-context-bar.module.css";

export function ProjectWorkspaceChrome({ clientKey }: { clientKey: string }) {
  const pathname = usePathname();
  const isPlanning = pathname.includes("/planning/");
  const local = new Set<string>(LOCAL_PROJECT_CLIENT_KEYS).has(clientKey);
  const localProject = local ? getLocalProjectPresentation(clientKey) : null;
  const { state: connection } = useCreatorIntegration();
  const [coreProject, setCoreProject] = useState<CreatorProject | null>(null);
  const [coreError, setCoreError] = useState<string | null>(null);

  useEffect(() => {
    if (local || connection.status !== "connected") return;
    const controller = new AbortController();
    void creatorRequest<ProjectEnvelope>(`projects/${encodeURIComponent(clientKey)}`, {
      signal: controller.signal,
    })
      .then((payload) => {
        setCoreProject(payload.project);
        setCoreError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setCoreError(
          error instanceof CreatorClientError
            ? error.detail.message
            : "无法读取当前 Core 项目。",
        );
      });
    return () => controller.abort();
  }, [clientKey, connection.status, local]);

  const connected = !local && connection.status === "connected" && Boolean(coreProject);
  const title = localProject?.display.projectTitle ?? coreProject?.title ?? clientKey;
  const boundaryDetail = local
    ? "非权威演示数据"
    : coreError
      ? coreError
      : connected
        ? `项目 ${coreProject?.projectRef}`
        : "正在核对权威项目";

  return (
    <section aria-label="项目上下文" className={styles.contextBar}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <div className={styles.boundary}>
            <strong>{local ? "本地演示" : connected ? "Core v1" : "Core 项目"}</strong>
            <span>{boundaryDetail}</span>
          </div>
          <div className={styles.workspaceKey}>
            <span>当前项目</span>
            <strong>{title}</strong>
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
