"use client";

import { useEffect, useMemo, useState } from "react";
import {
  creatorRequest,
  getExecutionMethodPlan,
  type CreatorCreativeShotVersion,
  type ExecutionMethodPlanEnvelope,
  type ShotGraphBundleEnvelope,
} from "@/features/core-integration";
import { ProductionRunSelector } from "./production-run-selector";
import {
  productionResourcePath,
  readableCreatorError,
  useProjectProductionRuns,
} from "./production-workspace-data";
import styles from "./production-studio.module.css";

const methodLabels: Record<string, string> = {
  STATIC_PLATE_OR_REUSE: "静态画面 / 复用",
  SINGLE_ANCHOR_I2V: "单锚图生视频",
  CONTACT_CONDITIONED_VIDEO: "接触动作约束视频",
  POSE_OR_TRAJECTORY_CONDITIONED_VIDEO: "姿态 / 轨迹约束视频",
  V3_DETERMINISTIC_COMPOSITION: "V3 确定性合成",
};

function shortRef(value: string) {
  return value.length > 28 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
}

export function StoryboardWorkspace({ projectRef }: { projectRef: string }) {
  const runs = useProjectProductionRuns(projectRef);
  const [graph, setGraph] = useState<ShotGraphBundleEnvelope | null>(null);
  const [methodPlan, setMethodPlan] = useState<ExecutionMethodPlanEnvelope | null>(null);
  const [methodNotice, setMethodNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sceneRef, setSceneRef] = useState("ALL");
  const [selectedShotRef, setSelectedShotRef] = useState("");

  useEffect(() => {
    const run = runs.selectedRun;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setGraph(null);
      setMethodPlan(null);
      setMethodNotice("");
      setError("");
      setSceneRef("ALL");
      setSelectedShotRef("");
      setLoading(Boolean(run));
    });
    if (!run) return () => controller.abort();
    void creatorRequest<ShotGraphBundleEnvelope>(
      productionResourcePath(run.productionRunRef, "shot-graph"),
      { method: "GET", signal: controller.signal },
    ).then(async nextGraph => {
      if (controller.signal.aborted) return;
      setGraph(nextGraph);
      setSelectedShotRef(nextGraph.creativeShotVersions[0]?.creativeShotVersionRef ?? "");
      try {
        const nextPlan = await getExecutionMethodPlan({
          productionRunRef: run.productionRunRef,
          projectRef: run.projectRef,
          seriesRef: run.seriesRef,
          episodeRef: run.episodeRef,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setMethodPlan(nextPlan);
      } catch (planError) {
        if (!controller.signal.aborted) {
          setMethodNotice(`镜头图可读；服务器方法计划尚不可读：${readableCreatorError(planError)}`);
        }
      }
    }).catch(loadError => {
      if (!controller.signal.aborted) setError(readableCreatorError(loadError));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [runs.selectedRun]);

  const scenes = useMemo(() => {
    if (!graph) return [];
    return [...new Set(graph.creativeShotVersions.map(shot => shot.scriptSceneRef))];
  }, [graph]);
  const shots = useMemo(() => graph?.creativeShotVersions.filter(
    shot => sceneRef === "ALL" || shot.scriptSceneRef === sceneRef,
  ) ?? [], [graph, sceneRef]);
  const selectedShot = graph?.creativeShotVersions.find(
    shot => shot.creativeShotVersionRef === selectedShotRef,
  ) ?? shots[0] ?? null;
  const requirements = useMemo(() => methodPlan?.visualExecutionRequirements.filter(
    requirement => requirement.creativeShotVersionRef === selectedShot?.creativeShotVersionRef,
  ) ?? [], [methodPlan, selectedShot]);

  return (
    <section className={styles.workspace} aria-labelledby="storyboard-title">
      <header className={styles.workspaceHeader}>
        <div><span>M8 · Storyboard</span><h1 id="storyboard-title">分镜工作区</h1><p>读取真实 StoryboardVersion、CreativeShotVersion 与服务器方法计划。</p></div>
        <ProductionRunSelector runs={runs.runs} selectedRunRef={runs.selectedRunRef} onSelect={runs.selectRun} onRefresh={runs.refresh} disabled={loading} />
      </header>
      {runs.status === "loading" && !runs.selectedRun && <p role="status" className={styles.notice}>正在读取项目制作记录…</p>}
      {runs.status === "error" && <p role="alert" className={styles.error}>{runs.error}</p>}
      {runs.status === "ready" && runs.runs.length === 0 && <p className={styles.empty}>当前项目还没有单集制作记录。先从剧本建立单集生产根。</p>}
      {loading && <p role="status" className={styles.notice}>正在读取权威镜头图…</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {methodNotice && <p role="status" className={styles.warning}>{methodNotice}</p>}
      {graph && (
        <div className={styles.storyboardLayout}>
          <aside className={styles.panel} aria-label="场景导航">
            <h2>场景</h2>
            <button type="button" data-active={sceneRef === "ALL"} onClick={() => setSceneRef("ALL")}>全部镜头 <b>{graph.creativeShotVersions.length}</b></button>
            {scenes.map(scene => <button type="button" data-active={sceneRef === scene} key={scene} onClick={() => setSceneRef(scene)}>{shortRef(scene)} <b>{graph.creativeShotVersions.filter(shot => shot.scriptSceneRef === scene).length}</b></button>)}
            <dl className={styles.compactFacts}><div><dt>分镜版本</dt><dd>{shortRef(graph.storyboardVersion.storyboardVersionRef)}</dd></div><div><dt>生产状态</dt><dd>{graph.state}</dd></div></dl>
          </aside>
          <main className={styles.board} aria-label="分镜画板">
            <div className={styles.sectionTitle}><div><h2>镜头板</h2><p>{shots.length} 个镜头 · {graph.executableShotGraph.output.frameRate ?? "?"} fps</p></div><span className={styles.statusBadge}>仅技术证据 · 不可发布</span></div>
            <div className={styles.shotGrid}>
              {shots.map(shot => <ShotCard key={shot.creativeShotVersionRef} shot={shot} active={selectedShot?.creativeShotVersionRef === shot.creativeShotVersionRef} onSelect={() => setSelectedShotRef(shot.creativeShotVersionRef)} />)}
            </div>
          </main>
          <aside className={styles.panel} aria-label="镜头检查器">
            <h2>Shot Inspector</h2>
            {!selectedShot ? <p>请选择镜头。</p> : <>
              <span className={styles.statusBadge}>SHOT {selectedShot.globalOrder}</span>
              <h3>{selectedShot.action || "未提供动作摘要"}</h3>
              <dl className={styles.factList}>
                <div><dt>场景</dt><dd>{shortRef(selectedShot.scriptSceneRef)}</dd></div>
                <div><dt>时长</dt><dd>{selectedShot.durationFrames} 帧 / {selectedShot.frameRate} fps</dd></div>
                <div><dt>景别</dt><dd>{String(selectedShot.cameraInstruction.shotSize ?? "未设置")}</dd></div>
                <div><dt>运动</dt><dd>{String(selectedShot.cameraInstruction.movement ?? "未设置")}</dd></div>
                <div><dt>角度</dt><dd>{String(selectedShot.cameraInstruction.angle ?? "未设置")}</dd></div>
                <div><dt>角色锁</dt><dd>{selectedShot.requiredCharacterIdentityLocks.length}</dd></div>
              </dl>
              <h3>服务器方法</h3>
              {requirements.length === 0 ? <p className={styles.muted}>当前镜头尚无可读方法计划。</p> : requirements.map(requirement => <div className={styles.requirement} key={requirement.visualExecutionRequirementRef}><strong>{methodLabels[requirement.executionMethod] ?? requirement.executionMethod}</strong><span>{requirement.executionClass} · {requirement.disposition}</span></div>)}
              <p className={styles.digest}>Digest · {shortRef(selectedShot.payloadDigest)}</p>
            </>}
          </aside>
        </div>
      )}
    </section>
  );
}

function ShotCard({ shot, active, onSelect }: { shot: CreatorCreativeShotVersion; active: boolean; onSelect: () => void }) {
  return <button type="button" className={styles.shotCard} data-active={active} onClick={onSelect}>
    <div className={styles.shotThumbnail}><span>SHOT {String(shot.globalOrder).padStart(2, "0")}</span><small>{shot.durationFrames}f</small></div>
    <strong>{shot.action || "动作说明未提供"}</strong>
    <span>{String(shot.cameraInstruction.shotSize ?? "景别未设置")} · {String(shot.cameraInstruction.movement ?? "运动未设置")}</span>
    <small>{shot.requiredCharacterIdentityLocks.length} 个角色身份锁</small>
  </button>;
}
