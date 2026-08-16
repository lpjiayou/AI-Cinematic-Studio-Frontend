"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACSBadge, ACSButton } from "@/components";
import {
  creatorRequest,
  CreatorClientError,
  useCreatorIntegration,
  type CreatorProject,
  type CreatorScriptVersion,
  type CreatorSeries,
  type EpisodeEnvelope,
  type ProjectEnvelope,
  type ScriptMutationEnvelope,
  type ScriptWorkspaceEnvelope,
  type SeriesEnvelope,
} from "@/features/core-integration";
import { projectRoute } from "@/lib/project-navigation";
import styles from "./script-workspace.module.css";

type ScriptPageState =
  | { status: "loading" }
  | {
      status: "ready";
      project: CreatorProject;
      series: CreatorSeries;
      episodeRef: string | null;
      workspace: ScriptWorkspaceEnvelope["workspace"] | null;
    }
  | { status: "error"; code: string; message: string };

function detail(error: unknown) {
  return error instanceof CreatorClientError
    ? error.detail
    : { code: "core_disconnected", message: "当前无法读取 Creator Core 剧本工作区。" };
}

function workspacePath(seriesRef: string, episodeRef: string) {
  return `script-workspaces?${new URLSearchParams({ seriesRef, episodeRef }).toString()}`;
}

