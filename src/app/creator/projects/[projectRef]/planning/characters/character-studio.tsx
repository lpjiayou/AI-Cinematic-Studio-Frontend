"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ACSBadge,
  ACSButton,
  ACSCard,
  ACSDrawer,
  ACSModal,
  AIAssistantPanel,
  AICandidateCard,
  AIThinkingState,
} from "@/components";
import {
  findStateIntervalOverlaps,
  useProjectPresentation,
  type EpisodePlanItemOption,
} from "@/features/project-data";
import { CustomerLayout, WorkspaceLayout } from "@/layouts";
import styles from "./character-studio.module.css";

export type CharacterStudioPageState =
  | "empty"
  | "editing"
  | "preview-ready"
  | "consistency-preview-ready"
  | "confirmed-preview"
  | "stale-preview"
  | "local-error"
  | "next-route-unavailable";

export type CharacterContextStatus =
  | "等待设计"
  | "设计中"
  | "预览完成"
  | "本地确认"
  | "预览已过期";

export type CharacterContext = {
  characterName: string;
  roleLabel: string;
  stageLabel: "角色设计";
  statusLabel: CharacterContextStatus;
  seriesTitle: string;
  worldContextLabel: string;
};

export type IdentityPreview = {
  background: string;
  motivation: string;
  belief: string;
  conflict: string;
  goal: string;
  forbiddenBehaviors: readonly string[];
  continuityNotes: readonly string[];
};

export type PersonalityPreview = {
  traits: readonly string[];
  behaviorRules: readonly string[];
  speechStyle: string;
  emotionalPattern: string;
  dialogueRules: readonly string[];
};

export type CharacterAssetKind = "main" | "face" | "costume" | "props";

export type CharacterAssetPreview = {
  id: string;
  kind: CharacterAssetKind;
  src: string;
  alt: string;
  label: string;
  selected: boolean;
};

export type AppearancePreview = {
  faceDirection: string;
  hairDirection: string;
  costumeDirection: string;
  bodyDirection: string;
  propsDirection: string;
  assets: readonly CharacterAssetPreview[];
};

export type CharacterNode = {
  id: string;
  name: string;
  roleLabel: string;
  isPrimary: boolean;
};

export type CharacterRelation = {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  emotionalDirection: string;
  description: string;
  continuityNotes: readonly string[];
};

export type CharacterStatePreview = {
  arcStage: string;
  effectiveEpisodeLabel: string;
  personalityDelta: string;
  relationshipDelta: string;
  appearanceNotes: string;
  continuityNotes: readonly string[];
};

export type VisualConsistencyPreview = {
  status: "empty" | "ready" | "stale";
  mainAssetId: string | null;
  referenceAssetIds: readonly string[];
  paletteLabel: string;
  styleLabel: string;
  identityRules: readonly string[];
  consistencyNotes: readonly string[];
};

export type CharacterPreview = {
  name: string;
  role: string;
  summary: string;
  identity: IdentityPreview;
  appearance: AppearancePreview;
  personality: PersonalityPreview;
  state: CharacterStatePreview;
  nodes: readonly CharacterNode[];
  relationships: readonly CharacterRelation[];
  visualConsistency: VisualConsistencyPreview;
};

export type IdentityField =
  | "background"
  | "motivation"
  | "belief"
  | "conflict"
  | "goal";

export type CharacterUpdatePayload =
  | { area: "identity"; field: IdentityField; value: string }
  | { area: "personality"; field: "speechStyle"; value: string }
  | { area: "personality"; field: "emotionalPattern"; value: string }
  | { area: "appearance"; field: "faceDirection"; value: string }
  | { area: "appearance"; field: "hairDirection"; value: string }
  | { area: "appearance"; field: "costumeDirection"; value: string }
  | { area: "appearance"; field: "bodyDirection"; value: string }
  | { area: "appearance"; field: "propsDirection"; value: string };

export type CharacterWorkspaceArea =
  | "IDENTITY"
  | "APPEARANCE"
  | "PERSONALITY"
  | "RELATIONSHIP"
  | "CONTINUITY"
  | "CONSISTENCY";

export type CharacterDesignCandidate = {
  id: string;
  field: IdentityField;
  label: string;
  value: string;
  rationale: string;
};

type CharacterCandidateTask = {
  id: string;
  area: "IDENTITY";
  field: IdentityField;
  revision: number;
  status: "results";
};

export type CharacterReferenceSelection = {
  assetId: string;
  state: "current" | "candidate" | "adopted-local";
};

export type CharacterAssistantInsight = {
  context: CharacterWorkspaceArea;
  analysis: string;
  potentialConflict: string;
  candidateSuggestion: string;
  worldAlignmentHint: string;
  continuityWarning: string;
  nextAction: string;
};

export type CharacterStudioWorkspaceProps = {
  context: CharacterContext;
  character: CharacterPreview;
  pageState: CharacterStudioPageState;
  onUpdate: (payload: CharacterUpdatePayload) => void;
  onSelectAsset: (assetId: string) => void;
  onAdoptAsset?: (assetId: string) => void;
  onSelectCharacterNode: (nodeId: string) => void;
  onSelectRelationship: (relationId: string) => void;
  onRebuildPreview: () => void;
  onConfirmPreview: () => void;
};

export type CharacterContextBarProps = {
  context: CharacterContext;
};

export type CharacterOverviewCardProps = {
  character: Pick<CharacterPreview, "name" | "role" | "summary">;
  mainVisual: CharacterAssetPreview;
  statusLabel: CharacterContextStatus;
  arcStage?: Pick<CharacterStatePreview, "arcStage" | "effectiveEpisodeLabel">;
  readOnly?: boolean;
};

export type IdentityCanvasProps = {
  value: IdentityPreview;
  disabled?: boolean;
  candidates?: readonly CharacterDesignCandidate[];
  activeField?: IdentityField;
  selectedCandidateId?: string | null;
  adoptedCandidateId?: string | null;
  candidateSurface?: "inline" | "external";
  onActiveFieldChange?: (field: IdentityField) => void;
  onSelectCandidate?: (candidateId: string) => void;
  onAdoptCandidate?: (candidateId: string) => void;
  onGenerateCandidates?: () => void;
  onReturnCurrent?: () => void;
  onChange: (
    payload: Extract<CharacterUpdatePayload, { area: "identity" }>,
  ) => void;
};

export type AppearanceBoardProps = {
  value: AppearancePreview;
  activeAssetId: string | null;
  adoptedAssetId?: string | null;
  disabled?: boolean;
  onChange: (
    payload: Extract<CharacterUpdatePayload, { area: "appearance" }>,
  ) => void;
  onSelectAsset: (assetId: string) => void;
  onAdoptAsset?: (assetId: string) => void;
  onOpenViewer: (assetId: string) => void;
};

export type PersonalityCardProps = {
  value: PersonalityPreview;
  disabled?: boolean;
  onChange: (
    payload: Extract<CharacterUpdatePayload, { area: "personality" }>,
  ) => void;
};

export type CharacterStateCardProps = {
  state: CharacterStatePreview;
  readOnly?: boolean;
};

export type RelationshipGraphProps = {
  nodes: readonly CharacterNode[];
  relations: readonly CharacterRelation[];
  selectedNodeId: string | null;
  selectedRelationId: string | null;
  onSelectNode: (nodeId: string) => void;
  onSelectRelation: (relationId: string) => void;
};

export type VisualConsistencyPanelProps = {
  preview: VisualConsistencyPreview;
  assets: readonly CharacterAssetPreview[];
  activeAssetId?: string | null;
  onOpenAsset: (assetId: string) => void;
  onRebuild?: () => void;
  onAdoptDirection?: () => void;
};

export type CharacterAssetViewerProps = {
  open: boolean;
  assets: readonly CharacterAssetPreview[];
  activeAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
  onClose: () => void;
};

export type AICharacterAssistantPanelProps = {
  status: "empty" | "thinking" | "ready" | "error";
  summary: string;
  suggestions: readonly string[];
  insight?: CharacterAssistantInsight;
  actionNote?: string | null;
  onRebuild: () => void;
  onGenerateCandidate?: () => void;
  onAdoptSuggestion?: () => void;
  onViewConflict?: () => void;
};

export type ContinueScriptButtonProps = {
  disabled: boolean;
  loading: boolean;
  onContinue: () => void;
};

const characterAssets = [
  {
    id: "lin-che-main",
    kind: "main",
    src: "/assets/character-studio/hero/character-overview.webp",
    alt: "电影角色站在所属世界环境中的整体身份与视觉设定",
    label: "整体身份",
    selected: true,
  },
  {
    id: "lin-che-face",
    kind: "face",
    src: "/assets/character-studio/appearance/character-face.webp",
    alt: "电影角色面部特征、年龄感和表情方向参考",
    label: "面部方向",
    selected: false,
  },
  {
    id: "lin-che-costume",
    kind: "costume",
    src: "/assets/character-studio/appearance/character-costume.webp",
    alt: "电影角色服装轮廓、材质和世界文化风格参考",
    label: "服装方向",
    selected: false,
  },
  {
    id: "lin-che-props",
    kind: "props",
    src: "/assets/character-studio/appearance/character-props.webp",
    alt: "电影角色标志性道具、工作工具和重要物件参考",
    label: "标志性道具",
    selected: false,
  },
] as const satisfies readonly CharacterAssetPreview[];

