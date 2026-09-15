"use client";

import { useCallback, useEffect, useState } from "react";
import { creatorRequest } from "@/features/core-integration/browser-client";
import { readRuntimeEnvironment, type RuntimeEnvironment } from "@/features/core-integration/image-video-client";
import type { GenerationScope } from "@/features/core-integration/generation-workspace-client";
import styles from "./generation-workspace.module.css";

type DisplayState = "CHECKING" | "CONNECTED" | "READY" | "IDLE" | "BUSY" | "UNAVAILABLE" | "DISCONNECTED";
type Item = { key: string; label: string; state: DisplayState; detail: string };

function items(environment: RuntimeEnvironment | null, coreConnected: boolean | null): Item[] {
  if (!environment) {
    const core = coreConnected === false ? "DISCONNECTED" : coreConnected ? "CONNECTED" : "CHECKING";
    const other = coreConnected === null ? "CHECKING" : "UNAVAILABLE";
    return [
      { key: "core", label: "Core", state: core, detail: core === "DISCONNECTED" ? "连接断开" : core === "CONNECTED" ? "已连接" : "检查中" },
      ...["Operator", "GPU", "ComfyUI", "Queue"].map(label => ({ key: label.toLowerCase(), label, state: other as DisplayState, detail: other === "CHECKING" ? "检查中" : "状态不可读" })),
    ];
  }
  return [
    { key: "core", label: "Core", state: environment.core, detail: "已连接" },
    { key: "operator", label: "Operator", state: environment.operator, detail: environment.operator === "READY" ? "就绪" : "不可用" },
    { key: "gpu", label: "GPU", state: environment.gpu, detail: environment.gpu === "CONNECTED" ? "已连接" : "不可用" },
    { key: "comfyui", label: "ComfyUI", state: environment.comfyui, detail: environment.comfyui === "CONNECTED" ? "已连接" : "不可用" },
    { key: "queue", label: "Queue", state: environment.queue.state,
      detail: environment.queue.state === "BUSY" ? `运行 ${environment.queue.runningCount} · 排队 ${environment.queue.pendingCount}` : environment.queue.state === "IDLE" ? "空闲" : "不可用" },
  ];
}

export function RuntimeEnvironmentBar({ scope }: { scope: GenerationScope }) {
  const [environment, setEnvironment] = useState<RuntimeEnvironment | null>(null);
  const [coreConnected, setCoreConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setMessage("");
    try {
      const result = await readRuntimeEnvironment(scope, signal);
      if (signal?.aborted) return;
      setEnvironment(result); setCoreConnected(true);
    } catch {
      if (signal?.aborted) return;
      setEnvironment(null);
      try {
        await creatorRequest("capabilities", { signal });
        if (!signal?.aborted) { setCoreConnected(true); setMessage("运行环境现场状态暂不可读。"); }
      } catch {
        if (!signal?.aborted) { setCoreConnected(false); setMessage("当前无法连接 Creator Core。"); }
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void refresh(controller.signal), 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [refresh]);

  const observed = environment?.observedAt
    ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "medium" }).format(new Date(environment.observedAt))
    : "尚无当前现场读数";
  return <section className={styles.environmentBar} aria-labelledby="runtime-environment-title">
    <div className={styles.environmentHeading}>
      <div><h2 id="runtime-environment-title">运行环境</h2><p>只读状态 · {observed} · 不会发起生成或签发 Grant</p></div>
      <button type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "检查中…" : "刷新运行环境"}</button>
    </div>
    <div className={styles.environmentItems}>
      {items(environment, coreConnected).map(item => <div className={styles.environmentItem} data-state={item.state} key={item.key} aria-label={`${item.label}：${item.detail}`}>
        <span className={styles.environmentDot} aria-hidden="true" /><span className={styles.environmentLabel}>{item.label}</span><strong>{item.detail}</strong>
      </div>)}
    </div>
    {message && <p className={styles.environmentMessage} role="status">{message}</p>}
  </section>;
}
