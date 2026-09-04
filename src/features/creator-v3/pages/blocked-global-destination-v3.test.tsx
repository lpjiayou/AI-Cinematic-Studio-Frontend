import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import {
  BLOCKED_GLOBAL_DESTINATIONS,
  BlockedGlobalDestinationV3,
  type BlockedGlobalDestinationKey,
} from "./blocked-global-destination-v3";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("BlockedGlobalDestinationV3", () => {
  it.each([
    ["quick-create", "快速创作", "runtime_unavailable", "/creator/projects"],
    ["assets", "资产", "ui_missing", "/creator/projects"],
    ["jobs", "任务", "ui_missing", "/creator"],
    ["works", "作品", "authority_required", "/creator/projects"],
  ] as const)("renders the independent %s blocker without a fake action", (key, title, blockerClass, safeHref) => {
    const config = BLOCKED_GLOBAL_DESTINATIONS[key as BlockedGlobalDestinationKey];
    render(<ThemeProvider><BlockedGlobalDestinationV3 config={config} /></ThemeProvider>);
    expect(screen.getByRole("heading", { name: title, level: 1 })).toBeVisible();
    expect(document.querySelector(`[data-blocker-class="${blockerClass}"]`)).not.toBeNull();
    expect(screen.getAllByText(config.cause).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(config.consequence).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(config.owner).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: config.safeActionLabel })).toHaveAttribute("href", safeHref);
    for (const fakeAction of ["立即生成", "上传资产", "重试任务", "发布作品", "下载 Master"]) {
      expect(screen.queryByRole("button", { name: fakeAction })).not.toBeInTheDocument();
    }
    expect(screen.getByRole("complementary", { name: `${title}授权与证据` })).toBeVisible();
  });
});