const initialCharacter: CharacterPreview = {
  name: "林澈",
  role: "记忆档案修复师 · 故事主角",
  summary:
    "她替城市修复他人的记忆，却在一段无人认领的影像里看见了自己被抹去的人生。",
  identity: {
    background:
      "林澈成长于外环，成年后进入中央档案城，成为少数能够修复模拟记忆载体的技术人员。",
    motivation: "找回一段被系统判定为不存在、却与母亲失踪有关的原始记忆。",
    belief: "未经选择的记忆只是记录；人如何回应它，才构成真正的身份。",
    conflict:
      "她依赖档案系统寻找真相，却逐渐发现自己维护的秩序正是删除真相的力量。",
    goal: "在记忆议会封存异常影像前，确认其中的人是否真的是过去的自己。",
    forbiddenBehaviors: [
      "不会用激烈宣言表达立场",
      "不会轻易信任未经验证的记忆",
      "不会为了个人答案牺牲无辜者的身份安全",
    ],
    continuityNotes: [
      "遇到压力时先观察出口与光源，再看向对话者",
      "只在谈及母亲时触碰右侧衣领的铜扣",
    ],
  },
  appearance: {
    faceDirection: "克制、清醒，眼神长期保持观察感；左眉短疤是唯一明显旧伤。",
    hairDirection: "深黑及肩直发，右侧鬓角保留一缕自然银白，不做精致造型。",
    costumeDirection: "矿物灰长外套、非对称高领与旧铜扣，强调档案修复工作的痕迹。",
    bodyDirection: "清瘦但有长期体力工作的稳定感，站姿谨慎，动作幅度小。",
    propsDirection: "修复过的记忆盘与暖光档案灯，都是剧情判断的实际工具。",
    assets: characterAssets,
  },
  personality: {
    traits: ["克制", "敏锐", "有韧性", "不轻信权威"],
    behaviorRules: [
      "先确认事实，再决定是否表态",
      "对弱者保持具体而非口号式的善意",
      "危险时优先保护记忆原件",
    ],
    speechStyle: "短句、低声、少修饰；关键判断会用一个具体细节作为依据。",
    emotionalPattern: "情绪先被压住，再通过停顿、视线和手部动作显露。",
    dialogueRules: [
      "不主动解释自己的创伤",
      "不说技术黑话",
      "质疑时先复述对方的事实，再指出缺口",
    ],
  },
  state: {
    arcStage: "第一幕 · 信任开始松动",
    effectiveEpisodeLabel: "第 01–02 集",
    personalityDelta: "仍相信档案程序，但第一次选择保留未经登记的记忆副本。",
    relationshipDelta: "重新联系顾言；对苏弥从防备转为有限合作。",
    appearanceNotes: "外套保持完整，右袖出现一次修复工作留下的银灰粉尘。",
    continuityNotes: [
      "此阶段尚未公开反抗记忆议会",
      "档案灯由苏弥交付后才进入林澈的随身道具序列",
    ],
  },
  nodes: [
    { id: "lin-che", name: "林澈", roleLabel: "记忆修复师", isPrimary: true },
    { id: "gu-yan", name: "顾言", roleLabel: "前档案搭档", isPrimary: false },
    { id: "su-mi", name: "苏弥", roleLabel: "外环信使", isPrimary: false },
    { id: "memory-council", name: "记忆议会", roleLabel: "秩序机构", isPrimary: false },
  ],
  relationships: [
    {
      id: "lin-che-gu-yan",
      sourceId: "lin-che",
      targetId: "gu-yan",
      relationType: "疏离的旧搭档",
      emotionalDirection: "信任残留 / 彼此隐瞒",
      description: "顾言曾替林澈封存一次违规修复记录，也因此失去继续留在档案城的资格。",
      continuityNotes: [
        "两人从不直呼对方的职位",
        "顾言知道左眉伤痕的来源，但不会在第一幕主动说出",
      ],
    },
    {
      id: "lin-che-su-mi",
      sourceId: "lin-che",
      targetId: "su-mi",
      relationType: "谨慎同盟",
      emotionalDirection: "防备 → 有限信任",
      description: "苏弥掌握异常记忆的外环来源，也在试探林澈是否仍代表中央档案。",
      continuityNotes: ["档案灯是两人第一次建立信任的可见证据"],
    },
    {
      id: "lin-che-council",
      sourceId: "lin-che",
      targetId: "memory-council",
      relationType: "服从与质疑",
      emotionalDirection: "敬畏 / 逐步疏离",
      description: "议会认可林澈的修复能力，却持续限制她接触关于外环断层的原始材料。",
      continuityNotes: [],
    },
  ],
  visualConsistency: {
    status: "ready",
    mainAssetId: "lin-che-main",
    referenceAssetIds: ["lin-che-face", "lin-che-costume", "lin-che-props"],
    paletteLabel: "石板蓝 · 矿物灰 · 旧铜 · 暖档案光",
    styleLabel: "克制写实的近未来档案美学",
    identityRules: [
      "右鬓角银白发束与左眉短疤始终保留",
      "矿物灰非对称长外套保持主轮廓",
      "表演方向克制，不使用广告式笑容或英雄化姿态",
    ],
    consistencyNotes: [
      "面部、年龄与身体比例在所有参考中保持一致",
      "服装磨损可以随剧情增加，但材质和剪裁方向不改变",
    ],
  },
};

const identityFields = [
  ["background", "角色背景", "BACKGROUND"],
  ["motivation", "核心动机", "MOTIVATION"],
  ["belief", "核心信念", "BELIEF"],
  ["conflict", "核心冲突", "CONFLICT"],
  ["goal", "当前目标", "GOAL"],
] as const satisfies readonly [IdentityField, string, string][];

const candidateCatalog: Record<IdentityField, readonly CharacterDesignCandidate[]> = {
  background: [
    {
      id: "background-a",
      field: "background",
      label: "外环修复学徒",
      value: "林澈在外环民间修复铺长大，因能读取受损记忆纹理被中央档案城破格录用。",
      rationale: "让专业能力、阶层差异与她对制度的复杂依赖来自同一段经历。",
    },
    {
      id: "background-b",
      field: "background",
      label: "失忆者家属",
      value: "林澈的母亲在一次公共记忆校准后失踪，她因此进入档案系统内部寻找原始记录。",
      rationale: "把进入职业体系的原因直接连接到故事谜团。",
    },
    {
      id: "background-c",
      field: "background",
      label: "双城身份",
      value: "林澈同时拥有外环出生记录与中央档案城教育身份，两套记录之间存在无法解释的三年空白。",
      rationale: "提前埋下身份记录不一致的可执行悬念。",
    },
  ],
  motivation: [
    {
      id: "motivation-a",
      field: "motivation",
      label: "找回原始记忆",
      value: "寻找被系统判定不存在、却与母亲失踪有关的原始记忆，并确认它为何只对自己产生回应。",
      rationale: "保留情感目标，同时把她本人变成谜团的一部分。",
    },
    {
      id: "motivation-b",
      field: "motivation",
      label: "保护被删除者",
      value: "在追查母亲之前，先阻止议会继续删除与异常影像有关的普通人身份。",
      rationale: "让私人目标与公共责任发生更强的行动冲突。",
    },
    {
      id: "motivation-c",
      field: "motivation",
      label: "证明选择仍存在",
      value: "证明被修改的记忆仍能保留人的选择，从而否定议会对身份的唯一解释权。",
      rationale: "把角色动机提升为可以贯穿全季的主题行动。",
    },
  ],
  belief: [
    {
      id: "belief-a",
      field: "belief",
      label: "选择定义身份",
      value: "记忆可以被更改，但人在知道真相后做出的选择仍然属于自己。",
      rationale: "适合驱动她在真相与安全之间不断作出具体选择。",
    },
    {
      id: "belief-b",
      field: "belief",
      label: "记录必须可质疑",
      value: "任何无法被质疑的记录都会变成权力，而不是事实。",
      rationale: "强化她从制度维护者走向制度质疑者的弧光。",
    },
    {
      id: "belief-c",
      field: "belief",
      label: "记忆需要见证",
      value: "一段记忆只有被另一个人见证并回应，才不会再次被权力抹去。",
      rationale: "让关系线成为主题实现的一部分。",
    },
  ],
  conflict: [
    {
      id: "conflict-a",
      field: "conflict",
      label: "秩序与真相",
      value: "她需要借助档案系统寻找真相，却必须破坏自己一直维护的审查流程才能接近它。",
      rationale: "让每一步调查都带来职业与道德代价。",
    },
    {
      id: "conflict-b",
      field: "conflict",
      label: "母亲与陌生人",
      value: "越接近母亲的线索，她越发现保存这段记忆可能危及大量被删除身份的人。",
      rationale: "避免私人目标天然正确，增加真正的选择压力。",
    },
    {
      id: "conflict-c",
      field: "conflict",
      label: "能力不再可靠",
      value: "她最信任的修复能力开始对自己的记忆失效，使每个判断都可能来自被植入的偏见。",
      rationale: "把外部阴谋转化为角色自身的不可靠性。",
    },
  ],
  goal: [
    {
      id: "goal-a",
      field: "goal",
      label: "保住异常影像",
      value: "在议会封存前复制异常影像，并找到唯一能验证其中时间戳的外环设备。",
      rationale: "形成第一幕清晰、可拍摄、可失败的动作目标。",
    },
    {
      id: "goal-b",
      field: "goal",
      label: "找到首位见证者",
      value: "找到影像中仍然存活的第一位见证者，在议会注意到对方之前确认其身份。",
      rationale: "让调查自然进入人物关系与追逐场景。",
    },
    {
      id: "goal-c",
      field: "goal",
      label: "重启旧修复台",
      value: "与顾言重启被封存的旧修复台，读取异常影像中被新系统主动忽略的模拟层。",
      rationale: "把旧搭档关系转化为当前阶段的生产性目标。",
    },
  ],
};

const areaTabs = [
  ["IDENTITY", "身份核心"],
  ["APPEARANCE", "外观"],
  ["PERSONALITY", "性格"],
  ["RELATIONSHIP", "关系"],
  ["CONTINUITY", "阶段"],
  ["CONSISTENCY", "一致性"],
] as const satisfies readonly [CharacterWorkspaceArea, string][];

