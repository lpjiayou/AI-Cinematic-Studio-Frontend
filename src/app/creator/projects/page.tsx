import type { Metadata } from "next";
import Link from "next/link";
import styles from "./projects-page.module.css";

export const metadata: Metadata = {
  title: "项目 · 镜构智能",
  description: "管理镜构智能创作项目。",
};

export default function ProjectsPage() {
  return (
    <main className={styles.main}>
      <section aria-labelledby="projects-title" className={styles.panel}>
        <p className={styles.eyebrow}>PROJECT CENTER</p>
        <h1 id="projects-title">项目</h1>
        <p className={styles.description}>
          当前尚未连接权威项目数据。项目列表将在可信数据契约接入后显示，
          此处不会根据名称、示例或路由推断项目身份。
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/creator/projects/new">
            新建项目
          </Link>
          <span className={styles.status}>项目上下文未连接</span>
        </div>
      </section>
    </main>
  );
}
