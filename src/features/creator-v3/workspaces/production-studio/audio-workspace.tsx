"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getExecutionMethodPlan,
  getExplicitAudioRequirementRoute,
  type AudioRequirement,
  type ExecutionMethodPlanEnvelope,
  type ExplicitAudioRequirementRouteEnvelope,
} from "@/features/core-integration";
import { ProductionRunSelector } from "./production-run-selector";
import { readableCreatorError, useProjectProductionRuns } from "./production-workspace-data";
import styles from "./production-studio.module.css";

const audioLabels: Record<string, string> = {
  DIALOGUE: "对白",
  NARRATION: "旁白",
  AMBIENCE: "环境声",
  SFX: "音效",
  MUSIC: "音乐",
  SILENCE: "静音",
};

function shortRef(value: string) {
  return value.length > 30 ? `${value.slice(0, 13)}…${value.slice(-9)}` : value;
}

export function AudioWorkspace({ projectRef }: { projectRef: string }) {
  const runs = useProjectProductionRuns(projectRef);
  const [plan, setPlan] = useState<ExecutionMethodPlanEnvelope | null>(null);
  const [route, setRoute] = useState<ExplicitAudioRequirementRouteEnvelope | null>(null);
  const [selectedRequirementRef, setSelectedRequirementRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [routeNotice, setRouteNotice] = useState("");

  useEffect(() => {
    const run = runs.selectedRun;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setPlan(null);
      setRoute(null);
      setError("");
      setRouteNotice("");
      setSelectedRequirementRef("");
      setLoading(Boolean(run));
    });
    if (!run) return () => controller.abort();
    const options = {
      productionRunRef: run.productionRunRef,
      projectRef: run.projectRef,
      seriesRef: run.seriesRef,
      episodeRef: run.episodeRef,
      signal: controller.signal,
    };
    void getExecutionMethodPlan(options).then(async nextPlan => {
      if (controller.signal.aborted) return;
      setPlan(nextPlan);
      setSelectedRequirementRef(nextPlan.audioRequirements[0]?.audioRequirementRef ?? "");
      try {
        const nextRoute = await getExplicitAudioRequirementRoute(options);
        if (!controller.signal.aborted) setRoute(nextRoute);
      } catch (routeError) {
        if (!controller.signal.aborted) setRouteNotice(`尚无可读取的显式音频路由：${readableCreatorError(routeError)}`);
      }
    }).catch(loadError => {
      if (!controller.signal.aborted) setError(readableCreatorError(loadError));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [runs.selectedRun]);

  const selected = useMemo(() => plan?.audioRequirements.find(
    requirement => requirement.audioRequirementRef === selectedRequirementRef,
  ) ?? null, [plan, selectedRequirementRef]);
  const routeMatchesSelection = route?.audioRequirementRef === selected?.audioRequirementRef;

  return (
    <section className={styles.workspace} aria-labelledby="audio-title">
      <header className={styles.workspaceHeader}>
        <div><span>M12 · Audio Requirements</span><h1 id="audio-title">音频工作区</h1><p>读取 M9 显式音频需求、M12 路由合同与 M13 时间线绑定。</p></div>
        <ProductionRunSelector runs={runs.runs} selectedRunRef={runs.selectedRunRef} onSelect={runs.selectRun} onRefresh={runs.refresh} disabled={loading} />
      </header>
      <div className={styles.runtimeHold} role="status"><strong>M12 Runtime：未安装 / G0 未完成</strong><span>需求与路由合同可以核验；本页不会伪装音频已生成，也不提供运行按钮。</span></div>
      {runs.status === "loading" && !runs.selectedRun && <p role="status" className={styles.notice}>正在读取项目制作记录…</p>}
      {runs.status === "error" && <p role="alert" className={styles.error}>{runs.error}</p>}
      {runs.status === "ready" && runs.runs.length === 0 && <p className={styles.empty}>当前项目还没有单集制作记录。</p>}
      {loading && <p role="status" className={styles.notice}>正在读取显式音频需求…</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {routeNotice && <p className={styles.warning}>{routeNotice}</p>}
      {plan && (
        <div className={styles.audioLayout}>
          <aside className={styles.panel} aria-label="音频需求列表">
            <div className={styles.sectionTitle}><div><h2>需求</h2><p>{plan.audioRequirements.length} 条权威需求</p></div></div>
            <div className={styles.requirementList}>
              {plan.audioRequirements.map(requirement => <AudioRequirementButton key={requirement.audioRequirementRef} requirement={requirement} active={selected?.audioRequirementRef === requirement.audioRequirementRef} onSelect={() => setSelectedRequirementRef(requirement.audioRequirementRef)} />)}
            </div>
          </aside>
          <main className={styles.audioCanvas} aria-label="音频时间与状态画布">
            <div className={styles.sectionTitle}><div><h2>时间绑定</h2><p>帧范围来自 CreativeShotVersion，不由界面猜测。</p></div><span className={styles.statusBadge}>合同可读 · 运行时禁用</span></div>
            {!selected ? <p className={styles.empty}>当前执行方法计划没有音频需求。</p> : <>
              <div className={styles.audioWave} aria-label={`${audioLabels[selected.audioType]} 时间范围`}>
                <span style={{ left: `${Math.min(92, Math.max(0, selected.timingReference.startFrameInclusive % 100))}%` }} />
                <strong>{selected.timingReference.startFrameInclusive}f</strong>
                <i>{audioLabels[selected.audioType]}</i>
                <strong>{selected.timingReference.endFrameExclusive}f</strong>
              </div>
              <div className={styles.audioSummaryGrid}>
                <div><span>类型</span><strong>{audioLabels[selected.audioType]}</strong></div>
                <div><span>处置</span><strong>{selected.disposition}</strong></div>
                <div><span>镜头版本</span><strong>{shortRef(selected.creativeShotVersionRef)}</strong></div>
                <div><span>Beat</span><strong>{shortRef(selected.beatRef)}</strong></div>
              </div>
              <section className={styles.routeCard}>
                <h3>当前路由</h3>
                {routeMatchesSelection && route ? <dl className={styles.factList}>
                  <div><dt>路由处置</dt><dd>{route.routeDisposition}</dd></div>
                  <div><dt>请求类型</dt><dd>{route.audioGenerationRequest?.requestKind ?? "不需要生成请求"}</dd></div>
                  <div><dt>时间线绑定</dt><dd>{route.audioCueTimingBinding?.bindingState ?? "无"}</dd></div>
                  <div><dt>运行时</dt><dd>{route.m12RuntimeState}</dd></div>
                  <div><dt>可发布</dt><dd>否</dd></div>
                </dl> : <p>当前选择尚无精确路由记录。需求仍是权威事实，但不能据此声称音频资产已存在。</p>}
              </section>
            </>}
          </main>
          <aside className={styles.panel} aria-label="音频检查器">
            <h2>Requirement Inspector</h2>
            {!selected ? <p>请选择音频需求。</p> : <>
              <span className={styles.statusBadge}>{audioLabels[selected.audioType]}</span>
              <dl className={styles.factList}>
                <div><dt>需求引用</dt><dd>{shortRef(selected.audioRequirementRef)}</dd></div>
                <div><dt>来源脚本</dt><dd>{shortRef(selected.scriptVersionRef)}</dd></div>
                <div><dt>分镜版本</dt><dd>{shortRef(selected.storyboardVersionRef)}</dd></div>
                <div><dt>帧范围</dt><dd>{selected.timingReference.startFrameInclusive}–{selected.timingReference.endFrameExclusive}</dd></div>
                <div><dt>发布</dt><dd>禁止</dd></div>
              </dl>
              {(selected.audioType === "DIALOGUE" || selected.audioType === "NARRATION") && <p className={styles.warning}>语音生产仍需权利、声音版本与 M12 Runtime；界面不会从文本直接绕过这些边界。</p>}
              <p className={styles.digest}>Digest · {shortRef(selected.payloadDigest)}</p>
            </>}
          </aside>
        </div>
      )}
    </section>
  );
}

function AudioRequirementButton({ requirement, active, onSelect }: { requirement: AudioRequirement; active: boolean; onSelect: () => void }) {
  return <button type="button" data-active={active} onClick={onSelect}>
    <span>{audioLabels[requirement.audioType]}</span>
    <strong>{requirement.timingReference.startFrameInclusive}–{requirement.timingReference.endFrameExclusive} 帧</strong>
    <small>{requirement.disposition}</small>
  </button>;
}