const assistantInsights: Record<CharacterWorkspaceArea, CharacterAssistantInsight> = {
  IDENTITY: {
    context: "IDENTITY",
    analysis: "动机、信念与冲突已经形成同一条追查主线。",
    potentialConflict: "她依赖档案秩序，却要通过违反秩序找到答案。",
    candidateSuggestion: "让异常记忆只对林澈产生回应，强化她与谜团的直接关系。",
    worldAlignmentHint: "保持记忆信用制度对身份、职业和行动权限的持续影响。",
    continuityWarning: "第一幕尚不能让她公开否定记忆议会。",
    nextAction: "比较核心动机候选，并采用一条更可执行的方向。",
  },
  APPEARANCE: {
    context: "APPEARANCE",
    analysis: "面部、服装与道具已经共享矿物灰、旧铜和暖光语言。",
    potentialConflict: "过度英雄化的轮廓会削弱她作为档案修复师的职业可信度。",
    candidateSuggestion: "保留非对称外套，并让右袖磨损随剧情阶段增加。",
    worldAlignmentHint: "所有物件继续遵循模拟光学和可维修结构。",
    continuityWarning: "银白鬓发与左眉短疤必须在所有参考中保留。",
    nextAction: "选择面部、服装或道具候选，并采用为本地当前参考。",
  },
  PERSONALITY: {
    context: "PERSONALITY",
    analysis: "克制、先验证事实和保护原件构成稳定行为模式。",
    potentialConflict: "“不主动解释创伤”与第 2 集可能出现的过去说明存在倾向冲突。",
    candidateSuggestion: "把主动说明改成回应顾言提供的具体证据，而不是完整自述。",
    worldAlignmentHint: "她的表达应体现档案工作者依赖证据的职业习惯。",
    continuityWarning: "情绪变化先通过停顿和动作显露，再进入对白。",
    nextAction: "查看候选调整，并决定是否改写当前对白规则。",
  },
  RELATIONSHIP: {
    context: "RELATIONSHIP",
    analysis: "顾言、苏弥与记忆议会分别承载过去、行动同盟与制度压力。",
    potentialConflict: "如果顾言过早说明伤痕来源，会削弱第一幕的身份悬念。",
    candidateSuggestion: "让顾言先通过旧称呼暴露熟悉感，再延后事实说明。",
    worldAlignmentHint: "关系变化必须通过档案权限、物件交付或见证行为落地。",
    continuityWarning: "档案灯只有在苏弥交付后才能成为林澈随身道具。",
    nextAction: "选择一条关系，核对它的连续性备注。",
  },
  CONTINUITY: {
    context: "CONTINUITY",
    analysis: "当前阶段是信任开始松动，而不是公开反抗。",
    potentialConflict: "过早呈现坚定反叛会跳过角色第一次保留违规副本的关键变化。",
    candidateSuggestion: "先让她用专业理由延迟上交，再意识到这是主动选择。",
    worldAlignmentHint: "阶段变化仍由剧情上下文决定，不在此处创建正式版本。",
    continuityWarning: "右袖银灰粉尘只在第一次异常修复后出现。",
    nextAction: "核对性格、关系、外观与连续性四组阶段变化。",
  },
  CONSISTENCY: {
    context: "CONSISTENCY",
    analysis: "主视觉、面部、服装与道具目前保持同一身份方向。",
    potentialConflict: "任何新候选若改变年龄感、发束位置或外套主轮廓，需要重新整理。",
    candidateSuggestion: "以整体身份为参考，逐项比较当前视觉方向。",
    worldAlignmentHint: "色板继续使用石板蓝、矿物灰、旧铜与暖档案光。",
    continuityWarning: "本地预览不是身份锁定或正式资产批准。",
    nextAction: "重新整理预览，并采用当前方向作为本地工作基线。",
  },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function displayStatus(status: CharacterContextStatus) {
  if (status === "预览已过期") return "待重新整理";
  if (status === "预览完成") return "预览已更新";
  return status;
}

export function CharacterContextBar({ context }: CharacterContextBarProps) {
  const badgeTone =
    context.statusLabel === "本地确认" || context.statusLabel === "预览完成"
      ? "primary"
      : context.statusLabel === "预览已过期"
        ? "warning"
        : context.statusLabel === "设计中"
          ? "ai"
          : "neutral";

  return (
    <ACSCard className={styles.contextBar} padding="compact">
      <div className={styles.contextContent}>
        <div className={styles.contextIdentity}>
          <strong>{context.seriesTitle}</strong>
          <span aria-hidden="true">/</span>
          <span>{context.worldContextLabel}</span>
          <span aria-hidden="true">/</span>
          <span>{context.characterName}</span>
          <span aria-hidden="true">/</span>
          <span>{context.stageLabel}</span>
        </div>
        <ACSBadge dot tone={badgeTone}>{displayStatus(context.statusLabel)}</ACSBadge>
        {context.statusLabel === "预览已过期" ? (
          <span className={styles.contractStatus}>预览已过期</span>
        ) : null}
      </div>
    </ACSCard>
  );
}

function CharacterStudioPageIntro() {
  return (
    <section aria-labelledby="character-studio-title" className={styles.pageIntro}>
      <div>
        <p className={styles.eyebrow}><span>CHARACTER STUDIO</span> · PRODUCTION WORKSPACE</p>
        <h1 id="character-studio-title">让角色拥有可以持续保持的一致身份</h1>
      </div>
      <div className={styles.introStatus}>
        <span>当前任务</span>
        <strong>设计林澈 · 第一幕角色约束</strong>
        <ACSBadge tone="neutral">本地草稿</ACSBadge>
      </div>
    </section>
  );
}

export function CharacterOverviewCard({
  character,
  mainVisual,
  statusLabel,
  arcStage,
  readOnly = false,
}: CharacterOverviewCardProps) {
  return (
    <div className={styles.overviewCompact}>
      <figure className={styles.overviewCompactVisual}>
        <Image alt={mainVisual.alt} className={styles.mediaImage} fill priority sizes="320px" src={mainVisual.src} />
      </figure>
      <div>
        <span className={styles.workLabel}>CURRENT CHARACTER</span>
        <h2>{character.name}</h2>
        <p className={styles.overviewRole}>{character.role}</p>
        <p>{character.summary}</p>
        <div className={styles.inlineBadges}>
          <ACSBadge tone={statusLabel === "预览已过期" ? "warning" : "primary"}>{displayStatus(statusLabel)}</ACSBadge>
          {arcStage ? <ACSBadge tone="neutral">{arcStage.effectiveEpisodeLabel}</ACSBadge> : null}
          {readOnly ? <ACSBadge tone="neutral">只读预览</ACSBadge> : null}
        </div>
      </div>
    </div>
  );
}

type CharacterReferenceRailProps = {
  character: CharacterPreview;
  activeAssetId: string | null;
  adoptedAssetId: string | null;
  statusLabel: CharacterContextStatus;
  onSelectAsset: (assetId: string) => void;
  onOpenViewer: (assetId: string) => void;
  onContextChange: (area: CharacterWorkspaceArea) => void;
};

export function CharacterReferenceRail({
  character,
  activeAssetId,
  adoptedAssetId,
  statusLabel,
  onSelectAsset,
  onOpenViewer,
  onContextChange,
}: CharacterReferenceRailProps) {
  const assetRefs = useRef(new Map<string, HTMLButtonElement>());
  const assets = character.appearance.assets;
  const activeAsset = assets.find((asset) => asset.id === activeAssetId) ?? assets[0];

  function selectAsset(assetId: string) {
    const asset = assets.find((item) => item.id === assetId);
    onSelectAsset(assetId);
    onContextChange(asset?.kind === "main" ? "IDENTITY" : "APPEARANCE");
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + assets.length) % assets.length;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % assets.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = assets.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectAsset(assets[index].id);
      return;
    }
    if (nextIndex !== null) {
      event.preventDefault();
      assetRefs.current.get(assets[nextIndex].id)?.focus();
    }
  }

  return (
    <aside className={styles.referenceRail} aria-label="角色制作参考栏">
      <div className={styles.panelToolbar}>
        <div><strong>角色制作参考</strong><span className={styles.workLabel}>CHARACTER REFERENCE</span></div>
        <ACSBadge tone={statusLabel === "预览已过期" ? "warning" : "neutral"}>{displayStatus(statusLabel)}</ACSBadge>
      </div>
      {activeAsset ? (
        <figure className={styles.referenceStage} data-asset-kind={activeAsset.kind}>
          <Image alt={activeAsset.alt} className={styles.mediaImage} fill priority sizes="(max-width: 767px) 100vw, 320px" src={activeAsset.src} />
          <div aria-hidden="true" className={styles.mediaOverlay} />
          <figcaption><span>{activeAsset.label}</span><strong>{character.name}</strong></figcaption>
          <ACSButton
            aria-label={`查看${activeAsset.label}大图`}
            className={styles.referenceViewerButton}
            onClick={() => onOpenViewer(activeAsset.id)}
            size="small"
            variant="secondary"
          >
            查看参考
          </ACSButton>
        </figure>
      ) : null}
      <div className={styles.referenceIdentity}>
        <div><h2>{character.name}</h2><p>{character.role}</p></div>
        <p>{character.summary}</p>
        <div className={styles.arcMarker}>
          <span>当前弧光阶段</span>
          <strong>{character.state.arcStage}</strong>
          <small>{character.state.effectiveEpisodeLabel}</small>
        </div>
      </div>
      <div aria-labelledby="character-reference-label" className={styles.referenceSelector} role="group">
        <span className={styles.selectorLabel} id="character-reference-label">角色视觉参考</span>
        <div className={styles.referenceGrid}>
          {assets.map((asset, index) => {
            const selected = asset.id === activeAssetId;
            const referenceState =
              asset.id === adoptedAssetId
                ? "已采用（LOCAL）"
                : asset.kind === "main"
                  ? "当前参考"
                  : selected
                    ? "候选参考"
                    : "选择方向";
            return (
              <button
                aria-label={`${asset.label}${selected ? "，已选择" : ""}`}
                aria-pressed={selected}
                className={styles.referenceButton}
                data-reference-state={asset.id === adoptedAssetId ? "adopted-local" : asset.kind === "main" ? "current" : "candidate"}
                key={asset.id}
                onClick={() => selectAsset(asset.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(node) => {
                  if (node) assetRefs.current.set(asset.id, node);
                  else assetRefs.current.delete(asset.id);
                }}
                tabIndex={selected || (!activeAssetId && index === 0) ? 0 : -1}
                type="button"
              >
                <span className={styles.referenceThumb}>
                  <Image alt="" className={styles.mediaImage} fill sizes="120px" src={asset.src} />
                </span>
                <span><strong>{asset.label}</strong><small>{referenceState}</small></span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export function IdentityCanvas({
  value,
  disabled = false,
  candidates = [],
  activeField = "motivation",
  selectedCandidateId = null,
  adoptedCandidateId = null,
  candidateSurface = "inline",
  onActiveFieldChange,
  onSelectCandidate,
  onAdoptCandidate,
  onGenerateCandidates,
  onReturnCurrent,
  onChange,
}: IdentityCanvasProps) {
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;

  return (
    <section className={styles.identityCanvas} aria-labelledby="identity-canvas-title">
      <div className={styles.canvasHeading}>
        <div><strong>角色设计画布</strong><span className={styles.workLabel}>CHARACTER DESIGN CANVAS</span><h2 id="identity-canvas-title">身份方向</h2></div>
        <div className={styles.canvasActions}>
          <div className={styles.bilingualState}><strong>当前方向 + AI 候选</strong><span>CURRENT + AI SUGGESTIONS</span></div>
          <ACSButton onClick={onGenerateCandidates} size="small" variant="secondary">生成本地候选</ACSButton>
        </div>
      </div>
      <div className={styles.identityReferenceBand}>
        <figure>
          <Image
            alt="展示电影角色背景、动机、信念、目标和核心冲突的身份视觉设计板"
            className={styles.mediaImage}
            fill
            sizes="(max-width: 767px) 100vw, 280px"
            src="/assets/character-studio/identity/identity-board.webp"
          />
        </figure>
        <div>
          <strong>身份来源板</strong>
          <span className={styles.workLabel}>IDENTITY SOURCE BOARD</span>
          <small>当前身份方向参考</small>
          <p>把世界背景、角色动机与核心冲突放在同一制作语境中核对。</p>
        </div>
      </div>
      <form className={styles.identityForm} onSubmit={(event) => event.preventDefault()}>
        {identityFields.map(([field, label, code]) => {
          const inputId = `character-identity-${field}`;
          const helpId = `${inputId}-help`;
          const errorId = `${inputId}-error`;
          const invalid = value[field].trim().length === 0;
          const active = field === activeField;
          return (
            <div className={styles.identityField} data-active={active || undefined} key={field}>
              <button
                aria-pressed={active}
                className={styles.identityFieldSelector}
                onClick={() => onActiveFieldChange?.(field)}
                type="button"
              >
                <span>{code}</span><strong>{label}</strong>
              </button>
              <label htmlFor={inputId}>{label}</label>
              <textarea
                aria-describedby={`${helpId}${invalid ? ` ${errorId}` : ""}`}
                aria-invalid={invalid}
                disabled={disabled}
                id={inputId}
                onChange={(event) => {
                  onActiveFieldChange?.(field);
                  onChange({ area: "identity", field, value: event.target.value });
                }}
                onFocus={() => onActiveFieldChange?.(field)}
                rows={2}
                value={value[field]}
              />
              <p id={helpId}>{active ? "当前方向可直接编辑；本地修改会要求重新整理一致性预览。" : "选择后比较当前方向与候选方向。"}</p>
              {invalid ? <p className={styles.fieldError} id={errorId}>请补充{label}。</p> : null}
              <ACSBadge tone={adoptedCandidateId && active ? "primary" : "neutral"}>
                {adoptedCandidateId && active ? "本地编辑" : "当前方向"}
              </ACSBadge>
            </div>
          );
        })}
      </form>
      {candidateSurface === "inline" ? <div className={styles.candidateWorkbench}>
        <div className={styles.candidateList}>
          <div className={styles.candidateListHeading}>
            <span>AI SUGGESTIONS</span><strong>候选方向</strong>
          </div>
          {candidates.map((candidate, index) => (
            <button
              aria-label={`选择候选：${candidate.label}`}
              aria-pressed={candidate.id === selectedCandidateId}
              className={styles.candidateOption}
              key={candidate.id}
              onClick={() => onSelectCandidate?.(candidate.id)}
              type="button"
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <span><strong>{candidate.label}</strong><small>{candidate.rationale}</small></span>
            </button>
          ))}
        </div>
        <div className={styles.candidateCompare}>
          {selectedCandidate ? (
            <AICandidateCard
              actions={
                <div className={styles.candidateActions}>
                  <ACSButton onClick={() => onReturnCurrent?.()} size="small" variant="ghost">恢复当前</ACSButton>
                  <ACSButton onClick={() => onAdoptCandidate?.(selectedCandidate.id)} size="small" variant="primary">采用候选</ACSButton>
                </div>
              }
              description={selectedCandidate.rationale}
              label={selectedCandidate.id === adoptedCandidateId ? "已采用（LOCAL）" : "候选方向"}
              selected
              title={selectedCandidate.label}
            >
              <p>{selectedCandidate.value}</p>
            </AICandidateCard>
          ) : (
            <div className={styles.currentDirection}>
              <ACSBadge tone="primary">CURRENT</ACSBadge>
              <strong>当前方向</strong>
              <p>{value[activeField]}</p>
              <span>选择候选开始比较，或继续编辑当前方向。</span>
            </div>
          )}
        </div>
      </div> : null}
      <div className={styles.constraintBar}>
        <span>角色约束</span>
        <strong>{value.forbiddenBehaviors[0]}</strong>
        <span aria-hidden="true">·</span>
        <strong>{value.continuityNotes[0]}</strong>
      </div>
    </section>
  );
}

function CharacterCandidateStrip({
  candidates,
  selectedCandidateId,
  adoptedCandidateId,
  onSelectCandidate,
  onAdoptCandidate,
  onReturnCurrent,
}: {
  candidates: readonly CharacterDesignCandidate[];
  selectedCandidateId: string | null;
  adoptedCandidateId: string | null;
  onSelectCandidate: (candidateId: string) => void;
  onAdoptCandidate: (candidateId: string) => void;
  onReturnCurrent: () => void;
}) {
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;

  return (
    <div className={styles.characterCandidateStrip}>
      <div className={styles.candidateStripHeading}>
        <span className={styles.workLabel}>ACTIVE TASK · IDENTITY CANDIDATES</span>
        <strong>身份候选</strong>
        <small>{candidates.length} 个本地结果 · 不会自动替换当前方向</small>
      </div>
      <div aria-label="身份候选结果" className={styles.candidateStripResults} role="group">
        {candidates.map((candidate, index) => (
          <button
            aria-label={`比较候选：${candidate.label}`}
            aria-pressed={candidate.id === selectedCandidateId}
            className={styles.candidateStripOption}
            key={candidate.id}
            onClick={() => onSelectCandidate(candidate.id)}
            type="button"
          >
            <span>{String.fromCharCode(65 + index)}</span>
            <span>
              <strong>{candidate.label}</strong>
              <small>{candidate.rationale}</small>
            </span>
          </button>
        ))}
      </div>
      <div className={styles.candidateStripReview}>
        {selectedCandidate ? (
          <>
            <div>
              <ACSBadge tone={selectedCandidate.id === adoptedCandidateId ? "primary" : "ai"}>
                {selectedCandidate.id === adoptedCandidateId ? "已采用（LOCAL）" : "当前候选"}
              </ACSBadge>
              <strong>{selectedCandidate.label}</strong>
              <p>{selectedCandidate.value}</p>
            </div>
            <div className={styles.candidateStripActions}>
              <ACSButton onClick={onReturnCurrent} size="small" variant="ghost">恢复当前</ACSButton>
              <ACSButton onClick={() => onAdoptCandidate(selectedCandidate.id)} size="small">采用候选</ACSButton>
            </div>
          </>
        ) : (
          <p>选择候选开始比较，或继续编辑当前方向。</p>
        )}
      </div>
    </div>
  );
}

const appearanceFields = [
  ["faceDirection", "面部方向"],
  ["hairDirection", "发型方向"],
  ["costumeDirection", "服装方向"],
  ["bodyDirection", "身体方向"],
  ["propsDirection", "道具方向"],
] as const satisfies readonly [
  Extract<CharacterUpdatePayload, { area: "appearance" }>["field"],
  string,
][];

export function AppearanceBoard({
  value,
  activeAssetId,
  adoptedAssetId = null,
  disabled = false,
  onChange,
  onSelectAsset,
  onAdoptAsset,
  onOpenViewer,
}: AppearanceBoardProps) {
  const activeAsset = value.assets.find((asset) => asset.id === activeAssetId) ?? value.assets[0];
  const mainAsset = value.assets.find((asset) => asset.kind === "main") ?? value.assets[0];
  const candidateAssets = value.assets.filter((asset) => asset.kind !== "main");

  return (
    <ACSCard
      className={styles.appearanceBoard}
      headerAction={<ACSBadge tone={adoptedAssetId ? "primary" : "neutral"}>{adoptedAssetId ? "已采用（LOCAL）" : "候选参考"}</ACSBadge>}
      padding="compact"
      title="外观设计板"
    >
      <div className={styles.appearanceWorkspace}>
        {mainAsset ? (
          <div className={styles.currentReference}>
            <div className={styles.subhead}><strong>当前身份参考</strong><span>CURRENT IDENTITY REFERENCE</span></div>
            <figure className={styles.currentReferenceStage}>
              <Image alt={mainAsset.alt} className={styles.mediaImage} fill sizes="(max-width: 767px) 100vw, 420px" src={mainAsset.src} />
              <ACSBadge className={styles.imageBadge} tone="primary">当前参考</ACSBadge>
            </figure>
            <ACSButton onClick={() => onOpenViewer(mainAsset.id)} size="small" variant="secondary">查看整体参考</ACSButton>
          </div>
        ) : null}
        <div className={styles.appearanceCandidates}>
          <div className={styles.subhead}><strong>选择候选参考</strong><span>CANDIDATE REFERENCES</span></div>
          <div aria-label="外观候选参考" className={styles.appearanceCandidateGrid} role="group">
            {candidateAssets.map((asset) => {
              const selected = asset.id === activeAssetId;
              const adopted = asset.id === adoptedAssetId;
              return (
                <button
                  aria-pressed={selected}
                  className={styles.appearanceCandidate}
                  data-adopted={adopted || undefined}
                  key={asset.id}
                  onClick={() => onSelectAsset(asset.id)}
                  type="button"
                >
                  <span className={styles.appearanceCandidateImage}>
                    <Image alt="" className={styles.mediaImage} fill loading="eager" sizes="180px" src={asset.src} />
                  </span>
                  <span><strong>{asset.label}</strong><small>{adopted ? "已采用（LOCAL）" : selected ? "候选参考" : "比较"}</small></span>
                </button>
              );
            })}
          </div>
          {activeAsset && activeAsset.kind !== "main" ? (
            <div className={styles.appearanceActionBar}>
              <div><span>当前选择</span><strong>{activeAsset.label}</strong></div>
              <ACSButton onClick={() => onOpenViewer(activeAsset.id)} size="small" variant="ghost">查看参考</ACSButton>
              <ACSButton disabled={disabled} onClick={() => onAdoptAsset?.(activeAsset.id)} size="small" variant="primary">采用为当前参考</ACSButton>
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.appearanceFields}>
        {appearanceFields.map(([field, label]) => (
          <div className={styles.compactField} key={field}>
            <label htmlFor={`character-appearance-${field}`}>{label}</label>
            <textarea
              aria-describedby={`character-appearance-${field}-help`}
              disabled={disabled}
              id={`character-appearance-${field}`}
              onChange={(event) => onChange({ area: "appearance", field, value: event.target.value })}
              rows={2}
              value={value[field]}
            />
            <p id={`character-appearance-${field}-help`}>LOCAL EDIT · 修改后重新整理本地预览。</p>
          </div>
        ))}
      </div>
    </ACSCard>
  );
}

export function PersonalityCard({ value, disabled = false, onChange }: PersonalityCardProps) {
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const candidateSpeech = "短句、低声、少修饰；被追问过去时先指出证据缺口，再选择透露一个事实。";

  return (
    <ACSCard className={styles.personalityCard} headerAction={<ACSBadge tone="neutral">当前规则</ACSBadge>} padding="compact" title="性格与行为">
      <div className={styles.personalityWorkbench}>
        <div>
          <div className={styles.tagList} aria-label="角色性格特质">
            {value.traits.map((trait) => <ACSBadge key={trait} tone="neutral">{trait}</ACSBadge>)}
          </div>
          <div className={styles.ruleColumns}>
            <section><h3>行为规则</h3><ul>{value.behaviorRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>
            <section><h3>对白规则</h3><ul>{value.dialogueRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>
          </div>
        </div>
        <div className={styles.personalityReview}>
          <span className={styles.workLabel}>POTENTIAL CONFLICT</span>
          <strong>对白倾向需要核对</strong>
          <p>当前规则“不主动解释自己的创伤”，与第 2 集可能出现的主动说明过去存在本地预览冲突。</p>
          <small>这不是对真实剧本版本的扫描结果。</small>
          <ACSButton onClick={() => setSuggestionVisible((current) => !current)} size="small" variant="secondary">查看建议</ACSButton>
          {suggestionVisible ? (
            <div className={styles.personalitySuggestion}>
              <span>候选调整</span><p>{candidateSpeech}</p>
              <ACSButton
                disabled={disabled}
                onClick={() => onChange({ area: "personality", field: "speechStyle", value: candidateSpeech })}
                size="small"
                variant="primary"
              >
                采用候选调整
              </ACSButton>
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.personalityFields}>
        <div className={styles.formField}>
          <label htmlFor="character-speech-style">说话方式</label>
          <textarea aria-describedby="character-speech-style-help" disabled={disabled} id="character-speech-style" onChange={(event) => onChange({ area: "personality", field: "speechStyle", value: event.target.value })} rows={3} value={value.speechStyle} />
          <p id="character-speech-style-help">当前规则 · 可直接编辑。</p>
        </div>
        <div className={styles.formField}>
          <label htmlFor="character-emotional-pattern">情绪模式</label>
          <textarea aria-describedby="character-emotional-pattern-help" disabled={disabled} id="character-emotional-pattern" onChange={(event) => onChange({ area: "personality", field: "emotionalPattern", value: event.target.value })} rows={3} value={value.emotionalPattern} />
          <p id="character-emotional-pattern-help">当前规则 · 不使用数值相似度。</p>
        </div>
      </div>
    </ACSCard>
  );
}

export function CharacterStateCard({ state, readOnly = false }: CharacterStateCardProps) {
  const stateRows = [
    ["Personality Delta", "性格变化", state.personalityDelta],
    ["Relationship Delta", "关系变化", state.relationshipDelta],
    ["Appearance Notes", "外观备注", state.appearanceNotes],
  ] as const;

  return (
    <ACSCard className={styles.stateCard} headerAction={readOnly ? <ACSBadge tone="neutral">本地阶段预览</ACSBadge> : undefined} padding="compact" title="角色阶段状态">
      <div className={styles.stateLead}>
        <strong>当前剧情阶段</strong><span>CURRENT STORY STAGE</span><b>{state.arcStage}</b><small>{state.effectiveEpisodeLabel}</small>
      </div>
      <div className={styles.stateWorkspace}>
        {stateRows.map(([code, label, value]) => (
          <section key={code}><span>{code}</span><h3>{label}</h3><p>{value}</p></section>
        ))}
        <section><span>CONTINUITY NOTES</span><h3>连续性备注</h3><ul>{state.continuityNotes.map((note) => <li key={note}>{note}</li>)}</ul></section>
      </div>
    </ACSCard>
  );
}

function nodeName(nodes: readonly CharacterNode[], nodeId: string) {
  return nodes.find((node) => node.id === nodeId)?.name ?? "未知角色";
}

function RelationDetail({ relation, nodes }: { relation: CharacterRelation; nodes: readonly CharacterNode[] }) {
  return (
    <div className={styles.relationDetail}>
      <dl>
        <div><dt>来源角色</dt><dd>{nodeName(nodes, relation.sourceId)}</dd></div>
        <div><dt>目标角色</dt><dd>{nodeName(nodes, relation.targetId)}</dd></div>
        <div><dt>关系类型</dt><dd>{relation.relationType}</dd></div>
        <div><dt>情绪方向</dt><dd>{relation.emotionalDirection}</dd></div>
      </dl>
      <section><h3>关系说明</h3><p>{relation.description}</p></section>
      <section>
        <h3>连续性备注</h3>
        {relation.continuityNotes.length > 0 ? <ul>{relation.continuityNotes.map((note) => <li key={note}>{note}</li>)}</ul> : <p className={styles.emptyNote}>暂无连续性备注</p>}
      </section>
    </div>
  );
}

export function RelationshipGraph({
  nodes,
  relations,
  selectedNodeId,
  selectedRelationId,
  onSelectNode,
  onSelectRelation,
}: RelationshipGraphProps) {
  const isMobile = useIsMobile();
  const [detailRelationId, setDetailRelationId] = useState<string | null>(null);
  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const detailRelation = relations.find((item) => item.id === detailRelationId) ?? null;
  const selectedRelation = relations.find((item) => item.id === selectedRelationId) ?? relations[0] ?? null;

  function openRelation(relationId: string) {
    onSelectRelation(relationId);
    setDetailRelationId(relationId);
  }

  const detail = detailRelation ? <RelationDetail nodes={nodes} relation={detailRelation} /> : null;

  return (
    <section aria-labelledby="character-relationships-title">
      <ACSCard className={styles.relationshipCard} headerAction={<ACSBadge tone="neutral">{relations.length} 条关系</ACSBadge>} padding="compact" title={<span id="character-relationships-title">角色关系</span>}>
        <div className={styles.relationshipLayout}>
          <figure className={styles.relationshipVisual}>
            <Image alt="展示主要电影角色之间关系、情绪距离和叙事张力的视觉设计板" className={styles.mediaImage} fill sizes="(max-width: 1023px) 100vw, 58vw" src="/assets/character-studio/relation/relationship-board.webp" />
            <div aria-hidden="true" className={styles.graphLines} />
            <div className={styles.graphNodes}>
              {nodes.map((node) => (
                <button aria-pressed={node.id === selectedNodeId} className={styles.graphNode} data-node={node.id} key={node.id} onClick={() => onSelectNode(node.id)} type="button">
                  <strong>{node.name}</strong><span>{node.roleLabel}</span>
                </button>
              ))}
            </div>
          </figure>
          <div className={styles.relationArchive}>
            <div className={styles.subhead}><strong>关系上下文</strong><span>RELATIONSHIP CONTEXT</span><small>选择关系并核对连续性</small></div>
            <ul aria-label="角色关系列表" className={styles.relationList}>
              {relations.map((relation) => (
                <li data-selected={relation.id === selectedRelationId || undefined} key={relation.id}>
                  <div><strong>{nodeName(nodes, relation.sourceId)} — {relation.relationType} → {nodeName(nodes, relation.targetId)}</strong><span>{relation.emotionalDirection}</span></div>
                  <ACSButton aria-pressed={relation.id === selectedRelationId} onClick={() => openRelation(relation.id)} size="small" variant="secondary">查看关系</ACSButton>
                </li>
              ))}
            </ul>
            {selectedRelation ? (
              <div className={styles.selectedRelationDetail} aria-live="polite">
                <span>当前关系</span><strong>{selectedRelation.relationType}</strong><p>{selectedRelation.description}</p>
                <h3>连续性备注</h3>
                {selectedRelation.continuityNotes.length > 0 ? <ul>{selectedRelation.continuityNotes.map((note) => <li key={note}>{note}</li>)}</ul> : <p className={styles.emptyNote}>暂无连续性备注</p>}
                <ACSButton onClick={() => setSuggestionVisible((current) => !current)} size="small" variant="ghost">生成本地关系建议</ACSButton>
                {suggestionVisible ? <p className={styles.localSuggestion}>候选：先用旧称呼暴露熟悉感，再延后事实说明。</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </ACSCard>
      {isMobile ? (
        <ACSDrawer description={detailRelation?.emotionalDirection} onClose={() => setDetailRelationId(null)} open={Boolean(detailRelation)} side="bottom" title={detailRelation ? `${nodeName(nodes, detailRelation.sourceId)}与${nodeName(nodes, detailRelation.targetId)}` : "关系详情"}>{detail}</ACSDrawer>
      ) : (
        <ACSModal description={detailRelation?.emotionalDirection} onClose={() => setDetailRelationId(null)} open={Boolean(detailRelation)} size="medium" title={detailRelation ? `${nodeName(nodes, detailRelation.sourceId)}与${nodeName(nodes, detailRelation.targetId)}` : "关系详情"}>{detail}</ACSModal>
      )}
    </section>
  );
}

export function VisualConsistencyPanel({
  preview,
  assets,
  activeAssetId = null,
  onOpenAsset,
  onRebuild,
  onAdoptDirection,
}: VisualConsistencyPanelProps) {
  const [adopted, setAdopted] = useState(false);
  const mainAsset = assets.find((asset) => asset.id === preview.mainAssetId) ?? assets[0];
  const currentAsset = assets.find((asset) => asset.id === activeAssetId) ?? mainAsset;
  const references = assets.filter((asset) => preview.referenceAssetIds.includes(asset.id));
  const badgeLabel = preview.status === "ready" ? "本地一致性预览" : preview.status === "stale" ? "需要重新整理" : "等待整理";

  return (
    <ACSCard className={styles.consistencyPanel} headerAction={<ACSBadge dot tone={preview.status === "stale" ? "warning" : "ai"}>{badgeLabel}</ACSBadge>} padding="compact" title="视觉一致性预览">
      <div className={styles.consistencyToolbar}>
        <div><strong>身份一致性审查</strong><span className={styles.workLabel}>IDENTITY REVIEW STATION</span><small>参考与当前方向</small></div>
        <div>
          <ACSButton disabled={!mainAsset} onClick={() => mainAsset && onOpenAsset(mainAsset.id)} size="small" variant="ghost">查看参考</ACSButton>
          <ACSButton onClick={onRebuild} size="small" variant="secondary">重新整理预览</ACSButton>
          <ACSButton
            disabled={preview.status !== "ready"}
            onClick={() => { setAdopted(true); onAdoptDirection?.(); }}
            size="small"
            variant="primary"
          >
            采用当前方向
          </ACSButton>
        </div>
      </div>
      <div className={styles.consistencyLayout}>
        <div className={styles.comparisonGrid}>
          {mainAsset ? (
            <figure className={styles.comparisonFrame}>
              <Image alt={mainAsset.alt} className={styles.mediaImage} fill sizes="(max-width: 767px) 100vw, 480px" src={mainAsset.src} />
              <figcaption><span>REFERENCE</span><strong>主身份参考</strong></figcaption>
            </figure>
          ) : null}
          {currentAsset ? (
            <figure className={styles.comparisonFrame} data-asset-kind={currentAsset.kind}>
              <Image alt={currentAsset.alt} className={styles.mediaImage} fill sizes="(max-width: 767px) 100vw, 480px" src={currentAsset.src} />
              <figcaption><span>CURRENT DIRECTION</span><strong>{currentAsset.label}</strong></figcaption>
            </figure>
          ) : null}
        </div>
        <div className={styles.consistencyReview}>
          <div className={styles.consistencyDirection}>
            <section><span>VISUAL STYLE</span><strong>{preview.styleLabel}</strong></section>
            <section><span>PALETTE</span><strong>{preview.paletteLabel}</strong></section>
          </div>
          <section className={styles.consistencyRules}><h3>身份规则</h3><ul>{preview.identityRules.map((rule) => <li key={rule}>{rule}</li>)}</ul></section>
          <section className={styles.consistencyRules}><h3>一致性备注</h3><ul>{preview.consistencyNotes.map((note) => <li key={note}>{note}</li>)}</ul></section>
          <div className={styles.referenceStrip}>
            {references.map((asset) => (
              <button aria-label={`查看${asset.label}`} key={asset.id} onClick={() => onOpenAsset(asset.id)} type="button">
                <span><Image alt="" className={styles.mediaImage} fill sizes="120px" src={asset.src} /></span><strong>{asset.label}</strong>
              </button>
            ))}
          </div>
          {adopted ? <p className={styles.adoptedDirection} role="status">当前方向已采用（LOCAL）</p> : null}
        </div>
      </div>
      <p className={styles.previewBoundary}>本地一致性预览仅整理当前工作方向，不创建正式身份版本、资产记录或锁定状态。</p>
    </ACSCard>
  );
}

export function CharacterAssetViewer({ open, assets, activeAssetId, onSelectAsset, onClose }: CharacterAssetViewerProps) {
  const isMobile = useIsMobile();
  const activeIndex = Math.max(0, assets.findIndex((asset) => asset.id === activeAssetId));
  const activeAsset = assets[activeIndex];
  const selectAt = useCallback((index: number) => {
    if (assets.length === 0) return;
    onSelectAsset(assets[(index + assets.length) % assets.length].id);
  }, [assets, onSelectAsset]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") { event.preventDefault(); selectAt(activeIndex - 1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); selectAt(activeIndex + 1); }
      else if (event.key === "Home") { event.preventDefault(); selectAt(0); }
      else if (event.key === "End") { event.preventDefault(); selectAt(assets.length - 1); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, assets.length, open, selectAt]);

  const content = activeAsset ? (
    <div className={styles.assetViewer}>
      <figure className={styles.viewerStage} data-asset-kind={activeAsset.kind}>
        <Image alt={activeAsset.alt} className={styles.viewerImage} fill sizes="(max-width: 767px) 100vw, 960px" src={activeAsset.src} />
      </figure>
      <div className={styles.viewerToolbar}>
        <ACSButton aria-label="上一张角色资产" onClick={() => selectAt(activeIndex - 1)} variant="secondary">← 上一张</ACSButton>
        <div aria-live="polite"><strong>{activeAsset.label}</strong><span>{activeIndex + 1} / {assets.length}</span></div>
        <ACSButton aria-label="下一张角色资产" onClick={() => selectAt(activeIndex + 1)} variant="secondary">下一张 →</ACSButton>
      </div>
    </div>
  ) : null;

  return isMobile ? (
    <ACSDrawer description="本地角色视觉参考" onClose={onClose} open={open} side="bottom" size="wide" title={activeAsset?.label ?? "角色资产"}>{content}</ACSDrawer>
  ) : (
    <ACSModal description="本地角色视觉参考" onClose={onClose} open={open} size="large" title={activeAsset?.label ?? "角色资产"}>{content}</ACSModal>
  );
}

export function AICharacterAssistantPanel({
  status,
  summary,
  suggestions,
  insight,
  actionNote,
  onRebuild,
  onGenerateCandidate,
  onAdoptSuggestion,
  onViewConflict,
}: AICharacterAssistantPanelProps) {
  const statusLabel = status === "thinking" ? "正在分析" : status === "ready" ? "工具已就绪" : status === "error" ? "需要检查" : "等待工作区域";
  const resolvedInsight = insight ?? assistantInsights.IDENTITY;
  const insightRows = [
    ["ANALYSIS", "分析", resolvedInsight.analysis],
    ["POTENTIAL CONFLICT", "潜在冲突", resolvedInsight.potentialConflict],
    ["CANDIDATE", "候选建议", resolvedInsight.candidateSuggestion],
    ["WORLD ALIGNMENT", "世界匹配", resolvedInsight.worldAlignmentHint],
    ["CONTINUITY", "连续性提醒", resolvedInsight.continuityWarning],
    ["NEXT ACTION", "下一步", resolvedInsight.nextAction],
  ] as const;

  return (
    <AIAssistantPanel
      aria-label="角色 AI 制作助理"
      actions={<ACSButton disabled={status === "thinking"} onClick={onRebuild} size="small" variant="secondary">重新分析</ACSButton>}
      className={styles.assistantPanel}
      description={`当前工作区域 · ${resolvedInsight.context}`}
      footer={
        <div className={styles.assistantActionBar}>
          <ACSButton onClick={onViewConflict} size="small" variant="ghost">查看冲突</ACSButton>
          <ACSButton onClick={onGenerateCandidate} size="small" variant="secondary">生成候选</ACSButton>
          <ACSButton onClick={onAdoptSuggestion} size="small" variant="primary">采用建议</ACSButton>
        </div>
      }
      status={statusLabel}
      title="AI 角色助理 · 镜构小构"
    >
      {status === "thinking" ? (
        <AIThinkingState compact detail="正在根据当前工作区域重新整理分析、冲突与下一步。" label="正在整理角色预览" />
      ) : status === "error" ? (
        <p className={styles.localError}>本地分析暂时无法准备，请检查当前角色设定后重试。</p>
      ) : (
        <div className={styles.assistantContent}>
          <p>{summary}</p>
          <div className={styles.assistantInsights}>
            {insightRows.map(([code, label, value]) => (
              <section key={code}><span>{code}</span><h3>{label}</h3><p>{value}</p></section>
            ))}
          </div>
          <ol className={styles.assistantSuggestionList}>
            {suggestions.map((suggestion, index) => <li key={suggestion}><span>{String(index + 1).padStart(2, "0")}</span><p>{suggestion}</p></li>)}
          </ol>
          {actionNote ? <p className={styles.assistantActionNote} role="status">{actionNote}</p> : null}
        </div>
      )}
    </AIAssistantPanel>
  );
}

export function ContinueScriptButton({ disabled, loading, onContinue }: ContinueScriptButtonProps) {
  return <ACSButton aria-busy={loading} className={styles.continueButton} disabled={disabled || loading} loading={loading} onClick={onContinue} size="large" variant="primary">进入剧本设计</ACSButton>;
}

function assistantStatusFor(pageState: CharacterStudioPageState) {
  if (pageState === "empty") return "empty" as const;
  if (pageState === "editing") return "thinking" as const;
  if (pageState === "local-error") return "error" as const;
  return "ready" as const;
}

function RelationshipPrimaryWorkspace({
  nodes,
  relation,
}: {
  nodes: readonly CharacterNode[];
  relation: CharacterRelation | undefined;
}) {
  const candidates = [
    "先让旧称呼暴露两人的熟悉感，再延后说明失踪真相。",
    "用一次未完成的交接强化互信，同时保留双方对风险判断的分歧。",
  ] as const;
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [adopted, setAdopted] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);

  if (!relation) {
    return (
      <div className={styles.relationshipPrimaryEmpty}>
        <strong>尚未选择关系</strong>
        <p>从下方完整关系工作区选择一条关系，开始核对人物与连续性。</p>
        <a href="#relationship-workspace">打开完整关系工作区</a>
      </div>
    );
  }

  const sourceName = nodeName(nodes, relation.sourceId);
  const targetName = nodeName(nodes, relation.targetId);
  const candidate = candidates[candidateIndex];

  return (
    <section className={styles.relationshipPrimary} aria-labelledby="relationship-primary-title">
      <div className={styles.relationshipPrimaryHeading}>
        <div>
          <h2 id="relationship-primary-title">关系设计画布</h2>
          <span className={styles.workLabel}>RELATIONSHIP DESIGN CANVAS</span>
        </div>
        <ACSBadge tone="neutral">当前关系 · LOCAL</ACSBadge>
      </div>

      <div className={styles.relationshipPrimaryLead}>
        <div>
          <span>当前关系</span>
          <strong>{sourceName} — {relation.relationType} → {targetName}</strong>
          <p>{relation.description}</p>
        </div>
        <dl>
          <div><dt>关系双方</dt><dd>{sourceName} / {targetName}</dd></div>
          <div><dt>关系类型</dt><dd>{relation.relationType}</dd></div>
          <div><dt>情绪方向</dt><dd>{relation.emotionalDirection}</dd></div>
        </dl>
      </div>

      <div className={styles.relationshipPrimaryGrid}>
        <section>
          <span>连续性核对</span>
          <h3>当前关系连续性</h3>
          {relation.continuityNotes.length > 0 ? (
            <ul>{relation.continuityNotes.map((note) => <li key={note}>{note}</li>)}</ul>
          ) : (
            <p className={styles.emptyNote}>暂无连续性备注</p>
          )}
          <small>工作提示：优先保持称呼、知情顺序与情绪距离一致。</small>
        </section>
        <section className={styles.relationshipCandidate} data-adopted={adopted || undefined}>
          <div><span>本地关系候选</span><ACSBadge tone={adopted ? "primary" : "ai"}>{adopted ? "已采用（LOCAL）" : "AI 候选"}</ACSBadge></div>
          <h3>叙事推进建议</h3>
          <p>{candidate}</p>
          <small>仅用于当前浏览器中的展示与比较，不写入任何正式项目。</small>
        </section>
      </div>

      <div className={styles.relationshipPrimaryActions}>
        <ACSButton onClick={() => setActionNote(`已聚焦查看 ${sourceName} 与 ${targetName} 的当前关系。`)} size="small" variant="ghost">查看关系</ACSButton>
        <ACSButton
          onClick={() => {
            setCandidateIndex((current) => (current + 1) % candidates.length);
            setAdopted(false);
            setActionNote("已生成新的本地关系候选；未发送或保存任何数据。");
          }}
          size="small"
          variant="secondary"
        >
          生成本地候选
        </ACSButton>
        <ACSButton
          onClick={() => {
            setAdopted(true);
            setActionNote("关系候选已采用到本地当前方向。");
          }}
          size="small"
          variant="primary"
        >
          采用候选
        </ACSButton>
        <a href="#relationship-workspace">打开完整关系工作区</a>
      </div>
      {actionNote ? <p className={styles.relationshipActionNote} role="status">{actionNote}</p> : null}
    </section>
  );
}

function ActiveCanvasSummary({
  area,
  character,
  activeAsset,
}: {
  area: Exclude<CharacterWorkspaceArea, "IDENTITY" | "RELATIONSHIP">;
  character: CharacterPreview;
  activeAsset: CharacterAssetPreview | undefined;
}) {
  const content = {
    APPEARANCE: {
      code: "APPEARANCE WORKFLOW",
      title: activeAsset?.label ?? "外观方向",
      copy: activeAsset ? `${activeAsset.label}正在作为候选参考参与比较。` : "选择一项视觉参考开始比较。",
      detail: character.appearance.costumeDirection,
    },
    PERSONALITY: {
      code: "PERSONALITY WORKFLOW",
      title: "当前规则与候选调整",
      copy: character.personality.speechStyle,
      detail: "潜在冲突：不主动解释创伤，与第 2 集可能出现的主动说明倾向需要核对。",
    },
    CONTINUITY: {
      code: "CURRENT STORY STAGE",
      title: character.state.arcStage,
      copy: character.state.personalityDelta,
      detail: character.state.continuityNotes[0],
    },
    CONSISTENCY: {
      code: "IDENTITY REVIEW",
      title: character.visualConsistency.status === "stale" ? "重新整理一致性预览" : "本地一致性预览",
      copy: character.visualConsistency.styleLabel,
      detail: character.visualConsistency.identityRules[0],
    },
  }[area];

  return (
    <div className={styles.activeCanvasSummary}>
      <span>{content.code}</span><h2>{content.title}</h2><p>{content.copy}</p>
      <div><strong>当前工作提示</strong><p>{content.detail}</p></div>
      <small>使用下方对应工作区继续编辑、比较或采用。</small>
    </div>
  );
}

export function CharacterStudioWorkspace({
  context,
  character,
  pageState,
  onUpdate,
  onSelectAsset,
  onAdoptAsset,
  onSelectCharacterNode,
  onSelectRelationship,
  onRebuildPreview,
  onConfirmPreview,
}: CharacterStudioWorkspaceProps) {
  const [assetViewerOpen, setAssetViewerOpen] = useState(false);
  const [viewerAssetId, setViewerAssetId] = useState<string | null>(character.visualConsistency.mainAssetId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(character.nodes.find((node) => node.isPrimary)?.id ?? null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(character.relationships[0]?.id ?? null);
  const [activeArea, setActiveArea] = useState<CharacterWorkspaceArea>("IDENTITY");
  const [activeIdentityField, setActiveIdentityField] = useState<IdentityField>("motivation");
  const [candidateRevision, setCandidateRevision] = useState(0);
  const [activeTask, setActiveTask] = useState<CharacterCandidateTask | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [adoptedCandidates, setAdoptedCandidates] = useState<Partial<Record<IdentityField, string>>>({});
  const [adoptedAssetId, setAdoptedAssetId] = useState<string | null>(null);
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [assistantActionNote, setAssistantActionNote] = useState<string | null>(null);
  const tabRefs = useRef(new Map<CharacterWorkspaceArea, HTMLButtonElement>());
  const assistantTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (assistantTimer.current !== null) window.clearTimeout(assistantTimer.current);
  }, []);

  const visibleCandidates = useMemo(() => {
    const catalog = candidateCatalog[activeIdentityField];
    const start = candidateRevision % catalog.length;
    return [catalog[start], catalog[(start + 1) % catalog.length]];
  }, [activeIdentityField, candidateRevision]);

  const selectedAsset = character.appearance.assets.find((asset) => asset.selected) ?? character.appearance.assets[0];
  const selectedRelation = character.relationships.find((relation) => relation.id === selectedRelationshipId);
  const candidateTaskMatchesCurrentScope = Boolean(
    activeTask
      && activeTask.status === "results"
      && activeTask.area === activeArea
      && activeTask.field === activeIdentityField
      && activeTask.revision === candidateRevision
      && visibleCandidates.length > 1,
  );
  const isStale = pageState === "stale-preview";
  const canContinue = !isStale && pageState !== "empty" && pageState !== "editing" && pageState !== "local-error";

  function openAsset(assetId: string) {
    setViewerAssetId(assetId);
    setAssetViewerOpen(true);
  }

  function selectArea(area: CharacterWorkspaceArea) {
    setActiveArea(area);
    setAssistantActionNote(null);
  }

  function handleTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + areaTabs.length) % areaTabs.length;
    else if (event.key === "ArrowRight") nextIndex = (index + 1) % areaTabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = areaTabs.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      const nextArea = areaTabs[nextIndex][0];
      selectArea(nextArea);
      tabRefs.current.get(nextArea)?.focus();
    }
  }

  function selectIdentityField(field: IdentityField) {
    setActiveIdentityField(field);
    if (activeTask?.field !== field) setSelectedCandidateId(null);
    selectArea("IDENTITY");
  }

  function generateCandidates() {
    const nextRevision = candidateRevision + 1;
    setCandidateRevision(nextRevision);
    const catalog = candidateCatalog[activeIdentityField];
    setSelectedCandidateId(catalog[nextRevision % catalog.length].id);
    setActiveTask({
      id: `character-studio:identity:${activeIdentityField}:${nextRevision}`,
      area: "IDENTITY",
      field: activeIdentityField,
      revision: nextRevision,
      status: "results",
    });
    setAssistantActionNote("本地候选已重新生成；没有发送或保存任何数据。");
  }

  function adoptCandidate(candidateId: string) {
    const candidate = candidateCatalog[activeIdentityField].find((item) => item.id === candidateId);
    if (!candidate) return;
    onUpdate({ area: "identity", field: candidate.field, value: candidate.value });
    setAdoptedCandidates((current) => ({ ...current, [candidate.field]: candidate.id }));
    setAssistantActionNote(`${candidate.label}已采用到本地当前方向。`);
  }

  function adoptAsset(assetId: string) {
    setAdoptedAssetId(assetId);
    onAdoptAsset?.(assetId);
    setAssistantActionNote("视觉候选已采用为本地当前参考。");
    selectArea("APPEARANCE");
  }

  function reanalyzeAssistant() {
    if (assistantTimer.current !== null) window.clearTimeout(assistantTimer.current);
    setAssistantThinking(true);
    setAssistantActionNote(null);
    assistantTimer.current = window.setTimeout(() => {
      setAssistantThinking(false);
      setAssistantActionNote(`${activeArea} 本地分析已更新。`);
      assistantTimer.current = null;
    }, 320);
  }

  return (
    <div aria-label={`${context.characterName}角色工作区`} className={styles.workspace}>
      <WorkspaceLayout
        candidateStrip={
          <CharacterCandidateStrip
            adoptedCandidateId={adoptedCandidates[activeIdentityField] ?? null}
            candidates={visibleCandidates}
            onAdoptCandidate={adoptCandidate}
            onReturnCurrent={() => setSelectedCandidateId(null)}
            onSelectCandidate={setSelectedCandidateId}
            selectedCandidateId={selectedCandidateId}
          />
        }
        candidateStripMode={candidateTaskMatchesCurrentScope ? "results" : "hidden"}
        className={styles.primaryWorkbench}
        contentLabel="角色设计画布"
        embedded
        inspector={
          <AICharacterAssistantPanel
            actionNote={assistantActionNote}
            insight={assistantInsights[activeArea]}
            onAdoptSuggestion={() => {
              if (activeArea === "IDENTITY" && selectedCandidateId) adoptCandidate(selectedCandidateId);
              else setAssistantActionNote("建议已加入本地工作方向，等待你在对应工作区确认。");
            }}
            onGenerateCandidate={activeArea === "IDENTITY" ? generateCandidates : () => setAssistantActionNote("已生成一条本地工作建议；没有连接外部服务。")}
            onRebuild={reanalyzeAssistant}
            onViewConflict={() => selectArea(activeArea === "IDENTITY" ? "PERSONALITY" : activeArea)}
            status={assistantThinking ? "thinking" : assistantStatusFor(pageState)}
            suggestions={[
              "先比较当前方向与候选，不直接覆盖当前版本。",
              "每次采用都会把一致性预览标记为需要重新整理。",
            ]}
            summary="镜构小构正在围绕当前工作区域提供分析、冲突、候选与下一步，不作为聊天或正式创作决策。"
          />
        }
        projectNavigator={
          <CharacterReferenceRail
            activeAssetId={selectedAsset?.id ?? null}
            adoptedAssetId={adoptedAssetId}
            character={character}
            onContextChange={selectArea}
            onOpenViewer={openAsset}
            onSelectAsset={onSelectAsset}
            statusLabel={context.statusLabel}
          />
        }
      >
        <section className={styles.designCanvas}>
          <div className={styles.workspaceTabs} aria-label="角色工作区导航" role="tablist">
            {areaTabs.map(([area, label], index) => (
              <button
                aria-controls={`character-canvas-${area.toLowerCase()}`}
                aria-selected={activeArea === area}
                id={`character-tab-${area.toLowerCase()}`}
                key={area}
                onClick={() => selectArea(area)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                ref={(node) => {
                  if (node) tabRefs.current.set(area, node);
                  else tabRefs.current.delete(area);
                }}
                role="tab"
                tabIndex={activeArea === area ? 0 : -1}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div aria-labelledby={`character-tab-${activeArea.toLowerCase()}`} id={`character-canvas-${activeArea.toLowerCase()}`} role="tabpanel">
            {activeArea === "IDENTITY" ? (
              <IdentityCanvas
                activeField={activeIdentityField}
                adoptedCandidateId={adoptedCandidates[activeIdentityField] ?? null}
                candidateSurface="external"
                candidates={visibleCandidates}
                onActiveFieldChange={selectIdentityField}
                onAdoptCandidate={adoptCandidate}
                onChange={onUpdate}
                onGenerateCandidates={generateCandidates}
                onReturnCurrent={() => setSelectedCandidateId(null)}
                onSelectCandidate={setSelectedCandidateId}
                selectedCandidateId={selectedCandidateId}
                value={character.identity}
              />
            ) : activeArea === "RELATIONSHIP" ? (
              <RelationshipPrimaryWorkspace nodes={character.nodes} relation={selectedRelation} />
            ) : (
              <ActiveCanvasSummary activeAsset={selectedAsset} area={activeArea} character={character} />
            )}
          </div>
        </section>
      </WorkspaceLayout>

      <div className={styles.secondaryNavigation} aria-label="角色制作次级工作区">
        <span>继续工作</span>
        {areaTabs.slice(1).map(([area, label]) => (
          <a href={`#${area.toLowerCase()}-workspace`} key={area} onClick={() => selectArea(area)}>{label}</a>
        ))}
      </div>

      <section className={styles.appearancePersonalityGrid}>
        <div id="appearance-workspace" tabIndex={-1}>
          <AppearanceBoard
            activeAssetId={selectedAsset?.id ?? null}
            adoptedAssetId={adoptedAssetId}
            onAdoptAsset={adoptAsset}
            onChange={onUpdate}
            onOpenViewer={openAsset}
            onSelectAsset={(assetId) => { onSelectAsset(assetId); selectArea("APPEARANCE"); }}
            value={character.appearance}
          />
        </div>
        <div id="personality-workspace" tabIndex={-1}>
          <PersonalityCard onChange={onUpdate} value={character.personality} />
        </div>
      </section>

      <section className={styles.stateRelationshipGrid}>
        <div id="continuity-workspace" tabIndex={-1}><CharacterStateCard readOnly state={character.state} /></div>
        <div id="relationship-workspace" tabIndex={-1}>
          <RelationshipGraph
            nodes={character.nodes}
            onSelectNode={(nodeId) => { setSelectedNodeId(nodeId); onSelectCharacterNode(nodeId); selectArea("RELATIONSHIP"); }}
            onSelectRelation={(relationId) => { setSelectedRelationshipId(relationId); onSelectRelationship(relationId); selectArea("RELATIONSHIP"); }}
            relations={character.relationships}
            selectedNodeId={selectedNodeId}
            selectedRelationId={selectedRelationshipId}
          />
        </div>
      </section>

      <div id="consistency-workspace" tabIndex={-1}>
        <VisualConsistencyPanel
          activeAssetId={selectedAsset?.id ?? null}
          assets={character.appearance.assets}
          onAdoptDirection={() => setAssistantActionNote("当前视觉方向已作为本地工作基线。")}
          onOpenAsset={openAsset}
          onRebuild={onRebuildPreview}
          preview={character.visualConsistency}
        />
      </div>

      <section className={styles.continueSection} aria-labelledby="continue-script-title">
        <div>
          <p className={styles.sectionEyebrow}>PRODUCTION PROGRESSION</p>
          <h2 id="continue-script-title">当前角色约束已在本地准备</h2>
          <p>{isStale ? "当前方向已调整，请先重新整理本地一致性预览。" : "下一阶段：Script Studio · 剧本仍由剧本工作室负责。"}</p>
        </div>
        <ContinueScriptButton disabled={!canContinue} loading={pageState === "editing"} onContinue={onConfirmPreview} />
      </section>

      <CharacterAssetViewer activeAssetId={viewerAssetId} assets={character.appearance.assets} onClose={() => setAssetViewerOpen(false)} onSelectAsset={setViewerAssetId} open={assetViewerOpen} />
    </div>
  );
}

export function EpisodePlanItemSelector({
  id,
  label,
  options,
  selectedClientKey,
  allowOpenEnd = false,
}: {
  id: string;
  label: string;
  options: readonly EpisodePlanItemOption[];
  selectedClientKey: string | null;
  allowOpenEnd?: boolean;
}) {
  return (
    <label className={styles.planItemSelector} htmlFor={id}>
      <span>{label}</span>
      <select defaultValue={selectedClientKey ?? ""} id={id}>
        {allowOpenEnd ? <option value="">未设置 · 开放区间</option> : null}
        {options.map((option) => (
          <option key={option.clientKey} value={option.clientKey}>
            {option.label} · {option.episodePlanItemRef ? "可信 Ref" : "LOCAL"}
          </option>
        ))}
      </select>
    </label>
  );
}

function CharacterDomainAlignmentPanel() {
  const project = useProjectPresentation();
  const conflicts = findStateIntervalOverlaps(
    project.characterStudio.stateIntervals,
    project.storyWorld.planItems,
  );

  return (
    <ACSCard className={styles.domainAlignmentPanel} padding="spacious">
      <div className={styles.domainAlignmentHeading}>
        <div>
          <p className={styles.sectionEyebrow}>ACCEPTED CHARACTER SURFACE</p>
          <h2>结构化阶段与关系边界</h2>
          <p>区间采用开始项包含、结束项不包含；结束未设置表示开放区间。</p>
        </div>
        <div className={styles.alignmentBadges}>
          <ACSBadge tone="neutral">{project.dataOrigin} · 非权威</ACSBadge>
          <ACSBadge tone="ai">设计探索区域不计入完成度</ACSBadge>
        </div>
      </div>

      <dl className={styles.identityRefs}>
        <div>
          <dt>本地 clientKey</dt>
          <dd>{project.characterStudio.characterClientKey}</dd>
        </div>
        <div>
          <dt>characterRef</dt>
          <dd>{project.characterStudio.characterRef ?? "未连接"}</dd>
        </div>
      </dl>

      <section className={styles.intervalSection} aria-labelledby="character-intervals-title">
        <div className={styles.sectionHeadingRow}>
          <h3 id="character-intervals-title">角色状态区间</h3>
          <ACSBadge tone={conflicts.length ? "warning" : "primary"}>
            {conflicts.length ? `${conflicts.length} 个区间冲突` : "区间检查通过"}
          </ACSBadge>
        </div>
        <div className={styles.intervalGrid}>
          {project.characterStudio.stateIntervals.map((interval) => (
            <article className={styles.intervalCard} data-conflict={conflicts.includes(interval.clientKey) || undefined} key={interval.clientKey}>
              <div className={styles.intervalTitle}>
                <strong>{interval.category}</strong>
                <small>{interval.intervalRef ?? "intervalRef 未连接"}</small>
              </div>
              <div className={styles.intervalSelectors}>
                <EpisodePlanItemSelector
                  id={`${interval.clientKey}-start`}
                  label="开始计划项"
                  options={project.storyWorld.planItems}
                  selectedClientKey={interval.startPlanItemClientKey}
                />
                <EpisodePlanItemSelector
                  allowOpenEnd
                  id={`${interval.clientKey}-end`}
                  label="结束计划项"
                  options={project.storyWorld.planItems}
                  selectedClientKey={interval.endPlanItemClientKey}
                />
              </div>
              <p>{interval.annotation}</p>
              {interval.category === "Location" && !interval.valueRef ? (
                <p className={styles.intervalWarning}>地点区间缺少可信 valueRef，当前仅为不完整本地草稿。</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.intervalSection} aria-labelledby="character-relationships-title">
        <h3 id="character-relationships-title">有时间边界的关系</h3>
        <div className={styles.relationshipIntervals}>
          {project.characterStudio.relationships.map((relationship) => (
            <article key={relationship.clientKey}>
              <strong>{relationship.sourceLabel} — {relationship.relationType} → {relationship.targetLabel}</strong>
              <span>{relationship.relationshipRef ?? "relationshipRef 未连接"}</span>
              <div className={styles.intervalSelectors}>
                <EpisodePlanItemSelector
                  id={`${relationship.clientKey}-start`}
                  label="开始计划项"
                  options={project.storyWorld.planItems}
                  selectedClientKey={relationship.startPlanItemClientKey}
                />
                <EpisodePlanItemSelector
                  allowOpenEnd
                  id={`${relationship.clientKey}-end`}
                  label="结束计划项"
                  options={project.storyWorld.planItems}
                  selectedClientKey={relationship.endPlanItemClientKey}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.referenceCollections} aria-label="角色引用集合">
        {[
          ["地点引用", project.characterStudio.locationRefs],
          ["道具引用", project.characterStudio.propRefs],
          ["时间线事件引用", project.characterStudio.timelineEventRefs],
        ].map(([label, refs]) => (
          <div key={label as string}>
            <strong>{label as string}</strong>
            <span>{(refs as readonly string[]).length ? (refs as readonly string[]).join("、") : "无可信 Ref · 等待 Story World 目录连接"}</span>
          </div>
        ))}
      </section>
    </ACSCard>
  );
}

function updateCharacter(current: CharacterPreview, payload: CharacterUpdatePayload): CharacterPreview {
  if (payload.area === "identity") return { ...current, identity: { ...current.identity, [payload.field]: payload.value }, visualConsistency: { ...current.visualConsistency, status: "stale" } };
  if (payload.area === "appearance") return { ...current, appearance: { ...current.appearance, [payload.field]: payload.value }, visualConsistency: { ...current.visualConsistency, status: "stale" } };
  return { ...current, personality: { ...current.personality, [payload.field]: payload.value }, visualConsistency: { ...current.visualConsistency, status: "stale" } };
}

function contextStatusFor(pageState: CharacterStudioPageState): CharacterContextStatus {
  if (pageState === "empty") return "等待设计";
  if (pageState === "editing") return "设计中";
  if (pageState === "stale-preview") return "预览已过期";
  if (pageState === "confirmed-preview" || pageState === "next-route-unavailable") return "本地确认";
  return "预览完成";
}

export function CharacterStudioPage() {
  const project = useProjectPresentation();
  const projectInitialCharacter = useMemo<CharacterPreview>(
    () => ({
      ...initialCharacter,
      name: project.display.characterName,
      role: project.display.characterRole,
    }),
    [project.display.characterName, project.display.characterRole],
  );
  const [character, setCharacter] = useState<CharacterPreview>(projectInitialCharacter);
  const [pageState, setPageState] = useState<CharacterStudioPageState>("consistency-preview-ready");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("lin-che");
  const [, setSelectedRelationId] = useState<string | null>("lin-che-gu-yan");
  const [nextStepOpen, setNextStepOpen] = useState(false);
  const rebuildTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (rebuildTimer.current !== null) window.clearTimeout(rebuildTimer.current);
  }, []);

  const context: CharacterContext = useMemo(() => ({
    characterName: character.name,
    roleLabel: "故事主角",
    stageLabel: "角色设计",
    statusLabel: contextStatusFor(pageState),
    seriesTitle: project.display.worldTitle,
    worldContextLabel: "记忆信用时代",
  }), [character.name, pageState, project.display.worldTitle]);

  const handleUpdate = useCallback((payload: CharacterUpdatePayload) => {
    setCharacter((current) => updateCharacter(current, payload));
    setPageState("stale-preview");
  }, []);

  const handleSelectAsset = useCallback((assetId: string) => {
    setCharacter((current) => ({ ...current, appearance: { ...current.appearance, assets: current.appearance.assets.map((asset) => ({ ...asset, selected: asset.id === assetId })) } }));
  }, []);

  const handleAdoptAsset = useCallback((assetId: string) => {
    handleSelectAsset(assetId);
    setCharacter((current) => ({ ...current, visualConsistency: { ...current.visualConsistency, status: "stale" } }));
    setPageState("stale-preview");
  }, [handleSelectAsset]);

  const handleRebuild = useCallback(() => {
    if (rebuildTimer.current !== null) window.clearTimeout(rebuildTimer.current);
    setPageState("editing");
    rebuildTimer.current = window.setTimeout(() => {
      setCharacter((current) => ({ ...current, visualConsistency: { ...current.visualConsistency, status: "ready" } }));
      setPageState("consistency-preview-ready");
      rebuildTimer.current = null;
    }, 360);
  }, []);

  function handleContinue() {
    setPageState("confirmed-preview");
    setNextStepOpen(true);
    window.setTimeout(() => setPageState("next-route-unavailable"), 0);
  }

  return (
    <CustomerLayout
      className={styles.characterStudioLayout}
      contained={false}
      data-page-state={pageState}
    >
      <div className={styles.page}>
        <CharacterContextBar context={context} />
        <CharacterStudioPageIntro />
        <CharacterStudioWorkspace
          character={{ ...character, nodes: character.nodes.map((node) => ({ ...node, isPrimary: node.id === selectedNodeId })), relationships: character.relationships }}
          context={context}
          onAdoptAsset={handleAdoptAsset}
          onConfirmPreview={handleContinue}
          onRebuildPreview={handleRebuild}
          onSelectAsset={handleSelectAsset}
          onSelectCharacterNode={setSelectedNodeId}
          onSelectRelationship={setSelectedRelationId}
          onUpdate={handleUpdate}
          pageState={pageState}
        />
        <CharacterDomainAlignmentPanel />
      </div>

      <ACSModal
        description="本地角色方向已确认"
        footer={<ACSButton fullWidth onClick={() => setNextStepOpen(false)} variant="primary">留在角色工作室</ACSButton>}
        onClose={() => setNextStepOpen(false)}
        open={nextStepOpen}
        size="small"
        title="剧本设计入口即将开放"
      >
        <div className={styles.nextStepContent}>
          <ACSBadge tone="primary">本地预览已确认</ACSBadge>
          <h3>角色方向已准备好进入剧本</h3>
          <p>剧本设计功能尚未开放，你可以继续留在这里完善角色方向。</p>
          <p>当前确认只保留为本地创作预览，不会发布或提交正式制作内容。</p>
        </div>
      </ACSModal>
    </CustomerLayout>
  );
}
