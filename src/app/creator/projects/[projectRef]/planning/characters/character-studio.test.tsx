import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { getLocalProjectPresentation, ProjectPresentationProvider } from "@/features/project-data";
import { CharacterStudioPage } from "./character-studio";

let mobileViewport = false;

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches:
        query === "(max-width: 767px)" || query === "(max-width: 1152px)"
          ? mobileViewport
          : false,
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
      <ProjectPresentationProvider value={getLocalProjectPresentation("future-city")}>
        <CharacterStudioPage />
      </ProjectPresentationProvider>
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

  it("organizes character development into six focused production tasks", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "让角色拥有可以持续保持的一致身份",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("CHARACTER STUDIO")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "身份方向" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "外观" }));
    expect(screen.getByRole("heading", { name: "外观设计板" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "性格" }));
    expect(screen.getByRole("heading", { name: "性格与行为" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "关系" }));
    expect(screen.getByRole("heading", { name: "角色关系" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "阶段" }));
    expect(screen.getByRole("heading", { name: "角色阶段状态" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "阶段适用范围" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "一致性" }));
    expect(screen.getByRole("heading", { name: "视觉一致性预览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AI 角色检查" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "进入剧本设计" })).toBeEnabled();

    expect(
      screen.getAllByAltText("电影角色站在所属世界环境中的整体身份与视觉设定").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        /characterRef|Provider|Database|GPU|Queue ID|Identity Locked/,
      ),
    ).not.toBeInTheDocument();
  });

  it("has no critical or serious axe violations in idle and candidate-result states", async () => {
    const user = userEvent.setup();
    const { container } = renderCharacterStudio();

    const assertAccessible = async () => {
      const result = await axe.run(container, {
        rules: { "color-contrast": { enabled: false } },
      });
      expect(
        result.violations.filter(
          (violation) => violation.impact === "critical" || violation.impact === "serious",
        ),
      ).toEqual([]);
    };

    await assertAccessible();
    await user.click(screen.getByRole("button", { name: "生成本地候选" }));
    await assertAccessible();
  }, 15_000);

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
    expect(screen.getByRole("group", { name: "角色视觉参考" })).toBeInTheDocument();
  });

  it("presents Chinese-first task labels and eagerly loads appearance candidates", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    expect(screen.getByText("角色制作参考")).toBeInTheDocument();
    expect(screen.getByText("角色设计画布")).toBeInTheDocument();
    expect(screen.getByText("当前方向 + AI 候选")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "外观" }));
    const candidates = screen.getByRole("group", { name: "外观候选参考" });
    for (const image of candidates.querySelectorAll("img")) {
      expect(image).toHaveAttribute("loading", "eager");
    }

    await user.click(screen.getByRole("tab", { name: "一致性" }));
    expect(screen.getByText("身份一致性审查")).toBeInTheDocument();
  });

  it("turns the relationship tab into a focused inline design workspace", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("tab", { name: "关系" }));
    const canvas = screen.getByRole("main", { name: "角色设计画布" });

    expect(within(canvas).getByRole("heading", { name: "角色关系" })).toBeInTheDocument();
    expect(within(canvas).getByText("林澈 — 疏离的旧搭档 → 顾言")).toBeInTheDocument();
    expect(within(canvas).getByText("信任残留 / 彼此隐瞒")).toBeInTheDocument();
    expect(within(canvas).getByText("两人从不直呼对方的职位")).toBeInTheDocument();
    expect(within(canvas).getByText("当前关系")).toBeInTheDocument();
    expect(within(canvas).queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("compares, adopts, and returns from a local identity candidate", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    expect(screen.queryByRole("region", { name: "候选结果" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "生成本地候选" }));

    const candidate = screen.getByRole("button", { name: "比较候选：保护被删除者" });
    expect(candidate).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "采用候选" }));

    expect(screen.getByRole("textbox", { name: "核心动机" })).toHaveValue(
      "在追查母亲之前，先阻止议会继续删除与异常影像有关的普通人身份。",
    );
    expect(screen.getAllByText("已采用（LOCAL）").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "进入剧本设计" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "恢复当前" }));
    expect(screen.getByText("选择候选开始比较，或继续编辑当前方向。")).toBeInTheDocument();
  });

  it("mounts candidates only for the matching active task and preserves page task state", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    expect(screen.queryByRole("region", { name: "候选结果" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "生成本地候选" }));

    const candidateRegion = screen.getByRole("region", { name: "候选结果" });
    expect(within(candidateRegion).getAllByRole("button", { name: /比较候选/ })).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "采用候选" }));

    await user.click(screen.getByRole("tab", { name: "外观" }));
    expect(screen.queryByRole("region", { name: "候选结果" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "身份核心" }));
    expect(screen.getByRole("region", { name: "候选结果" })).toBeInTheDocument();
    expect(screen.getAllByText("已采用（LOCAL）").length).toBeGreaterThan(0);
  });

  it("adopts an appearance reference as a local candidate workflow", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("tab", { name: "外观" }));
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
    expect(screen.getByText("当前任务 · 一致性检查")).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(identityTab).toHaveFocus();

    await user.click(screen.getByRole("tab", { name: "性格" }));
    const assistant = screen.getByRole("complementary", { name: "角色 AI 制作助理" });
    expect(within(assistant).getByText("当前任务 · 性格与对白规则")).toBeInTheDocument();
    await user.click(within(assistant).getByRole("button", { name: "重新检查" }));
    expect(within(assistant).getByRole("status")).toHaveTextContent("正在整理角色预览");
    await waitFor(() =>
      expect(within(assistant).getByText("PERSONALITY 本地分析已更新。")).toBeInTheDocument(),
    );
  });

  it("updates relationship continuity context with a local suggestion", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("tab", { name: "关系" }));
    expect(screen.getByText("当前关系")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "生成本地关系建议" }));
    expect(screen.getByText("候选：先用旧称呼暴露熟悉感，再延后事实说明。")).toBeInTheDocument();
  });

  it("provides an accessible relationship list and explicit empty continuity state", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("tab", { name: "关系" }));
    const relationList = screen.getByRole("list", { name: "角色关系列表" });
    expect(within(relationList).getAllByRole("listitem")).toHaveLength(3);
    const detailButtons = within(relationList).getAllByRole("button", {
      name: "选择关系",
    });

    await user.click(detailButtons[2]);
    expect(screen.getByText("服从与质疑")).toBeInTheDocument();
    expect(screen.getByText("暂无连续性备注")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "林澈与记忆议会" })).not.toBeInTheDocument();
  });

  it("keeps reference selection inside the current task instead of opening an image popup", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("button", { name: "在当前任务中使用整体身份参考" }));
    expect(screen.getByRole("heading", { name: "身份方向" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "整体身份" })).not.toBeInTheDocument();

    const referenceGroup = screen.getByRole("group", { name: "角色视觉参考" });
    await user.click(within(referenceGroup).getByRole("button", { name: /面部方向/ }));
    await user.click(screen.getByRole("button", { name: "在当前任务中使用面部方向参考" }));
    expect(screen.getByRole("heading", { name: "外观设计板" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "面部方向" })).not.toBeInTheDocument();
  });

  it("marks consistency stale after editing and locally rebuilds it", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    const belief = screen.getByRole("textbox", { name: "核心信念" });
    await user.type(belief, " 她仍保留选择。 ");

    expect(screen.getAllByText("预览已过期").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "一致性" }));
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

  it("confirms only the local preview and exposes the independent script workspace", async () => {
    const user = userEvent.setup();
    renderCharacterStudio();

    await user.click(screen.getByRole("button", { name: "进入剧本设计" }));

    const dialog = await screen.findByRole("dialog", {
      name: "角色预览已确认",
    });
    expect(within(dialog).getByText("本地预览已确认")).toBeInTheDocument();
    expect(within(dialog).getByText(/只保留为本地创作预览/)).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "打开剧本工作室" })).toHaveAttribute("href", "/script-studio");
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
    expect(screen.getByRole("button", { name: "打开角色检查与建议" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开角色制作参考" }));
    const referenceDrawer = await screen.findByRole("dialog", { name: "角色制作参考" });
    expect(
      within(referenceDrawer).getAllByAltText("电影角色站在所属世界环境中的整体身份与视觉设定").length,
    ).toBeGreaterThan(0);
    await user.click(within(referenceDrawer).getByRole("button", { name: "在当前任务中使用整体身份参考" }));
    expect(screen.queryByRole("dialog", { name: "整体身份" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "身份方向" })).toBeInTheDocument();
  });
});
