import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import {
  StoryWorldPage,
  WorldTimeline,
  type TimelineEventPreview,
} from "./story-world";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderStoryWorldPage() {
  return render(
    <ThemeProvider>
      <StoryWorldPage />
    </ThemeProvider>,
  );
}

describe("StoryWorldPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("renders the complete cinematic world archive without technical information", () => {
    renderStoryWorldPage();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "建立一个可以持续生长的电影世界",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("STORY WORLD / IP BIBLE")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "世界概览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "世界规则" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "世界时间线" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "世界地图" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "阵营系统" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "文化画布" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "视觉语言" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI 世界构建建议" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入角色设计" })).toBeEnabled();

    expect(
      screen.getAllByAltText(
        "电影世界全景中展示未来城市、时代环境和空间规模的概念视觉",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByAltText(
        "展示电影世界历史演变、文明变化和关键时代节点的视觉规划图",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByAltText(
        "展示电影世界中城市区域、特殊地点和空间关系的概念地图",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByAltText(
        "展示电影世界中不同阵营的视觉符号、文化元素和关系结构的设计板",
      ).length,
    ).toBeGreaterThan(0);

    expect(
      screen.queryByText(/worldRef|locationRef|factionRef|assetRef|Provider|Queue|GPU|Hash|Database/),
    ).not.toBeInTheDocument();
  });

  it("associates the world premise label, help, limit, and validation copy", async () => {
    const user = userEvent.setup();
    renderStoryWorldPage();

    const input = screen.getByRole("textbox", { name: "世界前提" });
    expect(input).toHaveAttribute("aria-describedby", "story-world-premise-help");
    expect(input).toHaveAttribute("maxlength", "800");

    await user.clear(input);
    await user.type(input, "一座失去共同记忆的城市");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "story-world-premise-help story-world-premise-error",
    );
    expect(screen.getByText("世界前提至少需要 30 个字符。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入角色设计" })).toBeDisabled();
  });

  it("supports timeline roving focus, wrap, Home, End, Enter, and Space", async () => {
    const user = userEvent.setup();
    const events: readonly TimelineEventPreview[] = [
      { id: "one", yearLabel: "2100", title: "第一时代", description: "第一段历史" },
      { id: "two", yearLabel: "2120", title: "第二时代", description: "第二段历史" },
      { id: "three", yearLabel: "2148", title: "第三时代", description: "第三段历史" },
    ];

    function TimelineHarness() {
      const [selected, setSelected] = useState("one");
      return <WorldTimeline events={events} onSelect={setSelected} selectedEventId={selected} />;
    }

    render(<TimelineHarness />);
    const timeline = screen.getByRole("heading", { name: "世界时间线" }).closest("section");
    expect(timeline).not.toBeNull();
    const first = within(timeline!).getByRole("button", { name: /第一时代/ });
    const second = within(timeline!).getByRole("button", { name: /第二时代/ });
    const third = within(timeline!).getByRole("button", { name: /第三时代/ });

    expect(first).toHaveAttribute("type", "button");
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveAttribute("tabindex", "0");

    first.focus();
    await user.keyboard("{ArrowLeft}");
    expect(third).toHaveFocus();
    expect(third).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Home}");
    expect(first).toHaveFocus();

    await user.keyboard("{ArrowRight}{Enter}");
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{End} ");
    expect(third).toHaveFocus();
    expect(third).toHaveAttribute("aria-pressed", "true");
  });

  it("uses accessible location and faction buttons with non-color selection state", async () => {
    const user = userEvent.setup();
    renderStoryWorldPage();

    const location = screen.getByRole("button", { name: "查看地点：静默区" });
    expect(location).toHaveAttribute("type", "button");
    expect(location).toHaveAttribute("aria-pressed", "false");
    await user.click(location);
    expect(await screen.findByRole("dialog", { name: "静默区" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "关闭对话框" }));
    expect(location).toHaveAttribute("aria-pressed", "true");
    expect(location).toHaveTextContent("已选择");

    const faction = screen.getByRole("button", { name: "查看阵营：共生联盟" });
    expect(faction).toHaveAttribute("type", "button");
    expect(faction).toHaveAttribute("aria-pressed", "false");
    await user.click(faction);
    expect(await screen.findByRole("dialog", { name: "共生联盟" })).toBeInTheDocument();
  });

  it("rebuilds only deterministic local presentation suggestions", async () => {
    const user = userEvent.setup();
    renderStoryWorldPage();

    await user.click(screen.getByRole("button", { name: "重新整理世界建议" }));

    expect(screen.getByRole("status")).toHaveTextContent("正在整理世界建议");
    expect(screen.getByRole("status")).toHaveTextContent(
      "正在检查世界规则、历史关系和视觉方向。",
    );
    await waitFor(
      () => expect(screen.queryByRole("status")).not.toBeInTheDocument(),
      { timeout: 1400 },
    );
  });

  it("confirms only the local world preview and shows the guided next step", async () => {
    const user = userEvent.setup();
    renderStoryWorldPage();

    await user.click(screen.getByRole("button", { name: "进入角色设计" }));

    expect(
      await screen.findByRole("dialog", { name: "世界预览已确认" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("本地世界预览已确认").length).toBeGreaterThan(0);
    expect(screen.getByText(/不会创建角色实体/)).toBeInTheDocument();
    expect(screen.getByText(/不会持久化 IP Bible/)).toBeInTheDocument();
  });

  it("inherits and switches the ACS ThemeProvider", async () => {
    const user = userEvent.setup();
    renderStoryWorldPage();

    await user.click(screen.getByRole("button", { name: "切换至浅色模式" }));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(window.localStorage.getItem("acs-theme")).toBe("light");
    expect(
      screen.getAllByAltText(
        "电影世界全景中展示未来城市、时代环境和空间规模的概念视觉",
      ).length,
    ).toBeGreaterThan(0);
  });
});
