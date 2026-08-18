import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectedProductionWorkspace } from "./production-workspace";

const coreMocks = vi.hoisted(() => ({ request: vi.fn(), refresh: vi.fn() }));

vi.mock("@/features/core-integration", async () => {
  const actual = await vi.importActual<typeof import("@/features/core-integration")>(
    "@/features/core-integration",
  );
  return {
    ...actual,
    creatorRequest: coreMocks.request,
    useCreatorIntegration: () => ({
      state: { status: "connected", capabilities: [] },
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

function installBundleMocks(activeRun: { state: string }) {
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

describe("ConnectedProductionWorkspace", () => {
  beforeEach(() => {
    coreMocks.request.mockReset();
    coreMocks.refresh.mockReset();
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
