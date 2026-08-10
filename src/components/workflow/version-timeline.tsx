import type { HTMLAttributes, ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./workflow.module.css";

export type VersionTimelineItemState = "current" | "complete" | "pending";

export interface VersionTimelineItem {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  state?: VersionTimelineItemState;
}

export interface VersionTimelineProps
  extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
  items: readonly VersionTimelineItem[];
  emptyLabel?: ReactNode;
}

export function VersionTimeline({
  items,
  emptyLabel = "暂无版本",
  className,
  ...props
}: VersionTimelineProps) {
  if (items.length === 0) {
    return <div className={styles.emptyState}>{emptyLabel}</div>;
  }

  return (
    <ol className={mergeClassNames(styles.timeline, className)} {...props}>
      {items.map((item) => (
        <li key={item.id} className={styles.timelineItem} data-state={item.state ?? "pending"}>
          <span className={styles.timelineMarker} aria-hidden="true" />
          <div className={styles.timelineContent}>
            <div className={styles.timelineRow}>
              <strong>{item.label}</strong>
              {item.meta && <span>{item.meta}</span>}
            </div>
            {item.description && <p>{item.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
