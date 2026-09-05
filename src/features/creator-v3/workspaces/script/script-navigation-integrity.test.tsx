import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme";
import { ScriptStudioV3 } from "./script-studio-v3";
import { CreatorClientError } from "@/features/core-integration";
import { deferred, scriptFixture } from "./script-workspace-test-fixtures";

const core = vi.hoisted(() => ({ request: vi.fn(), push: vi.fn(), connection: { status: "connected" } }));
vi.mock("@/features/core-integration", async () => ({
  ...await vi.importActual<typeof import("@/features/core-integration")>("@/features/core-integration"),
  creatorRequest: core.request, useCreatorIntegration: () => ({ state: core.connection, refresh: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: core.push }) }));

let manualGate: Promise<unknown> | null = null;
let saveError: CreatorClientError | null = null;

describe("Script navigation integrity with the real Project Shell", () => {
  beforeEach(() => {
    core.request.mockReset(); core.push.mockReset(); manualGate = null; saveError = null;
    window.history.replaceState({}, "", "/creator/projects/project-a/script");
    const fixture = scriptFixture();
    let saved = fixture.workspace();
    core.request.mockImplementation(async (path: string, init) => {
      if (path.startsWith("projects/")) return { project: fixture.project };
      if (path.startsWith("series/")) return { series: fixture.series };
      if (path.startsWith("script-workspaces?")) return { workspace: saved };
      if (path === "script-versions/manual") {
        if (manualGate) await manualGate;
        if (saveError) throw saveError;
        saved = fixture.workspace(init.body.content.synopsis, 2);
        return { ok: true, script: saved.script };
      }
      throw new Error(path);
    });
  });

  it("F2 guards the desktop Job Center before navigation", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><ScriptStudioV3 projectRef="project-a" /></ThemeProvider>);
    await user.type(await screen.findByRole("textbox", { name: "故事梗概" }), " dirty");
    await user.click(screen.getByRole("button", { name: "打开任务中心" }));
    expect(core.push).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "离开前保存修改？" });
    expect(within(dialog).getByRole("button", { name: "留在当前页面" })).toBeVisible();
  });

  async function editor(dirty = true) {
    const user = userEvent.setup();
    render(<ThemeProvider><ScriptStudioV3 projectRef="project-a" /></ThemeProvider>);
    const input = await screen.findByRole("textbox", { name: "故事梗概" });
    if (dirty) fireEvent.change(input, { target: { value: "B" } });
    return { user, input };
  }
  function assertNoMutation() {
    expect(core.request.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
  }
  function popBase() {
    fireEvent.popState(window, { state: { ...window.history.state,
      acsScriptUnsavedGuard: { role: "base", page: "/creator/projects/project-a/script" } } });
  }

  it.each(["V3 项目导航", "V3 全局导航"])("guards a real route from %s and restores its trigger", async (navigationName) => {
    const { user, input } = await editor();
    const navigation = screen.getByRole("navigation", { name: navigationName });
    const link = within(navigation).getAllByRole("link")[0];
    await user.click(link);
    expect(core.push).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "离开前保存修改？" });
    for (const label of ["保存并继续", "放弃修改并继续", "留在当前页面"]) expect(within(dialog).getByRole("button", { name: label })).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "留在当前页面" }));
    await waitFor(() => expect(link).toHaveFocus());
    expect(input).toHaveValue("B"); assertNoMutation();
  });

  it("keeps the mobile Project Drawer available and restores the two distinct focus targets", async () => {
    const { user, input } = await editor();
    const trigger = screen.getByRole("button", { name: "打开项目导航" });
    await user.click(trigger);
    const drawer = screen.getByRole("dialog", { name: "项目导航" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.queryByRole("dialog", { name: "离开前保存修改？" })).not.toBeInTheDocument();
    const link = drawer.querySelector<HTMLAnchorElement>('[data-destination-id="overview"]')!;
    expect(link).toHaveAttribute("href", "/creator/projects/project-a/overview");
    await user.click(link);
    const modal = screen.getByRole("dialog", { name: "离开前保存修改？" });
    expect(drawer).toBeVisible(); expect(core.push).not.toHaveBeenCalled();
    await user.click(within(modal).getByRole("button", { name: "留在当前页面" }));
    await waitFor(() => expect(link).toHaveFocus());
    expect(screen.queryByRole("dialog", { name: "离开前保存修改？" })).not.toBeInTheDocument();
    expect(drawer).toBeVisible(); expect(input).toHaveValue("B");
    expect(document.querySelector('[data-script-dirty="true"]')).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/creator/projects/project-a/script");
    expect(core.push).not.toHaveBeenCalled(); assertNoMutation();
  });

  it.each(["项目导航", "全局导航"])("Escape dismisses only the unsaved Modal above the %s Drawer", async (drawerName) => {
    const { user } = await editor();
    await user.click(screen.getByRole("button", { name: `打开${drawerName}` }));
    const drawer = screen.getByRole("dialog", { name: drawerName });
    const link = within(drawer).getAllByRole("link")[0];
    await user.click(link);
    expect(screen.getByRole("dialog", { name: "离开前保存修改？" })).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(link).toHaveFocus());
    expect(drawer).toBeVisible(); expect(screen.getAllByRole("dialog")).toHaveLength(1);
    assertNoMutation();
  });

  it("guards the mobile Job Center through the same navigation entry", async () => {
    const { user, input } = await editor();
    await user.click(screen.getByRole("button", { name: "打开任务" }));
    const drawer = screen.getByRole("dialog", { name: "任务" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const trigger = within(drawer).getByRole("button", { name: "打开任务中心" });
    await user.click(trigger);
    expect(core.push).not.toHaveBeenCalled();
    await user.click(within(screen.getByRole("dialog", { name: "离开前保存修改？" })).getByRole("button", { name: "留在当前页面" }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(drawer).toBeVisible(); expect(input).toHaveValue("B"); assertNoMutation();
  });

  it.each(["选择分集", "移动端选择分集"])("guards %s and preserves the old Episode when staying", async (label) => {
    const { user, input } = await editor();
    const select = screen.getByLabelText(label, { selector: "select" });
    await user.selectOptions(select, "episode-a-next");
    const dialog = screen.getByRole("dialog", { name: "切换分集前保存修改？" });
    expect(select).toHaveValue("episode-a");
    await user.click(within(dialog).getByRole("button", { name: "留在当前分集" }));
    await waitFor(() => expect(select).toHaveFocus());
    expect(input).toHaveValue("B"); assertNoMutation();
  });

  it.each(["打开项目导航", "打开全局导航", "打开 Authority/Evidence", "打开任务"])("%s does not count as leaving the editor", async (label) => {
    const { user, input } = await editor();
    await user.click(screen.getByRole("button", { name: label }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.queryByRole("dialog", { name: "离开前保存修改？" })).not.toBeInTheDocument();
    expect(input).toHaveValue("B"); expect(core.push).not.toHaveBeenCalled(); assertNoMutation();
  });

  it("does not prompt for JobShelf expansion, theme, edit/compare, or local hash links", async () => {
    const { user } = await editor();
    await user.click(screen.getByRole("button", { name: "展开任务" }));
    await user.click(screen.getByRole("button", { name: "收起任务" }));
    await user.click(screen.getByRole("button", { name: /切换为.*主题/ }));
    await user.click(screen.getByRole("tab", { name: "对比" }));
    await user.click(screen.getByRole("tab", { name: "编辑" }));
    const anchor = document.createElement("a"); anchor.href = "#script-title"; anchor.textContent = "当前页锚点";
    screen.getByRole("main").append(anchor);
    await user.click(anchor);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(core.push).not.toHaveBeenCalled(); assertNoMutation();
    anchor.remove();
  });

  it("waits for the exact save snapshot before continuing", async () => {
    const gate = deferred<unknown>(); manualGate = gate.promise;
    const { user } = await editor();
    await user.click(screen.getByRole("button", { name: "打开任务中心" }));
    await user.click(screen.getByRole("button", { name: "保存并继续" }));
    expect(core.push).not.toHaveBeenCalled();
    expect(core.request.mock.calls.find(([path]) => path === "script-versions/manual")![1].body.content.synopsis).toBe("B");
    await act(async () => { gate.resolve({ ok: true }); });
    await waitFor(() => expect(core.push).toHaveBeenCalledWith("/creator/jobs"));
  });

  it("keeps the Modal and draft when saving fails", async () => {
    saveError = new CreatorClientError(409, { code: "conflict", message: "保存发生冲突" });
    const { user, input } = await editor();
    await user.click(screen.getByRole("button", { name: "打开任务中心" }));
    await user.click(screen.getByRole("button", { name: "保存并继续" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("保存发生冲突");
    expect(core.push).not.toHaveBeenCalled(); expect(input).toHaveValue("B");
    expect(screen.getByRole("dialog", { name: "离开前保存修改？" })).toBeVisible();
  });

  it("does not navigate or claim everything saved after more typing during save-and-continue", async () => {
    const gate = deferred<unknown>(); manualGate = gate.promise;
    const { user, input } = await editor();
    await user.click(screen.getByRole("button", { name: "打开任务中心" }));
    await user.click(screen.getByRole("button", { name: "保存并继续" }));
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: "C" } });
    await act(async () => { gate.resolve({ ok: true }); });
    expect(await screen.findByRole("alert")).toHaveTextContent("保存期间还有新的未保存修改");
    expect(core.push).not.toHaveBeenCalled(); expect(input).toHaveValue("C");
    expect(screen.queryAllByText("所有修改已保存")).toHaveLength(0);
  });

  it("discards to the saved baseline before continuing without a mutation", async () => {
    const { user, input } = await editor();
    await user.click(screen.getByRole("button", { name: "打开任务中心" }));
    await user.click(screen.getByRole("button", { name: "放弃修改并继续" }));
    expect(input).toHaveValue("A"); expect(core.push).toHaveBeenCalledWith("/creator/jobs"); assertNoMutation();
  });

  it("lets clean back navigation leave exactly once without a history loop", async () => {
    await editor(false);
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
    popBase(); popBase();
    expect(go).toHaveBeenCalledExactlyOnceWith(-2);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); go.mockRestore();
  });

  it.each(["stay", "discard", "save", "failure"] as const)("routes dirty browser back through the same %s decision", async (choice) => {
    const { user, input } = await editor();
    const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
    if (choice === "failure") saveError = new CreatorClientError(409, { code: "conflict", message: "不能保存" });
    popBase();
    const dialog = screen.getByRole("dialog", { name: "离开前保存修改？" });
    expect(go).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: choice === "stay" ? "留在当前页面" : choice === "discard" ? "放弃修改并继续" : "保存并继续" }));
    if (choice === "save" || choice === "discard") await waitFor(() => expect(go).toHaveBeenCalledExactlyOnceWith(-2));
    else { expect(go).not.toHaveBeenCalled(); expect(input).toHaveValue("B"); }
    if (choice === "stay") { popBase(); expect(screen.getByRole("dialog", { name: "离开前保存修改？" })).toBeVisible(); }
    go.mockRestore();
  });

});
