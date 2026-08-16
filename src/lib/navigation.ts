export const PRIMARY_NAVIGATION = [
  {
    label: "首页",
    description: "任务入口与能力边界",
    href: "/creator",
    available: true,
    unavailableReason: null,
  },
  {
    label: "AI导演",
    description: "创意检查与导演简报",
    href: "/creator/ai-director",
    available: true,
    unavailableReason: null,
  },
  {
    label: "项目",
    description: "项目入口与连接状态",
    href: "/creator/projects",
    available: true,
    unavailableReason: null,
  },
  {
    label: "资产库",
    description: "素材、版权与版本",
    href: "/creator/assets",
    available: false,
    unavailableReason: "资产库尚未接入可信资产数据",
  },
  {
    label: "创作中心",
    description: "图像、视频与音频生成",
    href: "/creator/create",
    available: false,
    unavailableReason: "生成能力尚未连接真实 Provider",
  },
  {
    label: "作品",
    description: "成片、发布与交付",
    href: "/creator/works",
    available: false,
    unavailableReason: "作品与交付能力尚未开放",
  },
] as const;
