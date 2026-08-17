import type { Metadata } from "next";
import Link from "next/link";
import { ACSBadge } from "@/components";
import {
  getLocalProjectPresentation,
  LOCAL_PROJECT_CLIENT_KEYS,
} from "@/features/project-data/project-presentation";
import { projectRoute } from "@/lib/project-navigation";
import { ConnectedProjectBrowser } from "./connected-project-browser";
import styles from "./projects-page.module.css";

export const metadata: Metadata = {
  title: "项目 · 镜构智能",
  description: "管理镜构智能创作项目。",
};

export default function ProjectsPage() {
  return (
    <main className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>PROJECT CENTER</p>
          <h1>项目</h1>
          <p className={styles.description}>
            查找并继续已建立的制作项目，或从新的本地创意方案开始。
          </p>
        </div>
        <Link className={styles.primaryAction} href="/creator/projects/new">
          新建项目
        </Link>
      </header>

      <ConnectedProjectBrowser />

      <section aria-labelledby="local-workspaces-title" className={styles.localWorkspaces}>
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>LOCAL FIXTURES</p>
            <h2 id="local-workspaces-title">可浏览的本地演示工作区</h2>
          </div>
          <p>
            以下入口只用于前端流程审核。它们不是权威项目记录，也不会伪装成已连接的生产数据。
          </p>
        </header>

        <div className={styles.fixtureGrid}>
          {LOCAL_PROJECT_CLIENT_KEYS.map((clientKey) => {
            const project = getLocalProjectPresentation(clientKey);

            return (
              <article className={styles.fixtureCard} key={clientKey}>
                <div className={styles.fixtureHeading}>
                  <div>
                    <span>LOCAL_FIXTURE</span>
                    <h3>{project.display.projectTitle}</h3>
                  </div>
                  <ACSBadge tone="neutral">非权威项目</ACSBadge>
                </div>
                <p>{project.display.worldPremise}</p>
                <dl className={styles.fixtureFacts}>
                  <div>
                    <dt>工作区键</dt>
                    <dd>{clientKey}</dd>
                  </div>
                  <div>
                    <dt>权威引用</dt>
                    <dd>未连接</dd>
                  </div>
                </dl>
                <div className={styles.fixtureActions}>
                  <Link
                    className={styles.primaryAction}
                    href={projectRoute(clientKey, "planning/bible")}
                  >
                    打开故事世界
                  </Link>
                  <Link
                    className={styles.secondaryAction}
                    href={projectRoute(clientKey, "planning/characters")}
                  >
                    打开角色工作室
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="project-boundary-title" className={styles.boundaryPanel}>
        <div>
          <p className={styles.eyebrow}>DATA BOUNDARY</p>
          <h2 id="project-boundary-title">连接后才会出现的能力</h2>
        </div>
        <ul>
          <li>项目名称、类型、阶段与更新时间</li>
          <li>项目成员、权限与协作状态</li>
          <li>可信项目引用、版本和保存回执</li>
        </ul>
      </section>
    </main>
  );
}
