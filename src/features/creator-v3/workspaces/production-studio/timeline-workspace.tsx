"use client";

import { useEffect, useMemo, useState } from "react";
import {
  creatorRequest,
  type CreatorTimelineClip,
  type CreatorTimelineTrack,
  type TimelineProjectionEnvelope,
  type TimelineVersionsEnvelope,
} from "@/features/core-integration";
import { ProductionRunSelector } from "./production-run-selector";
import {
  productionResourcePath,
  readableCreatorError,
  useProjectProductionRuns,
} from "./production-workspace-data";
import styles from "./production-studio.module.css";

const trackLabels: Record<CreatorTimelineTrack["trackKind"], string> = {
  VIDEO: "画面",
  AUDIO: "音频",
  SUBTITLE: "字幕",
  EFFECT: "特效",
};

function shortRef(value: string) {
  return value.length > 32 ? `${value.slice(0, 14)}…${value.slice(-10)}` : value;
}

function mutationKey(operation: string) {
  const nonce = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `creator-timeline-${operation.toLowerCase()}-${nonce}`;
}

export function TimelineWorkspace({ projectRef }: { projectRef: string }) {
  const runs = useProjectProductionRuns(projectRef);
  const [timeline, setTimeline] = useState<TimelineProjectionEnvelope | null>(null);
  const [versions, setVersions] = useState<TimelineVersionsEnvelope | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [selectedClipRef, setSelectedClipRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTimeline(signal?: AbortSignal) {
    const run = runs.selectedRun;
    if (!run) return;
    const base = productionResourcePath(run.productionRunRef, "timeline");
    const [nextTimeline, nextVersions] = await Promise.all([
      creatorRequest<TimelineProjectionEnvelope>(base, { method: "GET", signal }),
      creatorRequest<TimelineVersionsEnvelope>(productionResourcePath(run.productionRunRef, "timeline-versions"), { method: "GET", signal }),
    ]);
    setTimeline(nextTimeline);
    setVersions(nextVersions);
    setSelectedClipRef(current => nextTimeline.clips.some(clip => clip.clipRef === current)
      ? current
      : nextTimeline.clips[0]?.clipRef ?? "");
    try {
      await creatorRequest<Record<string, unknown>>(productionResourcePath(run.productionRunRef, "preview"), { method: "GET", signal });
      setPreviewReady(true);
    } catch {
      setPreviewReady(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setTimeline(null);
      setVersions(null);
      setPreviewReady(false);
      setSelectedClipRef("");
      setError("");
      setNotice("");
      setLoading(Boolean(runs.selectedRun));
      if (runs.selectedRun) {
        void loadTimeline(controller.signal).catch(loadError => {
          if (!controller.signal.aborted) setError(readableCreatorError(loadError));
        }).finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      }
    });
    if (!runs.selectedRun) return () => controller.abort();
    return () => controller.abort();
  // loadTimeline intentionally binds to the selected authoritative run only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runs.selectedRun]);

  const selectedClip = timeline?.clips.find(clip => clip.clipRef === selectedClipRef) ?? null;
  const sortedTracks = useMemo(
    () => [...(timeline?.tracks ?? [])].sort((left, right) => left.order - right.order),
    [timeline],
  );

  async function toggleSelectedClip() {
    const run = runs.selectedRun;
    if (!run || !timeline || !selectedClip || mutating) return;
    const operation = selectedClip.enabled ? "DISABLE_CLIP" : "ENABLE_CLIP";
    const key = mutationKey(operation);
    setMutating(true);
    setError("");
    setNotice("");
    try {
      const next = await creatorRequest<TimelineProjectionEnvelope>(
        productionResourcePath(run.productionRunRef, "timeline-edits"),
        {
          method: "POST",
          body: {
            operationRef: key,
            idempotencyKey: key,
            expectedRunVersion: run.version,
            parentTimelineVersionRef: timeline.timelineVersion.timelineVersionRef,
            parentTimelineVersionDigest: timeline.timelineVersion.payloadDigest,
            editCommand: { operation, arguments: { clipRef: selectedClip.clipRef } },
          },
        },
      );
      setTimeline(next);
      setNotice(`${trackLabels[selectedClip.clipKind]}片段已${operation === "DISABLE_CLIP" ? "停用" : "启用"}，已创建 Timeline v${next.timelineVersion.versionNumber}。`);
      const nextVersions = await creatorRequest<TimelineVersionsEnvelope>(
        productionResourcePath(run.productionRunRef, "timeline-versions"),
        { method: "GET" },
      );
      setVersions(nextVersions);
    } catch (mutationError) {
      setError(`Timeline 编辑未完成，未自动重试：${readableCreatorError(mutationError)}`);
    } finally {
      setMutating(false);
    }
  }

  const duration = timeline?.timelineVersion.durationFrames ?? 1;
  const previewUrl = runs.selectedRun
    ? `/api/creator/episode-production-runs/${encodeURIComponent(runs.selectedRun.productionRunRef)}/preview/content`
    : "";

  return (
    <section className={styles.workspace} aria-labelledby="timeline-title">
      <header className={styles.workspaceHeader}>
        <div><span>M13 · Timeline Studio</span><h1 id="timeline-title">剪辑工作区</h1><p>读取并编辑真实 TimelineVersion、Track 与 Clip；每次修改创建新版本。</p></div>
        <ProductionRunSelector runs={runs.runs} selectedRunRef={runs.selectedRunRef} onSelect={runs.selectRun} onRefresh={runs.refresh} disabled={loading || mutating} />
      </header>
      {runs.status === "loading" && !runs.selectedRun && <p role="status" className={styles.notice}>正在读取项目制作记录…</p>}
      {runs.status === "error" && <p role="alert" className={styles.error}>{runs.error}</p>}
      {runs.status === "ready" && runs.runs.length === 0 && <p className={styles.empty}>当前项目还没有单集制作记录。</p>}
      {loading && <p role="status" className={styles.notice}>正在读取 Timeline Studio 投影…</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {notice && <p role="status" className={styles.success}>{notice}</p>}
      {timeline && (
        <div className={styles.timelineStudio}>
          <aside className={styles.panel} aria-label="时间线素材与版本">
            <h2>版本与轨道</h2>
            <dl className={styles.factList}>
              <div><dt>当前版本</dt><dd>v{timeline.timelineVersion.versionNumber}</dd></div>
              <div><dt>画布</dt><dd>{timeline.timelineVersion.canvasWidth} × {timeline.timelineVersion.canvasHeight}</dd></div>
              <div><dt>帧率</dt><dd>{timeline.timelineVersion.frameRate} fps</dd></div>
              <div><dt>总时长</dt><dd>{duration} 帧</dd></div>
            </dl>
            <h3>版本血缘</h3>
            <ol className={styles.versionList}>{(versions?.versions ?? []).map(version => <li key={version.timelineVersionRef} data-current={version.timelineVersionRef === timeline.timelineVersion.timelineVersionRef}><strong>v{version.versionNumber}</strong><span>{shortRef(version.timelineVersionRef)}</span></li>)}</ol>
          </aside>
          <main className={styles.timelineCanvas} aria-label="M13 时间线画布">
            <div className={styles.previewStage}>
              {previewReady ? <video controls preload="metadata" src={previewUrl} aria-label="M13 技术预览" /> : <div><strong>技术预览尚未生成</strong><p>Timeline 可编辑不等于 M14 审片、批准或发布已完成。</p></div>}
            </div>
            <div className={styles.timelineRuler} aria-hidden="true"><span>0f</span><span>{Math.round(duration / 2)}f</span><span>{duration}f</span></div>
            <div className={styles.trackStack}>
              {sortedTracks.map(track => <TimelineTrackLane key={track.trackRef} track={track} clips={timeline.clips.filter(clip => clip.trackRef === track.trackRef)} duration={duration} selectedClipRef={selectedClipRef} onSelect={setSelectedClipRef} />)}
            </div>
          </main>
          <aside className={styles.panel} aria-label="片段检查器">
            <h2>Clip Inspector</h2>
            {!selectedClip ? <p>选择一个片段查看权威绑定。</p> : <>
              <span className={styles.statusBadge}>{trackLabels[selectedClip.clipKind]}</span>
              <dl className={styles.factList}>
                <div><dt>片段</dt><dd>{shortRef(selectedClip.clipRef)}</dd></div>
                <div><dt>帧范围</dt><dd>{selectedClip.timelineStartFrameInclusive}–{selectedClip.timelineEndFrameExclusive}</dd></div>
                <div><dt>状态</dt><dd>{selectedClip.enabled ? "启用" : "停用"}</dd></div>
                <div><dt>图层 / Z</dt><dd>{selectedClip.layer} / {selectedClip.zOrder}</dd></div>
                <div><dt>混合</dt><dd>{selectedClip.blendMode}</dd></div>
                <div><dt>来源</dt><dd>{shortRef(String(Object.values(selectedClip.sourceBinding).find(value => typeof value === "string") ?? "权威来源已绑定"))}</dd></div>
              </dl>
              <button type="button" className={styles.primaryAction} onClick={() => void toggleSelectedClip()} disabled={mutating}>{mutating ? "正在创建新版本…" : selectedClip.enabled ? "停用片段并创建新版本" : "启用片段并创建新版本"}</button>
              <p className={styles.muted}>使用 expectedRunVersion 与 parent Timeline digest 做 CAS；失败不会自动重试。</p>
              <p className={styles.digest}>Digest · {shortRef(selectedClip.payloadDigest)}</p>
            </>}
          </aside>
        </div>
      )}
    </section>
  );
}

function TimelineTrackLane({ track, clips, duration, selectedClipRef, onSelect }: { track: CreatorTimelineTrack; clips: CreatorTimelineClip[]; duration: number; selectedClipRef: string; onSelect: (clipRef: string) => void }) {
  return <section className={styles.trackLane} data-disabled={!track.enabled}>
    <div><strong>{trackLabels[track.trackKind]}</strong><small>{track.enabled ? track.lanePolicy : "轨道停用"}</small></div>
    <div className={styles.trackBody}>
      {clips.map(clip => {
        const left = Math.max(0, Math.min(100, clip.timelineStartFrameInclusive / duration * 100));
        const width = Math.max(3, Math.min(100 - left, (clip.timelineEndFrameExclusive - clip.timelineStartFrameInclusive) / duration * 100));
        return <button type="button" key={clip.clipRef} data-kind={clip.clipKind} data-active={clip.clipRef === selectedClipRef} data-enabled={clip.enabled} style={{ left: `${left}%`, width: `${width}%` }} onClick={() => onSelect(clip.clipRef)} title={`${trackLabels[clip.clipKind]} ${clip.timelineStartFrameInclusive}-${clip.timelineEndFrameExclusive}`}><span>{trackLabels[clip.clipKind]}</span></button>;
      })}
    </div>
  </section>;
}
