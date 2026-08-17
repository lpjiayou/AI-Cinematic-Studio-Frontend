export const PROJECT_NAVIGATION = [
  {
    label: "概览",
    description: "状态与下一动作",
    segment: "overview",
    hrefSuffix: "overview",
    available: false,
    unavailableReason: "项目概览页面尚未实施",
  },
  {
    label: "策划",
    description: "导演、世界与角色",
    segment: "planning",
    hrefSuffix: "planning/bible",
    available: true,
    unavailableReason: null,
  },
  {
    label: "内容",
    description: "分集与剧本工作区",
    segment: "content",
    hrefSuffix: "content/script",
    available: true,
    unavailableReason: null,
  },
  {
    label: "制作",
    description: "镜头、资产与媒体任务",
    segment: "production",
    hrefSuffix: "production",
    available: true,
    unavailableReason: null,
  },
  {
    label: "后期",
    description: "预览、质检与人工审批",
    segment: "post",
    hrefSuffix: "post",
    available: true,
    unavailableReason: null,
  },
  {
    label: "交付",
    description: "母版、本地导出与证据",
    segment: "delivery",
    hrefSuffix: "delivery",
    available: true,
    unavailableReason: null,
  },
] as const;

export const PLANNING_NAVIGATION = [
  {
    label: "AI 导演",
    description: "创意方向与导演简报",
    segment: "director",
    available: false,
    unavailableReason: "项目内 AI 导演页面尚未实施",
  },
  {
    label: "系列规划",
    description: "系列结构与分集规划",
    segment: "series",
    available: false,
    unavailableReason: "系列规划页面尚未实施",
  },
  {
    label: "故事世界",
    description: "规则、地点与视觉语言",
    segment: "bible",
    available: true,
    unavailableReason: null,
  },
  {
    label: "角色工作室",
    description: "身份、外观与连续性",
    segment: "characters",
    available: true,
    unavailableReason: null,
  },
  {
    label: "连续性",
    description: "跨场景事实与冲突检查",
    segment: "continuity",
    available: false,
    unavailableReason: "连续性页面尚未实施",
  },
] as const;

export function projectRoute(clientKey: string, suffix: string) {
  return `/creator/projects/${encodeURIComponent(clientKey)}/${suffix}`;
}
