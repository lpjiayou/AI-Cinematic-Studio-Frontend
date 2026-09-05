import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, MouseEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productionTruthProjection } from "@/features/core-integration/state-projection-test-fixtures";
import { ConnectedProductionWorkspace } from "./production-workspace";

const coreMocks = vi.hoisted(() => ({
  request: vi.fn(),
  stateProjection: vi.fn(),
  refresh: vi.fn(),
  capabilities: vi.fn(),
  handlers: new Map<string, () => void>(),
}));

vi.mock("@/components", async () => {
  const actual = await vi.importActual<typeof import("@/components")>("@/components");
  return {
    ...actual,
    ACSButton: (props: ComponentProps<typeof actual.ACSButton>) => {
      // Retain real button behavior while allowing a direct handler invocation.
      if (typeof props.children === "string" && props.onClick) {
        coreMocks.handlers.set(props.children, () => props.onClick?.({} as MouseEvent<HTMLButtonElement>));
      }
      return <actual.ACSButton {...props} />;
    },
  };
});

vi.mock("@/features/core-integration", async () => {
  const actual = await vi.importActual<typeof import("@/features/core-integration")>(
    "@/features/core-integration",
  );
  return {
    ...actual,
    creatorRequest: coreMocks.request,
    getK2ProductionStateProjection: coreMocks.stateProjection,
    useCreatorIntegration: () => ({
      state: { status: "connected", capabilities: coreMocks.capabilities() },
      refresh: coreMocks.refresh,
    }),
  };
});

const run = {
  schemaVersion: "v5.episode-production-run.v1",
  productionRunRef: "episode-production-run-1",
  contentProfileRef: "profile-1",
  projectRef: "project-core-1",
  seriesRef: "series-core-1",
  episodeRef: "episode-core-1",
  seriesPlanRef: "series-plan-1",
  seriesPlanVersionRef: "series-plan-version-1",
  episodePlanItemRef: "episode-plan-item-1",
  scriptRef: "script-1",
  scriptVersionRef: "script-version-1",
  manifest: {
    expectedShotCount: 2,
    executionMode: "LOCAL_EVIDENCE",
    output: { width: 1920, height: 1080, frameRate: 24, totalFrames: 240 },
  },
  upstreamSnapshot: {},
  upstreamDigest: "a".repeat(64),
  payloadDigest: "b".repeat(64),
  state: "SHOTS_COMPILED",
  createdAt: "2026-08-17T02:00:00Z",
  updatedAt: "2026-08-17T02:00:00Z",
  version: 1,
  idempotentReplay: false,
} as const;

const shotBundle = {
  ok: true,
  state: "SHOTS_COMPILED",
  consistencyValidation: {},
  storyboardVersion: {
    storyboardVersionRef: "storyboard-version-1",
    scenes: [],
    payloadDigest: "c".repeat(64),
  },
  creativeShotVersions: [1, 2].map((order) => ({
    creativeShotRef: `shot-${order}`,
    creativeShotVersionRef: `shot-version-${order}`,
    scriptSceneRef: "scene-1",
    globalOrder: order,
    sceneOrder: order,
    durationFrames: 120,
    frameRate: 24,
    cameraInstruction: {
      shotSize: order === 1 ? "wide" : "medium-close-up",
      movement: order === 1 ? "slow-dolly-in" : "locked-off",
      lensMm: order === 1 ? 28 : 50,
    },
    action: `镜头动作 ${order}`,
    requiredCharacterIdentityLocks: [{
      characterRef: "character-1",
      identityLockVersionRef: "identity-lock-version-1",
      referenceVersionRef: "reference-version-1",
    }],
    payloadDigest: `${order}`.repeat(64),
  })),
  executableShotGraph: {
    executableShotGraphVersionRef: "shot-graph-version-1",
    shots: [],
    edges: [],
    output: { width: 1920, height: 1080, frameRate: 24, totalFrames: 240 },
    payloadDigest: "d".repeat(64),
    publicationAllowed: false,
  },
} as const;

const assetBundle = {
  ok: true,
  state: "ASSETS_READY",
  assetResolutionManifest: {
    summary: { requirements: 6, generationRequested: 4, generationRequests: 4, blocked: 0 },
    payloadDigest: "e".repeat(64),
    publicationAllowed: false,
  },
  assetRequirements: [],
  generationRequests: [],
} as const;

