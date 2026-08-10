import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useACSTheme } from "./theme-provider";

function ThemeHarness() {
  const { theme, toggleTheme } = useACSTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = "dark";
  });

  it("applies and persists an explicit light or dark theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("dark"));
    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("acs-theme")).toBe("light");
  });

  it("restores a saved preference after the hydration-safe first render", async () => {
    window.localStorage.setItem("acs-theme", "light");
    document.documentElement.dataset.theme = "light";

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("light"));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(window.localStorage.getItem("acs-theme")).toBe("light");
  });
});
