"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { PRIMARY_NAVIGATION } from "@/lib/navigation";
import { PROJECT_NAVIGATION, projectRoute } from "@/lib/project-navigation";
import { useCreatorIntegration } from "@/features/core-integration";
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
  const { state: coreState } = useCreatorIntegration();
  const [utilityMessage, setUtilityMessage] = useState<string | null>(null);
  const brandHref = "/creator";
  const capabilitySummary =
    coreState.status === "connected"
      ? coreState.capabilities.reduce(
          (summary, capability) => {
            summary[capability.state] += 1;
            return summary;
          },
          {
            available: 0,
            local_evidence_only: 0,
            production_policy_required: 0,
            authority_required: 0,
            not_open: 0,
          },
        )
      : null;

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
              onClick={() => setUtilityMessage("全局搜索尚未开放；当前不会返回本地伪造结果。")}
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
              onClick={() => setUtilityMessage("通知服务尚未接入，当前不显示推断通知。")}
              type="button"
            >
              <Image alt="" height={18} src="/assets/workspace-home/icons/utility-notification.svg" width={18} />
            </button>
            <button
              aria-label="帮助"
              onClick={() =>
                setUtilityMessage(
                  coreState.status === "connected"
                    ? "Creator Public API 已连接；页面会分别标注 Core 数据、权限阻断与 LOCAL_FIXTURE。"
                    : "Creator Core 未连接；权威数据不会由 LOCAL_FIXTURE 自动替代。",
                )
              }
              type="button"
            >
              <Image alt="" height={18} src="/assets/workspace-home/icons/utility-help.svg" width={18} />
            </button>
            <button
              aria-label="用户菜单"
              className={styles.avatar}
              onClick={() => setUtilityMessage("账户、团队与配额身份尚未接入；工作区范围由服务端配置注入。")}
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
        <aside
          aria-label="Creator 数据连接"
          className={styles.presentationBoundary}
          data-status={coreState.status}
        >
          <div>
            <strong>
              {coreState.status === "connected"
                ? "Core 已连接"
                : coreState.status === "loading"
                  ? "正在连接 Core"
                  : "Core 未连接"}
            </strong>
            <span>
              {coreState.status === "connected"
                ? `${capabilitySummary?.available ?? 0} 项已开放，${capabilitySummary?.local_evidence_only ?? 0} 项仅有本地证据，${capabilitySummary?.production_policy_required ?? 0} 项等待生产策略或外部执行，${capabilitySummary?.authority_required ?? 0} 项等待外部权限，${capabilitySummary?.not_open ?? 0} 项尚未开放。`
                : coreState.status === "loading"
                  ? "正在核对公共 API 与 M1–M19 能力合同。"
                  : "权威数据不会被本地演示替代；可在项目中心单独打开明确标注的 LOCAL_FIXTURE。"}
            </span>
          </div>
        </aside>
      ) : null}
    </>
  );
}
