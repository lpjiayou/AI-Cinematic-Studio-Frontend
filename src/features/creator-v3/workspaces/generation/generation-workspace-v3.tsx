"use client";

import { useV3ProjectCollection } from "../../data";
import { CreatorProjectShell } from "../../shell";
import { GenerationWorkspace } from "./generation-workspace";

export function GenerationWorkspaceV3({ projectRef }: { projectRef: string }) {
  const { state, refresh } = useV3ProjectCollection();
  const project = state.status === "ready" ? state.projects.find(p => p.projectRef === projectRef) ?? null : null;
  const error = state.status === "error" || state.status === "disconnected" ? state.error.message : "项目尚不可读取";
  const canvas = project ? <GenerationWorkspace projectRef={projectRef} /> :
    <section aria-label="生成项目状态" style={{ padding: 24 }}>
      <h1>视频生成</h1>
      {state.status === "idle" || state.status === "loading" ? <p role="status">正在读取项目…</p> :
        <><p role="alert">{error}</p><button onClick={refresh}>重新读取</button></>}
    </section>;
  return <CreatorProjectShell project={project} projectRef={projectRef} activeDestinationId="generation"
    primaryCanvas={canvas} contentLabel="视频生成主要画布" authorityLabel="视频生成授权与证据"
    contextBar={{ seriesLabel: project ? `已绑定 ${project.seriesRefs.length} 个系列` : "项目读取中",
      episodeLabel: "单集与作业见制作记录", versionLabel: project ? `项目 v${project.version}` : "项目版本未读取",
      versionStateText: "原作业状态独立核验", readinessSummary: "技术结果；不推断发布准备度",
      readinessState: "unverified", contextLabel: "视频生成项目上下文" }}
    jobShelf={<p role="status" style={{ padding: "8px 16px", margin: 0 }}>原作业进度见生成工作区；本页不创建独立队列。</p>}
    authorityEvidence={{
      layers: [
        { id: "ui", label: "界面", state: "available", stateLabel: "已接线", message: "状态与操作均通过 Creator API" },
        { id: "runtime", label: "运行时", state: "unverified", stateLabel: "以作业为准", message: "不根据页面状态推断 GPU 在线" },
        { id: "authority", label: "授权", state: "unverified", stateLabel: "逐次核验", message: "原 Operator 保留全部批准与一次执行约束" },
        { id: "policy", label: "发布", state: "unverified", stateLabel: "未授权", message: "技术结果不等于资产准入或正式发布" },
      ],
      summary: "原作业状态和视频可读，不代表新的生成或发布获准。",
      fields: [{ id: "project-ref", label: "项目引用", value: projectRef, sensitivity: "restricted", copyAllowed: true }],
      evidenceSummary: "当前页面保持原 Project / Episode / Job 血缘。",
    }} />;
}
