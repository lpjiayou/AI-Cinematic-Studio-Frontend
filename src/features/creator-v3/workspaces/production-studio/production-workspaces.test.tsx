import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CreatorEpisodeProductionRun,
  ShotGraphBundleEnvelope,
  TimelineProjectionEnvelope,
  TimelineVersionsEnvelope,
} from "@/features/core-integration";
import { audioFixture, executionFixture } from "@/features/core-integration/method-aware-test-fixtures";
import { ThemeProvider } from "@/theme";
import { AudioWorkspace } from "./audio-workspace";
import { StoryboardWorkspace } from "./storyboard-workspace";
import { TimelineWorkspace } from "./timeline-workspace";

const api = vi.hoisted(() => ({
  creatorRequest: vi.fn(),
  getExecutionMethodPlan: vi.fn(),
  getExplicitAudioRequirementRoute: vi.fn(),
}));

vi.mock("@/features/core-integration", async importOriginal => ({
  ...await importOriginal<typeof import("@/features/core-integration")>(),
  creatorRequest: api.creatorRequest,
  getExecutionMethodPlan: api.getExecutionMethodPlan,
  getExplicitAudioRequirementRoute: api.getExplicitAudioRequirementRoute,
}));

const digest = "a".repeat(64);
const run: CreatorEpisodeProductionRun = {
  schemaVersion: "v5.episode-production-run.v1",
  productionRunRef: "run-test",
  contentProfileRef: "profile-test",
  projectRef: "project-test",
  seriesRef: "series-test",
  episodeRef: "episode-test",
  seriesPlanRef: "series-plan-test",
  seriesPlanVersionRef: "series-plan-version-test",
  episodePlanItemRef: "episode-plan-item-test",
  scriptRef: "script-test",
  scriptVersionRef: "script-v1",
  manifest: { output: { width: 1920, height: 1080, frameRate: 24, totalFrames: 48 } },
  upstreamSnapshot: {},
  upstreamDigest: digest,
  payloadDigest: digest,
  state: "PREVIEW_READY",
  createdAt: "2026-09-16T00:00:00Z",
  updatedAt: "2026-09-16T01:00:00Z",
  version: 7,
  idempotentReplay: false,
};

const shotGraph: ShotGraphBundleEnvelope = {
  ok: true,
  state: "SHOTS_COMPILED",
  consistencyValidation: {},
  storyboardVersion: { storyboardVersionRef: "storyboard-v1", payloadDigest: digest },
  creativeShotVersions: [{
    creativeShotRef: "shot-1",
    creativeShotVersionRef: "shot-v1",
    scriptSceneRef: "scene-1",
    globalOrder: 1,
    sceneOrder: 1,
    durationFrames: 48,
    frameRate: 24,
    cameraInstruction: { shotSize: "MEDIUM_CLOSE_UP", movement: "LOCKED", angle: "EYE_LEVEL" },
    action: "角色在夜窗前缓慢抬头",
    requiredCharacterIdentityLocks: [{ characterRef: "character-1", identityLockVersionRef: "lock-v1", referenceVersionRef: "reference-v1" }],
    payloadDigest: digest,
  }],
  executableShotGraph: {
    executableShotGraphVersionRef: "shot-graph-v1",
    shots: [],
    edges: [],
    output: { width: 1920, height: 1080, frameRate: 24, totalFrames: 48 },
    payloadDigest: digest,
    publicationAllowed: false,
  },
};

const timeline = {
  schemaVersion: "v5.timeline.v1",
  timelineRef: "timeline-1",
  workspaceRef: "workspace-test",
  projectRef: "project-test",
  seriesRef: "series-test",
  episodeRef: "episode-test",
  productionRunRef: "run-test",
  createdAt: "2026-09-16T00:00:00Z",
  payloadDigest: digest,
};

function timelineProjection(versionNumber = 1, enabled = true): TimelineProjectionEnvelope {
  const timelineVersionRef = `timeline-v${versionNumber}`;
  return {
    ok: true,
    timeline,
    timelineVersion: {
      schemaVersion: "v5.timeline-version.v1",
      timelineRef: timeline.timelineRef,
      timelineVersionRef,
      versionNumber,
      parentTimelineVersionRef: versionNumber === 1 ? null : `timeline-v${versionNumber - 1}`,
      parentTimelineVersionDigest: versionNumber === 1 ? null : digest,
      workspaceRef: timeline.workspaceRef,
      projectRef: timeline.projectRef,
      seriesRef: timeline.seriesRef,
      episodeRef: timeline.episodeRef,
      productionRunRef: timeline.productionRunRef,
      scriptVersionRef: "script-v1",
      scriptVersionDigest: digest,
      storyboardVersionRef: "storyboard-v1",
      storyboardVersionDigest: digest,
      frameRate: 24,
      canvasWidth: 1920,
      canvasHeight: 1080,
      pixelAspectRatio: "1:1",
      displayAspectRatio: "16:9",
      durationFrames: 48,
      safeArea: {},
      outputProfileBindings: [],
      trackRefs: ["video-track-1"],
      createdAt: "2026-09-16T00:00:00Z",
      publicationAllowed: false,
      payloadDigest: digest,
    },
    tracks: [{
      schemaVersion: "v5.timeline-track.v1",
      trackRef: "video-track-1",
      timelineVersionRef,
      trackKind: "VIDEO",
      order: 1,
      enabled: true,
      lanePolicy: "PRIMARY_VIDEO",
      payloadDigest: digest,
    }],
    clips: [{
      schemaVersion: "v5.timeline-clip.v1",
      clipRef: "clip-1",
      timelineVersionRef,
      trackRef: "video-track-1",
      clipKind: "VIDEO",
      timelineStartFrameInclusive: 0,
      timelineEndFrameExclusive: 48,
      enabled,
      layer: 0,
      zOrder: 0,
      opacity: 1,
      blendMode: "NORMAL",
      sourceBinding: { videoAssetVersionRef: "video-v1" },
      transitionIn: null,
      transitionOut: null,
      speed: { numerator: 1, denominator: 1 },
      transform: {},
      maskBindings: [],
      payloadDigest: digest,
    }],
    lineage: [],
    stale: false,
    publicationAllowed: false,
    evidenceRevision: "M13",
    idempotentReplay: false,
  };
}

