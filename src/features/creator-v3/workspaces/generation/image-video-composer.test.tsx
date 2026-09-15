import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageVideoComposer } from "./image-video-composer";
import type { ImageVideoGeneration, ImageVideoWorkspace } from "@/features/core-integration/image-video-client";
import { CreatorClientError } from "@/features/core-integration/browser-client";

const api = vi.hoisted(() => ({ read: vi.fn(), create: vi.fn() }));
vi.mock("@/features/core-integration/image-video-client", async importOriginal => ({ ...(await importOriginal<object>()), readImageVideoWorkspace: api.read, createImageVideoGeneration: api.create }));
const scope = { projectRef: "project-one", seriesRef: "series-one", episodeRef: "episode-one", productionRunRef: "run-one" };
const generation: ImageVideoGeneration = { schemaVersion: "creator.image-video-generation.v1", ...scope, generationRef: "generation-one", mediaJobRef: null, state: "PREPARING", attemptCount: 0, description: "人物转头", inputSha256: "a".repeat(64), createdAt: "2026-09-15T09:00:00Z", errorCode: null, artifact: null, publicationAllowed: false, automaticRetryAllowed: false };
const workspace: ImageVideoWorkspace = { schemaVersion: "creator.image-video-workspace.v1", ...scope, policy: { policyDigest: "b".repeat(64), maxInputBytes: 8388608, maxDescriptionChars: 1000, output: { width: 704, height: 1280, durationFrames: 48, frameRate: 24 }, maxCostMinor: 1500, currency: "CNY", executionTimeoutSeconds: 7200 }, available: true, reason: null, generations: [] };
const completed: ImageVideoGeneration = { ...generation, state: "SUCCEEDED", attemptCount: 1, mediaJobRef: "new-job-one", artifact: { sha256: "c".repeat(64), byteSize: 100, mediaType: "video/mp4", width: 704, height: 1280, durationFrames: 48, frameRate: 24 } };
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); api.read.mockResolvedValue(workspace); api.create.mockResolvedValue(generation); });
async function fill() {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByLabelText("参考图片")).toBeEnabled());
  await user.upload(screen.getByLabelText("参考图片"), new File([new Uint8Array([137, 80, 78, 71])], "角色.png", { type: "image/png" }));
  await screen.findByAltText("本次生成参考图片预览");
  await user.type(screen.getByLabelText("画面描述"), "人物转头");
  return user;
}
describe("image + description → explicit generation → playback", () => {
  it("shows policy and image preview, creates one independent job, polls only reads and plays successful output", async () => {
    render(<ImageVideoComposer scope={scope} />); const user = await fill();
    expect(screen.getByText(/单次费用上限 ¥15.00/)).toBeVisible();
    expect(screen.getByAltText("本次生成参考图片预览")).toHaveAttribute("data-nimg", "fill");
    expect(screen.getByAltText("本次生成参考图片预览")).not.toHaveAttribute("width");
    expect(api.create).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "生成两秒视频" }));
    expect(api.create).toHaveBeenCalledOnce();
    expect(api.create.mock.calls[0][0]).toEqual(scope);
    expect(api.create.mock.calls[0][1]).toMatchObject({ description: "人物转头", imageMediaType: "image/png", expectedPolicyDigest: workspace.policy?.policyDigest });
    expect(api.create.mock.calls[0][1].idempotencyKey).toMatch(/^[a-f0-9-]{36}$/i);
    await screen.findByText(/正在准备输入 · 尝试次数 0/);
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled();
    api.read.mockResolvedValue({ ...workspace, generations: [{ ...generation, state: "RUNNING", mediaJobRef: "new-job-one", attemptCount: 1 }] });
    await user.click(screen.getByRole("button", { name: "刷新新作业" })); await screen.findByText(/正在生成视频 · 尝试次数 1/);
    api.read.mockResolvedValue({ ...workspace, generations: [completed] });
    await user.click(screen.getByRole("button", { name: "刷新新作业" }));
    const video = await screen.findByLabelText("新生成的两秒视频");
    expect(video).toHaveAttribute("src", expect.stringContaining("/image-video-generations/generation-one/content?"));
    expect(screen.getByText("new-job-one")).toBeVisible(); expect(api.create).toHaveBeenCalledOnce();
  });
  it("guards two synchronous clicks before the POST receipt", async () => {
    let finish: (value: ImageVideoGeneration) => void = () => {};
    api.create.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    render(<ImageVideoComposer scope={scope} />); await fill();
    const button = screen.getByRole("button", { name: "生成两秒视频" });
    act(() => { fireEvent.click(button); fireEvent.click(button); });
    expect(api.create).toHaveBeenCalledOnce();
    await act(async () => finish(generation));
    expect(api.create).toHaveBeenCalledOnce();
  });
  it("restores server history after leaving without creating new jobs", async () => {
    api.read.mockResolvedValue({ ...workspace, generations: [completed] });
    const first = render(<ImageVideoComposer scope={scope} />);
    await screen.findByLabelText("新生成的两秒视频"); first.unmount();
    render(<ImageVideoComposer scope={scope} />);
    expect(await screen.findByLabelText("新生成的两秒视频")).toHaveAttribute("src", expect.stringContaining("generation-one/content"));
    expect(api.create).not.toHaveBeenCalled();
  });
  it("preserves an ambiguous idempotency latch after remount, never generating a new key or resending", async () => {
    api.create.mockRejectedValue(new TypeError("network failed"));
    const first = render(<ImageVideoComposer scope={scope} />); const user = await fill();
    await user.click(screen.getByRole("button", { name: "生成两秒视频" }));
    await screen.findByText(/请求结果尚未确认/);
    const key = sessionStorage.getItem(`acs-image-video-pending:${JSON.stringify(scope)}`);
    expect(key).toBe(api.create.mock.calls[0][1].idempotencyKey);
    first.unmount(); render(<ImageVideoComposer scope={scope} />);
    await screen.findByText(/本浏览器有尚未确认的提交/);
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled();
    expect(sessionStorage.getItem(`acs-image-video-pending:${JSON.stringify(scope)}`)).toBe(key);
    expect(api.create).toHaveBeenCalledOnce();
  });
  it("reports a definitive input rejection without pretending a job exists", async () => {
    api.create.mockRejectedValue(new CreatorClientError(400, { code: "invalid_image", message: "图片无法解码" }));
    render(<ImageVideoComposer scope={scope} />); const user = await fill();
    await user.click(screen.getByRole("button", { name: "生成两秒视频" }));
    await screen.findByText("图片无法解码");
    expect(sessionStorage.length).toBe(0); expect(screen.queryByLabelText("新生成的两秒视频")).not.toBeInTheDocument();
    expect(api.create).toHaveBeenCalledOnce();
  });
  it("keeps an unavailable service disabled and never fabricates fallback", async () => {
    api.read.mockResolvedValue({ ...workspace, policy: null, available: false, reason: "service_unavailable" });
    render(<ImageVideoComposer scope={scope} />);
    await screen.findByText(/当前生成服务不可用/);
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled();
    expect(screen.getByLabelText("参考图片")).toBeDisabled(); expect(api.create).not.toHaveBeenCalled();
  });
  it.each([
    ["generation_already_active", "RUNNING", "已有作业正在处理"],
    ["generation_already_active", "UNKNOWN", "已有作业的提交结果待核实"],
    ["generation_budget_exhausted", "FAILED", "当前生成次数或费用额度已用完"],
    ["generation_policy_expired", "SUCCEEDED", "当前生成授权窗口已结束"],
    ["OUTSIDE_VALIDITY_WINDOW", "SUCCEEDED", "当前生成授权窗口已结束"],
    ["generation_policy_changed", "SUCCEEDED", "生成配置或费用上限已更新"],
  ] as const)("explains %s/%s without mislabeling an installed service as disconnected", async (reason, state, message) => {
    api.read.mockResolvedValue({ ...workspace, available: false, reason, generations: [{ ...generation, state }] });
    render(<ImageVideoComposer scope={scope} />);
    await screen.findByText(new RegExp(message));
    expect(screen.queryByText(/请先由操作端连接服务/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled();
    expect(api.create).not.toHaveBeenCalled();
  });
  it.each(["generation_policy_expired", "generation_budget_exhausted", "generation_already_active", "generation_policy_changed"])("clears only the definitively rejected %s latch and never auto-resends", async code => {
    api.create.mockRejectedValue(new CreatorClientError(409, { code, message: "本次请求未被接收，请查看最新状态。" }));
    render(<ImageVideoComposer scope={scope} />); const user = await fill();
    await user.click(screen.getByRole("button", { name: "生成两秒视频" }));
    await screen.findByText("本次请求未被接收，请查看最新状态。");
    expect(sessionStorage.length).toBe(0);
    expect(screen.queryByText(/请求结果尚未确认/)).not.toBeInTheDocument();
    expect(api.create).toHaveBeenCalledOnce();
  });
  it.each(["idempotency_conflict", "unknown_conflict"])("keeps an ambiguous %s latch instead of trying a new key", async code => {
    api.create.mockRejectedValue(new CreatorClientError(409, { code, message: "提交状态需要核实。" }));
    render(<ImageVideoComposer scope={scope} />); const user = await fill();
    await user.click(screen.getByRole("button", { name: "生成两秒视频" }));
    await screen.findByText(/请求结果尚未确认/);
    expect(sessionStorage.getItem(`acs-image-video-pending:${JSON.stringify(scope)}`)).toBe(api.create.mock.calls[0][1].idempotencyKey);
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled();
    expect(api.create).toHaveBeenCalledOnce();
  });
  it("rejects invalid image type, oversized file and overlong description locally", async () => {
    render(<ImageVideoComposer scope={scope} />);
    await waitFor(() => expect(screen.getByLabelText("参考图片")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("参考图片"), { target: { files: [new File(["<svg/>"], "image.svg", { type: "image/svg+xml" })] } });
    await screen.findByText(/请选择不超过 8 MB/);
    const large = new File(["x"], "large.png", { type: "image/png" }); Object.defineProperty(large, "size", { value: 8388609 });
    fireEvent.change(screen.getByLabelText("参考图片"), { target: { files: [large] } });
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("参考图片"), { target: { files: [new File(["png"], "image.png", { type: "image/png" })] } });
    await screen.findByAltText("本次生成参考图片预览");
    fireEvent.change(screen.getByLabelText("画面描述"), { target: { value: "字".repeat(1001) } });
    expect(screen.getByRole("button", { name: "生成两秒视频" })).toBeDisabled(); expect(api.create).not.toHaveBeenCalled();
  });
  it.each(["FAILED", "UNKNOWN"] as const)("shows %s without a retry action", async state => {
    api.read.mockResolvedValue({ ...workspace, generations: [{ ...generation, state, mediaJobRef: "new-job-one", attemptCount: 1, errorCode: "EXECUTION_UNAVAILABLE" }] });
    render(<ImageVideoComposer scope={scope} />);
    await screen.findByText(state === "UNKNOWN" ? /任务结果未知/ : /本次生成失败/);
    expect(screen.queryByRole("button", { name: /重试/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("新生成的两秒视频")).not.toBeInTheDocument(); expect(api.create).not.toHaveBeenCalled();
  });
  it("ignores a late response after full scope changes", async () => {
    let finish: (value: ImageVideoWorkspace) => void = () => {};
    api.read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const result = render(<ImageVideoComposer scope={scope} />);
    await waitFor(() => expect(api.read).toHaveBeenCalled());
    const nextScope = { ...scope, episodeRef: "episode-two", productionRunRef: "run-two" };
    api.read.mockResolvedValue({ ...workspace, ...nextScope });
    result.rerender(<ImageVideoComposer scope={nextScope} />);
    await waitFor(() => expect(screen.getByLabelText("参考图片")).toBeEnabled());
    await act(async () => finish({ ...workspace, generations: [completed] }));
    expect(screen.queryByLabelText("新生成的两秒视频")).not.toBeInTheDocument();
  });
});