const mediaBundle = {
  ok: true,
  state: "MEDIA_READY",
  mediaManifest: {
    summary: { requested: 4, verifiedResults: 4, registeredAssets: 4, failed: 0 },
    payloadDigest: "f".repeat(64),
    provenance: "LOCAL_EVIDENCE",
    gpuUsed: false,
    publicationAllowed: false,
  },
  generationResults: [],
  assetVersions: [],
  jobs: [],
} as const;

const productionReadiness = {
  ok: true,
  policyBundle: null,
  readiness: {
    state: "BLOCKED_POLICY",
    policyRecorded: false,
    rightsState: "MISSING",
    providerPolicyState: "MISSING",
    persistenceClass: "LOCAL_SQLITE_EVIDENCE",
    rootPayloadDigest: "8".repeat(64),
    blockers: [
      "identity_reference_rights_not_approved",
      "production_policy_missing",
      "live_provider_evidence_missing",
      "publication_authority_missing",
    ],
    publicationAllowed: false,
  },
} as const;

const stateProjection = {
  ok: true,
  schemaVersion: "v5.k2-production-state-projection.v1",
  workspaceRef: "workspace-k2",
  productionRunRef: run.productionRunRef,
  state: "REAL_VIDEO_PLAN_READY",
  productionState: "REAL_VIDEO_PLAN_READY",
  rootState: {
    state: "ROOTS_READY",
    authority: "V5_ROOT_DATABASE",
    mutable: false,
  },
  productionProjection: {
    state: "REAL_VIDEO_PLAN_READY",
    authority: "V5_EVIDENCE_TRANSITIONS",
  },
  runtimeState: {
    state: "ATTENTION_REQUIRED",
    authority: "V4_RUNTIME_NON_CANONICAL",
    jobCount: 4,
  },
  visualQcState: {
    state: "NOT_RECORDED",
    authority: "V5_CANONICAL_APPEND_ONLY",
    activeRevisionRef: "real-video-plan-v1",
    candidateCount: 2,
    decisionCount: 0,
    decisions: [],
  },
  activeRevision: {
    state: "ACTIVE",
    revisionRef: "real-video-plan-v1",
    authority: "V5_CANONICAL_APPEND_ONLY",
  },
  candidateLifecycle: {
    schemaVersion: "v5.k2-candidate-lifecycle-projection.v1",
    workspaceRef: "workspace-k2",
    productionRunRef: run.productionRunRef,
    latestCandidateRevisionRef: "real-video-plan-v1",
    latestCandidateRevisionRefs: { VIDEO: "real-video-plan-v1" },
    activeRevisionRef: "real-video-plan-v1",
    historicalCandidateCount: 0,
    candidates: [
      { candidateRef: "candidate-1", revisionRef: "real-video-plan-v1" },
      { candidateRef: "candidate-2", revisionRef: "real-video-plan-v1" },
    ],
    assetVersions: [],
    publicationAllowed: false,
  },
  candidates: [
    { candidateRef: "candidate-1", revisionRef: "real-video-plan-v1" },
    { candidateRef: "candidate-2", revisionRef: "real-video-plan-v1" },
  ],
  invariants: {
    runtimeDoesNotAdvanceProduction: true,
    visualQcDoesNotAdvanceProduction: true,
    assetVersionAuthority: "V5_CANONICAL_EVIDENCE_ONLY",
    publicationAllowed: false,
  },
  publicationAllowed: false,
} as const;

function deliveryBundle(state: "QC_READY" | "MASTER_READY" = "QC_READY") {
  return {
    ok: true,
    state,
    productionRunRef: run.productionRunRef,
    timelineVersion: {
      timelineVersionRef: "timeline-version-1",
      items: [],
      output: {},
      payloadDigest: "1".repeat(64),
    },
    previewCandidate: {
      previewCandidateVersionRef: "preview-version-1",
      mediaType: "video/mp4",
      byteSize: 1024,
      sha256: "2".repeat(64),
      provenance: "LOCAL_EVIDENCE",
      approvalStatus: "UNAPPROVED",
      gpuUsed: false,
      publicationAllowed: false,
      payloadDigest: "3".repeat(64),
    },
    qcReport: {
      qcReportRef: "qc-1",
      result: "PASS",
      checks: [
        { checkId: "video-stream-contract", status: "PASSED" },
        { checkId: "identity-continuity-lineage", status: "PASSED" },
      ],
      machineVerified: true,
      approvalStatus: "UNAPPROVED",
      publicationAllowed: false,
      payloadDigest: "4".repeat(64),
    },
    ...(state === "MASTER_READY"
      ? {
          approvalDecisions: [],
          episodeMaster: {
            episodeMasterVersionRef: "master-version-1",
            state: "IMMUTABLE_MASTER",
            mediaType: "video/mp4",
            byteSize: 2048,
            sha256: "5".repeat(64),
            provenance: "LOCAL_EVIDENCE",
            gpuUsed: false,
            publicationAllowed: false,
            payloadDigest: "6".repeat(64),
          },
          exportArtifact: {
            exportArtifactRef: "export-1",
            fileName: "k2-episode.mp4",
            mediaType: "video/mp4",
            byteSize: 2048,
            sha256: "5".repeat(64),
            state: "PLAYABLE_LOCAL_EVIDENCE",
            downloadAllowed: true,
            publicationAllowed: false,
            payloadDigest: "7".repeat(64),
          },
        }
      : {}),
  };
}

