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
    description: "分集、故事与剧本",
    segment: "episodes",
    hrefSuffix: "episodes",
    available: false,
    unavailableReason: "内容页面尚未实施",
  },
  {
    label: "制作",
    description: "分镜、镜头与场景",
    segment: "production",
    hrefSuffix: "production",
    available: false,
    unavailableReason: "制作能力将在 M8+ 开放",
  },
  {
    label: "后期",
    description: "时间线、预览与质检",
    segment: "post",
    hrefSuffix: "post",
    available: false,
    unavailableReason: "后期能力尚未开放",
  },
  {
    label: "交付",
    description: "母版、导出与发布",
    segment: "delivery",
    hrefSuffix: "delivery",
    available: false,
    unavailableReason: "交付能力尚未开放",
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
