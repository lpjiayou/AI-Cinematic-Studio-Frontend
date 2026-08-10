"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ACSTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ACSTheme;
  setTheme: (theme: ACSTheme) => void;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ACSTheme;
  storageKey?: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is ACSTheme {
  return value === "light" || value === "dark";
}

function getInitialTheme(defaultTheme: ACSTheme, storageKey: string): ACSTheme {
  if (typeof window === "undefined") return defaultTheme;

  const storedTheme = window.localStorage.getItem(storageKey);
  const documentTheme = document.documentElement.dataset.theme ?? null;
  if (isTheme(storedTheme)) return storedTheme;
  if (isTheme(documentTheme)) return documentTheme;
  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "acs-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ACSTheme>(() =>
    getInitialTheme(defaultTheme, storageKey),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  const setTheme = useCallback((nextTheme: ACSTheme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark",
    );
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useACSTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useACSTheme must be used within ThemeProvider.");
  }

  return context;
}
