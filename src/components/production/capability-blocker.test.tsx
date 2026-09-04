import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CapabilityBlocker } from "./capability-blocker";

describe("CapabilityBlocker", () => {
  it("keeps cause, consequence, owner and affected capability visible", () => {
    render(
      <CapabilityBlocker
        blockerClass="runtime_unavailable"
        severity="warning"
        affectedCapability="媒体执行"
        title="运行时不可用"
        cause="构建主机尚未通过复核"
        consequence="无法提交生成任务"
        owner="基础设施负责人"
      />,
    );
    const article = screen.getByRole("article", { name: "运行时不可用，警告" });
    expect(article).toHaveTextContent("媒体执行");
    expect(article).toHaveTextContent("构建主机尚未通过复核");
    expect(article).toHaveTextContent("无法提交生成任务");
    expect(article).toHaveTextContent("基础设施负责人");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(article).not.toHaveTextContent("成功");
  });

  it("rejects an empty required truth field", () => {
    expect(() => render(
      <CapabilityBlocker
        blockerClass="unknown"
        severity="danger"
        affectedCapability="未知能力"
        title="状态未验证"
        cause=""
        consequence="保持关闭"
        owner="待确认"
      />,
    )).toThrow("CapabilityBlocker requires cause");
  });
});