function installBundleMocks(activeRun: { productionRunRef: string; state: string }) {
  coreMocks.stateProjection.mockResolvedValue({
    ...stateProjection,
    productionRunRef: activeRun.productionRunRef,
    state: activeRun.state,
    productionState: activeRun.state,
    productionProjection: {
      ...stateProjection.productionProjection,
      state: activeRun.state,
    },
    candidateLifecycle: {
      ...stateProjection.candidateLifecycle,
      productionRunRef: activeRun.productionRunRef,
    },
  });
  coreMocks.request.mockImplementation(async (path: string, init?: { method?: string }) => {
    if (path === "episode-production-runs") return { ok: true, runs: [activeRun] };
    if (path.endsWith("/production-readiness")) return productionReadiness;
    if (path.endsWith("/shot-graph")) return shotBundle;
    if (path.endsWith("/assets")) return assetBundle;
    if (path.endsWith("/media")) return mediaBundle;
    if (path.endsWith("/delivery")) return deliveryBundle(activeRun.state === "MASTER_READY" ? "MASTER_READY" : "QC_READY");
    if (path.endsWith("/preview") && init?.method === "POST") {
      return { ...deliveryBundle(), idempotentReplay: false };
    }
    if (path.endsWith("/finalize") && init?.method === "POST") {
      return { ...deliveryBundle("MASTER_READY"), idempotentReplay: false };
    }
    throw new Error(`Unexpected request: ${path}`);
  });
}

function approvalReadyProjection(
  candidateCount = 4,
  expectedCandidateCount: number | null = candidateCount,
) {
  const candidates = Array.from({ length: candidateCount }, (_, index) => ({
    candidateRef: `video-candidate-${index + 1}`,
    revisionRef: "video-revision-1",
    selectionState: "SELECTED_BY_HUMAN",
    admissionState: "ADMITTED",
    assetVersionRef: `video-asset-version-${index + 1}`,
  }));
  return {
    ...stateProjection,
    productionRunRef: run.productionRunRef,
    state: "APPROVAL_READY" as const,
    productionState: "APPROVAL_READY" as const,
    productionProjection: {
      ...stateProjection.productionProjection,
      state: "APPROVAL_READY" as const,
    },
    visualQcState: {
      ...stateProjection.visualQcState,
      state: "PASS" as const,
      activeRevisionRef: "video-revision-1",
      candidateCount,
      expectedCandidateCount,
      decisionCount: candidateCount,
      decisions: candidates.map((candidate, index) => ({
        visualQcRef: `video-qc-${index + 1}-v1`,
        visualQcVersion: 1,
        candidateRef: candidate.candidateRef,
        result: "PASS",
        payloadDigest: String(index + 1).repeat(64),
      })),
    },
    activeRevision: {
      ...stateProjection.activeRevision,
      revisionRef: "video-revision-1",
    },
    candidateLifecycle: {
      ...stateProjection.candidateLifecycle,
      productionRunRef: run.productionRunRef,
      latestCandidateRevisionRef: "video-revision-1",
      latestCandidateRevisionRefs: { VIDEO: "video-revision-1" },
      activeRevisionRef: "video-revision-1",
      candidates,
    },
    candidates,
  };
}

