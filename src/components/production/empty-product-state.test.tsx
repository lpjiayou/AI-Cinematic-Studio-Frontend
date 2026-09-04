import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyProductState } from "./empty-product-state";
import type { EmptyProductVariant } from "./presentation-types";

const variants: readonly EmptyProductVariant[] = [
  "no_data",
  "no_results",
  "disconnected",
  "authentication_required",
  "authority_required",
  "policy_blocked",
  "runtime_blocked",
  "not_implemented",
  "unknown",
];

describe("EmptyProductState", () => {
  it("renders every closed variant with the same semantic structure", () => {
    for (const variant of variants) {
      const { unmount } = render(
        <EmptyProductState
          variant={variant}
          title={`${variant} 标题`}
          explanation="明确说明"
          prerequisite="真实前置条件"
          contentLabel={`${variant} 空状态`}
        />,
      );
      const region = screen.getByRole("region", { name: `${variant} 空状态` });
      expect(region).toHaveAttribute("data-variant", variant);
      expect(region).toHaveTextContent("明确说明");
      expect(region).toHaveTextContent("真实前置条件");
      unmount();
    }
  });

  it("does not expose a fake action for not implemented or unknown states", () => {
    const { rerender } = render(
      <EmptyProductState
        variant="not_implemented"
        title="尚未实施"
        explanation="等待后续授权"
        primaryAction={<button type="button">开始使用</button>}
        contentLabel="未实施"
      />,
    );
    expect(screen.queryByRole("button", { name: "开始使用" })).not.toBeInTheDocument();
    rerender(
      <EmptyProductState
        variant="unknown"
        title="未知"
        explanation="按关闭状态处理"
        primaryAction={<button type="button">继续</button>}
        contentLabel="未知状态"
      />,
    );
    expect(screen.queryByRole("button", { name: "继续" })).not.toBeInTheDocument();
  });

  it("keeps disconnected, authentication, authority, runtime and policy copy distinct", () => {
    const copies = new Set<string>();
    for (const variant of ["disconnected", "authentication_required", "authority_required", "runtime_blocked", "policy_blocked"] as const) {
      const { unmount } = render(
        <EmptyProductState variant={variant} title={variant} explanation={variant} contentLabel={variant} />,
      );
      copies.add(screen.getByRole("region", { name: variant }).textContent || "");
      expect(document.body).not.toHaveTextContent("LOCAL_FIXTURE");
      unmount();
    }
    expect(copies.size).toBe(5);
  });
});
