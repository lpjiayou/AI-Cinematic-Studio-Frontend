import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { ThemeProvider } from "@/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Cinematic Studio V2.3",
  description: "镜构智能 AI Cinematic Studio 客户体验入口。",
};

const themeBootstrap = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("acs-theme");
    const theme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <Script id="acs-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
      </body>
    </html>
  );
}
