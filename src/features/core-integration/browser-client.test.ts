import { afterEach, describe, expect, it, vi } from "vitest";
import {
  K2_REAL_IMAGE_READ_RESOURCES,
  K2_REAL_VIDEO_READ_RESOURCES,
  getK2ProductionStateProjection,
  getK2RealImageRevision,
  getK2RealVideoRevision,
} from "./browser-client";

const projection = {
  ok: true,
  schemaVersion: "v5.k2-production-state-projection.v1",
  productionRunRef: "run 1",
  state: "REAL_VIDEO_PLAN_READY",
  productionState: "REAL_VIDEO_PLAN_READY",
  rootState: { state: "ROOTS_READY", authority: "V5_ROOT_DATABASE" },
  productionProjection: {
    state: "REAL_VIDEO_PLAN_READY",
    authority: "V5_EVIDENCE_TRANSITIONS",
  },
  runtimeState: {
    state: "ATTENTION_REQUIRED",
    authority: "V4_RUNTIME_NON_CANONICAL",
  },
  visualQcState: {
    state: "NOT_STARTED",
    authority: "V5_CANONICAL_APPEND_ONLY",
  },
  activeRevision: {
    state: "ACTIVE",
    revisionRef: "real-video-plan-v1",
    authority: "V5_CANONICAL_APPEND_ONLY",
  },
  invariants: {
    runtimeDoesNotAdvanceProduction: true,
    assetVersionAuthority: "V5_CANONICAL_EVIDENCE_ONLY",
  },
  publicationAllowed: false,
} as const;

describe("K2 control-plane browser client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads and validates the exact four-axis state projection", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(projection));

    await expect(getK2ProductionStateProjection("run 1")).resolves.toEqual(projection);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/creator/episode-production-runs/run%201/state-projection",
      expect.objectContaining({ cache: "no-store", method: "GET" }),
    );
  });

  it("fails closed when Core collapses or renames a projection axis", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ ...projection, productionProjection: undefined }),
    );

    await expect(getK2ProductionStateProjection("run-1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
  });

  it("fails closed when the production alias or active revision is inconsistent", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...projection, productionState: "QC_READY" }),
    );
    await expect(getK2ProductionStateProjection("run-1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
    fetchMock.mockResolvedValueOnce(
      Response.json({ ...projection, activeRevision: undefined }),
    );
    await expect(getK2ProductionStateProjection("run-1")).rejects.toMatchObject({
      status: 502,
      detail: { code: "state_projection_contract_mismatch" },
    });
  });

  it("consumes every read-only review and admission view as one revision contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        ok: true,
        state: "REAL_VIDEO_PLAN_READY",
        videoGenerationRequests: [],
        publicationAllowed: false,
      }),
    );

    for (const resource of K2_REAL_VIDEO_READ_RESOURCES) {
      await expect(getK2RealVideoRevision("run-1", resource)).resolves.toMatchObject({
        ok: true,
        state: "REAL_VIDEO_PLAN_READY",
      });
    }

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(
      K2_REAL_VIDEO_READ_RESOURCES.map(
        (resource) => `/api/creator/episode-production-runs/run-1/${resource}`,
      ),
    );
  });

  it("consumes every unified real-image resource as one revision contract", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({
        ok: true,
        state: "REAL_IMAGE_PLAN_READY",
        realImagePlan: {
          schemaVersion: "v5.k2-real-image-plan.v1",
          realImagePlanRef: "real-image-plan-v1",
        },
        generationRequests: [],
        publicationAllowed: false,
      }),
    );

    for (const resource of K2_REAL_IMAGE_READ_RESOURCES) {
      await expect(getK2RealImageRevision("run-1", resource)).resolves.toMatchObject({
        ok: true,
        state: "REAL_IMAGE_PLAN_READY",
      });
    }

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(
      K2_REAL_IMAGE_READ_RESOURCES.map(
        (resource) => `/api/creator/episode-production-runs/run-1/${resource}`,
      ),
    );
  });

  it("fails closed when a unified real-image revision is incomplete", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        state: "REAL_IMAGE_PLAN_READY",
        realImagePlan: {},
        generationRequests: "not-an-array",
      }),
    );

    await expect(
      getK2RealImageRevision("run-1", "real-image-candidates"),
    ).rejects.toMatchObject({
      status: 502,
      detail: { code: "real_image_revision_contract_mismatch" },
    });
  });
});
