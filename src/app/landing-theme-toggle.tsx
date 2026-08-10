"use client";

import { ACSButton } from "@/components";
import { useACSTheme } from "@/theme";
import styles from "./landing-page.module.css";

export function LandingThemeToggle() {
  const { theme, toggleTheme } = useACSTheme();
  const nextThemeLabel = theme === "dark" ? "浅色" : "深色";

  return (
    <ACSButton
      aria-label={`切换至${nextThemeLabel}模式`}
      className={styles.headerUtilityButton}
      onClick={toggleTheme}
      size="small"
      variant="ghost"
    >
      {nextThemeLabel}模式
    </ACSButton>
  );
}
