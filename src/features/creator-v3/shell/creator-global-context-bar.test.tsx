import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorGlobalContextBar } from "./creator-global-context-bar";

describe("CreatorGlobalContextBar", () => {
  it.each([
    ["connected", "Creator Core 已连接"],
    ["loading", "正在核对 Creator Core"],
    ["disconnected", "Creator Core 当前未连接"],
    ["error", "Creator Core 状态无法确认"],
  ] as const)("renders the %s connection state in user language", (connectionState, message) => {
    render(
      <CreatorGlobalContextBar
        title="项目"
        description="真实项目集合"
        connectionState={connectionState}
        navigationTrigger={<button>打开全局导航</button>}
        evidenceTrigger={<button>打开证据</button>}
        jobTrigger={<button>打开任务</button>}
        themeTrigger={<button>切换主题</button>}
      />,
    );
    expect(screen.getByText(message)).toBeVisible();
    for (const name of ["打开全局导航", "打开证据", "打开任务", "切换主题"]) {
      expect(screen.getByRole("button", { name })).toBeVisible();
    }
    expect(screen.queryByText(/projectRef|workspaceRef|Provider|queue/)).not.toBeInTheDocument();
  });
});
