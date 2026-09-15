"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { creatorRequest } from "@/features/core-integration/browser-client";
import { generationContentUrl, readGeneration, startGeneration, type GenerationScope, type GenerationView } from "@/features/core-integration/generation-workspace-client";
import styles from "./generation-workspace.module.css";
import { ImageVideoComposer } from "./image-video-composer";
import { RuntimeEnvironmentBar } from "./runtime-environment-bar";

const labels = { QUEUED: "等待执行", LEASED: "作业已领取", RUNNING: "正在生成", SUCCEEDED: "生成成功", FAILED: "生成失败", CANCELLED: "已取消", UNKNOWN: "提交结果待核实" };
export function GenerationWorkspace({ projectRef }: { projectRef: string }) {
  return <ProjectGenerationWorkspace key={projectRef} projectRef={projectRef} />;
}

function ProjectGenerationWorkspace({ projectRef }: { projectRef: string }) {
  const [runs, setRuns] = useState<GenerationScope[]>([]);
  const [selected, setSelected] = useState("");
  const [view, setView] = useState<GenerationView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const requestScope = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);
  const refreshSequence = useRef(0);
  const scope = runs.find(r => r.productionRunRef === selected);
  useEffect(() => {
    const controller = new AbortController();
    creatorRequest<{ ok: true; runs: GenerationScope[] }>("episode-production-runs", { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(result.runs)) throw new Error("制作记录响应无效。");
        const found = result.runs.filter(r => r.projectRef === projectRef && [r.seriesRef, r.episodeRef, r.productionRunRef].every(v => typeof v === "string" && v.length))
          .map(r => ({ projectRef: r.projectRef, seriesRef: r.seriesRef, episodeRef: r.episodeRef, productionRunRef: r.productionRunRef }));
        setRuns(found); setSelected(found[0]?.productionRunRef ?? "");
      }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "无法读取制作记录。"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [projectRef]);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!scope) return;
    const sequence = ++refreshSequence.current;
    try {
      const next = await readGeneration(scope, signal);
      if (!signal?.aborted && sequence === refreshSequence.current) { setView(next); setError(""); }
    } catch (e) {
      if (!signal?.aborted && sequence === refreshSequence.current) { setView(null); setError(e instanceof Error ? e.message : "无法读取生成状态。"); }
    }
  }, [scope]);
  useEffect(() => {
    const controller = new AbortController(); requestScope.current = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      await refresh(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(poll, 4000);
    };
    void poll();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [refresh]);
  async function operate(operation: "PREPARE" | "EXECUTE_APPROVED") {
    if (!view || submittingRef.current) return;
    const signal = requestScope.current?.signal;
    submittingRef.current = true; setSubmitting(true); setConfirming(false); setError("");
    try {
      await startGeneration(view, operation, signal);
      await refresh(signal);
    } catch (e) {
      if (!signal?.aborted) setError(`${e instanceof Error ? e.message : "请求未完成。"} 请刷新查看原作业，不要重复提交。`);
    } finally { if (!signal?.aborted) { submittingRef.current = false; setSubmitting(false); } }
  }
  const active = submitting || (view && view.activity !== "IDLE");
  return <section className={styles.workspace} aria-labelledby="generation-title">
    <header className={styles.header}><div><p className={styles.eyebrow}>项目工作区</p><h1 id="generation-title">视频生成</h1><p>原生成作业 · 状态追踪 · 结果播放</p></div>
      <button onClick={() => void refresh(requestScope.current?.signal)} disabled={!scope}>刷新状态</button></header>
    {scope && <RuntimeEnvironmentBar scope={scope} />}
    {scope && <ImageVideoComposer scope={scope} />}
    <div className={styles.layout}>
      <aside className={styles.panel}><h2>制作记录</h2><label htmlFor="generation-run">选择单集作业</label>
        <select id="generation-run" value={selected} onChange={e => { setSelected(e.target.value); setView(null); setConfirming(false); setError(""); }} disabled={!runs.length || !!active}>
          {!runs.length && <option value="">暂无制作记录</option>}
          {runs.map(r => <option key={r.productionRunRef} value={r.productionRunRef}>{r.episodeRef}</option>)}
        </select><p className={styles.muted}>只显示当前项目的真实 Core 记录。新作业仅由明确点击生成创建，不会自动重试。</p></aside>
      <article className={styles.panel}>
        {loading && <p role="status">正在读取项目制作记录…</p>}
        {!loading && !runs.length && !error && <p>当前项目尚无可读取的制作记录。请先完成剧本和镜头输入。</p>}
        {error && <div role="alert" className={styles.error}>{error}</div>}
        {view && <>
          <div className={styles.heading}><h2>{view.artifact ? "生成结果" : "当前作业"}</h2><span role="status" className={styles.badge}>{view.activity === "PREPARING" ? "正在核验准备条件" : view.activity === "EXECUTING" ? "正在执行原作业" : labels[view.state]}</span></div>
          {view.artifact ? <><video className={styles.video} controls preload="metadata" src={generationContentUrl(view)} aria-label="生成视频" />
            <p className={styles.spec}>{view.artifact.width} × {view.artifact.height} · {view.artifact.durationFrames / view.artifact.frameRate} 秒 · {view.artifact.frameRate} fps · {view.artifact.durationFrames} 帧</p></>
            : <div className={styles.empty}><strong>{labels[view.state]}</strong><p>{view.state === "UNKNOWN" ? "可能已经提交。禁止自动补发，请核实原作业。" : "视频生成成功后将在这里播放。"}</p></div>}
          {view.errorCode && <p role="alert" className={styles.error}>原生成入口返回：{view.errorCode}。未自动重试。</p>}
          <div className={styles.actions}><button disabled={!view.canPrepare || !!active} onClick={() => void operate("PREPARE")}>检查准备条件</button>
            <button className={styles.primary} disabled={!view.canExecute || !!active} onClick={() => setConfirming(true)}>执行已批准作业</button></div>
          {confirming && <div className={styles.confirm} role="group" aria-label="执行确认"><p>只执行当前已批准的原作业一次。参数和权限由 Core 核验；失败或结果未知时不会自动重试。</p><button className={styles.primary} onClick={() => void operate("EXECUTE_APPROVED")}>确认执行一次</button><button onClick={() => setConfirming(false)}>取消</button></div>}
        </>}
      </article>
      <aside className={styles.panel}><h2>来源与边界</h2><p>生成结果用于技术验证，不等于资产准入、正式出片或发布。</p>
        {view && <dl>{[["单集", view.episodeRef], ["镜头版本", view.creativeShotVersionRef], ["作业", view.mediaJobRef], ["尝试次数", String(view.attemptCount)], ["视频摘要", view.artifact?.sha256 ?? "尚无结果"]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
        <p className={styles.muted}>模型、输入和运行批准由服务端绑定。页面不连接 GPU，不签发 Grant。</p></aside>
    </div>
  </section>;
}
