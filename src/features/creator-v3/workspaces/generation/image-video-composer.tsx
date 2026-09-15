"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CreatorClientError } from "@/features/core-integration/browser-client";
import { createImageVideoGeneration, IMAGE_VIDEO_MAX_BYTES, IMAGE_VIDEO_MAX_DESCRIPTION, imageVideoContentUrl, readImageVideoWorkspace, type ImageVideoWorkspace } from "@/features/core-integration/image-video-client";
import type { GenerationScope } from "@/features/core-integration/generation-workspace-client";
import styles from "./generation-workspace.module.css";

const stateLabels = { PREPARING: "正在准备输入", QUEUED: "等待生成", RUNNING: "正在生成视频", SUCCEEDED: "视频已生成", FAILED: "生成失败", UNKNOWN: "提交结果待核实" };
const definitiveConflictCodes = new Set(["generation_policy_expired", "generation_budget_exhausted", "generation_already_active", "generation_policy_changed"]);
function availabilityMessage(workspace: ImageVideoWorkspace) {
  if (workspace.reason === "generation_already_active") return workspace.generations.some(generation => generation.state === "UNKNOWN")
    ? "已有作业的提交结果待核实，暂不能创建新作业。请核实原作业，页面不会自动补发。"
    : "已有作业正在处理，请等待当前作业结束。页面会自动刷新进度，不会重复提交。";
  if (workspace.reason === "generation_budget_exhausted") return "当前生成次数或费用额度已用完，暂不能创建新作业。已有结果仍可查看。";
  if (workspace.reason === "generation_policy_expired" || workspace.reason === "OUTSIDE_VALIDITY_WINDOW") return "当前生成授权窗口已结束，暂不能创建新作业。已有结果仍可查看。";
  if (workspace.reason === "generation_policy_changed") return "生成配置或费用上限已更新，请刷新后确认本次条件。";
  return workspace.policy ? "暂不能创建新作业，请刷新查看最新状态。页面不会切换到演示数据。"
    : "当前生成服务不可用。请先由操作端连接服务；页面不会切换到演示数据。";
}
type SelectedImage = { name: string; dataUrl: string; base64: string; mediaType: "image/png" | "image/jpeg" };
export function ImageVideoComposer({ scope }: { scope: GenerationScope }) {
  return <ScopedComposer key={JSON.stringify(scope)} scope={scope} />;
}

