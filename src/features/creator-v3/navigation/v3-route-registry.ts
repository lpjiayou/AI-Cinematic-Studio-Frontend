import type {
  GlobalRailDestinationId,
  GlobalRailDestinationView,
  ProjectDestinationView,
} from "@/components";

export const GLOBAL_V3_DESTINATIONS = [
  {
    id: "home",
    label: "首页",
    description: "继续最近工作并查看下一安全动作",
    icon: "首",
    availability: "available",
    href: "/creator",
  },
  {
    id: "projects",
    label: "项目",
    description: "创建、查找并继续制作项目",
    icon: "项",
    availability: "available",
    href: "/creator/projects",
  },
  {
    id: "quick-create",
    label: "快速创作",
    description: "执行一个有边界的图像、视频或音频任务",
    icon: "快",
    availability: "blocked",
    blockedReason: "生成运行时和后续产品界面尚未开放",
    explanationHref: "/creator/create",
  },
  {
    id: "assets",
    label: "资产",
    description: "查看素材、候选、版本、版权与血缘",
    icon: "资",
    availability: "blocked",
    blockedReason: "统一资产库产品面尚未完成",
    explanationHref: "/creator/assets",
  },
  {
    id: "jobs",
    label: "任务",
    description: "查看排队、运行、阻断和失败任务",
    icon: "任",
    availability: "blocked",
    blockedReason: "跨项目任务投影尚未接入",
    explanationHref: "/creator/jobs",
  },
  {
    id: "works",
    label: "作品",
    description: "查看受限交付、Master 和未来发布对象",
    icon: "作",
    availability: "blocked",
    blockedReason: "M15 之后的作品与发布权限尚未开放",
    explanationHref: "/creator/works",
  },
] as const satisfies readonly GlobalRailDestinationView[];

const globalRouteEntries = [
  ["/creator", "home"],
  ["/creator/projects", "projects"],
  ["/creator/create", "quick-create"],
  ["/creator/assets", "assets"],
  ["/creator/jobs", "jobs"],
  ["/creator/works", "works"],
] as const;

const globalRoutes = new Map<string, GlobalRailDestinationId>(globalRouteEntries);

export type CreatorV3Route =
  | {
      kind: "global";
      destinationId: GlobalRailDestinationId;
    }
  | {
      kind: "project-overview";
      destinationId: "projects";
      projectRef: string;
    };

export type CreatorRouteClassification =
  | { shell: "v3"; route: CreatorV3Route }
  | { shell: "legacy" };

export function classifyCreatorRoute(pathname: string): CreatorRouteClassification {
  const globalDestination = globalRoutes.get(pathname);
  if (globalDestination) {
    return {
      shell: "v3",
      route: { kind: "global", destinationId: globalDestination },
    };
  }

  const overviewMatch = /^\/creator\/projects\/([^/]+)\/overview$/.exec(pathname);
  if (!overviewMatch) return { shell: "legacy" };

  try {
    const projectRef = decodeURIComponent(overviewMatch[1]);
    if (!projectRef) return { shell: "legacy" };
    return {
      shell: "v3",
      route: {
        kind: "project-overview",
        destinationId: "projects",
        projectRef,
      },
    };
  } catch {
    return { shell: "legacy" };
  }
}

export function buildProjectV3Destinations(
  projectRef: string,
): readonly ProjectDestinationView[] {
  const encodedProjectRef = encodeURIComponent(projectRef);
  const projectRoot = `/creator/projects/${encodedProjectRef}`;
  const overviewRoot = `${projectRoot}/overview`;

  return [
    {
      id: "overview",
      label: "概览",
      description: "项目状态与下一安全动作",
      availability: "available",
      href: overviewRoot,
    },
    {
      id: "story",
      label: "故事",
      description: "迁移期 Story World 工作区",
      availability: "available",
      href: `${projectRoot}/planning/bible`,
    },
    {
      id: "script",
      label: "剧本",
      description: "迁移期 Script Studio",
      availability: "available",
      href: `${projectRoot}/content/script`,
    },
    {
      id: "characters",
      label: "角色",
      description: "迁移期 Character Studio",
      availability: "available",
      href: `${projectRoot}/planning/characters`,
    },
    {
      id: "storyboard",
      label: "分镜",
      description: "镜头与服务器方法计划",
      availability: "blocked",
      blockedReason: "分镜与服务器方法计划界面将在 Wave 2 实施",
      explanationHref: `${overviewRoot}#destination-storyboard`,
    },
    {
      id: "generation",
      label: "生成",
      description: "Method-aware Generation Studio",
      availability: "blocked",
      blockedReason: "Method-aware Generation Studio 尚未实施",
      explanationHref: `${overviewRoot}#destination-generation`,
    },
    {
      id: "audio",
      label: "音频",
      description: "显式音频需求与运行时",
      availability: "blocked",
      blockedReason: "显式音频需求界面尚未实施，M12 Runtime G0 也未完成",
      explanationHref: `${overviewRoot}#destination-audio`,
    },
    {
      id: "timeline",
      label: "剪辑",
      description: "M13 Timeline Studio",
      availability: "blocked",
      blockedReason: "M13 Timeline Studio 产品界面尚未实施",
      explanationHref: `${overviewRoot}#destination-timeline`,
    },
    {
      id: "review",
      label: "审片",
      description: "迁移期 fail-closed Post 页面",
      availability: "available",
      href: `${projectRoot}/post`,
    },
    {
      id: "delivery",
      label: "交付",
      description: "迁移期 fail-closed Delivery 页面",
      availability: "available",
      href: `${projectRoot}/delivery`,
    },
  ];
}
