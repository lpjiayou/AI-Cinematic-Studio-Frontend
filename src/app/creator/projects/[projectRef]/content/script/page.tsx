import type { Metadata } from "next";
import Link from "next/link";
import { LOCAL_PROJECT_CLIENT_KEYS } from "@/features/project-data";
import { ConnectedScriptStudio } from "./connected-script-studio";
import styles from "./script-workspace.module.css";

export const metadata: Metadata = {
  title: "剧本工作区 · 镜构智能",
  description: "在真实项目与集数范围内生成、修订并确认剧本版本。",
};

export default async function ProjectScriptRoute({
  params,
}: {
  params: Promise<{ projectRef: string }>;
}) {
  const { projectRef } = await params;
  const local = new Set<string>(LOCAL_PROJECT_CLIENT_KEYS).has(projectRef);
  if (local) {
    return (
      <main className={styles.statePage}>
        <div className={styles.stateCard}>
          <h1>这是本地演示项目</h1>
          <p>本地样例不具备 Core 的 Series、Episode 或 Script 身份。可以打开独立演示编辑器，但它不会写入权威项目。</p>
          <Link className={styles.textLink} href="/script-studio">打开本地剧本演示</Link>
        </div>
      </main>
    );
  }
  return <ConnectedScriptStudio projectRef={projectRef} />;
}
