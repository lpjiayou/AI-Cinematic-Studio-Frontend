"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ACSBadge, ACSButton } from "@/components";
import {
  CreatorClientError,
  creatorRequest,
  useCreatorIntegration,
  type AssetPlanBundleEnvelope,
  type CreatorEpisodeProductionRun,
  type DeliveryBundleEnvelope,
  type EpisodeApprovalKind,
  type EpisodeProductionRunsEnvelope,
  type EpisodeProductionState,
  type FinalizeMutationEnvelope,
  type MediaBundleEnvelope,
  type PreviewMutationEnvelope,
  type ShotGraphBundleEnvelope,
} from "@/features/core-integration";
import { LOCAL_PROJECT_CLIENT_KEYS } from "@/features/project-data";
import { projectRoute } from "@/lib/project-navigation";
import styles from "./production-workspace.module.css";

export type ProductionWorkspaceStage = "shots" | "assets" | "review" | "delivery";

const STATE_ORDER: EpisodeProductionState[] = [
  "ROOTS_READY",
  "AUTHORITY_READY",
  "SCRIPT_VALIDATED",
  "SHOTS_COMPILED",
  "ASSETS_READY",
  "MEDIA_READY",
  "PREVIEW_READY",
  "QC_READY",
  "APPROVAL_READY",
  "MASTER_READY",
];

const STATE_LABELS: Record<EpisodeProductionState, string> = {
  ROOTS_READY: "单集根已锁定",
  AUTHORITY_READY: "权限与身份已锁定",
  SCRIPT_VALIDATED: "剧本已校验",
  SHOTS_COMPILED: "镜头图已编译",
  ASSETS_READY: "资产计划已就绪",
  MEDIA_READY: "媒体证据已就绪",
  PREVIEW_READY: "预览已合成",
  QC_READY: "机器质检已通过",
  APPROVAL_READY: "审批证据已就绪",
  MASTER_READY: "单集母版已就绪",
};

const STAGES: Array<{
  id: ProductionWorkspaceStage;
  label: string;
  description: string;
  href: (projectRef: string) => string;
}> = [
  {
    id: "shots",
    label: "镜头规划",
    description: "场景、镜头与连续性",
    href: (projectRef) => projectRoute(projectRef, "production"),
  },
  {
    id: "assets",
    label: "资产与任务",
    description: "需求、生成请求与执行",
    href: (projectRef) => `${projectRoute(projectRef, "production")}?stage=assets`,
  },
  {
    id: "review",
    label: "预览与质检",
    description: "播放、机器检查与人工审批",
    href: (projectRef) => projectRoute(projectRef, "post"),
  },
  {
    id: "delivery",
    label: "母版交付",
    description: "不可变母版与本地导出",
    href: (projectRef) => projectRoute(projectRef, "delivery"),
  },
];

const APPROVALS: Array<{ kind: EpisodeApprovalKind; label: string; description: string }> = [
  {
    kind: "CREATIVE_DIRECTION",
    label: "创作方向",
    description: "故事表达、节奏与导演意图",
  },
  {
    kind: "IDENTITY_CONTINUITY",
    label: "身份连续性",
    description: "角色身份锁与跨镜头一致性",
  },
  {
    kind: "TECHNICAL_QC",
    label: "技术质检",
    description: "画面、声音、时长与时间线证据",
  },
  {
    kind: "FINAL_MASTER",
    label: "最终母版",
    description: "确认生成不可变本地母版",
  },
];

type ApprovalDraft = Record<EpisodeApprovalKind, { approvalRef: string; actorRef: string }>;

function emptyApprovalDraft(): ApprovalDraft {
  return {
    CREATIVE_DIRECTION: { approvalRef: "", actorRef: "" },
    IDENTITY_CONTINUITY: { approvalRef: "", actorRef: "" },
    TECHNICAL_QC: { approvalRef: "", actorRef: "" },
    FINAL_MASTER: { approvalRef: "", actorRef: "" },
  };
}

function stateRank(state: EpisodeProductionState) {
  return STATE_ORDER.indexOf(state);
}

function hasReached(state: EpisodeProductionState, target: EpisodeProductionState) {
  return stateRank(state) >= stateRank(target);
}

function shortRef(value: string | undefined | null) {
  if (!value) return "未提供";
  return value.length > 24 ? `${value.slice(0, 11)}…${value.slice(-8)}` : value;
}

