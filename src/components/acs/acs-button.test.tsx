import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ACSBadge } from "./acs-badge";
import { ACSButton } from "./acs-button";
import { ACSCard } from "./acs-card";

describe("ACS primitives", () => {
  it("renders an accessible button and forwards interaction", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ACSButton variant="secondary" onClick={onClick}>
        继续
      </ACSButton>,
    );

    const button = screen.getByRole("button", { name: "继续" });
    expect(button).toHaveAttribute("data-variant", "secondary");
    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("exposes card and badge presentation states", () => {
    render(
      <ACSCard title="候选版本" tone="selected">
        <ACSBadge tone="success" dot>可用</ACSBadge>
      </ACSCard>,
    );

    expect(screen.getByRole("article")).toHaveAttribute("data-tone", "selected");
    expect(screen.getByText("可用")).toHaveAttribute("data-tone", "success");
  });
});
