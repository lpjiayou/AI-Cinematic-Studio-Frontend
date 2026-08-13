"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAVIGATION } from "@/lib/navigation";
import styles from "./global-shell.module.css";

function isCurrentDestination(pathname: string, href: string) {
  if (href === "/creator") return pathname === href;

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CreatorNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Creator 全局导航" className={styles.navigation}>
      <ul>
        {PRIMARY_NAVIGATION.map((item) => (
          <li key={item.href}>
            {item.available ? (
              <Link
                aria-current={
                  isCurrentDestination(pathname, item.href) ? "page" : undefined
                }
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-disabled="true" title="尚未开放">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
