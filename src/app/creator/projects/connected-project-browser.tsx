"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACSBadge } from "@/components";
import {
  creatorRequest,
  CreatorClientError,
  useCreatorIntegration,
  type CreatorProject,
  type ProjectsEnvelope,
} from "@/features/core-integration";
import { projectRoute } from "@/lib/project-navigation";
import styles from "./projects-page.module.css";

type ProjectCollectionState =
  | { status: "idle" | "loading" }
  | { status: "ready"; projects: CreatorProject[] }
  | { status: "error"; code: string; message: string };

function EmptyOrError({ state }: { state: ProjectCollectionState }) {
  const error = state.status === "error";
  return (
    <section aria-labelledby="project-empty-title" className={styles.emptyState}>
      <span className={styles.emptyMarker} aria-hidden="true" />
      <p className={styles.emptyEyebrow}>
        {error ? "CORE CONNECTION REQUIRED" : "AUTHORITATIVE PROJECT COLLECTION"}
      </p>
      <h2 id="project-empty-title">
        {state.status === "loading" || state.status === "idle"
          ? "正在核对权威项目集合"
          : error
            ? "暂时无法读取权威项目"
            : "还没有已保存的项目"}
      </h2>
      <p>
        {state.status === "loading" || state.status === "idle"
          ? "连接只通过 Frontend Experience Adapter 访问 Creator Public API。"
          : error
            ? state.message
            : "Core 已返回空项目集合。你可以新建第一个项目；下方本地演示仍作为独立非权威入口保留。"}
      </p>
      <div className={styles.emptyActions}>
        <Link className={styles.primaryAction} href="/creator/projects/new">
          新建项目
        </Link>
        <Link className={styles.secondaryAction} href="/creator">
          返回创作入口
        </Link>
      </div>
    </section>
  );
}

export function ConnectedProjectBrowser() {
  const { state: connection, refresh } = useCreatorIntegration();
  const [collection, setCollection] = useState<ProjectCollectionState>({ status: "idle" });

  useEffect(() => {
    if (connection.status !== "connected") return;
    const controller = new AbortController();
    void creatorRequest<ProjectsEnvelope>("projects", { signal: controller.signal })
      .then((payload) => setCollection({ status: "ready", projects: payload.projects }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof CreatorClientError) {
          setCollection({
            status: "error",
            code: error.detail.code,
            message: error.detail.message,
          });
          return;
        }
        setCollection({
          status: "error",
          code: "core_disconnected",
          message: "当前无法读取 Creator Core 的项目集合。",
        });
      });
    return () => controller.abort();
  }, [connection]);

  const effectiveCollection: ProjectCollectionState =
    connection.status === "disconnected" || connection.status === "error"
      ? {
          status: "error",
          code: connection.error.code,
          message: connection.error.message,
        }
      : collection;
  const projects = effectiveCollection.status === "ready" ? effectiveCollection.projects : [];
  const connected = connection.status === "connected";

  return (
    <section aria-label="项目浏览器" className={styles.browser}>
      <aside aria-labelledby="project-source-title" className={styles.sourcePanel}>
        <div className={styles.panelHeading}>
          <h2 id="project-source-title">项目数据源</h2>
          <ACSBadge tone={connected ? "success" : "neutral"}>
            {connected ? "Core v1" : "未连接"}
          </ACSBadge>
        </div>
        <p>
          {connected
            ? "项目来自 Creator Public API；工作区范围由服务端适配层注入。"
            : "没有连接时不会从动态路由或本地预览推断权威项目身份。"}
        </p>
        <dl className={styles.sourceFacts}>
          <div>
            <dt>可显示项目</dt>
            <dd>{effectiveCollection.status === "ready" ? projects.length : "待核对"}</dd>
          </div>
          <div>
            <dt>数据来源</dt>
            <dd>{connected ? "CORE" : "不可用"}</dd>
          </div>
          <div>
            <dt>M6</dt>
            <dd>{connected ? "需外部授权" : "等待连接"}</dd>
          </div>
        </dl>
        {(connection.status === "disconnected" || connection.status === "error") && (
          <button className={styles.retryButton} onClick={refresh} type="button">
            重新连接
          </button>
        )}
      </aside>

      {effectiveCollection.status === "ready" && projects.length ? (
        <section aria-label="权威项目列表" className={styles.authoritativeProjects}>
          <header>
            <p className={styles.emptyEyebrow}>CORE PROJECTS</p>
            <h2>继续制作</h2>
            <span>{projects.length} 个权威项目</span>
          </header>
          <div className={styles.authoritativeGrid}>
            {projects.map((project) => (
              <article key={project.projectRef} className={styles.authoritativeCard}>
                <div>
                  <ACSBadge tone="success">{project.status === "active" ? "进行中" : project.status}</ACSBadge>
                  <span>v{project.version}</span>
                </div>
                <h3>{project.title}</h3>
                <p>{project.description || "尚未填写项目说明。"}</p>
                <dl>
                  <div><dt>类型</dt><dd>{project.projectType}</dd></div>
                  <div><dt>画幅</dt><dd>{project.aspectRatio}</dd></div>
                  <div><dt>规划集数</dt><dd>{project.plannedEpisodeCount}</dd></div>
                </dl>
                <Link
                  className={styles.primaryAction}
                  href={projectRoute(project.projectRef, "planning/bible")}
                >
                  打开项目工作区
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyOrError state={effectiveCollection} />
      )}
    </section>
  );
}