export function ConnectedScriptStudio({ projectRef }: { projectRef: string }) {
  const { state: connection, refresh } = useCreatorIntegration();
  const [revision, setRevision] = useState(0);
  const [requestedEpisodeRef, setRequestedEpisodeRef] = useState<string | null>(null);
  const [state, setState] = useState<ScriptPageState>({ status: "loading" });
  const [creativePlanRef, setCreativePlanRef] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("第 1 集");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [synopsis, setSynopsis] = useState("");
  const [operation, setOperation] = useState<"idle" | "creating-episode" | "generating" | "saving" | "confirming">("idle");
  const [message, setMessage] = useState("剧本生成只使用当前 Episode 已绑定的人工确认导演方案。");

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
            message: "当前项目没有可用于剧本工作区的 Series 绑定。",
          });
        }
        const { series } = await creatorRequest<SeriesEnvelope>(
          `series/${encodeURIComponent(seriesRef)}`,
          { signal: controller.signal },
        );
        const validRequested = series.episodes.some(
          (episode) => episode.episodeRef === requestedEpisodeRef,
        );
        const episodeRef = validRequested
          ? requestedEpisodeRef
          : series.episodes[0]?.episodeRef ?? null;
        const workspace = episodeRef
          ? (
              await creatorRequest<ScriptWorkspaceEnvelope>(
                workspacePath(seriesRef, episodeRef),
                { signal: controller.signal },
              )
            ).workspace
          : null;
        return { project, series, episodeRef, workspace };
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setState({ status: "ready", ...payload });
        setRequestedEpisodeRef(payload.episodeRef);
        setSynopsis(payload.workspace?.versions.at(-1)?.synopsis ?? "");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const errorDetail = detail(error);
        setState({ status: "error", code: errorDetail.code, message: errorDetail.message });
      });
    return () => controller.abort();
  }, [connection.status, projectRef, requestedEpisodeRef, revision]);

  const disconnected = connection.status === "disconnected" || connection.status === "error";
  const effective: ScriptPageState = disconnected
    ? { status: "error", code: connection.error.code, message: connection.error.message }
    : state;
  const latest: CreatorScriptVersion | null =
    effective.status === "ready" ? effective.workspace?.versions.at(-1) ?? null : null;
  const busy = operation !== "idle";

  function reload(nextMessage: string) {
    setState({ status: "loading" });
    setMessage(nextMessage);
    setRevision((value) => value + 1);
  }

  async function createEpisode() {
    if (
      effective.status !== "ready" ||
      effective.episodeRef ||
      !creativePlanRef.trim() ||
      !episodeTitle.trim() ||
      !Number.isInteger(episodeNumber) ||
      episodeNumber < 1
    ) return;
    setOperation("creating-episode");
    setMessage("正在核对创意方案并建立 Episode 身份…");
    try {
      const payload = await creatorRequest<EpisodeEnvelope>("episodes", {
        method: "POST",
        body: {
          seriesRef: effective.series.seriesRef,
          creativePlanRef: creativePlanRef.trim(),
          episodeNumber,
          seasonNumber: 1,
          volumeNumber: 1,
          title: episodeTitle.trim(),
        },
      });
      setRequestedEpisodeRef(payload.episode.episodeRef);
      reload("Episode 已建立，可以生成第一版剧本。");
    } catch (error: unknown) {
      setMessage(detail(error).message);
    } finally {
      setOperation("idle");
    }
  }

  async function generateScript() {
    if (effective.status !== "ready" || !effective.episodeRef || effective.workspace?.script) return;
    setOperation("generating");
    setMessage("Core 正在根据 Episode 的确认方案生成剧本候选并建立 v1…");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/generate", {
        method: "POST",
        body: {
          seriesRef: effective.series.seriesRef,
          episodeRef: effective.episodeRef,
        },
      });
      reload("剧本 v1 已创建，等待人工修订或确认。");
    } catch (error: unknown) {
      setMessage(detail(error).message);
    } finally {
      setOperation("idle");
    }
  }

  async function saveManualVersion() {
    if (
      effective.status !== "ready" ||
      !effective.episodeRef ||
      !effective.workspace?.script ||
      !latest ||
      !synopsis.trim()
    ) return;
    setOperation("saving");
    setMessage("正在追加人工修订版本…");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/manual", {
        method: "POST",
        body: {
          seriesRef: effective.series.seriesRef,
          episodeRef: effective.episodeRef,
          scriptRef: effective.workspace.script.scriptRef,
          baseScriptVersionRef: latest.scriptVersionRef,
          content: {
            title: latest.title,
            logline: latest.logline,
            synopsis: synopsis.trim(),
            targetDurationSec: latest.targetDurationSec,
            scenes: latest.scenes,
          },
        },
      });
      reload("人工修订版本已保存，确认动作仍需单独执行。");
    } catch (error: unknown) {
      setMessage(detail(error).message);
    } finally {
      setOperation("idle");
    }
  }

  async function confirmVersion() {
    if (
      effective.status !== "ready" ||
      !effective.episodeRef ||
      !effective.workspace?.script ||
      !latest
    ) return;
    setOperation("confirming");
    setMessage("正在提交剧本版本人工确认…");
    try {
      await creatorRequest<ScriptMutationEnvelope>("script-versions/confirm", {
        method: "POST",
        body: {
          seriesRef: effective.series.seriesRef,
          episodeRef: effective.episodeRef,
          scriptRef: effective.workspace.script.scriptRef,
          scriptVersionRef: latest.scriptVersionRef,
          humanConfirmed: true,
        },
      });
      reload("当前剧本版本已确认，可作为后续分镜的可信输入；M8 尚未开放。");
    } catch (error: unknown) {
      setMessage(detail(error).message);
    } finally {
      setOperation("idle");
    }
  }

  if (effective.status === "loading") {
    return <main className={styles.statePage}><div className={styles.stateCard}><p>正在读取 Project → Series → Episode → Script 链路…</p></div></main>;
  }

  if (effective.status === "error") {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <ACSBadge tone="neutral">{effective.code}</ACSBadge>
          <h1>无法打开权威剧本工作区</h1>
          <p>{effective.message}</p>
          <ACSButton onClick={() => { refresh(); reload("正在重新连接 Creator Core。"); }} variant="primary">重新连接</ACSButton>
        </div>
      </main>
    );
  }

  const selectedEpisode = effective.series.episodes.find(
    (episode) => episode.episodeRef === effective.episodeRef,
  );
  const confirmed = Boolean(
    effective.workspace?.script?.confirmedScriptVersionRef &&
      effective.workspace.script.confirmedScriptVersionRef === latest?.scriptVersionRef,
  );

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>M2 EPISODE FOUNDATION · M3 SCRIPT STUDIO</p>
          <h1>{effective.project.title} · 剧本工作区</h1>
          <p>选择真实 Episode，生成版本、人工修订并确认。界面不会从动态路由推断任何创意方案或剧本身份。</p>
        </div>
        <ACSBadge dot tone="success">Core 项目</ACSBadge>
      </header>

      <section className={styles.scopeBar} aria-label="剧本工作区范围">
        <div><span>Project</span><strong>{effective.project.projectRef}</strong></div>
        <div><span>Series</span><strong>{effective.series.seriesRef}</strong></div>
        <label>
          <span>Episode</span>
          {effective.series.episodes.length ? (
            <select
              onChange={(event) => {
                setState({ status: "loading" });
                setRequestedEpisodeRef(event.target.value);
              }}
              value={effective.episodeRef ?? ""}
            >
              {effective.series.episodes.map((episode) => (
                <option key={episode.episodeRef} value={episode.episodeRef}>
                  {episode.episodeNumber}. {episode.title}
                </option>
              ))}
            </select>
          ) : <strong>尚未建立</strong>}
        </label>
        <div><span>Script</span><strong>{effective.workspace?.script?.scriptRef ?? "尚未生成"}</strong></div>
      </section>

      {!effective.episodeRef ? (
        <section className={styles.emptyWorkspace} aria-labelledby="create-episode-title">
          <div>
            <p className={styles.eyebrow}>CREATE FIRST EPISODE</p>
            <h2 id="create-episode-title">用已确认导演方案建立首集</h2>
            <p>请输入 AI 导演确认后返回的真实 creativePlanRef。Core 会校验它属于当前工作区；无效引用不会创建 Episode。</p>
          </div>
          <div className={styles.episodeForm}>
            <label className={styles.planRefField}><span>creativePlanRef</span><input onChange={(event) => setCreativePlanRef(event.target.value)} placeholder="creative-plan-…" value={creativePlanRef} /></label>
            <label><span>集数</span><input min={1} onChange={(event) => setEpisodeNumber(event.currentTarget.valueAsNumber)} type="number" value={episodeNumber} /></label>
            <label><span>集标题</span><input maxLength={500} onChange={(event) => setEpisodeTitle(event.target.value)} value={episodeTitle} /></label>
            <ACSButton disabled={busy || !creativePlanRef.trim() || !episodeTitle.trim()} loading={operation === "creating-episode"} onClick={() => void createEpisode()} variant="primary">建立 Episode</ACSButton>
          </div>
          <Link className={styles.textLink} href="/creator/ai-director">没有 creativePlanRef？先去 AI 导演生成并确认</Link>
        </section>
      ) : !effective.workspace?.script ? (
        <section className={styles.emptyWorkspace} aria-labelledby="generate-script-title">
          <div>
            <p className={styles.eyebrow}>EPISODE READY</p>
            <h2 id="generate-script-title">{selectedEpisode?.title ?? "当前 Episode"}可以生成剧本</h2>
            <p>生成服务只读取 Episode 已绑定的人工确认方案。成功后才会创建 Script 与不可变 ScriptVersion v1。</p>
          </div>
          <ACSButton disabled={busy} loading={operation === "generating"} onClick={() => void generateScript()} size="large" variant="primary">生成第一版剧本</ACSButton>
        </section>
      ) : latest ? (
        <div className={styles.editorGrid}>
          <aside className={styles.sceneNavigator} aria-labelledby="scene-list-title">
            <div className={styles.panelHeading}><div><p className={styles.eyebrow}>SCRIPT NAVIGATION</p><h2 id="scene-list-title">场景</h2></div><ACSBadge tone={confirmed ? "success" : "neutral"}>{confirmed ? "已确认" : `v${latest.versionNumber} 草稿`}</ACSBadge></div>
            <ol>
              {latest.scenes.map((scene) => (
                <li key={scene.scriptSceneRef}><span>{String(scene.sceneNumber).padStart(2, "0")}</span><div><strong>{scene.heading}</strong><small>{scene.location} · {scene.timeOfDay}</small></div></li>
              ))}
            </ol>
          </aside>

          <section className={styles.scriptEditor} aria-labelledby="script-title">
            <div className={styles.panelHeading}>
              <div><p className={styles.eyebrow}>CURRENT VERSION · {latest.changeKind}</p><h2 id="script-title">{latest.title}</h2></div>
              <span>{latest.targetDurationSec} 秒 · {latest.scenes.length} 场</span>
            </div>
            <p className={styles.logline}>{latest.logline}</p>
            <label className={styles.synopsisField}>
              <span>故事梗概（可人工修订）</span>
              <textarea onChange={(event) => setSynopsis(event.target.value)} value={synopsis} />
            </label>
            <div className={styles.scriptScenes}>
              {latest.scenes.map((scene) => (
                <article key={scene.scriptSceneRef}>
                  <header><span>场 {scene.sceneNumber}</span><strong>{scene.heading}</strong><small>{scene.estimatedDurationSec} 秒</small></header>
                  <p className={styles.sceneMeta}>{scene.location} · {scene.timeOfDay} · {scene.characters.join("、") || "无出场角色"}</p>
                  <p>{scene.action}</p>
                  {scene.dialogue.map((line, index) => (
                    <blockquote key={`${scene.scriptSceneRef}-${index}`}>
                      <strong>{String(line.speaker ?? "对白")}</strong>
                      <p>{String(line.text ?? "")}</p>
                    </blockquote>
                  ))}
                </article>
              ))}
            </div>
            <div className={styles.editorActions}>
              <ACSButton disabled={busy || synopsis.trim() === latest.synopsis || !synopsis.trim()} loading={operation === "saving"} onClick={() => void saveManualVersion()} variant="secondary">保存人工修订版本</ACSButton>
              <ACSButton disabled={busy || confirmed} loading={operation === "confirming"} onClick={() => void confirmVersion()} variant="primary">人工确认当前版本</ACSButton>
            </div>
          </section>

          <aside className={styles.contextPanel} aria-labelledby="script-context-title">
            <p className={styles.eyebrow}>TRUSTED CONTEXT</p>
            <h2 id="script-context-title">当前来源</h2>
            <dl>
              <div><dt>Episode</dt><dd>{effective.episodeRef}</dd></div>
              <div><dt>创意方案</dt><dd>{selectedEpisode?.creativePlanRef}</dd></div>
              <div><dt>当前版本</dt><dd>{latest.scriptVersionRef}</dd></div>
              <div><dt>确认版本</dt><dd>{effective.workspace.script.confirmedScriptVersionRef ?? "尚未确认"}</dd></div>
            </dl>
            <div className={styles.nextBoundary}>
              <ACSBadge tone="neutral">M8 尚未开放</ACSBadge>
              <p>确认剧本后可形成分镜输入，但当前前端不会伪装成已经进入分镜或制作阶段。</p>
            </div>
            <Link className={styles.textLink} href={projectRoute(projectRef, "planning/bible")}>查看系列规划与世界状态</Link>
          </aside>
        </div>
      ) : null}

      <p aria-live="polite" className={styles.operationMessage} role="status">{message}</p>
    </main>
  );
}
