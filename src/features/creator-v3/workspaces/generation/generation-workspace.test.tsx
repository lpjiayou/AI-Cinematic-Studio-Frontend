import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GenerationWorkspace } from "./generation-workspace";
import type { GenerationView } from "@/features/core-integration/generation-workspace-client";

const api = vi.hoisted(() => ({ runs: vi.fn(), read: vi.fn(), start: vi.fn() }));
vi.mock("@/features/core-integration/browser-client", () => ({ creatorRequest: api.runs }));
vi.mock("@/features/core-integration/generation-workspace-client", async importOriginal => ({ ...(await importOriginal<object>()), readGeneration: api.read, startGeneration: api.start }));
vi.mock("@/features/core-integration/image-video-client", async importOriginal => ({ ...(await importOriginal<object>()), readImageVideoWorkspace: async (scope: object) => ({ schemaVersion: "creator.image-video-workspace.v1", ...scope, policy: null, available: false, reason: "service_unavailable", generations: [] }) }));
const view: GenerationView = { schemaVersion: "creator.generation-workspace.v1", workspaceRef: "workspace-test", projectRef: "project-test", seriesRef: "series-test", episodeRef: "episode-test", productionRunRef: "run-test", mediaJobRef: "job-test", jobRevision: 1, approvedPlanDigest: "a".repeat(64), creativeShotVersionRef: "shot-v1", beatRef: "beat-test", state: "QUEUED", attemptCount: 0, activity: "IDLE", errorCode: null, artifact: null, canPrepare: true, canExecute: true, publicationAllowed: false, automaticRetryAllowed: false };
beforeEach(() => { vi.clearAllMocks(); api.runs.mockResolvedValue({ ok: true, runs: [view, { ...view, projectRef: "other", productionRunRef: "other-run" }] }); api.read.mockResolvedValue(view); api.start.mockResolvedValue(undefined); });
describe("generation workspace", () => {
  it("does not start on load and requires a separate explicit confirmation", async () => {
    const user = userEvent.setup(); render(<GenerationWorkspace projectRef="project-test" />);
    await screen.findByRole("button", { name: "执行已批准作业" });
    expect(api.start).not.toHaveBeenCalled();
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "执行已批准作业" }));
    expect(api.start).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "确认执行一次" }));
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(api.start.mock.calls[0][1]).toBe("EXECUTE_APPROVED");
  });
  it("offers playback after reload without starting work", async () => {
    api.read.mockResolvedValue({ ...view, state: "SUCCEEDED", canExecute: false, canPrepare: false, attemptCount: 1,
      artifact: { sha256: "b".repeat(64), mediaType: "video/mp4", byteSize: 100, width: 704, height: 1280, durationFrames: 48, frameRate: 24 } });
    render(<GenerationWorkspace projectRef="project-test" />);
    const video = await screen.findByLabelText("生成视频");
    expect(video).toHaveAttribute("src", expect.stringContaining("/api/creator/episode-production-runs/run-test/generation/content?"));
    expect(screen.getByRole("button", { name: "执行已批准作业" })).toBeDisabled();
    expect(screen.getByText(/2 秒/)).toBeVisible(); expect(api.start).not.toHaveBeenCalled();
  });
  it("UNKNOWN is not a retry button or a fake success", async () => {
    api.read.mockResolvedValue({ ...view, state: "UNKNOWN", canExecute: false, canPrepare: false });
    render(<GenerationWorkspace projectRef="project-test" />);
    await screen.findByText(/可能已经提交/);
    expect(screen.getByRole("button", { name: "执行已批准作业" })).toBeDisabled();
    expect(screen.queryByLabelText("生成视频")).not.toBeInTheDocument(); expect(api.start).not.toHaveBeenCalled();
  });
  it("missing deployment reports an error with no fixture fallback", async () => {
    api.read.mockRejectedValue(new Error("生成服务尚未连接"));
    render(<GenerationWorkspace projectRef="project-test" />);
    await screen.findByRole("alert");
    expect(screen.queryByRole("button", { name: "执行已批准作业" })).not.toBeInTheDocument(); expect(api.start).not.toHaveBeenCalled();
  });
  it("ignores a response after the project changes", async () => {
    let finish: (value: GenerationView) => void = () => {};
    api.read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const result = render(<GenerationWorkspace projectRef="project-test" />);
    await waitFor(() => expect(api.read).toHaveBeenCalled());
    api.runs.mockResolvedValue({ ok: true, runs: [] });
    result.rerender(<GenerationWorkspace projectRef="another-project" />);
    await screen.findByText(/当前项目尚无/);
    finish(view);
    await waitFor(() => expect(screen.queryByRole("button", { name: "执行已批准作业" })).not.toBeInTheDocument());
  });
});
