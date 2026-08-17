"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACSBadge, ACSButton } from "@/components";
import {
  creatorRequest,
  CreatorClientError,
  useCreatorIntegration,
  type CreatorProject,
  type ProjectEnvelope,
  type SeriesIntelligenceWorkspaceEnvelope,
  type SeriesPlanningWorkspaceEnvelope,
} from "@/features/core-integration";
import { projectRoute } from "@/lib/project-navigation";
import styles from "../connected-workspace.module.css";

type CharacterWorkspaceState =
  | { status: "loading" }
  | {
      status: "ready";
      project: CreatorProject;
      seriesRef: string;
      planning: SeriesPlanningWorkspaceEnvelope["workspace"];
      intelligence:
        | { status: "ready"; workspace: SeriesIntelligenceWorkspaceEnvelope["workspace"] }
        | { status: "blocked"; code: string; message: string };
    }
  | { status: "error"; code: string; message: string };

function detail(error: unknown) {
  return error instanceof CreatorClientError
    ? error.detail
    : { code: "core_disconnected", message: "当前无法读取 Creator Core 工作区。" };
}

function path(resource: string, projectRef: string, seriesRef: string) {
  return `${resource}?${new URLSearchParams({ projectRef, seriesRef }).toString()}`;
}

export function ConnectedCharacterStudio({ projectRef }: { projectRef: string }) {
  const { state: connection, refresh } = useCreatorIntegration();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<CharacterWorkspaceState>({ status: "loading" });

  useEffect(() => {
    if (connection.status !== "connected") return;
    const controller = new AbortController();
    void creatorRequest<ProjectEnvelope>(`projects/${encodeURIComponent(projectRef)}`, {
      signal: controller.signal,
    })
      .then(async ({ project }) => {
        const seriesRef = project.seriesRefs[0];
        if (!seriesRef) {
          throw new CreatorClientError(409, {
            code: "series_binding_required",
            message: "当前项目没有可用于角色连续性的 Series 绑定。",
          });
        }
        const planning = await creatorRequest<SeriesPlanningWorkspaceEnvelope>(
          path("series-planning-workspaces", projectRef, seriesRef),
          { signal: controller.signal },
        );
        try {
          const intelligence = await creatorRequest<SeriesIntelligenceWorkspaceEnvelope>(
            path("series-intelligence-workspaces", projectRef, seriesRef),
            { signal: controller.signal },
          );
          return {
            project,
            seriesRef,
            planning: planning.workspace,
            intelligence: { status: "ready" as const, workspace: intelligence.workspace },
          };
        } catch (error: unknown) {
          const errorDetail = detail(error);
          return {
            project,
            seriesRef,
            planning: planning.workspace,
            intelligence: {
              status: "blocked" as const,
              code: errorDetail.code,
              message: errorDetail.message,
            },
          };
        }
      })
      .then((payload) => {
        if (!controller.signal.aborted) setState({ status: "ready", ...payload });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const errorDetail = detail(error);
        setState({ status: "error", code: errorDetail.code, message: errorDetail.message });
      });
    return () => controller.abort();
  }, [connection.status, projectRef, revision]);

  const disconnected = connection.status === "disconnected" || connection.status === "error";
  const effective: CharacterWorkspaceState = disconnected
    ? { status: "error", code: connection.error.code, message: connection.error.message }
    : state;

  const continuitySummary = (() => {
    if (effective.status !== "ready" || effective.intelligence.status !== "ready") return null;
    const workspace = effective.intelligence.workspace;
    const latest = workspace.characterContinuityVersions.at(-1);
    const content = latest && typeof latest.content === "object" && latest.content
      ? latest.content as Record<string, unknown>
      : {};
    return {
      bibleVersions: workspace.seriesBibleVersions.length,
      characterVersions: workspace.characterContinuityVersions.length,
      stateIntervals: Array.isArray(content.stateIntervals) ? content.stateIntervals.length : 0,
      relationships: Array.isArray(content.relationships) ? content.relationships.length : 0,
      baseline: workspace.sourceCompatibility,
    };
  })();

  if (effective.status === "loading") {
    return <main className={styles.statePage}><div className={styles.stateCard}><p>正在核对项目、M5 来源与 M6 角色权限…</p></div></main>;
  }

  if (effective.status === "error") {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <ACSBadge tone="neutral">{effective.code}</ACSBadge>
          <h1>无法打开权威角色工作区</h1>
          <p>{effective.message}</p>
          <ACSButton onClick={() => { refresh(); setState({ status: "loading" }); setRevision((value) => value + 1); }} variant="primary">重新连接</ACSButton>
        </div>
      </main>
    );
  }

  const planningReady = Boolean(effective.planning.plan);
  const intelligenceReady = effective.intelligence.status === "ready";

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>M6 · CHARACTER CONTINUITY WORKSPACE</p>
          <h1>{effective.project.title} · 角色工作室</h1>
          <p>这里读取角色身份、状态区间与关系连续性；不会用本地人物样例替代 Core 的权威工作区。</p>
        </div>
        <ACSBadge dot tone={intelligenceReady ? "success" : "neutral"}>
          {intelligenceReady ? "M6 已授权" : "M6 权限待接入"}
        </ACSBadge>
      </header>

      <section className={styles.statusStrip} aria-label="角色工作区前置条件">
        <div><span>M4 项目</span><strong>已连接</strong></div>
        <div><span>Series</span><strong>{effective.seriesRef}</strong></div>
        <div><span>M5 来源</span><strong>{planningReady ? "已确认" : "尚未建立"}</strong></div>
        <div><span>M6 权限</span><strong>{intelligenceReady ? "已通过" : "待外部授权"}</strong></div>
      </section>

      <div className={styles.workspaceGrid}>
        <section className={styles.characterPanel} aria-labelledby="character-authority-title">
          <div className={styles.panelHeading}>
            <div><p className={styles.eyebrow}>AUTHORITATIVE CHARACTER SURFACE</p><h2 id="character-authority-title">角色连续性状态</h2></div>
            <ACSBadge tone={intelligenceReady ? "success" : "neutral"}>{intelligenceReady ? "Core 数据" : "不可读取"}</ACSBadge>
          </div>

          {!planningReady ? (
            <div className={styles.blockedState}>
              <ACSBadge tone="neutral">m5_source_required</ACSBadge>
              <h3>先建立系列规划</h3>
              <p>角色连续性必须绑定已确认的 M5 系列规划来源。当前不会推断角色、集数或状态区间。</p>
              <Link className={styles.textLink} href={projectRoute(projectRef, "planning/bible")}>返回故事世界建立 M5 规划</Link>
            </div>
          ) : effective.intelligence.status === "blocked" ? (
            <div className={styles.blockedState}>
              <ACSBadge tone="neutral">{effective.intelligence.code}</ACSBadge>
              <h3>M6 外部权限尚未接入</h3>
              <p>{effective.intelligence.message}</p>
              <p>需要准确的范围审批与身份权限，前端不会伪造角色引用，也不会展示本地角色卡作为替代。</p>
            </div>
          ) : continuitySummary ? (
            <>
              <div className={styles.featureStatement}>
                <span>激活基线兼容性</span>
                <h3>{continuitySummary.baseline}</h3>
                <p>所有角色版本、状态区间和关系边界均在当前项目与系列范围内读取。</p>
              </div>
              <dl className={styles.factList}>
                <div><dt>世界圣经版本</dt><dd>{continuitySummary.bibleVersions}</dd></div>
                <div><dt>角色连续性版本</dt><dd>{continuitySummary.characterVersions}</dd></div>
                <div><dt>角色状态区间</dt><dd>{continuitySummary.stateIntervals}</dd></div>
                <div><dt>有时序边界的关系</dt><dd>{continuitySummary.relationships}</dd></div>
              </dl>
              {continuitySummary.characterVersions === 0 ? (
                <div className={styles.blockedState}>
                  <ACSBadge tone="neutral">authoritative_empty</ACSBadge>
                  <h3>当前还没有角色连续性版本</h3>
                  <p>这是 Core 返回的真实空状态。创建写入仍受 M6 权限与已确认来源约束。</p>
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <aside className={styles.sidePanel} aria-labelledby="character-next-title">
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>SAFE NEXT ACTION</p><h2 id="character-next-title">当前可执行动作</h2></div></div>
          <p className={styles.operationMessage}>M6 写入需要外部权限、已确认 M5 来源以及真实上游引用。条件不足时保持只读阻断。</p>
          <Link className={styles.textLink} href={projectRoute(projectRef, "planning/bible")}>查看故事世界与系列规划</Link>
          <Link className={styles.textLink} href="/creator/projects">返回项目中心</Link>
        </aside>
      </div>
    </main>
  );
}
