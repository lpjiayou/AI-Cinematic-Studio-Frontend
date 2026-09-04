import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AuthorityStatus,
  type AuthorityLayerView,
} from "./authority-status";

const layers: readonly AuthorityLayerView[] = [
  { id: "ui", label: "界面", state: "available", stateLabel: "可用", message: "组件已实现" },
  { id: "runtime", label: "运行时", state: "blocked", stateLabel: "阻塞", message: "未执行", owner: "运行时负责人" },
  { id: "authority", label: "授权", state: "required", stateLabel: "需要授权", message: "未授权" },
  { id: "policy", label: "策略", state: "not_applicable", stateLabel: "不适用", message: "本轮无策略动作" },
];

describe("AuthorityStatus", () => {
  it("renders all four independent layers without aggregate readiness", () => {
    render(
      <AuthorityStatus
        summary="界面可用不代表执行获准"
        layers={layers}
        statusLabel="四层状态"
      />,
    );
    const status = screen.getByRole("region", { name: "四层状态" });
    expect(within(status).getAllByRole("listitem")).toHaveLength(4);
    expect(status).toHaveTextContent("界面");
    expect(status).toHaveTextContent("运行时负责人");
    expect(status).toHaveTextContent("需要授权");
    expect(status).not.toHaveTextContent("Ready");
    expect(status.querySelector('[data-layer="runtime"]')).toHaveAttribute("data-state", "blocked");
  });

  it("fails closed for an unrecognized state", () => {
    const unknownLayers = layers.map((layer) => (
      layer.id === "policy" ? { ...layer, state: "mystery" } : layer
    )) as unknown as readonly AuthorityLayerView[];
    render(
      <AuthorityStatus summary="未知状态" layers={unknownLayers} statusLabel="四层状态" />,
    );
    const policy = document.querySelector('[data-layer="policy"]');
    expect(policy).toHaveAttribute("data-state", "unverified");
    expect(policy).toHaveTextContent("状态未验证");
  });

  it("rejects missing or duplicate layers", () => {
    expect(() => render(
      <AuthorityStatus summary="缺层" layers={layers.slice(0, 3)} statusLabel="四层状态" />,
    )).toThrow("AuthorityStatus missing layer: policy");
    expect(() => render(
      <AuthorityStatus summary="重复" layers={[...layers, layers[0]]} statusLabel="四层状态" />,
    )).toThrow("AuthorityStatus duplicate layer: ui");
  });
});
