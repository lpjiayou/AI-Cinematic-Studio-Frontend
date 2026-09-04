import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  EvidenceDisclosure,
  type EvidenceFieldView,
} from "./evidence-disclosure";

const fields: readonly EvidenceFieldView[] = [
  { id: "ordinary", label: "显示字段", value: "fixture-value", sensitivity: "ordinary", copyAllowed: true },
  { id: "restricted", label: "受限字段", value: "restricted-value", sensitivity: "restricted", copyAllowed: false },
  { id: "redacted", label: "脱敏字段", sensitivity: "redacted", copyAllowed: false, redactedReason: "已按证据策略隐藏" },
];

function DrawerHarness({ copyAction }: { copyAction?: (field: Extract<EvidenceFieldView, { sensitivity: "ordinary" | "restricted" }>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <EvidenceDisclosure
      title="技术证据"
      summary="仅显示调用方提供的值"
      fields={fields}
      open={open}
      onOpenChange={setOpen}
      mode="drawer"
      copyAction={copyAction}
      closeLabel="关闭技术证据"
    />
  );
}

describe("EvidenceDisclosure", () => {
  it("separates visible, restricted and redacted fields and only copies when allowed", () => {
    const copyAction = vi.fn();
    render(
      <EvidenceDisclosure
        title="技术证据"
        summary="证据摘要"
        fields={fields}
        open
        onOpenChange={() => undefined}
        mode="panel"
        copyAction={copyAction}
        closeLabel="关闭技术证据"
      />,
    );
    const region = screen.getByRole("region", { name: "技术证据" });
    expect(region).toHaveTextContent("fixture-value");
    expect(region).toHaveTextContent("restricted-value");
    const redacted = region.querySelector('[data-evidence-sensitivity="redacted"]')!;
    expect(redacted).toHaveTextContent("已按证据策略隐藏");
    expect(redacted.querySelector("[data-evidence-value]")).toBeNull();
    expect(within(region).getAllByRole("button", { name: /复制/ })).toHaveLength(1);
  });

  it("closes a drawer with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);
    const trigger = screen.getByRole("button", { name: "查看技术证据" });
    await user.click(trigger);
    expect(await screen.findByRole("dialog", { name: "技术证据" })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "技术证据" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders an explicit empty state without example values", () => {
    render(
      <EvidenceDisclosure
        title="技术证据"
        summary="无证据"
        fields={[]}
        open
        onOpenChange={() => undefined}
        mode="inline"
        closeLabel="关闭"
      />,
    );
    expect(screen.getByText("尚无可核验证据")).toBeVisible();
    expect(document.querySelector("[data-evidence-value]")).toBeNull();
  });
});
