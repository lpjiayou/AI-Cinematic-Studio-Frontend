import type { Metadata } from "next";
import Link from "next/link";
import { ACSBadge } from "@/components";
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

      <section aria-label="项目浏览器" className={styles.browser}>
        <aside aria-labelledby="project-source-title" className={styles.sourcePanel}>
          <div className={styles.panelHeading}>
            <h2 id="project-source-title">项目数据源</h2>
            <ACSBadge tone="neutral">未连接</ACSBadge>
          </div>
          <p>
            当前前端没有收到权威项目集合，因此不会按示例名称、动态路由或本地预览推断项目身份。
          </p>
          <dl className={styles.sourceFacts}>
            <div>
              <dt>可显示项目</dt>
              <dd>不可确定</dd>
            </div>
            <div>
              <dt>排序与筛选</dt>
              <dd>等待数据</dd>
            </div>
            <div>
              <dt>项目保存</dt>
              <dd>尚未连接</dd>
            </div>
          </dl>
        </aside>

        <section aria-labelledby="project-empty-title" className={styles.emptyState}>
          <span className={styles.emptyMarker} aria-hidden="true" />
          <p className={styles.emptyEyebrow}>NO AUTHORITATIVE COLLECTION</p>
          <h2 id="project-empty-title">还没有可显示的权威项目</h2>
          <p>
            这不代表项目数量为零，只表示项目集合尚未接入。你可以建立本地创意方案，但系统不会声称它已经保存为正式项目。
          </p>
          <div className={styles.emptyActions}>
            <Link className={styles.primaryAction} href="/creator/projects/new">
              建立本地创意方案
            </Link>
            <Link className={styles.secondaryAction} href="/creator">
              返回创作入口
            </Link>
          </div>
        </section>
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
