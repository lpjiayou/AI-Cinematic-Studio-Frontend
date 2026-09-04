import type { ReactNode } from "react";
import { ACSBadge } from "@/components/acs";
import { mergeClassNames } from "@/lib/merge-class-names";
import type {
  AuthorityLayerId,
  AuthorityLayerState,
} from "./presentation-types";
import styles from "./authority-status.module.css";

export interface AuthorityLayerView {
  id: AuthorityLayerId;
  label: string;
  state: AuthorityLayerState;
  stateLabel: string;
  message: string;
  owner?: string;
  nextActionLabel?: string;
}

export interface AuthorityStatusProps {
  summary: string;
  layers: readonly AuthorityLayerView[];
  action?: ReactNode;
  evidenceAction?: ReactNode;
  compact?: boolean;
  statusLabel: string;
  className?: string;
}

const requiredLayerIds: readonly AuthorityLayerId[] = [
  "ui",
  "runtime",
  "authority",
  "policy",
];

const recognizedStates = new Set<AuthorityLayerState>([
  "available",
  "blocked",
  "required",
  "denied",
  "unverified",
  "not_open",
  "not_applicable",
]);

function normalizeState(state: AuthorityLayerState): AuthorityLayerState {
  return recognizedStates.has(state) ? state : "unverified";
}

export function AuthorityStatus({
  summary,
  layers,
  action,
  evidenceAction,
  compact = false,
  statusLabel,
  className,
}: AuthorityStatusProps) {
  const byId = new Map<AuthorityLayerId, AuthorityLayerView>();
  for (const layer of layers) {
    if (byId.has(layer.id)) throw new Error(`AuthorityStatus duplicate layer: ${layer.id}`);
    byId.set(layer.id, layer);
  }
  for (const layerId of requiredLayerIds) {
    if (!byId.has(layerId)) throw new Error(`AuthorityStatus missing layer: ${layerId}`);
  }
  if (byId.size !== requiredLayerIds.length) {
    throw new Error("AuthorityStatus requires exactly four layers");
  }

  return (
    <section
      aria-label={statusLabel}
      className={mergeClassNames(styles.status, className)}
      data-compact={compact || undefined}
    >
      <header className={styles.header}>
        <h2>{statusLabel}</h2>
        <p>{summary}</p>
      </header>
      <ul className={styles.layerList} aria-live="polite">
        {requiredLayerIds.map((layerId) => {
          const layer = byId.get(layerId)!;
          const state = normalizeState(layer.state);
          const stateLabel = state === "unverified" ? "状态未验证" : layer.stateLabel;
          return (
            <li key={layer.id} className={styles.layer} data-layer={layer.id} data-state={state}>
              <div className={styles.layerHeading}>
                <strong>{layer.label}</strong>
                <ACSBadge tone={state === "available" ? "primary" : state === "denied" ? "danger" : "warning"}>
                  {stateLabel}
                </ACSBadge>
              </div>
              <p>{layer.message}</p>
              {layer.owner && <span>负责方：{layer.owner}</span>}
              {layer.nextActionLabel && <span>下一动作：{layer.nextActionLabel}</span>}
            </li>
          );
        })}
      </ul>
      {(action || evidenceAction) && (
        <footer className={styles.actions}>{action}{evidenceAction}</footer>
      )}
    </section>
  );
}
