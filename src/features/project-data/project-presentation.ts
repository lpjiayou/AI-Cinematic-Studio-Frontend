export type DataOrigin = "LOCAL_FIXTURE";

export type NullableAuthoritativeRefs = {
  projectRef: string | null;
  seriesRef: string | null;
  episodeRef: string | null;
};

export type EpisodePlanItemOption = {
  clientKey: string;
  episodePlanItemRef: string | null;
  label: string;
  order: number;
};

export type SeriesBibleCatalogItem = {
  clientKey: string;
  authoritativeRef: string | null;
  label: string;
  description: string;
};

export type CharacterStateCategory = "Location" | "Health" | "Appearance" | "PrimaryGoal";

export type CharacterStateIntervalViewModel = {
  clientKey: string;
  intervalRef: string | null;
  characterRef: string | null;
  category: CharacterStateCategory;
  startPlanItemClientKey: string;
  endPlanItemClientKey: string | null;
  valueRef: string | null;
  annotation: string;
  continuityNotes: readonly string[];
};

export type CharacterRelationshipViewModel = {
  clientKey: string;
  relationshipRef: string | null;
  fromCharacterRef: string | null;
  toCharacterRef: string | null;
  sourceLabel: string;
  targetLabel: string;
  relationType: string;
  startPlanItemClientKey: string;
  endPlanItemClientKey: string | null;
};

export type ProjectPresentationViewModel = {
  clientKey: string;
  dataOrigin: DataOrigin;
  authoritative: false;
  refs: NullableAuthoritativeRefs;
  display: {
    projectTitle: string;
    worldTitle: string;
    worldPremise: string;
    characterName: string;
    characterRole: string;
  };
  storyWorld: {
    planItems: readonly EpisodePlanItemOption[];
    glossaryTerms: readonly SeriesBibleCatalogItem[];
    locations: readonly SeriesBibleCatalogItem[];
    props: readonly SeriesBibleCatalogItem[];
    timelineEvents: readonly SeriesBibleCatalogItem[];
    prohibitedNarrativePatterns: readonly SeriesBibleCatalogItem[];
  };
  characterStudio: {
    characterClientKey: string;
    characterRef: string | null;
    stateIntervals: readonly CharacterStateIntervalViewModel[];
    relationships: readonly CharacterRelationshipViewModel[];
    locationRefs: readonly string[];
    propRefs: readonly string[];
    timelineEventRefs: readonly string[];
  };
};

const futureCity: ProjectPresentationViewModel = {
  clientKey: "future-city",
  dataOrigin: "LOCAL_FIXTURE",
  authoritative: false,
  refs: { projectRef: null, seriesRef: null, episodeRef: null },
  display: {
    projectTitle: "未来之城",
    worldTitle: "未来之城",
    worldPremise:
      "2148 年，人类与 AI 共同生活在一座由记忆信用驱动的城市中。记忆既是身份凭证，也是权力来源；当一段无人认领的记忆出现，城市关于真实、归属与自由的秩序开始松动。",
    characterName: "林澈",
    characterRole: "记忆档案修复师 · 故事主角",
  },
  storyWorld: {
    planItems: [
      { clientKey: "future-city-plan-01", episodePlanItemRef: null, label: "第 01 集 · 异常影像", order: 1 },
      { clientKey: "future-city-plan-02", episodePlanItemRef: null, label: "第 02 集 · 外环见证", order: 2 },
      { clientKey: "future-city-plan-03", episodePlanItemRef: null, label: "第 03 集 · 档案裂缝", order: 3 },
      { clientKey: "future-city-plan-04", episodePlanItemRef: null, label: "第 04 集 · 记忆议会", order: 4 },
    ],
    glossaryTerms: [
      { clientKey: "term-memory-credit", authoritativeRef: null, label: "记忆信用", description: "以可验证记忆决定身份与公共权限的城市制度。" },
      { clientKey: "term-inherited-memory", authoritativeRef: null, label: "继承记忆", description: "由他人见证或移交、并非本人亲历的记忆。" },
    ],
    locations: [
      { clientKey: "location-memory-archive", authoritativeRef: null, label: "中央记忆档案城", description: "保存城市共同记忆的核心建筑群。" },
      { clientKey: "location-outer-market", authoritativeRef: null, label: "外环记忆集市", description: "未经认证的故事与旧媒介流通地。" },
    ],
    props: [
      { clientKey: "prop-memory-disc", authoritativeRef: null, label: "修复记忆盘", description: "林澈用于读取受损模拟记忆的工具。" },
      { clientKey: "prop-archive-lamp", authoritativeRef: null, label: "暖光档案灯", description: "苏弥交付、用于验证实体档案纹理。" },
    ],
    timelineEvents: [
      { clientKey: "event-memory-credit", authoritativeRef: null, label: "记忆信用系统启用", description: "城市身份秩序重构。" },
      { clientKey: "event-outer-ring", authoritativeRef: null, label: "外环记忆断层", description: "共同历史断裂并催生地下网络。" },
    ],
    prohibitedNarrativePatterns: [
      { clientKey: "pattern-memory-fixes-all", authoritativeRef: null, label: "记忆恢复即解决一切", description: "禁止把恢复记录等同于恢复完整身份。" },
      { clientKey: "pattern-ai-monolith", authoritativeRef: null, label: "AI 阵营单一化", description: "禁止把 AI 写成没有内部差异的统一群体。" },
    ],
  },
  characterStudio: {
    characterClientKey: "character-lin-che",
    characterRef: null,
    stateIntervals: [
      {
        clientKey: "state-lin-che-appearance-01",
        intervalRef: null,
        characterRef: null,
        category: "Appearance",
        startPlanItemClientKey: "future-city-plan-01",
        endPlanItemClientKey: "future-city-plan-03",
        valueRef: null,
        annotation: "右袖在异常修复后保留银灰粉尘；其余主轮廓不变。",
        continuityNotes: ["开始含第 01 集，结束不含第 03 集。"],
      },
      {
        clientKey: "state-lin-che-goal-01",
        intervalRef: null,
        characterRef: null,
        category: "PrimaryGoal",
        startPlanItemClientKey: "future-city-plan-01",
        endPlanItemClientKey: null,
        valueRef: null,
        annotation: "在议会封存前确认异常影像的来源。",
        continuityNotes: ["未设置结束项，表示开放区间。"],
      },
    ],
    relationships: [
      {
        clientKey: "relationship-lin-che-gu-yan",
        relationshipRef: null,
        fromCharacterRef: null,
        toCharacterRef: null,
        sourceLabel: "林澈",
        targetLabel: "顾言",
        relationType: "疏离的旧搭档",
        startPlanItemClientKey: "future-city-plan-01",
        endPlanItemClientKey: null,
      },
    ],
    locationRefs: [],
    propRefs: [],
    timelineEventRefs: [],
  },
};

