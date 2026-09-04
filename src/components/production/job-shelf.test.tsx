import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JobShelf, type JobShelfItemView } from "./job-shelf";

const jobs: readonly JobShelfItemView[] = [
  { id: "queued", label: "排队任务", state: "queued", stateLabel: "排队", progressText: "等待开始" },
  { id: "running", label: "运行任务", state: "running", stateLabel: "运行", progressText: "2 / 4" },
  { id: "blocked", label: "阻塞任务", state: "blocked", stateLabel: "阻塞", progressText: "等待授权", blockedReason: "授权未提供" },
  { id: "failed", label: "失败任务", state: "failed", stateLabel: "失败", progressText: "已停止", failedReason: "输入冲突" },
];

describe("JobShelf", () => {
  it("keeps queued, running, blocked and failed counts visible while collapsed", () => {
    render(
      <JobShelf jobs={jobs} expanded={false} onExpandedChange={() => undefined} label="活动任务" />,
    );
    expect(screen.getByText("排队 1")).toBeVisible();
    expect(screen.getByText("运行 1")).toBeVisible();
    expect(screen.getByText("阻塞 1")).toBeVisible();
    expect(screen.getByText("失败 1")).toBeVisible();
    expect(screen.queryByText("失败任务")).not.toBeInTheDocument();
  });

  it("opens real supplied jobs, collapses on Escape and restores focus", async () => {
    const onExpandedChange = vi.fn();
    const onOpenJob = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <JobShelf jobs={jobs} expanded={false} onExpandedChange={onExpandedChange} onOpenJob={onOpenJob} label="活动任务" />,
    );
    const toggle = screen.getByRole("button", { name: "展开任务" });
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    rerender(
      <JobShelf jobs={jobs} expanded onExpandedChange={onExpandedChange} onOpenJob={onOpenJob} label="活动任务" />,
    );
    await user.click(screen.getByRole("button", { name: /失败任务/ }));
    expect(onOpenJob).toHaveBeenCalledWith("failed");
    await user.keyboard("{Escape}");
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.getByRole("button", { name: "收起任务" })).toHaveFocus());
  });

  it("fails an unknown job state closed", () => {
    const unknownJob = [{ ...jobs[0], id: "unknown", state: "mystery" }] as unknown as readonly JobShelfItemView[];
    render(
      <JobShelf jobs={unknownJob} expanded onExpandedChange={() => undefined} label="活动任务" />,
    );
    expect(screen.getByText("状态未验证")).toBeVisible();
    expect(screen.getByText("失败 1")).toBeVisible();
    expect(document.body).not.toHaveTextContent("成功");
  });
});
