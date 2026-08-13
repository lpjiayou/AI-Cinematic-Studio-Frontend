import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PRIMARY_NAVIGATION } from "@/lib/navigation";
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

          <nav aria-label="Creator 全局导航" className={styles.navigation}>
            <ul>
              {PRIMARY_NAVIGATION.map((item) => (
                <li key={item.href}>
                  {item.available ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    <span aria-disabled="true" title="尚未开放">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
