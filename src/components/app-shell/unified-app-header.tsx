"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { PRIMARY_NAVIGATION } from "@/lib/navigation";
import { PROJECT_NAVIGATION, projectRoute } from "@/lib/project-navigation";
import { useACSTheme } from "@/theme";
import styles from "./unified-app-header.module.css";

export type AppHeaderMode = "global" | "project" | "editor";

export interface UnifiedAppHeaderProps {
  mode?: AppHeaderMode | "auto";
  editorLabel?: string;
  onNavigate?: (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => void;
}

function projectClientKeyFromPath(pathname: string) {
  const match = pathname.match(/^\/creator\/projects\/([^/]+)(?:\/|$)/);
  if (!match || match[1] === "new") return null;
  return decodeURIComponent(match[1]);
}

function isCurrentGlobalDestination(pathname: string, href: string) {
  if (href === "/creator") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function GlobalNavigation({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Creator 全局导航" className={styles.navigation}>
      <ul>
        {PRIMARY_NAVIGATION.map((item) => (
          <li key={item.href}>
            {item.available ? (
              <Link
                aria-current={isCurrentGlobalDestination(pathname, item.href) ? "page" : undefined}
                aria-label={item.label}
                href={item.href}
              >
                <span className={styles.navigationLabel}>{item.label}</span>
                <span className={styles.navigationDescription}>{item.description}</span>
              </Link>
            ) : (
              <span aria-disabled="true" title={item.unavailableReason}>
                <span className={styles.navigationLabel}>{item.label}</span>
                <span className={styles.navigationDescription}>{item.description}</span>
                <span className={styles.navigationAvailability}>尚未开放</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ProjectNavigation({ clientKey, pathname }: { clientKey: string; pathname: string }) {
  return (
    <nav aria-label="项目工作区导航" className={styles.navigation}>
      <ul>
        {PROJECT_NAVIGATION.map((item) => {
          const href = projectRoute(clientKey, item.hrefSuffix);
          const current = pathname.includes(`/${item.segment}/`) || pathname.endsWith(`/${item.segment}`);

          return (
            <li key={item.segment}>
              {item.available ? (
                <Link aria-current={current ? "page" : undefined} aria-label={item.label} href={href}>
                  <span className={styles.navigationLabel}>{item.label}</span>
                  <span className={styles.navigationDescription}>{item.description}</span>
                </Link>
              ) : (
                <span aria-disabled="true" title={item.unavailableReason ?? "尚未开放"}>
                  <span className={styles.navigationLabel}>{item.label}</span>
                  <span className={styles.navigationDescription}>{item.description}</span>
                  <span className={styles.navigationAvailability}>尚未开放</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function UnifiedAppHeader({
  mode = "auto",
  editorLabel = "编辑工作区",
  onNavigate,
}: UnifiedAppHeaderProps) {
  const pathname = usePathname();
  const clientKey = projectClientKeyFromPath(pathname);
  const resolvedMode: AppHeaderMode = mode === "auto" ? (clientKey ? "project" : "global") : mode;
  const { theme, toggleTheme } = useACSTheme();
  const [utilityMessage, setUtilityMessage] = useState<string | null>(null);
  const brandHref = "/creator";

  function handleNavigate(event: ReactMouseEvent<HTMLAnchorElement>, href: string) {
    onNavigate?.(event, href);
  }

  return (
    <>
      <header className={styles.header} data-mode={resolvedMode}>
        <div className={styles.headerInner}>
          <Link
            aria-label="镜构智能 Creator 首页"
            className={styles.brand}
            href={brandHref}
            onClick={(event) => handleNavigate(event, brandHref)}
          >
            <Image
              alt=""
              className={styles.brandMark}
              height={40}
              priority
              src="/assets/acs/brand/jinggou-mark.webp"
              width={40}
            />
            <span className={styles.brandCopy}>
              <strong>镜构智能</strong>
              <span>{resolvedMode === "editor" ? editorLabel : "AI Cinematic Studio"}</span>
            </span>
          </Link>

          {resolvedMode === "global" ? <GlobalNavigation pathname={pathname} /> : null}
          {resolvedMode === "project" && clientKey ? (
            <ProjectNavigation clientKey={clientKey} pathname={pathname} />
          ) : null}
          {resolvedMode === "editor" ? (
            <div className={styles.editorIdentity} aria-label="当前编辑器">
              <span>EDITOR</span>
              <strong>{editorLabel}</strong>
            </div>
          ) : null}

          <div className={styles.utilities} aria-label="应用工具">
            <button
              aria-label="搜索"
              onClick={() => setUtilityMessage("全局搜索将在可信项目数据接入后开放。")}
              type="button"
            >
              <Image alt="" height={18} src="/assets/workspace-home/icons/utility-search.svg" width={18} />
            </button>
            <button
              aria-label={`切换至${theme === "dark" ? "浅色" : "深色"}模式`}
              onClick={toggleTheme}
              type="button"
            >
              <Image
                alt=""
                height={18}
                src={theme === "dark" ? "/assets/workspace-home/icons/utility-theme-light.svg" : "/assets/workspace-home/icons/utility-theme-dark.svg"}
                width={18}
              />
            </button>
            <button
              aria-label="通知"
              onClick={() => setUtilityMessage("当前没有新的本地演示通知。")}
              type="button"
            >
              <Image alt="" height={18} src="/assets/workspace-home/icons/utility-notification.svg" width={18} />
            </button>
            <button
              aria-label="帮助"
              onClick={() => setUtilityMessage("当前页面使用本地演示数据，不会提交生产内容。")}
              type="button"
            >
              <Image alt="" height={18} src="/assets/workspace-home/icons/utility-help.svg" width={18} />
            </button>
            <button
              aria-label="用户菜单"
              className={styles.avatar}
              onClick={() => setUtilityMessage("本地演示用户未连接正式账户上下文。")}
              type="button"
            >
              <Image alt="" height={18} src="/assets/workspace-home/icons/utility-menu.svg" width={18} />
            </button>
          </div>
        </div>
        <p aria-live="polite" className={styles.utilityStatus}>
          {utilityMessage}
        </p>
      </header>

      {resolvedMode === "global" ? (
        <aside aria-label="本地呈现边界" className={styles.presentationBoundary}>
          <div>
            <strong>本地演示</strong>
            <span>当前界面使用本地演示内容，不代表已连接正式项目、生产状态或资产记录。</span>
          </div>
        </aside>
      ) : null}
    </>
  );
}
