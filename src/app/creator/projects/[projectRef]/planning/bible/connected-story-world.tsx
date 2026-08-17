"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACSBadge, ACSButton } from "@/components";
import {
  creatorRequest,
  CreatorClientError,
  useCreatorIntegration,
  type ConfirmedSeriesPlanEnvelope,
  type CreatorProject,
  type CreatorSeriesPlanCandidate,
  type ProjectEnvelope,
  type SeriesIntelligenceWorkspaceEnvelope,
  type SeriesPlanCandidateEnvelope,
  type SeriesPlanningWorkspaceEnvelope,
} from "@/features/core-integration";
import { projectRoute } from "@/lib/project-navigation";
import styles from "../connected-workspace.module.css";

type M6ReadState =
  | { status: "ready"; workspace: SeriesIntelligenceWorkspaceEnvelope["workspace"] }
  | { status: "blocked"; code: string; message: string };

type ConnectedWorkspaceState =
  | { status: "loading" }
  | {
      status: "ready";
      project: CreatorProject;
      seriesRef: string;
      planning: SeriesPlanningWorkspaceEnvelope["workspace"];
      intelligence: M6ReadState;
    }
  | { status: "error"; code: string; message: string };

function errorDetail(error: unknown) {
  return error instanceof CreatorClientError
    ? error.detail
    : { code: "core_disconnected", message: "当前无法读取 Creator Core 工作区。" };
}

function scopedPath(resource: string, projectRef: string, seriesRef: string) {
  const query = new URLSearchParams({ projectRef, seriesRef });
  return `${resource}?${query.toString()}`;
}

