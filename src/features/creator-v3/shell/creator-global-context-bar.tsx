import type { ReactNode } from "react";
import styles from "./creator-global-context-bar.module.css";

export type CreatorGlobalConnectionState =
  | "connected"
  | "loading"
  | "disconnected"
  | "error";

export interface CreatorGlobalContextBarProps {
  title: string;
  description: string;
  connectionState: CreatorGlobalConnectionState;
  navigationTrigger: ReactNode;
  evidenceTrigger: ReactNode;
  jobTrigger: ReactNode;
  themeTrigger: ReactNode;
  actions?: ReactNode;
}

const connectionMessages: Record<CreatorGlobalConnectionState, string> = {
  connected: "Creator Core 已连接",
  loading: "正在核对 Creator Core",
  disconnected: "Creator Core 当前未连接",
  error: "Creator Core 状态无法确认",
};

export function CreatorGlobalContextBar({
  title,
  description,
  connectionState,
  navigationTrigger,
  evidenceTrigger,
  jobTrigger,
  themeTrigger,
  actions,
}: CreatorGlobalContextBarProps) {
  return (
    <section
      aria-label={`${title}上下文`}
      className={styles.contextBar}
      data-connection-state={connectionState}
      data-wave-context-bar="true"
    >
      <div className={styles.identity}>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <p className={styles.connection} aria-live="polite">
        {connectionMessages[connectionState]}
      </p>
      <div className={styles.triggers} aria-label="全局工作台操作">
        {navigationTrigger}
        {evidenceTrigger}
        {jobTrigger}
      </div>
      <div className={styles.actions}>
        {actions}
        {themeTrigger}
      </div>
    </section>
  );
}