function ScopedComposer({ scope }: { scope: GenerationScope }) {
  const [workspace, setWorkspace] = useState<ImageVideoWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [selectedRef, setSelectedRef] = useState("");
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const fileReader = useRef<FileReader | null>(null);
  const sequence = useRef(0);
  const fileInput = useRef<HTMLInputElement | null>(null);
  // Browser storage is only an ambiguous-request safety latch. It is never a
  // source of jobs, scope authority, progress or results; these come from Core.
  const pendingKey = `acs-image-video-pending:${JSON.stringify(scope)}`;
  const refresh = useCallback(async (signal: AbortSignal) => {
    const requestSequence = ++sequence.current;
    try {
      const next = await readImageVideoWorkspace(scope, signal);
      if (signal.aborted || requestSequence !== sequence.current) return;
      setWorkspace(next); setReadError("");
      setSelectedRef(previous => next.generations.some(generation => generation.generationRef === previous) ? previous : next.generations[0]?.generationRef ?? "");
      setUncertain(Boolean(sessionStorage.getItem(pendingKey)));
    } catch (error) {
      if (!signal.aborted && requestSequence === sequence.current) { setReadError(error instanceof Error ? error.message : "无法读取图片视频生成服务。"); setWorkspace(null); }
    } finally { if (!signal.aborted && requestSequence === sequence.current) setLoading(false); }
  }, [scope, pendingKey]);
  useEffect(() => {
    const activeController = new AbortController(); controller.current = activeController;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => { await refresh(activeController.signal); if (!activeController.signal.aborted) timer = setTimeout(poll, 4000); };
    void poll();
    return () => { activeController.abort(); fileReader.current?.abort(); if (timer) clearTimeout(timer); };
  }, [refresh]);

  function selectImage(file?: File) {
    fileReader.current?.abort(); setImage(null); setSubmitError(""); setReadingImage(false);
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || !file.size || file.size > IMAGE_VIDEO_MAX_BYTES) {
      setSubmitError("请选择不超过 8 MB 的 PNG 或 JPEG 图片。"); if (fileInput.current) fileInput.current.value = ""; return;
    }
    const reader = new FileReader(); fileReader.current = reader; setReadingImage(true);
    reader.onload = () => {
      if (controller.current?.signal.aborted || fileReader.current !== reader) return;
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const prefix = `data:${file.type};base64,`;
      if (!dataUrl.startsWith(prefix)) { setSubmitError("图片读取失败，请重新选择。"); setReadingImage(false); return; }
      setImage({ name: file.name, dataUrl, base64: dataUrl.slice(prefix.length), mediaType: file.type as SelectedImage["mediaType"] }); setReadingImage(false);
    };
    reader.onerror = () => { if (!controller.current?.signal.aborted && fileReader.current === reader) { setSubmitError("图片读取失败，请重新选择。"); setReadingImage(false); } };
    reader.readAsDataURL(file);
  }
  const active = workspace?.generations.some(generation => ["PREPARING", "QUEUED", "RUNNING"].includes(generation.state)) ?? false;
  const blocked = loading || !workspace?.available || !workspace.policy || submitting || readingImage || active || uncertain;
  async function generate() {
    if (inFlight.current || blocked || !image || !description.trim() || [...description].length > IMAGE_VIDEO_MAX_DESCRIPTION || !workspace?.policy) return;
    const signal = controller.current?.signal;
    if (!signal || signal.aborted) return;
    inFlight.current = true; setSubmitting(true); setSubmitError("");
    let attempted = false;
    try {
      if (sessionStorage.getItem(pendingKey)) { setUncertain(true); return; }
      const idempotencyKey = crypto.randomUUID();
      sessionStorage.setItem(pendingKey, idempotencyKey);
      attempted = true;
      const generation = await createImageVideoGeneration(scope, {
        projectRef: scope.projectRef, seriesRef: scope.seriesRef, episodeRef: scope.episodeRef,
        imageBase64: image.base64, imageMediaType: image.mediaType, description: description.trim(),
        expectedPolicyDigest: workspace.policy.policyDigest, idempotencyKey,
      }, signal);
      // A validated server receipt, not text/digest matching, resolves this latch.
      sessionStorage.removeItem(pendingKey);
      if (signal.aborted) return;
      setWorkspace(current => current ? { ...current, generations: [generation, ...current.generations.filter(g => g.generationRef !== generation.generationRef)] } : current);
      setSelectedRef(generation.generationRef); setUncertain(false); setImage(null); setDescription("");
      if (fileInput.current) fileInput.current.value = "";
    } catch (error) {
      // Only closed, definitive policy/capacity denials prove that this POST did
      // not accept a new Job. Unknown conflicts and idempotency conflicts remain
      // ambiguous, so neither refresh nor a new key may silently send again.
      const rejected = error instanceof CreatorClientError && error.status >= 400 && error.status < 500 && error.status !== 408
        && (error.status !== 409 || definitiveConflictCodes.has(error.detail.code));
      if (rejected) sessionStorage.removeItem(pendingKey);
      if (!signal.aborted) {
        setUncertain(attempted && !rejected);
        setSubmitError(attempted && !rejected ? "请求结果尚未确认，可能已经接收。已停止重复提交，请只刷新查看服务器记录。" : error instanceof Error ? error.message : "无法安全保存提交标识，本次未发送请求。");
        if (rejected) void refresh(signal);
      }
    } finally { inFlight.current = false; if (!signal.aborted) setSubmitting(false); }
  }
  const selected = workspace?.generations.find(generation => generation.generationRef === selectedRef);
  return <section className={styles.composer} aria-labelledby="image-video-title">
    <div className={styles.heading}><h2 id="image-video-title">一张图片，一句描述</h2><button onClick={() => { if (controller.current) void refresh(controller.current.signal); }} disabled={loading}>刷新新作业</button></div>
    <p>上传参考图片，描述希望出现的动作，生成一段两秒视频。原 SH09 作业和视频保持不变。</p>
    {loading && <p role="status">正在读取生成服务与单次费用上限…</p>}
    {readError && <p role="alert" className={styles.error}>{readError}</p>}
    {workspace && !workspace.available && <p role="status">{availabilityMessage(workspace)}</p>}
    {workspace?.policy && <p className={styles.policy}>单次费用上限 ¥{(workspace.policy.maxCostMinor / 100).toFixed(2)} · 704 × 1280 · 24 fps · 2 秒<br />只创建一个独立新作业；失败或结果未知不会自动重试。点击生成即按显示的费用上限提交本次任务。</p>}
    <div className={styles.inputGrid}><div><label className={styles.fieldLabel} htmlFor="image-video-file">参考图片</label>
      <input ref={fileInput} id="image-video-file" type="file" accept="image/png,image/jpeg" disabled={blocked} onChange={event => selectImage(event.target.files?.[0])} />
      <p className={styles.muted}>PNG / JPEG，最多 8 MB。可重新选择图片。</p>
      {image && <figure className={styles.imagePreview}><div className={styles.imageFrame}><Image src={image.dataUrl} unoptimized fill sizes="(max-width: 700px) 100vw, 50vw" alt="本次生成参考图片预览" /></div><figcaption>{image.name}</figcaption></figure>}
    </div><div><label className={styles.fieldLabel} htmlFor="image-video-description">画面描述</label>
      <textarea id="image-video-description" rows={5} disabled={blocked} value={description} onChange={event => setDescription(event.target.value)} placeholder="例如：人物缓缓抬头看向镜头，头发随微风轻动，镜头保持固定。" aria-describedby="image-video-description-count" />
      <p id="image-video-description-count" className={styles.muted}>{[...description].length} / 1000 字</p>
      <button className={styles.primary} disabled={blocked || !image || !description.trim() || [...description].length > IMAGE_VIDEO_MAX_DESCRIPTION} onClick={() => void generate()}>{submitting ? "正在提交一次…" : "生成两秒视频"}</button>
    </div></div>
    {submitError && <p role="alert" className={styles.error}>{submitError}</p>}
    {uncertain && !submitError && <p role="alert" className={styles.error}>本浏览器有尚未确认的提交。为避免重复计费，已禁止再次发送；请查看服务器作业记录并核实原请求。</p>}
    {workspace && <div className={styles.history}><h3>新生成记录</h3>
      {!workspace.generations.length && <p>暂无新生成记录。上传图片并填写描述后可创建一次新作业。</p>}
      {!!workspace.generations.length && <><label className={styles.fieldLabel} htmlFor="image-video-history">选择新生成作业</label><select id="image-video-history" value={selectedRef} onChange={event => setSelectedRef(event.target.value)}>
        {workspace.generations.map(generation => <option value={generation.generationRef} key={generation.generationRef}>{stateLabels[generation.state]} · {generation.createdAt} · {generation.generationRef}</option>)}</select></>}
      {selected && <><p role="status">{stateLabels[selected.state]} · 尝试次数 {selected.attemptCount}</p><p>{selected.description}</p>
        {selected.artifact && <video key={selected.generationRef} className={styles.video} controls preload="metadata" src={imageVideoContentUrl(selected)} aria-label="新生成的两秒视频" />}
        {selected.state === "UNKNOWN" && <p className={styles.error}>任务结果未知，禁止自动补发。请核实此作业。</p>}
        {selected.state === "FAILED" && <p className={styles.error}>本次生成失败，未自动重试。{selected.errorCode ? `错误码：${selected.errorCode}` : ""}</p>}
        <dl><div><dt>独立作业</dt><dd>{selected.mediaJobRef ?? "尚未分配"}</dd></div><div><dt>输入摘要</dt><dd>{selected.inputSha256}</dd></div><div><dt>视频摘要</dt><dd>{selected.artifact?.sha256 ?? "尚无结果"}</dd></div></dl>
      </>}
    </div>}
  </section>;
}
