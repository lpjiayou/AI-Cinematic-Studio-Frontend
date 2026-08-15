export const PROJECT_NAVIGATION = [
  {
    label: "概览",
    segment: "overview",
    hrefSuffix: "overview",
    available: false,
    unavailableReason: "项目概览页面尚未实施",
  },
  {
    label: "策划",
    segment: "planning",
    hrefSuffix: "planning/bible",
    available: true,
    unavailableReason: null,
  },
  {
    label: "内容",
    segment: "episodes",
    hrefSuffix: "episodes",
    available: false,
    unavailableReason: "内容页面尚未实施",
  },
  {
    label: "制作",
    segment: "production",
    hrefSuffix: "production",
    available: false,
    unavailableReason: "制作能力将在 M8+ 开放",
  },
  {
    label: "后期",
    segment: "post",
    hrefSuffix: "post",
    available: false,
    unavailableReason: "后期能力尚未开放",
  },
  {
    label: "交付",
    segment: "delivery",
    hrefSuffix: "delivery",
    available: false,
    unavailableReason: "交付能力尚未开放",
  },
] as const;

export const PLANNING_NAVIGATION = [
  { label: "AI 导演", segment: "director", available: false },
  { label: "系列规划", segment: "series", available: false },
  { label: "故事世界", segment: "bible", available: true },
  { label: "角色工作室", segment: "characters", available: true },
  { label: "连续性", segment: "continuity", available: false },
] as const;

export function projectRoute(clientKey: string, suffix: string) {
  return `/creator/projects/${encodeURIComponent(clientKey)}/${suffix}`;
}

