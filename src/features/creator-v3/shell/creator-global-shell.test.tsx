import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthorityLayerView, EvidenceFieldView } from "@/components";
import { ThemeProvider } from "@/theme";
import { CreatorGlobalShell } from "./creator-global-shell";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const layers: readonly AuthorityLayerView[] = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "页面可用" },
  { id: "runtime", label: "运行时", state: "not_applicable", stateLabel: "不适用", message: "不执行" },
  { id: "authority", label: "授权", state: "unverified", stateLabel: "尚未核验", message: "未读取" },
  { id: "policy", label: "策略", state: "unverified", stateLabel: "尚未核验", message: "未读取" },
];

const fields: readonly EvidenceFieldView[] = [
  { id: "source", label: "来源", value: "Creator Core", sensitivity: "ordinary", copyAllowed: false },
];

describe("CreatorGlobalShell", () => {
  it("composes one global workbench without project navigation or fake jobs", () => {
    render(
      <ThemeProvider>
        <CreatorGlobalShell
          activeDestinationId="home"
          title="创作首页"
          description="继续项目"
          connectionState="connected"
          primaryCanvas={<h1>创作首页</h1>}
          authorityLayers={layers}
          authoritySummary="四层独立"
          evidenceFields={fields}
          evidenceSummary="真实边界"
        />
      </ThemeProvider>,
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    const navigation = screen.getByRole("navigation", { name: "V3 全局导航" });
    expect(within(navigation).getAllByRole("link")).toHaveLength(6);
    expect(screen.queryByRole("navigation", { name: "V3 项目导航" })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "创作首页授权与证据" })).toBeVisible();
    expect(screen.getByRole("region", { name: "跨项目任务投影尚未接入" })).toBeVisible();
    expect(screen.queryByText(/排队验证项|运行验证项/)).not.toBeInTheDocument();
  });

  it("opens only one named mobile drawer and restores focus", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <CreatorGlobalShell
          activeDestinationId="home"
          title="创作首页"
          description="继续项目"
          connectionState="loading"
          primaryCanvas="内容"
          authorityLayers={layers}
          authoritySummary="四层独立"
          evidenceFields={fields}
          evidenceSummary="真实边界"
        />
      </ThemeProvider>,
    );
    const trigger = screen.getByRole("button", { name: "打开全局导航" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "全局导航" });
    expect(within(dialog).getByRole("navigation", { name: "移动端全局导航" })).toBeVisible();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