export function ConnectedStoryWorld({ projectRef }: { projectRef: string }) {
  const { state: connection, refresh } = useCreatorIntegration();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<ConnectedWorkspaceState>({ status: "loading" });
  const [creativeInput, setCreativeInput] = useState("");
  const [candidate, setCandidate] = useState<CreatorSeriesPlanCandidate | null>(null);
  const [operation, setOperation] = useState<"idle" | "generating" | "confirming">("idle");
  const [operationMessage, setOperationMessage] = useState("先建立系列叙事规划，M6 才能接收可信上游来源。");

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
            message: "当前项目没有可用于系列规划的 Series 绑定。",
          });
        }
        const planning = await creatorRequest<SeriesPlanningWorkspaceEnvelope>(
          scopedPath("series-planning-workspaces", projectRef, seriesRef),
          { signal: controller.signal },
        );
        let intelligence: M6ReadState;
        try {
          const payload = await creatorRequest<SeriesIntelligenceWorkspaceEnvelope>(
            scopedPath("series-intelligence-workspaces", projectRef, seriesRef),
            { signal: controller.signal },
          );
          intelligence = { status: "ready", workspace: payload.workspace };
        } catch (error: unknown) {
          const detail = errorDetail(error);
          intelligence = { status: "blocked", code: detail.code, message: detail.message };
        }
        return { project, seriesRef, planning: planning.workspace, intelligence };
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setState({ status: "ready", ...payload });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const detail = errorDetail(error);
        setState({ status: "error", code: detail.code, message: detail.message });
      });
    return () => controller.abort();
  }, [connection.status, projectRef, revision]);

  const disconnected = connection.status === "disconnected" || connection.status === "error";
  const effectiveState: ConnectedWorkspaceState = disconnected
    ? { status: "error", code: connection.error.code, message: connection.error.message }
    : state;
  const latestVersion =
    effectiveState.status === "ready" ? effectiveState.planning.versions.at(-1) ?? null : null;
  const inputReady = creativeInput.trim().length >= 10;

  async function generateCandidate() {
    if (effectiveState.status !== "ready" || !inputReady || effectiveState.planning.plan) return;
    setOperation("generating");
    setCandidate(null);
    setOperationMessage("Core 正在生成 M5 系列规划候选；此时不会写入系列规划。 ");
    try {
      const payload = await creatorRequest<SeriesPlanCandidateEnvelope>("series-plan-candidates", {
        method: "POST",
        body: {
          projectRef,
          seriesRef: effectiveState.seriesRef,
          creativeInput: creativeInput.trim(),
        },
      });
      setCandidate(payload.candidate);
      setOperationMessage("候选已返回。审阅并明确确认后，Core 才会建立 M5 规划版本。");
    } catch (error: unknown) {
      setOperationMessage(errorDetail(error).message);
    } finally {
      setOperation("idle");
    }
  }

  async function confirmCandidate() {
    if (effectiveState.status !== "ready" || !candidate || effectiveState.planning.plan) return;
    setOperation("confirming");
    setOperationMessage("正在提交人工确认…");
    try {
      await creatorRequest<ConfirmedSeriesPlanEnvelope>("series-plans/confirm-candidate", {
        method: "POST",
        body: {
          projectRef,
          seriesRef: effectiveState.seriesRef,
          humanConfirmed: true,
          candidate,
        },
      });
      setCandidate(null);
      setState({ status: "loading" });
      setRevision((value) => value + 1);
      setOperationMessage("M5 系列规划已确认，正在重新核对 M6 上游状态。");
    } catch (error: unknown) {
      setOperationMessage(errorDetail(error).message);
    } finally {
      setOperation("idle");
    }
  }

  const intelligenceSummary = (() => {
    if (effectiveState.status !== "ready") return null;
    const intelligence = effectiveState.intelligence;
    if (intelligence.status === "blocked") return intelligence;
    return {
      status: "ready" as const,
      bibleVersions: intelligence.workspace.seriesBibleVersions.length,
      characterVersions: intelligence.workspace.characterContinuityVersions.length,
      baseline: intelligence.workspace.sourceCompatibility,
    };
  })();

  if (effectiveState.status === "loading") {
    return <main className={styles.statePage}><div className={styles.stateCard}><p>正在读取项目、系列规划与 M6 权限状态…</p></div></main>;
  }

  if (effectiveState.status === "error") {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <ACSBadge tone="neutral">{effectiveState.code}</ACSBadge>
          <h1>无法打开权威故事工作区</h1>
          <p>{effectiveState.message}</p>
          <ACSButton onClick={() => { refresh(); setState({ status: "loading" }); setRevision((value) => value + 1); }} variant="primary">重新连接</ACSButton>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>M4 PROJECT CONTEXT · M5 SERIES PLANNING · M6 SERIES INTELLIGENCE</p>
          <h1>{effectiveState.project.title} · 故事世界</h1>
          <p>先建立系列叙事基线，再读取世界与角色智能。每个状态都来自 Creator Public API。</p>
        </div>
        <ACSBadge dot tone="success">Core 项目</ACSBadge>
      </header>

      <section className={styles.statusStrip} aria-label="权威映射状态">
        <div><span>M4 项目上下文</span><strong>已连接</strong></div>
        <div><span>Series</span><strong>{effectiveState.seriesRef}</strong></div>
        <div><span>M5 系列规划</span><strong>{effectiveState.planning.plan ? "已确认" : "待建立"}</strong></div>
        <div><span>M6 世界与角色</span><strong>{intelligenceSummary?.status === "ready" ? "可读取" : "权限待接入"}</strong></div>
      </section>

      <div className={styles.workspaceGrid}>
        <section className={styles.primaryPanel} aria-labelledby="series-plan-title">
          <div className={styles.panelHeading}>
            <div><p className={styles.eyebrow}>SERIES NARRATIVE BASELINE</p><h2 id="series-plan-title">系列规划</h2></div>
            <ACSBadge tone={effectiveState.planning.plan ? "success" : "neutral"}>
              {effectiveState.planning.plan ? `v${effectiveState.planning.plan.version}` : "尚未建立"}
            </ACSBadge>
          </div>

          {effectiveState.planning.plan && latestVersion ? (
            <div className={styles.planContent}>
              <div className={styles.featureStatement}>
                <span>系列概念</span>
                <h3>{latestVersion.seriesConcept}</h3>
                <p>{latestVersion.logline}</p>
              </div>
              <div className={styles.arcGrid}>
                {latestVersion.mainArcs.map((arc) => (
                  <article key={`${arc.arcNumber}-${arc.title}`}>
                    <span>第 {arc.episodeStart}–{arc.episodeEnd} 集</span>
                    <h3>{arc.title}</h3>
                    <p>{arc.objective}</p>
                    <strong>{arc.turningPoint}</strong>
                  </article>
                ))}
              </div>
              <section className={styles.episodePlan}>
                <h3>分集叙事计划</h3>
                <div>
                  {latestVersion.episodePlanItems.map((episode) => (
                    <article key={episode.episodeNumber}>
                      <span>{String(episode.episodeNumber).padStart(2, "0")}</span>
                      <div><strong>{episode.title}</strong><p>{episode.logline}</p></div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className={styles.createPlan}>
              <h3>先说明这部系列如何持续发展</h3>
              <p>输入主线、阶段转折和分集节奏。Core 会按项目规划集数生成候选，未经确认不会保存。</p>
              <textarea
                maxLength={4000}
                onChange={(event) => setCreativeInput(event.target.value)}
                placeholder="例如：六集内让主角从逃避记忆，走向主动承担城市档案的真相；每两集完成一次关系转折。"
                value={creativeInput}
              />
              <div className={styles.actionRow}>
                <ACSButton disabled={!inputReady || operation !== "idle"} loading={operation === "generating"} onClick={() => void generateCandidate()} variant="primary">生成 M5 候选</ACSButton>
                <span>{creativeInput.trim().length}/4000 · 至少 10 个字符</span>
              </div>
            </div>
          )}

          {candidate ? (
            <section className={styles.candidatePanel} aria-labelledby="series-candidate-title">
              <div className={styles.panelHeading}>
                <div><p className={styles.eyebrow}>CANDIDATE · NOT YET SAVED</p><h3 id="series-candidate-title">{candidate.seriesConcept}</h3></div>
                <ACSBadge tone="primary">待人工确认</ACSBadge>
              </div>
              <p>{candidate.logline}</p>
              <div className={styles.arcGrid}>
                {candidate.mainArcs.map((arc) => <article key={arc.arcNumber}><span>第 {arc.episodeStart}–{arc.episodeEnd} 集</span><h3>{arc.title}</h3><p>{arc.objective}</p></article>)}
              </div>
              <div className={styles.actionRow}>
                <ACSButton disabled={operation !== "idle"} loading={operation === "confirming"} onClick={() => void confirmCandidate()} variant="primary">人工确认并建立 M5 版本</ACSButton>
                <ACSButton disabled={operation !== "idle"} onClick={() => setCandidate(null)} variant="secondary">放弃候选</ACSButton>
              </div>
            </section>
          ) : null}
          <p aria-live="polite" className={styles.operationMessage} role="status">{operationMessage}</p>
        </section>

        <aside className={styles.sidePanel} aria-labelledby="m6-status-title">
          <div className={styles.panelHeading}>
            <div><p className={styles.eyebrow}>M6 AUTHORITY GATE</p><h2 id="m6-status-title">世界与角色智能</h2></div>
          </div>
          {intelligenceSummary?.status === "ready" ? (
            <dl className={styles.factList}>
              <div><dt>世界圣经版本</dt><dd>{intelligenceSummary.bibleVersions}</dd></div>
              <div><dt>角色连续性版本</dt><dd>{intelligenceSummary.characterVersions}</dd></div>
              <div><dt>激活基线</dt><dd>{intelligenceSummary.baseline}</dd></div>
            </dl>
          ) : (
            <div className={styles.blockedState}>
              <ACSBadge tone="neutral">{intelligenceSummary?.code ?? "authority_required"}</ACSBadge>
              <h3>M6 外部权限尚未接入</h3>
              <p>{intelligenceSummary?.message ?? "当前无法读取 M6 权威工作区。"}</p>
              <p>这不是空数据，也不会回退到本地世界设定。完成 M5 后仍需接入范围审批与身份权限。</p>
            </div>
          )}
          <Link className={styles.textLink} href={projectRoute(projectRef, "planning/characters")}>打开角色工作区</Link>
        </aside>
      </div>
    </main>
  );
}