function formatBytes(value: number | undefined) {
  if (!Number.isFinite(value)) return "未提供";
  const bytes = value ?? 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(value: string | undefined) {
  if (!value) return "未提供";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

function textValue(value: unknown, fallback = "未提供") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function errorDetail(error: unknown) {
  if (error instanceof CreatorClientError) {
    return { code: error.detail.code, message: error.detail.message };
  }
  return {
    code: "unexpected_error",
    message: error instanceof Error ? error.message : "出现无法识别的错误。",
  };
}

function statusTone(state: EpisodeProductionState) {
  if (state === "MASTER_READY") return "success" as const;
  if (hasReached(state, "QC_READY")) return "primary" as const;
  return "info" as const;
}

function StageNavigation({ projectRef, current }: { projectRef: string; current: ProductionWorkspaceStage }) {
  return (
    <nav aria-label="K2 单集制作阶段" className={styles.stageNavigation}>
      <ol>
        {STAGES.map((stage, index) => (
          <li key={stage.id}>
            <Link aria-current={stage.id === current ? "page" : undefined} href={stage.href(projectRef)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.label}</strong>
              <small>{stage.description}</small>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function RunNavigator({
  run,
  runs,
  selectedRunRef,
  onSelect,
}: {
  run: CreatorEpisodeProductionRun;
  runs: CreatorEpisodeProductionRun[];
  selectedRunRef: string;
  onSelect: (value: string) => void;
}) {
  const milestones = [
    ["单集事实根", "ROOTS_READY"],
    ["权限与身份锁", "AUTHORITY_READY"],
    ["镜头图", "SHOTS_COMPILED"],
    ["资产解析", "ASSETS_READY"],
    ["媒体执行", "MEDIA_READY"],
    ["预览与质检", "QC_READY"],
    ["审批与母版", "MASTER_READY"],
  ] as const;

  return (
    <aside className={styles.navigator} aria-label="单集运行导航">
      <div className={styles.navigatorHeading}>
        <p>K2 SINGLE EPISODE</p>
        <h2>单集闭环</h2>
      </div>
      <label className={styles.runSelect}>
        <span>当前运行</span>
        <select value={selectedRunRef} onChange={(event) => onSelect(event.target.value)}>
          {runs.map((item) => (
            <option key={item.productionRunRef} value={item.productionRunRef}>
              {STATE_LABELS[item.state]} · {shortRef(item.productionRunRef)}
            </option>
          ))}
        </select>
      </label>
      <ol className={styles.milestoneList}>
        {milestones.map(([label, target], index) => {
          const complete = hasReached(run.state, target);
          const current =
            !complete &&
            (index === 0 || hasReached(run.state, milestones[index - 1][1]));
          return (
            <li data-complete={complete || undefined} data-current={current || undefined} key={target}>
              <span>{complete ? "完成" : current ? "当前" : "等待"}</span>
              <strong>{label}</strong>
            </li>
          );
        })}
      </ol>
      <details className={styles.evidenceDetails}>
        <summary>证据与版本</summary>
        <dl>
          <div><dt>运行 Ref</dt><dd title={run.productionRunRef}>{shortRef(run.productionRunRef)}</dd></div>
          <div><dt>Episode Ref</dt><dd title={run.episodeRef}>{shortRef(run.episodeRef)}</dd></div>
          <div><dt>Script Version</dt><dd title={run.scriptVersionRef}>{shortRef(run.scriptVersionRef)}</dd></div>
          <div><dt>根摘要</dt><dd title={run.payloadDigest}>{shortRef(run.payloadDigest)}</dd></div>
        </dl>
      </details>
    </aside>
  );
}

function EmptyStage({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <section className={styles.emptyStage}>
      <span aria-hidden="true" className={styles.emptyMark} />
      <p>NOT READY</p>
      <h2>{title}</h2>
      <div>{description}</div>
      {children}
    </section>
  );
}

function ShotWorkspace({ bundle, run }: { bundle: ShotGraphBundleEnvelope | null; run: CreatorEpisodeProductionRun }) {
  if (!bundle) {
    return (
      <EmptyStage
        title="镜头图尚未编译"
        description={
          run.state === "ROOTS_READY"
            ? "先完成 M6 权限裁决与 V5 Identity Lock；页面不会根据角色名称猜测权威引用。"
            : "需要把已确认剧本场景绑定到权威地点与道具引用后，才能生成可执行镜头图。"
        }
      />
    );
  }
  const graph = bundle.executableShotGraph;
  return (
    <section className={styles.canvasSection} aria-labelledby="shot-workspace-title">
      <header className={styles.sectionHeader}>
        <div>
          <p>STORY TO SHOT GRAPH</p>
          <h2 id="shot-workspace-title">可执行镜头图</h2>
          <span>每个镜头都保留剧本、身份锁、资产需求和帧数血缘。</span>
        </div>
        <ACSBadge dot tone="success">{bundle.creativeShotVersions.length} 个镜头</ACSBadge>
      </header>
      <div className={styles.factRibbon}>
        <div><span>画布</span><strong>{numberValue(graph.output.width)} × {numberValue(graph.output.height)}</strong></div>
        <div><span>帧率</span><strong>{numberValue(graph.output.frameRate)} fps</strong></div>
        <div><span>总帧数</span><strong>{numberValue(graph.output.totalFrames)}</strong></div>
        <div><span>发布状态</span><strong>{graph.publicationAllowed ? "可发布" : "禁止发布"}</strong></div>
      </div>
      <div className={styles.shotGrid}>
        {bundle.creativeShotVersions.map((shot) => (
          <article key={shot.creativeShotVersionRef}>
            <header>
              <span>SHOT {String(shot.globalOrder).padStart(2, "0")}</span>
              <ACSBadge tone="neutral">{Math.round(shot.durationFrames / shot.frameRate * 10) / 10}s</ACSBadge>
            </header>
            <h3>{textValue(shot.cameraInstruction.shotSize, "镜头")} · {textValue(shot.cameraInstruction.movement, "机位固定")}</h3>
            <p>{textValue(shot.action, "当前镜头动作来自已确认剧本。")}</p>
            <footer>
              <span>{shot.requiredCharacterIdentityLocks.length} 个身份锁</span>
              <span>{textValue(shot.cameraInstruction.lensMm, "—")} mm</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function AssetWorkspace({
  assetPlan,
  media,
  run,
  busy,
  onResolveAssets,
  onExecuteMedia,
}: {
  assetPlan: AssetPlanBundleEnvelope | null;
  media: MediaBundleEnvelope | null;
  run: CreatorEpisodeProductionRun;
  busy: boolean;
  onResolveAssets: () => void;
  onExecuteMedia: () => void;
}) {
  if (!assetPlan) {
    return (
      <EmptyStage title="资产计划尚未建立" description="镜头图完成后，Core 才能解析权威资产与每镜视频、音频生成请求。">
        <ACSButton disabled={run.state !== "SHOTS_COMPILED"} loading={busy} onClick={onResolveAssets}>
          解析镜头资产需求
        </ACSButton>
      </EmptyStage>
    );
  }
  const summary = assetPlan.assetResolutionManifest.summary ?? {};
  const mediaSummary = media?.mediaManifest.summary ?? {};
  return (
    <section className={styles.canvasSection} aria-labelledby="asset-workspace-title">
      <header className={styles.sectionHeader}>
        <div>
          <p>ASSET RESOLUTION & EXECUTION</p>
          <h2 id="asset-workspace-title">资产需求与媒体任务</h2>
          <span>解析结果与执行结果分开呈现；未选择真实 Provider 时不会声称已调用外部生成服务。</span>
        </div>
        <ACSBadge dot tone={media ? "success" : "warning"}>{media ? "媒体已验证" : "等待执行"}</ACSBadge>
      </header>
      <div className={styles.metricGrid}>
        <article><span>资产需求</span><strong>{numberValue(summary.requirements)}</strong><small>权威引用与媒体需求</small></article>
        <article><span>生成请求</span><strong>{assetPlan.generationRequests.length}</strong><small>每镜视频与音频</small></article>
        <article><span>已验证结果</span><strong>{numberValue(mediaSummary.verifiedResults)}</strong><small>{media ? "LOCAL_EVIDENCE" : "尚未执行"}</small></article>
        <article><span>失败任务</span><strong>{numberValue(mediaSummary.failed)}</strong><small>由 V4 任务事实给出</small></article>
      </div>
      {!media ? (
        <div className={styles.inlineAction}>
          <div>
            <strong>资产计划已通过，可提交单集媒体执行</strong>
            <span>当前 Core 的确定性本地适配器使用 CPU FFmpeg；不会标记为 GPU 或外部 Provider 成功。</span>
          </div>
          <ACSButton disabled={run.state !== "ASSETS_READY"} loading={busy} onClick={onExecuteMedia}>
            执行本地媒体任务
          </ACSButton>
        </div>
      ) : null}
      <div className={styles.jobTable} role="table" aria-label="媒体任务">
        <div role="row" className={styles.tableHeader}>
          <span role="columnheader">任务</span><span role="columnheader">类型</span><span role="columnheader">状态</span><span role="columnheader">执行证据</span>
        </div>
        {(media?.jobs ?? assetPlan.generationRequests).map((item, index) => {
          const job = item as Record<string, unknown>;
          return (
            <div role="row" key={textValue(job.jobRef ?? job.generationRequestVersionRef, String(index))}>
              <span role="cell">{shortRef(textValue(job.jobRef ?? job.generationRequestRef))}</span>
              <span role="cell">{textValue(job.mediaKind, "待解析")}</span>
              <span role="cell">{textValue(job.state ?? job.dispatchState, media ? "已验证" : "待调度")}</span>
              <span role="cell">{job.gpuUsed === true ? "GPU" : media ? "CPU · LOCAL_EVIDENCE" : "未执行"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReviewWorkspace({
  delivery,
  run,
  busy,
  approvalDraft,
  acknowledged,
  onDraftChange,
  onAcknowledgedChange,
  onPreview,
  onFinalize,
}: {
  delivery: DeliveryBundleEnvelope | null;
  run: CreatorEpisodeProductionRun;
  busy: boolean;
  approvalDraft: ApprovalDraft;
  acknowledged: boolean;
  onDraftChange: (kind: EpisodeApprovalKind, field: "approvalRef" | "actorRef", value: string) => void;
  onAcknowledgedChange: (value: boolean) => void;
  onPreview: () => void;
  onFinalize: () => void;
}) {
  const hasPreview = Boolean(delivery?.previewCandidate && delivery.qcReport);
  const approvalComplete = APPROVALS.every(({ kind }) =>
    approvalDraft[kind].approvalRef.trim() && approvalDraft[kind].actorRef.trim(),
  );
  if (!hasPreview) {
    return (
      <EmptyStage title="等待合成预览与机器质检" description="媒体证据齐备后，可生成一条受认证、禁止发布的单集预览，并运行六项确定性检查。">
        <ACSButton disabled={run.state !== "MEDIA_READY"} loading={busy} onClick={onPreview}>
          生成预览并运行质检
        </ACSButton>
      </EmptyStage>
    );
  }
  const preview = delivery?.previewCandidate;
  const qc = delivery?.qcReport;
  const previewUrl = `/api/creator/episode-production-runs/${encodeURIComponent(run.productionRunRef)}/preview/content`;
  return (
    <section className={styles.canvasSection} aria-labelledby="review-workspace-title">
      <header className={styles.sectionHeader}>
        <div>
          <p>PREVIEW, QC & HUMAN APPROVAL</p>
          <h2 id="review-workspace-title">先看片，再决定是否生成母版</h2>
          <span>机器质检只能提供证据；四项人工审批必须来自已配置的外部审批权威。</span>
        </div>
        <ACSBadge dot tone={qc?.result === "PASS" ? "success" : "danger"}>机器质检 {qc?.result}</ACSBadge>
      </header>
      <div className={styles.reviewGrid}>
        <div className={styles.playerPanel}>
          <video aria-label="K2 单集预览" controls key={preview?.sha256} preload="metadata" src={previewUrl} />
          <div>
            <span>{formatBytes(preview?.byteSize)}</span>
            <span>{preview?.provenance}</span>
            <span>{preview?.publicationAllowed ? "允许发布" : "禁止发布"}</span>
          </div>
        </div>
        <div className={styles.qcPanel}>
          <h3>机器检查</h3>
          <ul>
            {(qc?.checks ?? []).map((check) => (
              <li key={check.checkId}>
                <span>{check.checkId}</span>
                <ACSBadge tone={check.status === "PASSED" ? "success" : "danger"}>{check.status}</ACSBadge>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {run.state !== "MASTER_READY" ? (
        <section className={styles.approvalSection} aria-labelledby="approval-title">
          <header>
            <div><p>EXTERNAL APPROVALS</p><h3 id="approval-title">四项独立人工审批</h3></div>
            <ACSBadge tone="warning">不会自动批准</ACSBadge>
          </header>
          <div className={styles.approvalGrid}>
            {APPROVALS.map((approval) => (
              <fieldset key={approval.kind}>
                <legend>{approval.label}</legend>
                <p>{approval.description}</p>
                <label><span>审批引用</span><input aria-label={`${approval.label}审批引用`} autoComplete="off" onChange={(event) => onDraftChange(approval.kind, "approvalRef", event.target.value)} value={approvalDraft[approval.kind].approvalRef} /></label>
                <label><span>审批人引用</span><input aria-label={`${approval.label}审批人引用`} autoComplete="off" onChange={(event) => onDraftChange(approval.kind, "actorRef", event.target.value)} value={approvalDraft[approval.kind].actorRef} /></label>
              </fieldset>
            ))}
          </div>
          <label className={styles.acknowledgement}>
            <input checked={acknowledged} onChange={(event) => onAcknowledgedChange(event.target.checked)} type="checkbox" />
            <span>我确认上述引用来自真实外部审批记录，并理解本地证据仍禁止发布。</span>
          </label>
          <ACSButton disabled={!approvalComplete || !acknowledged || qc?.result !== "PASS"} loading={busy} onClick={onFinalize} size="large">
            验证审批并生成不可变母版
          </ACSButton>
        </section>
      ) : null}
    </section>
  );
}

function DeliveryWorkspace({ delivery, run }: { delivery: DeliveryBundleEnvelope | null; run: CreatorEpisodeProductionRun }) {
  const master = delivery?.episodeMaster;
  const exportArtifact = delivery?.exportArtifact;
  if (!master || !exportArtifact) {
    return (
      <EmptyStage title="母版尚未生成" description="请先在“预览与质检”中看片，提交四项可验证的人工审批；Core 默认拒绝缺失或未知审批。">
        <Link className={styles.primaryLink} href={projectRoute(run.projectRef, "post")}>前往预览与审批</Link>
      </EmptyStage>
    );
  }
  const downloadUrl = `/api/creator/episode-production-runs/${encodeURIComponent(run.productionRunRef)}/exports/${encodeURIComponent(exportArtifact.exportArtifactRef)}/content`;
  return (
    <section className={styles.canvasSection} aria-labelledby="delivery-workspace-title">
      <header className={styles.sectionHeader}>
        <div>
          <p>IMMUTABLE MASTER & EXPORT</p>
          <h2 id="delivery-workspace-title">单集母版与交付证据</h2>
          <span>母版已锁定；当前导出属于可播放本地证据，不授予发布权。</span>
        </div>
        <ACSBadge dot tone="success">母版已就绪</ACSBadge>
      </header>
      <div className={styles.deliveryGrid}>
        <div className={styles.playerPanel}>
          <video aria-label="K2 单集母版" controls preload="metadata" src={downloadUrl} />
        </div>
        <article className={styles.deliveryCard}>
          <p>DELIVERY PACKAGE</p>
          <h3>{exportArtifact.fileName}</h3>
          <dl>
            <div><dt>文件大小</dt><dd>{formatBytes(exportArtifact.byteSize)}</dd></div>
            <div><dt>媒体类型</dt><dd>{exportArtifact.mediaType}</dd></div>
            <div><dt>来源</dt><dd>{master.provenance}</dd></div>
            <div><dt>GPU</dt><dd>{master.gpuUsed ? "已使用" : "未使用"}</dd></div>
            <div><dt>发布权限</dt><dd>{exportArtifact.publicationAllowed ? "允许" : "不允许"}</dd></div>
          </dl>
          <a className={styles.primaryLink} download={exportArtifact.fileName} href={downloadUrl}>下载本地 MP4</a>
          <details className={styles.evidenceDetails}>
            <summary>查看摘要与版本</summary>
            <dl>
              <div><dt>Master Version</dt><dd title={master.episodeMasterVersionRef}>{shortRef(master.episodeMasterVersionRef)}</dd></div>
              <div><dt>Export Ref</dt><dd title={exportArtifact.exportArtifactRef}>{shortRef(exportArtifact.exportArtifactRef)}</dd></div>
              <div><dt>SHA-256</dt><dd title={exportArtifact.sha256}>{shortRef(exportArtifact.sha256)}</dd></div>
            </dl>
          </details>
        </article>
      </div>
    </section>
  );
}

function NextAction({
  run,
  stage,
  busy,
  onResolveAssets,
  onExecuteMedia,
  onPreview,
}: {
  run: CreatorEpisodeProductionRun;
  stage: ProductionWorkspaceStage;
  busy: boolean;
  onResolveAssets: () => void;
  onExecuteMedia: () => void;
  onPreview: () => void;
}) {
  let title = "核对当前链路";
  let description = "当前状态没有可安全自动执行的动作。";
  let action: React.ReactNode = null;
  if (run.state === "ROOTS_READY") {
    title = "连接 M6 权限与身份引用";
    description = "需要外部权限裁决和角色身份参考；系统不会按名称推断引用。";
    action = <Link className={styles.secondaryLink} href={projectRoute(run.projectRef, "planning/characters")}>打开角色工作室</Link>;
  } else if (run.state === "AUTHORITY_READY" || run.state === "SCRIPT_VALIDATED") {
    title = "确认场景权威绑定";
    description = "为已确认剧本场景提供地点与道具 Ref 后，Core 才能编译 Shot Graph。";
    action = <Link className={styles.secondaryLink} href={projectRoute(run.projectRef, "content/script")}>打开已确认剧本</Link>;
  } else if (run.state === "SHOTS_COMPILED") {
    title = "解析资产需求";
    description = "从镜头图建立权威资产引用和视频、音频生成请求。";
    action = <ACSButton loading={busy} onClick={onResolveAssets} size="small">解析资产</ACSButton>;
  } else if (run.state === "ASSETS_READY") {
    title = "执行单集媒体任务";
    description = "提交 V4 执行边界，并独立验证返回的本地媒体证据。";
    action = <ACSButton loading={busy} onClick={onExecuteMedia} size="small">执行媒体任务</ACSButton>;
  } else if (run.state === "MEDIA_READY") {
    title = "生成预览并质检";
    description = "合成时间线、生成预览并运行六项确定性机器检查。";
    action = <ACSButton loading={busy} onClick={onPreview} size="small">生成预览</ACSButton>;
  } else if (run.state === "QC_READY" || run.state === "APPROVAL_READY") {
    title = "等待四项人工审批";
    description = "先在预览页看片，再填写来自外部审批权威的四组引用。";
    action = stage === "review" ? null : <Link className={styles.secondaryLink} href={projectRoute(run.projectRef, "post")}>前往审批</Link>;
  } else if (run.state === "MASTER_READY") {
    title = "下载本地交付文件";
    description = "母版已完成，但 LOCAL_EVIDENCE 仍不具有发布权。";
    action = stage === "delivery" ? null : <Link className={styles.secondaryLink} href={projectRoute(run.projectRef, "delivery")}>查看交付</Link>;
  }

  return (
    <aside className={styles.inspector} aria-label="当前任务与数据边界">
      <section>
        <p>CURRENT STATE</p>
        <h2>{STATE_LABELS[run.state]}</h2>
        <ACSBadge dot tone={statusTone(run.state)}>{run.state}</ACSBadge>
      </section>
      <section>
        <p>NEXT ACTION</p>
        <h3>{title}</h3>
        <span>{description}</span>
        {action}
      </section>
      <section>
        <p>TRUTH BOUNDARY</p>
        <ul>
          <li>工作区范围由服务端凭据注入</li>
          <li>本地证据不替代外部 Provider</li>
          <li>GPU 使用状态来自 V4 任务事实</li>
          <li>审批不会由界面自动生成</li>
          <li>当前导出禁止发布</li>
        </ul>
      </section>
      <section>
        <p>UPDATED</p>
        <strong>{formatDate(run.updatedAt)}</strong>
      </section>
    </aside>
  );
}

export function ConnectedProductionWorkspace({
  projectRef,
  initialStage,
}: {
  projectRef: string;
  initialStage: ProductionWorkspaceStage;
}) {
  const { state: connection, refresh: refreshConnection } = useCreatorIntegration();
  const localProject = new Set<string>(LOCAL_PROJECT_CLIENT_KEYS).has(projectRef);
  const [runs, setRuns] = useState<CreatorEpisodeProductionRun[]>([]);
  const [selectedRunRef, setSelectedRunRef] = useState("");
  const [bundleState, setBundleState] = useState<{
    key: string;
    shotGraph: ShotGraphBundleEnvelope | null;
    assetPlan: AssetPlanBundleEnvelope | null;
    media: MediaBundleEnvelope | null;
    delivery: DeliveryBundleEnvelope | null;
  } | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [pageError, setPageError] = useState<{ code: string; message: string } | null>(null);
  const [operationMessage, setOperationMessage] = useState<string | null>(null);
  const [approvalDraft, setApprovalDraft] = useState<ApprovalDraft>(emptyApprovalDraft);
  const [acknowledged, setAcknowledged] = useState(false);

  const selectedRun = useMemo(
    () => runs.find((run) => run.productionRunRef === selectedRunRef) ?? runs[0] ?? null,
    [runs, selectedRunRef],
  );
  const expectedBundleKey = selectedRun
    ? `${selectedRun.productionRunRef}:${selectedRun.state}:${revision}`
    : "";
  const currentBundles = bundleState?.key === expectedBundleKey ? bundleState : null;
  const shotGraph = currentBundles?.shotGraph ?? null;
  const assetPlan = currentBundles?.assetPlan ?? null;
  const media = currentBundles?.media ?? null;
  const delivery = currentBundles?.delivery ?? null;
  const loadingBundles = Boolean(selectedRun && !currentBundles);

  useEffect(() => {
    if (localProject || connection.status !== "connected") {
      return;
    }
    const controller = new AbortController();
    void creatorRequest<EpisodeProductionRunsEnvelope>("episode-production-runs", {
      signal: controller.signal,
    })
      .then((payload) => {
        const matching = payload.runs
          .filter((run) => run.projectRef === projectRef)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
        setRuns(matching);
        setSelectedRunRef((current) =>
          matching.some((run) => run.productionRunRef === current)
            ? current
            : matching[0]?.productionRunRef ?? "",
        );
        setPageError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPageError(errorDetail(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRuns(false);
      });
    return () => controller.abort();
  }, [connection.status, localProject, projectRef, revision]);

  useEffect(() => {
    if (!selectedRun) return;
    const controller = new AbortController();
    const base = `episode-production-runs/${encodeURIComponent(selectedRun.productionRunRef)}`;
    const bundleKey = `${selectedRun.productionRunRef}:${selectedRun.state}:${revision}`;
    void (async () => {
      try {
        let nextShotGraph: ShotGraphBundleEnvelope | null = null;
        let nextAssetPlan: AssetPlanBundleEnvelope | null = null;
        let nextMedia: MediaBundleEnvelope | null = null;
        let nextDelivery: DeliveryBundleEnvelope | null = null;
        if (hasReached(selectedRun.state, "SHOTS_COMPILED")) {
          nextShotGraph = await creatorRequest<ShotGraphBundleEnvelope>(`${base}/shot-graph`, { signal: controller.signal });
        }
        if (hasReached(selectedRun.state, "ASSETS_READY")) {
          nextAssetPlan = await creatorRequest<AssetPlanBundleEnvelope>(`${base}/assets`, { signal: controller.signal });
        }
        if (hasReached(selectedRun.state, "MEDIA_READY")) {
          nextMedia = await creatorRequest<MediaBundleEnvelope>(`${base}/media`, { signal: controller.signal });
        }
        if (hasReached(selectedRun.state, "QC_READY")) {
          nextDelivery = await creatorRequest<DeliveryBundleEnvelope>(`${base}/delivery`, { signal: controller.signal });
        }
        setBundleState({
          key: bundleKey,
          shotGraph: nextShotGraph,
          assetPlan: nextAssetPlan,
          media: nextMedia,
          delivery: nextDelivery,
        });
        setPageError(null);
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setBundleState({
            key: bundleKey,
            shotGraph: null,
            assetPlan: null,
            media: null,
            delivery: null,
          });
          setPageError(errorDetail(error));
        }
      }
    })();
    return () => controller.abort();
  }, [revision, selectedRun]);

  function reloadRuns() {
    setLoadingRuns(true);
    setRevision((value) => value + 1);
  }

  async function execute(resource: "assets" | "media" | "preview", successMessage: string) {
    if (!selectedRun || busy) return;
    setBusy(true);
    setOperationMessage(null);
    try {
      const base = `episode-production-runs/${encodeURIComponent(selectedRun.productionRunRef)}`;
      const idempotencyKey = `g7-${resource}-${selectedRun.payloadDigest.slice(0, 24)}-v1`;
      if (resource === "preview") {
        await creatorRequest<PreviewMutationEnvelope>(`${base}/${resource}`, {
          method: "POST",
          body: { idempotencyKey },
        });
      } else {
        await creatorRequest<Record<string, unknown> & { ok: true }>(`${base}/${resource}`, {
          method: "POST",
          body: { idempotencyKey },
        });
      }
      setOperationMessage(successMessage);
      reloadRuns();
    } catch (error: unknown) {
      const detail = errorDetail(error);
      setOperationMessage(`${detail.message}（${detail.code}）`);
    } finally {
      setBusy(false);
    }
  }

  async function finalize() {
    if (!selectedRun || busy || !acknowledged) return;
    setBusy(true);
    setOperationMessage(null);
    try {
      const base = `episode-production-runs/${encodeURIComponent(selectedRun.productionRunRef)}`;
      const decisions = APPROVALS.map(({ kind }) => ({
        kind,
        decision: "ACCEPT" as const,
        approvalRef: approvalDraft[kind].approvalRef.trim(),
        actorRef: approvalDraft[kind].actorRef.trim(),
      }));
      await creatorRequest<FinalizeMutationEnvelope>(`${base}/finalize`, {
        method: "POST",
        body: {
          idempotencyKey: `g7-finalize-${selectedRun.payloadDigest.slice(0, 24)}-v1`,
          decisions,
        },
      });
      setOperationMessage("外部审批已验证，母版与本地导出已生成。");
      reloadRuns();
    } catch (error: unknown) {
      const detail = errorDetail(error);
      setOperationMessage(`${detail.message}（${detail.code}）`);
    } finally {
      setBusy(false);
    }
  }

  function updateApproval(kind: EpisodeApprovalKind, field: "approvalRef" | "actorRef", value: string) {
    setApprovalDraft((current) => ({
      ...current,
      [kind]: { ...current[kind], [field]: value },
    }));
  }

  function selectRun(value: string) {
    setSelectedRunRef(value);
    setApprovalDraft(emptyApprovalDraft());
    setAcknowledged(false);
    setOperationMessage(null);
  }

  if (localProject) {
    return (
      <main className={styles.statePage}>
        <EmptyStage title="本地演示项目没有权威生产链" description="LOCAL_FIXTURE 只用于界面浏览，不能伪装成 K2 EpisodeProductionRun。请从项目中心选择 Core 项目。">
          <Link className={styles.primaryLink} href="/creator/projects">返回项目中心</Link>
        </EmptyStage>
      </main>
    );
  }

  if (connection.status === "loading" || (connection.status === "connected" && loadingRuns)) {
    return <main className={styles.statePage}><EmptyStage title="正在读取单集生产事实" description="正在通过服务端 Experience Adapter 核对当前工作区与 Core。" /></main>;
  }

  if (connection.status !== "connected") {
    return (
      <main className={styles.statePage}>
        <EmptyStage title="当前无法连接 Creator Core" description="页面不会用本地样例替代权威项目、运行状态或审批结果。">
          <ACSButton onClick={refreshConnection}>重新连接</ACSButton>
        </EmptyStage>
      </main>
    );
  }

  if (pageError && !selectedRun) {
    return (
      <main className={styles.statePage}>
        <EmptyStage title="无法读取单集生产链" description={`${pageError.message}（${pageError.code}）`}>
          <ACSButton onClick={reloadRuns}>重新读取</ACSButton>
        </EmptyStage>
      </main>
    );
  }

  if (!selectedRun) {
    return (
      <main className={styles.statePage}>
        <EmptyStage title="这个项目还没有 K2 单集运行" description="先在已确认的 Project、Series、Episode、Series Plan 与 Script Version 上建立 EpisodeProductionRun。">
          <div className={styles.emptyActions}>
            <Link className={styles.primaryLink} href={projectRoute(projectRef, "content/script")}>核对剧本与集数</Link>
            <ACSButton onClick={reloadRuns} variant="secondary">刷新运行</ACSButton>
          </div>
        </EmptyStage>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p>K2 GOLDEN EPISODE · CONNECTED WORKSPACE</p>
          <h1>把一集从已确认剧本推进到可播放母版</h1>
          <span>当前界面只读取和推进这个 Core 项目的真实单集链路；所有状态、版本、摘要与权限均以服务端事实为准。</span>
        </div>
        <div className={styles.headerStatus}>
          <ACSBadge dot tone={statusTone(selectedRun.state)}>{STATE_LABELS[selectedRun.state]}</ACSBadge>
          <button onClick={reloadRuns} type="button">刷新事实</button>
        </div>
      </header>

      <StageNavigation current={initialStage} projectRef={projectRef} />

      {operationMessage ? <p aria-live="polite" className={styles.operationMessage}>{operationMessage}</p> : null}
      {pageError ? <p aria-live="assertive" className={styles.errorMessage}>{pageError.message}（{pageError.code}）</p> : null}

      <div className={styles.workspace} data-loading={loadingBundles || undefined}>
        <RunNavigator onSelect={selectRun} run={selectedRun} runs={runs} selectedRunRef={selectedRun.productionRunRef} />
        <div className={styles.canvas}>
          {loadingBundles ? <div className={styles.loadingOverlay}>正在核对最新版本与血缘…</div> : null}
          {initialStage === "shots" ? <ShotWorkspace bundle={shotGraph} run={selectedRun} /> : null}
          {initialStage === "assets" ? (
            <AssetWorkspace
              assetPlan={assetPlan}
              busy={busy}
              media={media}
              onExecuteMedia={() => void execute("media", "媒体任务已执行并通过证据校验。")}
              onResolveAssets={() => void execute("assets", "资产需求与生成请求已建立。")}
              run={selectedRun}
            />
          ) : null}
          {initialStage === "review" ? (
            <ReviewWorkspace
              acknowledged={acknowledged}
              approvalDraft={approvalDraft}
              busy={busy}
              delivery={delivery}
              onAcknowledgedChange={setAcknowledged}
              onDraftChange={updateApproval}
              onFinalize={() => void finalize()}
              onPreview={() => void execute("preview", "预览已合成，机器质检已完成。")}
              run={selectedRun}
            />
          ) : null}
          {initialStage === "delivery" ? <DeliveryWorkspace delivery={delivery} run={selectedRun} /> : null}
        </div>
        <NextAction
          busy={busy}
          onExecuteMedia={() => void execute("media", "媒体任务已执行并通过证据校验。")}
          onPreview={() => void execute("preview", "预览已合成，机器质检已完成。")}
          onResolveAssets={() => void execute("assets", "资产需求与生成请求已建立。")}
          run={selectedRun}
          stage={initialStage}
        />
      </div>
    </main>
  );
}