function versionsEnvelope(...projections: TimelineProjectionEnvelope[]): TimelineVersionsEnvelope {
  return {
    ok: true,
    timeline,
    versions: projections.map(item => item.timelineVersion),
    stale: false,
    publicationAllowed: false,
    evidenceRevision: "M13",
  };
}

function renderWorkspace(node: React.ReactNode) {
  return render(<ThemeProvider>{node}</ThemeProvider>);
}

describe("M8/M12/M13 production workspaces", () => {
  beforeEach(() => {
    api.creatorRequest.mockReset();
    api.getExecutionMethodPlan.mockReset();
    api.getExplicitAudioRequirementRoute.mockReset();
    api.creatorRequest.mockImplementation((path: string) => {
      if (path === "episode-production-runs") return Promise.resolve({ ok: true, runs: [run] });
      throw new Error(`unexpected request: ${path}`);
    });
  });

  it("renders the authoritative M8 shot graph and server method plan", async () => {
    api.creatorRequest.mockImplementation((path: string) => {
      if (path === "episode-production-runs") return Promise.resolve({ ok: true, runs: [run] });
      if (path === "episode-production-runs/run-test/shot-graph") return Promise.resolve(shotGraph);
      throw new Error(`unexpected request: ${path}`);
    });
    api.getExecutionMethodPlan.mockResolvedValue(executionFixture());

    renderWorkspace(<StoryboardWorkspace projectRef="project-test" />);

    expect(await screen.findByRole("heading", { name: "镜头板" })).toBeVisible();
    expect(screen.getAllByText("角色在夜窗前缓慢抬头")).toHaveLength(2);
    expect(screen.getByText("MEDIUM_CLOSE_UP · LOCKED")).toBeVisible();
    expect(screen.getByText("静态画面 / 复用")).toBeVisible();
    expect(screen.getByText("仅技术证据 · 不可发布")).toBeVisible();
  });

  it("shows M9/M12 audio requirements without exposing an unauthorized runtime action", async () => {
    api.getExecutionMethodPlan.mockResolvedValue(executionFixture());
    api.getExplicitAudioRequirementRoute.mockResolvedValue(audioFixture("DIALOGUE"));

    renderWorkspace(<AudioWorkspace projectRef="project-test" />);

    expect(await screen.findByRole("heading", { name: "时间绑定" })).toBeVisible();
    expect(screen.getByText("M12 Runtime：未安装 / G0 未完成")).toBeVisible();
    expect(screen.getByText("DIALOGUE_SYNTHESIS")).toBeVisible();
    expect(screen.getByText("NOT_INSTALLED_G0_NOT_COMPLETE")).toBeVisible();
    expect(screen.queryByRole("button", { name: /运行音频|生成音频|提交音频/ })).not.toBeInTheDocument();
  });

  it("creates an immutable M13 timeline version with the current CAS parent", async () => {
    const user = userEvent.setup();
    const v1 = timelineProjection(1, true);
    const v2 = timelineProjection(2, false);
    let versionsReads = 0;
    api.creatorRequest.mockImplementation((path: string, options?: { method?: string; body?: unknown }) => {
      if (path === "episode-production-runs") return Promise.resolve({ ok: true, runs: [run] });
      if (path === "episode-production-runs/run-test/timeline") return Promise.resolve(v1);
      if (path === "episode-production-runs/run-test/timeline-versions") {
        versionsReads += 1;
        return Promise.resolve(versionsReads === 1 ? versionsEnvelope(v1) : versionsEnvelope(v1, v2));
      }
      if (path === "episode-production-runs/run-test/preview") return Promise.resolve({ ok: true });
      if (path === "episode-production-runs/run-test/timeline-edits" && options?.method === "POST") return Promise.resolve(v2);
      throw new Error(`unexpected request: ${path}`);
    });

    renderWorkspace(<TimelineWorkspace projectRef="project-test" />);

    expect(await screen.findByRole("heading", { name: "Clip Inspector" })).toBeVisible();
    expect(screen.getByLabelText("M13 技术预览")).toHaveAttribute("src", "/api/creator/episode-production-runs/run-test/preview/content");
    await user.click(screen.getByRole("button", { name: "停用片段并创建新版本" }));

    expect(await screen.findByText("画面片段已停用，已创建 Timeline v2。")).toBeVisible();
    const editCall = api.creatorRequest.mock.calls.find(([path]) => path === "episode-production-runs/run-test/timeline-edits");
    expect(editCall).toBeDefined();
    expect(editCall?.[1]).toMatchObject({
      method: "POST",
      body: {
        expectedRunVersion: 7,
        parentTimelineVersionRef: "timeline-v1",
        parentTimelineVersionDigest: digest,
        editCommand: { operation: "DISABLE_CLIP", arguments: { clipRef: "clip-1" } },
      },
    });
    await waitFor(() => expect(within(screen.getByRole("list")).getByText("v2")).toBeVisible());
  });
});
