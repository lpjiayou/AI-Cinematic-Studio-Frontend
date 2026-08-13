import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreatorNavigation } from "./creator-navigation";
import styles from "./global-shell.module.css";

interface CreatorLayoutProps {
  children: ReactNode;
}

export default function CreatorLayout({ children }: CreatorLayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            aria-label="镜构智能 Creator 首页"
            className={styles.brand}
            href="/creator"
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
              <span>AI Cinematic Studio</span>
            </span>
          </Link>

          <CreatorNavigation />
        </div>
      </header>

      <aside aria-label="本地呈现边界" className={styles.presentationBoundary}>
        <div>
          <strong>本地演示</strong>
          <span>
            当前 Creator 界面使用本地演示内容验证布局与交互，不代表已连接正式项目、生产状态或资产记录。
          </span>
        </div>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
