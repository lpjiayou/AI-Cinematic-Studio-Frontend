import type { Metadata } from "next";
import { ThemeProvider } from "@/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Cinematic Studio V2.3",
  description: "AI Cinematic Studio V2.3 Experience Layer frontend foundation.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
