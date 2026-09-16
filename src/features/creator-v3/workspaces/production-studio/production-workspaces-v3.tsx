"use client";

import type { ProjectDestinationId } from "@/components";
import { useV3ProjectCollection } from "../../data";
import { CreatorProjectShell } from "../../shell";
import { AudioWorkspace } from "./audio-workspace";
import { StoryboardWorkspace } from "./storyboard-workspace";
import { TimelineWorkspace } from "./timeline-workspace";

type ProductionWorkspaceKind = Extract<ProjectDestinationId, "storyboard" | "audio" | "timeline">;

const workspaceMeta = {
  storyboard: {
    title: "分镜",
    contentLabel: "分镜工作区主要画布",
    runtime: "镜头图与方法计划由 Core 读取",
    authority: "ScriptVersion → StoryboardVersion → CreativeShotVersion",
  },
  audio: {
    title: "音频",
    contentLabel: "音频工作区主要画布",
    runtime: "M12 Runtime 未安装；需求合同可读",
    authority: "M9 AudioRequirement → M12 Route → M13 Timing",
  },
  timeline: {
    title: "剪辑",
    contentLabel: "Timeline Studio 主要画布",
    runtime: "M13 Timeline 读写由 Core CAS 保护",
    authority: "Timeline → immutable TimelineVersion → Track / Clip",
  },
} as const;

function ProductionWorkspaceV3({ projectRef, kind }: { projectRef: string; kind: ProductionWorkspaceKind }) {
  const { state, refresh } = useV3ProjectCollection();
  const project = state.status === "ready" ? state.projects.find(candidate => candidate.projectRef === projectRef) ?? null : null;
  const meta = workspaceMeta[kind];
  let canvas;
  if (project) {
    canvas = kind === "storyboard" ? <StoryboardWorkspace projectRef={projectRef} />
      : kind === "audio" ? <AudioWorkspace projectRef={projectRef} />
      : <TimelineWorkspace projectRef={projectRef} />;
  } else {
    const error = state.status === "error" || state.status === "disconnected" ? state.error.message : "项目尚不可读取";
    canvas = <section aria-label={`${meta.title}项目状态`} style={{ padding: 24 }}>
      <h1>{meta.title}工作区</h1>
      {state.status === "idle" || state.status === "loading" ? <p role="status">正在读取项目…</p> : <><p role="alert">{error}</p><button type="button" onClick={refresh}>重新读取</button></>}
    </section>;
  }

  const runtimeAvailable = kind !== "audio";
  return <CreatorProjectShell
    project={project}
    projectRef={projectRef}
    activeDestinationId={kind}
    primaryCanvas={canvas}
    contentLabel={meta.contentLabel}
    authorityLabel={`${meta.title}授权与证据`}
    contextBar={{
      seriesLabel: project ? `已绑定 ${project.seriesRefs.length} 个系列` : "项目读取中",
      episodeLabel: "从单集制作记录选择上下文",
      versionLabel: project ? `项目 v${project.version}` : "项目版本未读取",
      versionStateText: `${meta.title}权威投影`,
      readinessSummary: kind === "audio" ? "音频需求可读；M12 Runtime 未完成" : "技术工作区可用；不推断发布准备度",
      readinessState: "unverified",
      contextLabel: `${meta.title}项目上下文`,
    }}
    authorityEvidence={{
      layers: [
        { id: "ui", label: "界面", state: "available", stateLabel: "已接线", message: `${meta.title} V3 工作区已接入 Creator API` },
        { id: "authority", label: "Core", state: "available", stateLabel: "权威可读", message: meta.authority },
        { id: "runtime", label: "运行时", state: runtimeAvailable ? "available" : "blocked", stateLabel: runtimeAvailable ? "合同可用" : "未安装", message: meta.runtime },
        { id: "policy", label: "发布", state: "unverified", stateLabel: "未授权", message: "技术记录不等于 M14 Approval、Master 或发布" },
      ],
      summary: kind === "audio" ? "音频需求与路由合同可读；M12 Runtime 保持 fail-closed。" : `${meta.title}读取真实 Core 事实；发布与 M14 Approval 仍独立。`,
      fields: [
        { id: "project-ref", label: "项目引用", value: projectRef, sensitivity: "restricted", copyAllowed: true },
        { id: "authority-chain", label: "权威链", value: meta.authority, sensitivity: "ordinary", copyAllowed: false },
        { id: "runtime-state", label: "运行时边界", value: meta.runtime, sensitivity: "ordinary", copyAllowed: false },
      ],
      evidenceSummary: "仅展示当前 Creator Public API 返回的权威投影，不读取私有 Adapter 或 GPU。",
    }}
    jobShelf={<p role="status" style={{ padding: "8px 16px", margin: 0 }}>{kind === "audio" ? "M12 执行尚未开放；当前没有音频运行任务。" : "作业状态来自所选单集制作记录；本页不创建第二套队列。"}</p>}
  />;
}

export function StoryboardWorkspaceV3({ projectRef }: { projectRef: string }) {
  return <ProductionWorkspaceV3 projectRef={projectRef} kind="storyboard" />;
}

export function AudioWorkspaceV3({ projectRef }: { projectRef: string }) {
  return <ProductionWorkspaceV3 projectRef={projectRef} kind="audio" />;
}

export function TimelineWorkspaceV3({ projectRef }: { projectRef: string }) {
  return <ProductionWorkspaceV3 projectRef={projectRef} kind="timeline" />;
}