const amberArchive: ProjectPresentationViewModel = {
  ...futureCity,
  clientKey: "amber-archive",
  display: {
    projectTitle: "琥珀档案",
    worldTitle: "琥珀档案",
    worldPremise:
      "一座潮汐城市把居民的梦封存在琥珀胶片中；当旧城区开始同步做同一个梦，档案员必须判断这是一场灾难还是共同记忆的诞生。",
    characterName: "沈砚",
    characterRole: "潮汐档案员 · 故事主角",
  },
  storyWorld: {
    ...futureCity.storyWorld,
    planItems: futureCity.storyWorld.planItems.map((item) => ({
      ...item,
      clientKey: item.clientKey.replace("future-city", "amber-archive"),
    })),
    glossaryTerms: [
      { clientKey: "term-amber-film", authoritativeRef: null, label: "琥珀胶片", description: "保存梦境片段的潮汐感光介质。" },
    ],
  },
  characterStudio: {
    ...futureCity.characterStudio,
    characterClientKey: "character-shen-yan",
    stateIntervals: [],
    relationships: [],
  },
};

const unavailableProject: ProjectPresentationViewModel = {
  ...futureCity,
  clientKey: "unavailable-project",
  display: {
    projectTitle: "未连接项目",
    worldTitle: "未连接世界",
    worldPremise: "当前路由没有对应的本地演示数据。请选择已登记的本地项目后继续。",
    characterName: "未连接角色",
    characterRole: "等待可信上下文",
  },
  storyWorld: { ...futureCity.storyWorld, planItems: [], glossaryTerms: [], locations: [], props: [], timelineEvents: [], prohibitedNarrativePatterns: [] },
  characterStudio: { ...futureCity.characterStudio, characterClientKey: "unavailable-character", stateIntervals: [], relationships: [] },
};

const localProjects: Readonly<Record<string, ProjectPresentationViewModel>> = {
  [futureCity.clientKey]: futureCity,
  [amberArchive.clientKey]: amberArchive,
};

export function getLocalProjectPresentation(clientKey: string): ProjectPresentationViewModel {
  return localProjects[clientKey] ?? { ...unavailableProject, clientKey };
}

export const LOCAL_PROJECT_CLIENT_KEYS = Object.freeze(Object.keys(localProjects));

export function findStateIntervalOverlaps(
  intervals: readonly CharacterStateIntervalViewModel[],
  planItems: readonly EpisodePlanItemOption[],
) {
  const orderByKey = new Map(planItems.map((item) => [item.clientKey, item.order]));
  const conflicts = new Set<string>();

  for (let index = 0; index < intervals.length; index += 1) {
    const current = intervals[index];
    const currentStart = orderByKey.get(current.startPlanItemClientKey);
    const currentEnd = current.endPlanItemClientKey
      ? orderByKey.get(current.endPlanItemClientKey)
      : Number.POSITIVE_INFINITY;
    if (currentStart === undefined || currentEnd === undefined || currentStart >= currentEnd) {
      conflicts.add(current.clientKey);
      continue;
    }

    for (let otherIndex = index + 1; otherIndex < intervals.length; otherIndex += 1) {
      const other = intervals[otherIndex];
      if (other.category !== current.category || other.characterRef !== current.characterRef) continue;
      const otherStart = orderByKey.get(other.startPlanItemClientKey);
      const otherEnd = other.endPlanItemClientKey
        ? orderByKey.get(other.endPlanItemClientKey)
        : Number.POSITIVE_INFINITY;
      if (otherStart === undefined || otherEnd === undefined) continue;
      if (currentStart < otherEnd && otherStart < currentEnd) {
        conflicts.add(current.clientKey);
        conflicts.add(other.clientKey);
      }
    }
  }

  return [...conflicts];
}

