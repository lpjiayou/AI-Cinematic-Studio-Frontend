import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { ScriptStudioPage } from "./script-studio";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function renderScriptStudio() {
  return render(
    <ThemeProvider defaultTheme="light">
      <ScriptStudioPage />
    </ThemeProvider>,
  );
}

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  window.dispatchEvent(new Event("resize"));
}

describe("ScriptStudioPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    window.localStorage.clear();
    window.localStorage.setItem("acs-theme", "light");
    document.documentElement.dataset.theme = "light";
    setViewport(1920);
  });

  it("renders the selected professional compare workspace without technical leakage", () => {
    renderScriptStudio();

    expect(screen.getByRole("heading", { level: 1, name: "剧本制作工作台" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "客户制作模块导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "剧本与分镜" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "当前内容" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "候选内容" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "对象导航器" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "编辑器检查器" })).toBeInTheDocument();
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.body).not.toHaveTextContent(/GPU|Provider|Queue ID|Database|sceneRef|scriptRef|versionRef/);
  });

  it("supports roving scene navigation with wrap, Home, End, arrows, Enter, and Space", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    const navigator = screen.getByRole("navigation", { name: "章节与场景" });
    const current = within(navigator).getByRole("button", { name: /12 旧车站/ });
    const next = within(navigator).getByRole("button", { name: /13 天台/ });
    const first = within(navigator).getByRole("button", { name: /08 雨夜/ });
    const last = within(navigator).getByRole("button", { name: /15 市区街道/ });

    current.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(next).toHaveFocus();
    expect(next).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "外景 · 天台 · 夜" })).toBeInTheDocument();

    await user.keyboard("{Home}");
    expect(first).toHaveFocus();
    await user.keyboard("{End} ");
    expect(last).toHaveFocus();
    expect(last).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{ArrowDown}");
    expect(first).toHaveFocus();
  });

  it("attaches the native beforeunload guard only while the local buffer is dirty", async () => {
    const user = userEvent.setup();
    const view = renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "关闭候选比较" }));
    const dialogue = document.querySelector<HTMLTextAreaElement>("#edit-ui-block-12-04");
    expect(dialogue).not.toBeNull();

    const cleanEvent = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(cleanEvent)).toBe(true);
    expect(cleanEvent.defaultPrevented).toBe(false);

    await user.clear(dialogue!);
    await user.type(dialogue!, "这里冷得反常。");
    expect(screen.getByRole("status")).toHaveTextContent("尚有本地修改");

    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(dirtyEvent)).toBe(false);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    await user.clear(dialogue!);
    await user.type(dialogue!, "这里，比想象中更冷。");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("本地内容已与进入基线一致"));

    const restoredEvent = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(restoredEvent)).toBe(true);

    await user.clear(dialogue!);
    await user.type(dialogue!, "卸载前的本地修改。");
    view.unmount();
    const unmountedEvent = new Event("beforeunload", { cancelable: true });
    expect(window.dispatchEvent(unmountedEvent)).toBe(true);
  });

  it("routes project, episode, and internal navigation intents through the typed dirty guard", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "关闭候选比较" }));
    const dialogue = document.querySelector<HTMLTextAreaElement>("#edit-ui-block-12-04")!;
    await user.clear(dialogue);
    await user.type(dialogue, "保留这段本地对白。");

    await user.click(screen.getByRole("link", { name: "AI导演" }));
    let guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "取消" }));
    expect(pushMock).not.toHaveBeenCalled();
    expect(dialogue).toHaveValue("保留这段本地对白。");

    await user.click(screen.getByRole("button", { name: /项目未来之城/ }));
    guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "保留本地修改并继续编辑" }));
    expect(dialogue).toHaveValue("保留这段本地对白。");

    await user.click(screen.getByRole("button", { name: /剧集第 3 集/ }));
    guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "取消" }));
    expect(dialogue).toHaveValue("保留这段本地对白。");
  });

  it("protects dirty content with preserve, cancel, and destructive discard outcomes", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "关闭候选比较" }));
    const dialogue = document.querySelector<HTMLTextAreaElement>("#edit-ui-block-12-04")!;
    await user.clear(dialogue);
    await user.type(dialogue, "新的本地对白。");

    await user.click(screen.getByRole("button", { name: "进入分镜设计" }));
    let guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await waitFor(() => expect(within(guard).getByRole("button", { name: "保留本地修改并继续编辑" })).toHaveFocus());
    await user.click(within(guard).getByRole("button", { name: "保留本地修改并继续编辑" }));
    expect(dialogue).toHaveValue("新的本地对白。");

    await user.click(screen.getByRole("button", { name: "进入分镜设计" }));
    guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "取消" }));
    expect(dialogue).toHaveValue("新的本地对白。");

    await user.click(screen.getByRole("button", { name: "进入分镜设计" }));
    guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "放弃修改并继续" }));
    expect(dialogue).toHaveValue("这里，比想象中更冷。");
    expect(screen.getByRole("alert")).toHaveTextContent("分镜设计空间尚未开放");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("adopts a local candidate into the buffer and records a non-formal local snapshot", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "采用候选" }));
    expect(screen.getByRole("status")).toHaveTextContent("尚有本地修改");
    expect(screen.queryByRole("heading", { name: "候选内容" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "版本 / 本地历史" }));
    expect(screen.getByRole("heading", { name: "本地历史" })).toBeInTheDocument();
    expect(screen.getByText("采用候选前")).toBeInTheDocument();
    expect(screen.getByText("仅保留在本次会话中，不是正式 ScriptVersion。")).toBeInTheDocument();
  });

  it("guards local-history replacement and restores only a session-scoped snapshot", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "采用候选" }));
    await user.click(screen.getByRole("tab", { name: "版本 / 本地历史" }));
    await user.click(screen.getByRole("button", { name: "恢复“进入工作区时”" }));

    let guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "取消" }));
    expect(screen.getByRole("status")).toHaveTextContent("尚有本地修改");

    await user.click(screen.getByRole("button", { name: "恢复“进入工作区时”" }));
    guard = await screen.findByRole("dialog", { name: "尚有未保存的本地修改" });
    await user.click(within(guard).getByRole("button", { name: "放弃修改并继续" }));
    expect(screen.getByRole("status")).toHaveTextContent("本地内容已与进入基线一致");
    expect(screen.getByText("仅保留在本次会话中，不是正式 ScriptVersion。")).toBeInTheDocument();
  });

  it("marks superseded local candidate completion stale instead of applying it", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "关闭候选比较" }));
    const dialogue = document.querySelector<HTMLTextAreaElement>("#edit-ui-block-12-04")!;
    await user.click(screen.getByRole("button", { name: "生成候选" }));
    await user.clear(dialogue);
    await user.type(dialogue, "生成期间改变当前内容。");

    await waitFor(() => expect(screen.getByRole("button", { name: "生成候选" })).not.toHaveAttribute("aria-busy"), { timeout: 1200 });
    expect(screen.getByRole("button", { name: "比较候选" })).toBeDisabled();
    await user.click(screen.getByRole("tab", { name: /候选 1/ }));
    expect(screen.getAllByText("已过期").length).toBeGreaterThan(0);
    expect(document.querySelector<HTMLTextAreaElement>("#edit-ui-block-12-04")).toHaveValue("生成期间改变当前内容。");
  });

  it("keeps upstream constraints read-only and uses M7 findings only to locate presentation content", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    const inspector = screen.getByRole("complementary", { name: "编辑器检查器" });
    expect(within(inspector).getByText("人物一致性")).toBeInTheDocument();
    expect(within(inspector).getByText("世界规则")).toBeInTheDocument();
    expect(within(inspector).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(within(inspector).getByRole("button", { name: /语气偏直接/ }));
    const locatedBlock = document.querySelector("#edit-ui-block-12-14")?.closest("div");
    expect(locatedBlock).toHaveAttribute("data-selected", "true");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("rejects an empty selected block and recovers with a deterministic local candidate", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "关闭候选比较" }));
    const dialogue = document.querySelector<HTMLTextAreaElement>("#edit-ui-block-12-04")!;
    await user.clear(dialogue);
    await user.click(screen.getByRole("button", { name: "生成候选" }));
    expect(screen.getByRole("button", { name: "生成候选" })).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("alert", {}, { timeout: 1200 })).toHaveTextContent("候选生成失败");

    await user.type(dialogue, "这里冷得反常。");
    await user.click(screen.getByRole("button", { name: "生成候选" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "生成候选" })).not.toHaveAttribute("aria-busy"), { timeout: 1200 });
    await user.click(screen.getByRole("tab", { name: /候选 1/ }));
    expect(screen.getByText("对白调整候选")).toBeInTheDocument();
    expect(screen.getByText("本地 AI 候选")).toBeInTheDocument();
  });

  it("keeps mobile navigator and inspector access through accessible drawers", async () => {
    const user = userEvent.setup();
    setViewport(390);
    renderScriptStudio();

    await act(async () => setViewport(390));
    await user.click(screen.getByRole("button", { name: "打开场景导航" }));
    expect(await screen.findByRole("dialog", { name: "场景" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "关闭抽屉" }));

    await user.click(screen.getByRole("button", { name: "打开剧本检查器" }));
    expect(await screen.findByRole("dialog", { name: "剧本检查器" })).toBeInTheDocument();
  });

  it("inherits and switches the ACS ThemeProvider", async () => {
    const user = userEvent.setup();
    renderScriptStudio();

    await user.click(screen.getByRole("button", { name: "切换至深色模式" }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
    expect(window.localStorage.getItem("acs-theme")).toBe("dark");
  });
});
