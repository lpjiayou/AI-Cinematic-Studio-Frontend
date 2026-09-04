import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import {
  BlockedGlobalDestinationV3,
  type BlockedGlobalDestinationKey,
} from "./blocked-global-destination-v3";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("BlockedGlobalDestinationV3", () => {
  it.each([
    [
      "quick-create",
      "快速创作",
      "runtime_unavailable",
      "Method-aware 前端接线和对应运行时尚未完成",
      "当前不能提交真实生成任务",
      "M10–M13 前端与运行时实施波次",
      "进入项目中心",
      "/creator/projects",
    ],
    [
      "assets",
      "资产",
      "ui_missing",
      "当前尚未完成全局 AssetVersion 索引和产品级读取接线",
      "当前不能通过此页面上传、选择或准入资产",
      "Frontend Wave 5A",
      "返回项目中心",
      "/creator/projects",
    ],
    [
      "jobs",
      "任务",
      "ui_missing",
      "当前没有经过批准的跨项目 Job projection",
      "本页面不能读取内部 queue，也不能安全提供重试或取消",
      "Frontend Wave 5B",
      "返回创作首页",
      "/creator",
    ],
    [
      "works",
      "作品",
      "authority_required",
      "M15 之后的 Master、发布和商业化 Authority 尚未完成",
      "当前不能把 PreviewCandidate 或 Restricted Export 表示为作品",
      "M15–M17 后端与授权波次",
      "打开项目中心",
      "/creator/projects",
    ],
  ] as const)(
    "renders the independent %s blocker without a fake action",
    (key, title, blockerClass, cause, consequence, owner, safeActionLabel, safeHref) => {
      render(
        <ThemeProvider>
          <BlockedGlobalDestinationV3 destinationKey={key} />
        </ThemeProvider>,
      );
      expect(screen.getByRole("heading", { name: title, level: 1 })).toBeVisible();
      expect(document.querySelector(`[data-blocker-class="${blockerClass}"]`)).not.toBeNull();
      expect(screen.getAllByText(cause).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(consequence).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(owner).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole("link", { name: safeActionLabel })).toHaveAttribute("href", safeHref);
      for (const fakeAction of ["立即生成", "上传资产", "重试任务", "发布作品", "下载 Master"]) {
        expect(screen.queryByRole("button", { name: fakeAction })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: fakeAction })).not.toBeInTheDocument();
      }
      expect(screen.getByRole("complementary", { name: `${title}授权与证据` })).toBeVisible();
    },
  );

  it("fails closed for an unknown destination key", () => {
    const unknownKey = "unknown" as BlockedGlobalDestinationKey;

    expect(() => render(
      <ThemeProvider>
        <BlockedGlobalDestinationV3 destinationKey={unknownKey} />
      </ThemeProvider>,
    )).toThrowError("Unknown blocked global destination");
  });
});
