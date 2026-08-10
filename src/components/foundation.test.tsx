import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AIAssistantPanel,
  AICandidateCard,
  AIThinkingState,
  InspectorDrawer,
  VersionTimeline,
  WorkflowMap,
} from "@/components";
import { CustomerLayout, EditorLayout, WorkspaceLayout } from "@/layouts";

describe("ACS frontend foundation", () => {
  it("renders AI and workflow presentation components", () => {
    render(
      <AIAssistantPanel status="运行中">
        <AIThinkingState />
        <AICandidateCard title="候选 A" selected>候选内容</AICandidateCard>
        <VersionTimeline items={[{ id: "v1", label: "版本 1", state: "current" }]} />
        <WorkflowMap stages={[{ id: "one", label: "阶段一", state: "active" }]} />
      </AIAssistantPanel>,
    );

    expect(screen.getByRole("complementary")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("AI 正在思考");
    expect(screen.getByText("候选 A")).toBeVisible();
    expect(screen.getByLabelText("工作流")).toBeVisible();
  });

  it("composes customer, workspace, and editor layout slots", () => {
    render(
      <CustomerLayout header="客户头部">
        <WorkspaceLayout sidebar="侧栏" projectNavigator="项目导航" topbar="工作区头部">
          <EditorLayout navigator="对象" inspector="属性" toolbar="工具栏">
            编辑画布
          </EditorLayout>
        </WorkspaceLayout>
      </CustomerLayout>,
    );

    expect(screen.getByText("客户头部")).toBeVisible();
    expect(screen.getByLabelText("项目导航器")).toHaveTextContent("项目导航");
    expect(screen.getByLabelText("工作区内容")).toBeVisible();
    expect(screen.getByLabelText("编辑器画布")).toHaveTextContent("编辑画布");
  });

  it("provides the inspector specialization", async () => {
    render(
      <InspectorDrawer open onClose={() => undefined}>
        检查器内容
      </InspectorDrawer>,
    );

    expect(await screen.findByRole("dialog", { name: "检查器" })).toBeVisible();
  });
});
