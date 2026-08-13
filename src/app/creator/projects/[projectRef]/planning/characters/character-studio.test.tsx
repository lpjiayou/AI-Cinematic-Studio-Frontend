import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { CharacterStudioPage } from "./character-studio";

let mobileViewport = false;

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 767px)" ? mobileViewport : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderCharacterStudio() {
  return render(
    <ThemeProvider>
      <CharacterStudioPage />
    </ThemeProvider>,
  );
}

describe("CharacterStudioPage", () => {
  beforeEach(() => {
    mobileViewport = false;
    installMatchMedia();
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("renders the complete cinematic character-development workspace", () => {
    renderCharacterStudio();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "让角色拥有可以持续保持的一致身份",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("CHARACTER STUDIO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "身份方向" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "外观设计板" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "性格与行为" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "角色阶段状态" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "角色关系" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "视觉一致性预览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI 角色助理 · 镜构小构" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入剧本设计" })).toBeEnabled();

    const exactAlts = [
      "电影角色站在所属世界环境中的整体身份与视觉设定",
      "展示电影角色背景、动机、信念、目标和核心冲突的身份视觉设计板",
      "展示主要电影角色之间关系、情绪距离和叙事张力的视觉设计板",
    ];
    for (const alt of exactAlts) {
      expect(screen.getAllByAltText(alt).length).toBeGreaterThan(0);
    }
    expect(
      screen.queryByText(
        /Provider|Database|GPU|Queue ID|characterRef|identityRef|assetRef|versionRef|Identity Locked/,
      ),
    ).not.toBeInTheDocument();
  });

  it("uses semantic identity fields with descriptions and validation state", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const background = screen.getByRole("textbox", { name: "角色背景" });
    expect(background).toHaveAttribute(
      "aria-describedby",
      "character-identity-background-help",
    );
    expect(background).toHaveAttribute("aria-invalid", "false");

    await user.clear(background);

    expect(background).toHaveAttribute("aria-invalid", "true");
    expect(background).toHaveAttribute(
      "aria-describedby",
      "character-identity-background-help character-identity-background-error",
    );
    expect(screen.getByText("请补充角色背景。")).toBeInTheDocument();
  });

  it("supports the complete roving-focus asset selector contract", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const group = screen.getByRole("group", { name: "角色视觉参考" });
    const main = within(group).getByRole("button", { name: /整体身份/ });
    const face = within(group).getByRole("button", { name: /面部方向/ });
    const costume = within(group).getByRole("button", { name: /服装方向/ });
    const props = within(group).getByRole("button", { name: /标志性道具/ });

    expect(main).toHaveAttribute("type", "button");
    expect(main).toHaveAttribute("aria-pressed", "true");
    expect(main).toHaveAttribute("tabindex", "0");
    expect(face).toHaveAttribute("tabindex", "-1");

    main.focus();
    await user.keyboard("{ArrowLeft}");
    expect(props).toHaveFocus();
    await user.keyboard("{Home}");
    expect(main).toHaveFocus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(face).toHaveFocus();
    expect(face).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{End} ");
    expect(props).toHaveFocus();
    expect(props).toHaveAttribute("aria-pressed", "true");
    expect(costume).toHaveAttribute("aria-pressed", "false");
  });

  it("exposes the reference, design, and assistant production columns", () => {
    renderCharacterStudio();

    expect(screen.getByRole("complementary", { name: "角色制作参考栏" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "角色设计画布" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "角色 AI 制作助理" })).toBeInTheDocument();
    expect(screen.getByText("CURRENT STORY STAGE")).toBeInTheDocument();
  });

  it("presents Chinese-first production labels and eagerly loads appearance candidates", () => {
    renderCharacterStudio();

    expect(screen.getByText("角色制作参考")).toBeInTheDocument();
    expect(screen.getByText("角色设计画布")).toBeInTheDocument();
    expect(screen.getByText("当前方向 + AI 候选")).toBeInTheDocument();
    expect(screen.getByText("身份一致性审查")).toBeInTheDocument();

    const candidates = screen.getByRole("group", { name: "外观候选参考" });
    for (const image of candidates.querySelectorAll("img")) {
      expect(image).toHaveAttribute("loading", "eager");
    }
  });

  it("turns the relationship primary tab into a complete local design workspace", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("tab", { name: "关系" }));
    const canvas = screen.getByRole("main", { name: "角色设计画布" });

    expect(within(canvas).getByRole("heading", { name: "关系设计画布" })).toBeInTheDocument();
    expect(within(canvas).getByText("林澈 — 疏离的旧搭档 → 顾言")).toBeInTheDocument();
    expect(within(canvas).getByText("信任残留 / 彼此隐瞒")).toBeInTheDocument();
    expect(within(canvas).getByText("两人从不直呼对方的职位")).toBeInTheDocument();
    expect(within(canvas).getByText("本地关系候选")).toBeInTheDocument();
    expect(within(canvas).getByRole("link", { name: "打开完整关系工作区" })).toHaveAttribute(
      "href",
      "#relationship-workspace",
    );

    await user.click(within(canvas).getByRole("button", { name: "生成本地候选" }));
    expect(within(canvas).getByRole("status")).toHaveTextContent("未发送或保存任何数据");
    await user.click(within(canvas).getByRole("button", { name: "采用候选" }));
    expect(within(canvas).getByText("已采用（LOCAL）")).toBeInTheDocument();
    expect(within(canvas).getByRole("status")).toHaveTextContent("本地当前方向");
  });

  it("compares, adopts, and returns from a local identity candidate", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const candidate = screen.getByRole("button", { name: "选择候选：找回原始记忆" });
    expect(candidate).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "采用候选" }));

    expect(screen.getByRole("textbox", { name: "核心动机" })).toHaveValue(
      "寻找被系统判定不存在、却与母亲失踪有关的原始记忆，并确认它为何只对自己产生回应。",
    );
    expect(screen.getAllByText("已采用（LOCAL）").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "进入剧本设计" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "恢复当前" }));
    expect(screen.getByText("选择候选开始比较，或继续编辑当前方向。")).toBeInTheDocument();
  });

  it("adopts an appearance reference as a local candidate workflow", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const group = screen.getByRole("group", { name: "外观候选参考" });
    const face = within(group).getByRole("button", { name: /面部方向/ });
    await user.click(face);
    expect(face).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "采用为当前参考" }));

    expect(face).toHaveAttribute("data-adopted", "true");
    expect(screen.getAllByText("已采用（LOCAL）").length).toBeGreaterThan(0);
  });

  it("uses roving tabs and updates the deterministic assistant context", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const identityTab = screen.getByRole("tab", { name: "身份核心" });
    identityTab.focus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "一致性" })).toHaveFocus();
    expect(screen.getByText("当前工作区域 · CONSISTENCY")).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(identityTab).toHaveFocus();

    await user.click(screen.getByRole("tab", { name: "性格" }));
    const assistant = screen.getByRole("complementary", { name: "角色 AI 制作助理" });
    expect(within(assistant).getByText("当前工作区域 · PERSONALITY")).toBeInTheDocument();
    await user.click(within(assistant).getByRole("button", { name: "重新分析" }));
    expect(within(assistant).getByRole("status")).toHaveTextContent("正在整理角色预览");
    await waitFor(() =>
      expect(within(assistant).getByText("PERSONALITY 本地分析已更新。")).toBeInTheDocument(),
    );
  });

  it("updates relationship continuity context with a local suggestion", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    expect(screen.getByText("当前关系")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "生成本地关系建议" }));
    expect(screen.getByText("候选：先用旧称呼暴露熟悉感，再延后事实说明。")).toBeInTheDocument();
  });

  it("provides an accessible relationship list and explicit empty continuity state", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const relationList = screen.getByRole("list", { name: "角色关系列表" });
    expect(within(relationList).getAllByRole("listitem")).toHaveLength(3);
    const detailButtons = within(relationList).getAllByRole("button", {
      name: "查看关系",
    });

    await user.click(detailButtons[2]);

    const dialog = await screen.findByRole("dialog", {
      name: "林澈与记忆议会",
    });
    expect(within(dialog).getByText("服从与质疑")).toBeInTheDocument();
    expect(within(dialog).getByText("暂无连续性备注")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "林澈与记忆议会" })).not.toBeInTheDocument();
    expect(detailButtons[2]).toHaveFocus();
  });

  it("navigates the local asset viewer with Arrow, Home and End keys", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("button", { name: "查看整体身份大图" }));
    expect(await screen.findByRole("dialog", { name: "整体身份" })).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog", { name: "面部方向" })).toBeInTheDocument();
    expect(
      screen.getByAltText("电影角色面部特征、年龄感和表情方向参考"),
    ).toBeInTheDocument();

    await user.keyboard("{End}");
    expect(screen.getByRole("dialog", { name: "标志性道具" })).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(screen.getByRole("dialog", { name: "整体身份" })).toBeInTheDocument();
  });

  it("marks consistency stale after editing and locally rebuilds it", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const belief = screen.getByRole("textbox", { name: "核心信念" });
    await user.type(belief, " 她仍保留选择。 ");

    expect(screen.getAllByText("预览已过期").length).toBeGreaterThan(0);
    expect(screen.getByText("需要重新整理")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入剧本设计" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "重新整理预览" }));
    expect(screen.getByRole("status")).toHaveTextContent("正在整理角色预览");
    await waitFor(
      () => expect(screen.getByRole("button", { name: "进入剧本设计" })).toBeEnabled(),
      { timeout: 1200 },
    );
    expect(screen.getByText("本地一致性预览")).toBeInTheDocument();
  });

  it("confirms only the local preview and guides an unavailable next route", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("button", { name: "进入剧本设计" }));

    const dialog = await screen.findByRole("dialog", {
      name: "剧本设计入口即将开放",
    });
    expect(within(dialog).getByText("本地预览已确认")).toBeInTheDocument();
    expect(within(dialog).getByText(/只保留为本地创作预览/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "返回故事世界" })).not.toBeInTheDocument();
  });

  it("uses the global theme context and preserves the same character asset on mobile", async () => {
    const user = userEvent.setup();
    mobileViewport = true;
    installMatchMedia();
    window.localStorage.setItem("acs-theme", "light");
    renderCharacterStudio();

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(screen.queryByRole("button", { name: /切换至.*模式/ })).not.toBeInTheDocument();
    expect(
      screen.getAllByAltText("电影角色站在所属世界环境中的整体身份与视觉设定").length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "查看整体身份大图" }));
    expect(await screen.findByRole("dialog", { name: "整体身份" })).toBeInTheDocument();
    expect(screen.getByText("本地角色视觉参考")).toBeInTheDocument();
  });
});
