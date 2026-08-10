import type { HTMLAttributes, ReactNode } from "react";
import { mergeClassNames } from "@/lib/merge-class-names";
import styles from "./workflow.module.css";

export type WorkflowStageState = "idle" | "active" | "complete" | "blocked";

export interface WorkflowStage {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  state?: WorkflowStageState;
}

export interface WorkflowMapProps
  extends Omit<HTMLAttributes<HTMLOListElement>, "children"> {
  stages: readonly WorkflowStage[];
  orientation?: "horizontal" | "vertical";
  ariaLabel?: string;
}

export function WorkflowMap({
  stages,
  orientation = "horizontal",
  ariaLabel = "工作流",
  className,
  ...props
}: WorkflowMapProps) {
  return (
    <ol
      aria-label={ariaLabel}
      className={mergeClassNames(styles.workflowMap, className)}
      data-orientation={orientation}
      {...props}
    >
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          className={styles.workflowStage}
          data-state={stage.state ?? "idle"}
        >
          <div className={styles.workflowNode}>
            <span className={styles.workflowIndex} aria-hidden="true">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <div>
              <strong>{stage.label}</strong>
              {stage.description && <p>{stage.description}</p>}
            </div>
          </div>
          {index < stages.length - 1 && <span className={styles.workflowConnector} aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
