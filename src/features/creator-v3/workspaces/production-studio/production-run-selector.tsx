import type { CreatorEpisodeProductionRun } from "@/features/core-integration";
import styles from "./production-studio.module.css";

export function ProductionRunSelector({
  runs,
  selectedRunRef,
  onSelect,
  onRefresh,
  disabled = false,
}: {
  runs: CreatorEpisodeProductionRun[];
  selectedRunRef: string;
  onSelect: (runRef: string) => void;
  onRefresh: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.runSelector}>
      <label htmlFor="production-workspace-run">单集制作记录</label>
      <select
        id="production-workspace-run"
        value={selectedRunRef}
        onChange={event => onSelect(event.target.value)}
        disabled={disabled || runs.length === 0}
      >
        {runs.length === 0 && <option value="">暂无制作记录</option>}
        {runs.map(run => (
          <option key={run.productionRunRef} value={run.productionRunRef}>
            {run.episodeRef} · {run.state}
          </option>
        ))}
      </select>
      <button type="button" onClick={onRefresh} disabled={disabled}>刷新 Core 数据</button>
    </div>
  );
}
