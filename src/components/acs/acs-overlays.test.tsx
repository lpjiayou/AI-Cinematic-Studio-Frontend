import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ACSDrawer } from "./acs-drawer";
import { ACSModal } from "./acs-modal";

describe("ACS overlays", () => {
  it("labels the modal and closes it with Escape", async () => {
    const onClose = vi.fn();

    render(
      <ACSModal open onClose={onClose} title="确认操作">
        对话框内容
      </ACSModal>,
    );

    expect(await screen.findByRole("dialog", { name: "确认操作" })).toBeVisible();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders a right-side drawer with modal semantics", async () => {
    render(
      <ACSDrawer open onClose={() => undefined} title="属性" side="right">
        抽屉内容
      </ACSDrawer>,
    );

    const drawer = await screen.findByRole("dialog", { name: "属性" });
    expect(drawer).toHaveAttribute("data-side", "right");
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });
});
