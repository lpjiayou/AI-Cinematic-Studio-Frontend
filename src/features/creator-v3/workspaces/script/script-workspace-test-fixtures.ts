import type { CreatorProject, CreatorSeries, CreatorScriptVersion, ScriptWorkspaceEnvelope } from "@/features/core-integration";

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

export function scriptFixture(projectRef = "project-a", episodeRef = "episode-a") {
  const seriesRef = `series-${projectRef}`;
  const project: CreatorProject = {
    schemaVersion: "creator.project.v1", projectRef, projectType: "SERIES", title: projectRef,
    description: "test", targetPlatform: "Streaming", aspectRatio: "16:9", defaultDurationSec: 60,
    plannedEpisodeCount: 2, status: "ACTIVE", seriesRefs: [seriesRef],
    createdAt: "2026-09-05T00:00:00Z", updatedAt: "2026-09-05T00:00:00Z", version: 1,
  };
  const episodes = [episodeRef, `${episodeRef}-next`].map((ref, index) => ({
    schemaVersion: "creator.episode.v1", seriesRef, episodeRef: ref, episodeNumber: index + 1,
    seasonNumber: 1, volumeNumber: 1, title: ref, status: "ACTIVE", canonicalProjectRef: projectRef,
    creativePlanRef: "confirmed-plan", createdAt: project.createdAt, updatedAt: project.updatedAt, version: 1,
  }));
  const series: CreatorSeries = {
    schemaVersion: "creator.series.v1", seriesRef, title: seriesRef, description: "test", status: "ACTIVE",
    plannedEpisodeCount: 2, episodes, createdAt: project.createdAt, updatedAt: project.updatedAt, version: 1,
  };
  function version(synopsis = "A", number = 1): CreatorScriptVersion {
    return {
      scriptRef: `script-${episodeRef}`, scriptVersionRef: `version-${episodeRef}-${number}`,
      versionNumber: number, title: "测试剧本", logline: "测试梗概", synopsis, targetDurationSec: 60,
      scenes: [], changeKind: number === 1 ? "GENERATED" : "MANUAL", createdAt: project.createdAt,
    };
  }
  function workspace(synopsis = "A", number = 1): ScriptWorkspaceEnvelope["workspace"] {
    const latest = version(synopsis, number);
    return { bootstrap: {}, script: { scriptRef: latest.scriptRef, title: latest.title,
      currentScriptVersionRef: latest.scriptVersionRef, confirmedScriptVersionRef: null, version: number },
    versions: [latest] };
  }
  return { project, series, version, workspace };
}