describe("ConnectedProductionWorkspace", () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    coreMocks.request.mockReset();
    coreMocks.stateProjection.mockReset();
    coreMocks.refresh.mockReset();
    coreMocks.capabilities.mockReset();
    coreMocks.handlers.clear();
    coreMocks.capabilities.mockReturnValue([
      {
        id: "M10",
        name: "Image Studio",
        state: "production_policy_required",
        publicResources: ["episode-production-runs/production-readiness"],
        requirements: ["M9"],
      },
    ]);
  });

  it.each(["SHOTS_COMPILED", "ASSETS_READY"] as const)("I2 removes legacy writes in %s", async (state) => {
    const user = userEvent.setup();
    installBundleMocks({ ...run, state });
    render(<ConnectedProductionWorkspace initialStage="assets" projectRef="project-core-1" />);
    await screen.findByRole("list", { name: "K2 四轴状态投影" });
    const actions = screen.queryAllByRole("button", { name: /^(解析镜头资产需求|解析资产|执行本地媒体任务|执行媒体任务)$/ });
    // A regressed visible action must also be unable to issue a legacy product POST.
    if (actions[0]) await user.click(actions[0]);
    const posts = coreMocks.request.mock.calls.filter(([path, init]) => /\/(assets|media)$/.test(String(path)) && init?.method === "POST");
    expect({ visibleLegacyActions: actions.length, legacyProductPosts: posts.length }).toEqual({ visibleLegacyActions: 0, legacyProductPosts: 0 });
  });

  it("explains the closed legacy asset path when no historical plan exists", async () => {
    installBundleMocks(run);
    render(<ConnectedProductionWorkspace initialStage="assets" projectRef="project-core-1" />);
    expect(await screen.findByRole("heading", { name: "新的资产与生成流程尚未在此页面开放" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "等待新的分镜与方法规划界面" })).toBeInTheDocument();
    expect(screen.getByText("历史兼容", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("只读", { exact: true })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "返回项目概览" }).some((link) => link.getAttribute("href") === "/creator/projects/project-core-1/overview#destination-storyboard")).toBe(true);
    expect(coreMocks.request.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
  });

  it.each(["ASSETS_READY", "MEDIA_READY"] as const)("preserves read-only historical bundles in %s", async (state) => {
    const user = userEvent.setup();
    installBundleMocks({ ...run, state });
    const request = coreMocks.request.getMockImplementation()!;
    coreMocks.request.mockImplementation(async (path: string, init?: { method?: string }) => {
      if (path.endsWith("/assets")) return { ...assetBundle, assetRequirements: [{ assetRequirementRef: "historical-requirement-1" }], generationRequests: [{ generationRequestRef: "historical-request-1" }] };
      if (path.endsWith("/media")) return { ...mediaBundle, assetVersions: [{ assetVersionRef: "historical-media-version-1" }], jobs: [{ jobRef: "historical-job-1", status: "SUCCEEDED", taskType: "VIDEO" }] };
      return request(path, init);
    });
    render(<ConnectedProductionWorkspace initialStage="assets" projectRef="project-core-1" />);
    expect(await screen.findByRole("heading", { name: "历史资产与媒体证据" })).toBeInTheDocument();
    expect(screen.getByText("历史兼容", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("只读", { exact: true })).toBeInTheDocument();
    await user.click(screen.getByText("查看历史资产与媒体证据"));
    expect(screen.getByText("historical-requirement-1")).toBeVisible();
    expect(within(screen.getByText("查看历史资产与媒体证据").closest("details")!).getByText("historical-request-1")).toBeVisible();
    expect(coreMocks.request).toHaveBeenCalledWith(expect.stringMatching(/\/assets$/), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    if (state === "MEDIA_READY") {
      expect(screen.getByText("historical-media-version-1")).toBeVisible();
      expect(within(screen.getByRole("table", { name: "媒体任务" })).getAllByRole("row")).toHaveLength(2);
      expect(coreMocks.request).toHaveBeenCalledWith(expect.stringMatching(/\/media$/), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    } else {
      expect(screen.getByRole("heading", { name: "历史资产计划已存在" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "查看生成开放条件" })).toHaveAttribute("href", "/creator/projects/project-core-1/overview#destination-generation");
    }
    expect(coreMocks.request.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
  });

  describe.each(["stale-qc", "stale-revision"] as const)("I3 %s", (kind) => {
    const title = kind === "stale-qc" ? "视觉质检基于旧候选" : "素材版本已经变化，需要重新审查";

    it("accepts the public payload, blocks Preview at its handler, and allows refresh", async () => {
      const user = userEvent.setup();
      installBundleMocks({ ...run, state: "MEDIA_READY" });
      const { getK2ProductionStateProjection } = await vi.importActual<typeof import("@/features/core-integration/browser-client")>("@/features/core-integration/browser-client");
      const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json(productionTruthProjection(kind)));
      coreMocks.stateProjection.mockImplementation(() => getK2ProductionStateProjection(run.productionRunRef));
      render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);
      const hold = await screen.findByRole("region", { name: "生产动作已冻结" });
      expect(within(hold).getByRole("heading", { name: title })).toBeInTheDocument();
      if (kind === "stale-revision") expect(within(hold).getByRole("heading", { name: "当前修订已过期，质检保持阻断" })).toBeInTheDocument();
      expect(screen.queryByText(/state_projection_contract_mismatch/)).not.toBeInTheDocument();
      expect(screen.queryByText("生产状态冲突 · 动作已冻结")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "生成预览并运行质检" })).toBeDisabled();
      expect(screen.queryByRole("button", { name: "生成预览" })).not.toBeInTheDocument();
      expect(within(hold).getByRole("link", { name: "查看历史证据" })).toHaveAttribute("href", "/creator/projects/project-core-1/production?stage=assets#asset-workspace-title");
      const previewHandler = coreMocks.handlers.get("生成预览并运行质检");
      expect(previewHandler).toBeTypeOf("function");
      await act(async () => { previewHandler!(); });
      expect(screen.getByText(`${title}。生产动作已冻结，请重新读取事实。`)).toBeInTheDocument();
      await user.click(within(hold).getByRole("button", { name: "重新读取事实" }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      expect(await screen.findByRole("region", { name: "生产动作已冻结" })).toBeInTheDocument();
      expect(coreMocks.request.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
      expect(fetchMock.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
    });

    it.each(["QC_READY", "APPROVAL_READY"] as const)("keeps historical Preview readable but withholds Finalize in %s", async (state) => {
      installBundleMocks({ ...run, state });
      coreMocks.stateProjection.mockResolvedValue(productionTruthProjection(kind, state));
      render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);
      expect(await screen.findByRole("region", { name: "生产动作已冻结" })).toBeInTheDocument();
      expect(screen.getByLabelText("K2 单集预览")).toHaveAttribute("src", "/api/creator/episode-production-runs/episode-production-run-1/preview/content");
      expect(screen.queryByRole("button", { name: "验证审批并生成不可变母版" })).not.toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "创作方向审批引用" })).not.toBeInTheDocument();
      expect(coreMocks.request.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
    });

    it("keeps historical Delivery available without advancing stale truth", async () => {
      installBundleMocks({ ...run, state: "MASTER_READY" });
      coreMocks.stateProjection.mockResolvedValue(productionTruthProjection(kind, "MASTER_READY"));
      render(<ConnectedProductionWorkspace initialStage="delivery" projectRef="project-core-1" />);
      expect(await screen.findByRole("region", { name: "生产动作已冻结" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "下载本地 MP4" })).toHaveAttribute("href", "/api/creator/episode-production-runs/episode-production-run-1/exports/export-1/content");
      expect(coreMocks.request.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
    });

    it("blocks a previously captured Finalize handler after refreshed truth becomes stale", async () => {
      const user = userEvent.setup();
      installBundleMocks({ ...run, state: "QC_READY" });
      coreMocks.stateProjection.mockResolvedValue(productionTruthProjection("active", "QC_READY"));
      render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);
      const button = await screen.findByRole("button", { name: "验证审批并生成不可变母版" });
      for (const approval of ["创作方向", "身份连续性", "技术质检", "最终母版"]) {
        await user.type(screen.getByRole("textbox", { name: `${approval}审批引用` }), `approval-${approval}`);
        await user.type(screen.getByRole("textbox", { name: `${approval}审批人引用` }), "actor-project-lead");
      }
      await user.click(screen.getByRole("checkbox"));
      expect(button).toBeEnabled();
      const finalizeHandler = coreMocks.handlers.get("验证审批并生成不可变母版");
      expect(finalizeHandler).toBeTypeOf("function");
      coreMocks.stateProjection.mockResolvedValue(productionTruthProjection(kind, "QC_READY"));
      await user.click(screen.getByRole("button", { name: "刷新事实" }));
      await screen.findByRole("region", { name: "生产动作已冻结" });
      await act(async () => { finalizeHandler!(); });
      expect(screen.getByText(`${title}。生产动作已冻结，请重新读取事实。`)).toBeInTheDocument();
      expect(coreMocks.request.mock.calls.every(([, init]) => !init?.method || init.method === "GET")).toBe(true);
    });
  });

  it("keeps the accepted Core baseline usable when readiness is not advertised", async () => {
    coreMocks.capabilities.mockReturnValue([]);
    installBundleMocks(run);
    render(<ConnectedProductionWorkspace initialStage="shots" projectRef="project-core-1" />);

    expect(await screen.findByRole("heading", { name: "可执行镜头图" })).toBeInTheDocument();
    expect(
      screen.getByText("当前 Core 基线未公开生产就绪事实；发布保持禁止。"),
    ).toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path]) =>
          typeof path === "string" && path.endsWith("/production-readiness"),
      ),
    ).toBe(false);
  });

  it("renders the Core-backed executable shot graph at full project scope", async () => {
    installBundleMocks(run);
    render(<ConnectedProductionWorkspace initialStage="shots" projectRef="project-core-1" />);

    expect(await screen.findByRole("heading", { name: "可执行镜头图" })).toBeInTheDocument();
    expect(screen.getByText("1920 × 1080")).toBeInTheDocument();
    expect(screen.getByText("SHOT 01")).toBeInTheDocument();
    expect(screen.getByText("镜头动作 2")).toBeInTheDocument();
    expect(screen.getByText("禁止发布")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "尚未具备可发布生产条件" })).toBeInTheDocument();
    expect(screen.getByText("角色参考尚未取得可发布版权授权")).toBeInTheDocument();
    expect(coreMocks.request).toHaveBeenCalledWith(
      expect.stringContaining("episode-production-run-1/shot-graph"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("keeps V5 production, V4 runtime, and visual QC as separate read-only axes", async () => {
    const realVideoRun = { ...run, state: "REAL_VIDEO_PLAN_READY" as const };
    installBundleMocks(realVideoRun);
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    const axes = await screen.findByRole("list", { name: "K2 四轴状态投影" });
    expect(within(axes).getByText("根状态 · ROOTS_READY")).toBeInTheDocument();
    expect(within(axes).getByText("生产状态 · REAL_VIDEO_PLAN_READY")).toBeInTheDocument();
    expect(within(axes).getByText("V4 运行时 · ATTENTION_REQUIRED")).toBeInTheDocument();
    expect(within(axes).getByText("语义视觉 QC · NOT_RECORDED")).toBeInTheDocument();
    expect(screen.getByText("候选链 · 2 个候选")).toBeInTheDocument();
    expect(screen.getByText("运行时不可推进生产状态")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "核对视频候选、视觉质检与选择" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "验证审批并生成不可变母版" })).not.toBeInTheDocument();
    expect(coreMocks.stateProjection).toHaveBeenCalledWith(
      run.productionRunRef,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("fails closed when the run list and control-plane projection disagree", async () => {
    const qcReady = { ...run, state: "QC_READY" as const };
    installBundleMocks(qcReady);
    coreMocks.stateProjection.mockResolvedValue({
      ...stateProjection,
      productionRunRef: qcReady.productionRunRef,
      state: "REAL_VIDEO_PLAN_READY",
      productionState: "REAL_VIDEO_PLAN_READY",
      productionProjection: {
        ...stateProjection.productionProjection,
        state: "REAL_VIDEO_PLAN_READY",
      },
    });
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(
      await screen.findByRole("heading", {
        name: "控制面事实不一致，生产动作已冻结",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("生产状态冲突 · 动作已冻结")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "验证审批并生成不可变母版" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "创作方向审批引用" })).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/finalize") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("fails closed when a matching projection weakens a control-plane invariant", async () => {
    installBundleMocks(run);
    coreMocks.stateProjection.mockResolvedValue({
      ...stateProjection,
      productionRunRef: run.productionRunRef,
      state: run.state,
      productionState: run.state,
      productionProjection: {
        ...stateProjection.productionProjection,
        state: run.state,
      },
      candidateLifecycle: {
        ...stateProjection.candidateLifecycle,
        productionRunRef: run.productionRunRef,
      },
      invariants: {
        ...stateProjection.invariants,
        runtimeDoesNotAdvanceProduction: false,
      },
    });
    render(<ConnectedProductionWorkspace initialStage="assets" projectRef="project-core-1" />);

    expect(
      await screen.findByRole("heading", {
        name: "控制面事实不一致，生产动作已冻结",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "解析镜头资产需求" })).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/assets") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("fails closed when the active revision diverges across projection axes", async () => {
    installBundleMocks(run);
    coreMocks.stateProjection.mockResolvedValue({
      ...stateProjection,
      productionRunRef: run.productionRunRef,
      state: run.state,
      productionState: run.state,
      productionProjection: {
        ...stateProjection.productionProjection,
        state: run.state,
      },
      candidateLifecycle: {
        ...stateProjection.candidateLifecycle,
        productionRunRef: run.productionRunRef,
        activeRevisionRef: "different-revision",
      },
    });
    render(<ConnectedProductionWorkspace initialStage="assets" projectRef="project-core-1" />);

    expect(
      await screen.findByRole("heading", {
        name: "控制面事实不一致，生产动作已冻结",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "解析镜头资产需求" })).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/assets") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("starts preview generation only after an explicit user action", async () => {
    const user = userEvent.setup();
    const mediaReady = { ...run, state: "MEDIA_READY" as const };
    installBundleMocks(mediaReady);
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    const action = await screen.findByRole("button", { name: "生成预览并运行质检" });
    expect(coreMocks.request.mock.calls.some(([path]) => String(path).endsWith("/preview"))).toBe(false);
    await user.click(action);

    await waitFor(() =>
      expect(coreMocks.request).toHaveBeenCalledWith(
        "episode-production-runs/episode-production-run-1/preview",
        expect.objectContaining({
          method: "POST",
          body: { idempotencyKey: `g7-preview-${run.payloadDigest.slice(0, 24)}-v1` },
        }),
      ),
    );
  });

  it("plays the authenticated preview and never synthesizes human approvals", async () => {
    const user = userEvent.setup();
    const qcReady = { ...run, state: "QC_READY" as const };
    installBundleMocks(qcReady);
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    const preview = await screen.findByLabelText("K2 单集预览");
    expect(preview).toHaveAttribute(
      "src",
      "/api/creator/episode-production-runs/episode-production-run-1/preview/content",
    );
    const finalizeButton = screen.getByRole("button", { name: "验证审批并生成不可变母版" });
    expect(finalizeButton).toBeDisabled();
    expect(screen.getByText("不会自动批准")).toBeInTheDocument();

    for (const approval of ["创作方向", "身份连续性", "技术质检", "最终母版"]) {
      await user.type(screen.getByRole("textbox", { name: `${approval}审批引用` }), `approval-${approval}`);
      await user.type(screen.getByRole("textbox", { name: `${approval}审批人引用` }), "actor-project-lead");
    }
    await user.click(screen.getByRole("checkbox"));
    expect(finalizeButton).toBeEnabled();
    await user.click(finalizeButton);

    await waitFor(() => {
      const call = coreMocks.request.mock.calls.find(([path]) => String(path).endsWith("/finalize"));
      expect(call?.[1]).toEqual(expect.objectContaining({ method: "POST" }));
      expect(call?.[1]?.body.decisions).toHaveLength(4);
      expect(call?.[1]?.body).not.toHaveProperty("workspaceRef");
    });
  });

  it("shows finalization only for four exact current admitted video candidates", async () => {
    const approvalReady = { ...run, state: "APPROVAL_READY" as const };
    installBundleMocks(approvalReady);
    coreMocks.stateProjection.mockResolvedValue(approvalReadyProjection());
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(
      await screen.findByRole("button", { name: "验证审批并生成不可变母版" }),
    ).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "创作方向审批引用" })).toBeInTheDocument();
  });

  it("accepts a four-item admitted successor whose plan cardinality is no longer projected", async () => {
    const approvalReady = { ...run, state: "APPROVAL_READY" as const };
    installBundleMocks(approvalReady);
    coreMocks.stateProjection.mockResolvedValue(approvalReadyProjection(4, null));
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(
      await screen.findByRole("button", { name: "验证审批并生成不可变母版" }),
    ).toBeDisabled();
  });

  it("withholds finalization for a sparse one-candidate PASS admission", async () => {
    const approvalReady = { ...run, state: "APPROVAL_READY" as const };
    installBundleMocks(approvalReady);
    coreMocks.stateProjection.mockResolvedValue(approvalReadyProjection(1));
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(await screen.findByLabelText("K2 单集预览")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "验证审批并生成不可变母版" }),
    ).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/finalize") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("withholds finalization after one currently admitted candidate is authoritatively rejected", async () => {
    const approvalReady = { ...run, state: "APPROVAL_READY" as const };
    installBundleMocks(approvalReady);
    const projection = approvalReadyProjection();
    const rejectedCandidates = [
      { ...projection.candidates[0], selectionState: "REJECTED_BY_HUMAN" },
      ...projection.candidates.slice(1),
    ];
    coreMocks.stateProjection.mockResolvedValue({
      ...projection,
      candidateLifecycle: {
        ...projection.candidateLifecycle,
        candidates: rejectedCandidates,
      },
      candidates: rejectedCandidates,
    });
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(await screen.findByLabelText("K2 单集预览")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "验证审批并生成不可变母版" }),
    ).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/finalize") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("withholds finalization when the latest admitted video revision has a superseding QC failure", async () => {
    const approvalReady = { ...run, state: "APPROVAL_READY" as const };
    installBundleMocks(approvalReady);
    const failedVideoCandidate = {
      candidateRef: "video-candidate-1",
      revisionRef: "video-revision-1",
      admissionState: "ADMITTED",
    };
    coreMocks.stateProjection.mockResolvedValue({
      ...stateProjection,
      productionRunRef: approvalReady.productionRunRef,
      state: approvalReady.state,
      productionState: approvalReady.state,
      productionProjection: {
        ...stateProjection.productionProjection,
        state: approvalReady.state,
      },
      visualQcState: {
        ...stateProjection.visualQcState,
        state: "FAIL",
        activeRevisionRef: "video-revision-1",
        candidateCount: 1,
        decisionCount: 1,
        decisions: [
          {
            visualQcRef: "video-qc-1-v2",
            visualQcVersion: 2,
            candidateRef: failedVideoCandidate.candidateRef,
            result: "FAIL",
            payloadDigest: "9".repeat(64),
          },
        ],
      },
      activeRevision: {
        ...stateProjection.activeRevision,
        revisionRef: "video-revision-1",
      },
      candidateLifecycle: {
        ...stateProjection.candidateLifecycle,
        productionRunRef: approvalReady.productionRunRef,
        latestCandidateRevisionRef: "video-revision-1",
        latestCandidateRevisionRefs: { VIDEO: "video-revision-1" },
        activeRevisionRef: "video-revision-1",
        candidates: [failedVideoCandidate],
      },
      candidates: [failedVideoCandidate],
    });
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(await screen.findByLabelText("K2 单集预览")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "验证审批并生成不可变母版" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "创作方向审批引用" })).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/finalize") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("withholds finalization when APPROVAL_READY omits the canonical video revision", async () => {
    const approvalReady = { ...run, state: "APPROVAL_READY" as const };
    installBundleMocks(approvalReady);
    const admittedVideoCandidate = {
      candidateRef: "video-candidate-1",
      revisionRef: "video-revision-1",
      admissionState: "ADMITTED",
    };
    coreMocks.stateProjection.mockResolvedValue({
      ...stateProjection,
      productionRunRef: approvalReady.productionRunRef,
      state: approvalReady.state,
      productionState: approvalReady.state,
      productionProjection: {
        ...stateProjection.productionProjection,
        state: approvalReady.state,
      },
      visualQcState: {
        ...stateProjection.visualQcState,
        state: "PASS",
        activeRevisionRef: "video-revision-1",
        candidateCount: 1,
        decisionCount: 1,
        decisions: [
          {
            visualQcRef: "video-qc-1-v1",
            visualQcVersion: 1,
            candidateRef: admittedVideoCandidate.candidateRef,
            result: "PASS",
            payloadDigest: "8".repeat(64),
          },
        ],
      },
      activeRevision: {
        ...stateProjection.activeRevision,
        revisionRef: "video-revision-1",
      },
      candidateLifecycle: {
        ...stateProjection.candidateLifecycle,
        productionRunRef: approvalReady.productionRunRef,
        latestCandidateRevisionRef: "video-revision-1",
        latestCandidateRevisionRefs: {},
        activeRevisionRef: "video-revision-1",
        candidates: [admittedVideoCandidate],
      },
      candidates: [admittedVideoCandidate],
    });
    render(<ConnectedProductionWorkspace initialStage="review" projectRef="project-core-1" />);

    expect(await screen.findByLabelText("K2 单集预览")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "验证审批并生成不可变母版" }),
    ).not.toBeInTheDocument();
    expect(
      coreMocks.request.mock.calls.some(
        ([path, init]) => String(path).endsWith("/finalize") && init?.method === "POST",
      ),
    ).toBe(false);
  });

  it("shows the immutable local-evidence export without claiming publication rights", async () => {
    const masterReady = { ...run, state: "MASTER_READY" as const };
    installBundleMocks(masterReady);
    render(<ConnectedProductionWorkspace initialStage="delivery" projectRef="project-core-1" />);

    expect(await screen.findByRole("heading", { name: "单集母版与交付证据" })).toBeInTheDocument();
    expect(screen.getByText("k2-episode.mp4")).toBeInTheDocument();
    expect(screen.getByText("不允许")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载本地 MP4" })).toHaveAttribute(
      "href",
      "/api/creator/episode-production-runs/episode-production-run-1/exports/export-1/content",
    );
  });
});
