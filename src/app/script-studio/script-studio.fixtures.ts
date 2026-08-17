import type {
  NarrativeFindingPreview,
  ScriptLocalSnapshot,
  ScriptRewriteCandidate,
  ScriptSceneProjection,
  ScriptWorkspaceContext,
  UpstreamConstraintItem,
} from "./script-studio.types";
import { fingerprintScene, cloneScenes } from "./script-studio.local-service";

export const scriptWorkspaceContext: ScriptWorkspaceContext = {
  projectTitle: "未来之城",
  seriesTitle: "未来纪事",
  episodeLabel: "第 3 集 · 雨夜来客",
  stageLabel: "剧本制作",
  authorityLabel: "本地演示",
};

export const initialScenes: readonly ScriptSceneProjection[] = [
  {
    uiSceneKey: "ui-scene-08",
    ordinal: 8,
    actLabel: "第一幕 · 一种不祥的到来",
    title: "雨夜 · 城市全景",
    slugline: "外景 · 雨夜 · 城市全景",
    status: "current",
    candidateCount: 0,
    findingCount: 1,
    blocks: [
      { uiBlockKey: "ui-block-08-01", kind: "scene-heading", text: "外景 · 雨夜 · 城市全景" },
      { uiBlockKey: "ui-block-08-02", kind: "action", text: "雨幕压低了城市的天际线，列车从高架桥下掠过。" },
    ],
  },
  {
    uiSceneKey: "ui-scene-09",
    ordinal: 9,
    actLabel: "第一幕 · 一种不祥的到来",
    title: "林澈公寓 · 夜",
    slugline: "内景 · 林澈公寓 · 夜",
    status: "edited",
    candidateCount: 0,
    findingCount: 0,
    blocks: [
      { uiBlockKey: "ui-block-09-01", kind: "scene-heading", text: "内景 · 林澈公寓 · 夜" },
      { uiBlockKey: "ui-block-09-02", kind: "action", text: "桌上的旧车票被风吹落，停在林澈脚边。" },
    ],
  },
  {
    uiSceneKey: "ui-scene-10",
    ordinal: 10,
    actLabel: "第一幕 · 一种不祥的到来",
    title: "码头 · 夜",
    slugline: "外景 · 码头 · 夜",
    status: "edited",
    candidateCount: 0,
    findingCount: 0,
    blocks: [
      { uiBlockKey: "ui-block-10-01", kind: "scene-heading", text: "外景 · 码头 · 夜" },
      { uiBlockKey: "ui-block-10-02", kind: "action", text: "货轮的汽笛在雾里拉出一条低沉的回声。" },
    ],
  },
  {
    uiSceneKey: "ui-scene-11",
    ordinal: 11,
    actLabel: "第一幕 · 一种不祥的到来",
    title: "地下通道 · 夜",
    slugline: "内景 · 地下通道 · 夜",
    status: "candidate",
    candidateCount: 1,
    findingCount: 0,
    blocks: [
      { uiBlockKey: "ui-block-11-01", kind: "scene-heading", text: "内景 · 地下通道 · 夜" },
      { uiBlockKey: "ui-block-11-02", kind: "action", text: "林澈沿着渗水的墙面向旧车站走去。" },
    ],
  },
  {
    uiSceneKey: "ui-scene-12",
    ordinal: 12,
    actLabel: "第一幕 · 一种不祥的到来",
    title: "旧车站 · 夜",
    slugline: "内景 · 旧车站 · 夜",
    status: "candidate",
    candidateCount: 1,
    findingCount: 1,
    blocks: [
      { uiBlockKey: "ui-block-12-01", kind: "scene-heading", text: "内景 · 旧车站 · 夜" },
      { uiBlockKey: "ui-block-12-02", kind: "action", text: "林澈推开旧车站的门，风卷着雨气扑面而来。" },
      { uiBlockKey: "ui-block-12-03", kind: "character", text: "林澈（低声）", speakerLabel: "林澈" },
      { uiBlockKey: "ui-block-12-04", kind: "dialogue", text: "这里，比想象中更冷。", speakerLabel: "林澈" },
      { uiBlockKey: "ui-block-12-05", kind: "action", text: "他环顾四周，空荡的候车室里，钟表滴答作响。" },
      { uiBlockKey: "ui-block-12-06", kind: "action", text: "一个人影从阴影里走出。" },
      { uiBlockKey: "ui-block-12-07", kind: "character", text: "神秘人", speakerLabel: "神秘人" },
      { uiBlockKey: "ui-block-12-08", kind: "dialogue", text: "你来得太晚了，林澈。", speakerLabel: "神秘人" },
      { uiBlockKey: "ui-block-12-09", kind: "character", text: "林澈", speakerLabel: "林澈" },
      { uiBlockKey: "ui-block-12-10", kind: "dialogue", text: "我来得够早了。", speakerLabel: "林澈" },
      { uiBlockKey: "ui-block-12-11", kind: "character", text: "神秘人", speakerLabel: "神秘人" },
      { uiBlockKey: "ui-block-12-12", kind: "dialogue", text: "有些东西，错过了就回不来。", speakerLabel: "神秘人" },
      { uiBlockKey: "ui-block-12-13", kind: "character", text: "林澈", speakerLabel: "林澈" },
      { uiBlockKey: "ui-block-12-14", kind: "dialogue", text: "我不是为了挽回什么。\n（停顿）", speakerLabel: "林澈" },
      { uiBlockKey: "ui-block-12-15", kind: "character", text: "神秘人", speakerLabel: "神秘人" },
      { uiBlockKey: "ui-block-12-16", kind: "dialogue", text: "真相？你能承受吗？", speakerLabel: "神秘人" },
      { uiBlockKey: "ui-block-12-17", kind: "action", text: "林澈没有回答，只是往前走了一步。" },
    ],
  },
  {
    uiSceneKey: "ui-scene-13",
    ordinal: 13,
    actLabel: "第一幕 · 一种不祥的到来",
    title: "天台 · 夜",
    slugline: "外景 · 天台 · 夜",
    status: "read-only",
    candidateCount: 0,
    findingCount: 0,
    blocks: [
      { uiBlockKey: "ui-block-13-01", kind: "scene-heading", text: "外景 · 天台 · 夜", readOnly: true },
      { uiBlockKey: "ui-block-13-02", kind: "action", text: "城市的灯火在雨后重新亮起。", readOnly: true },
    ],
  },
  {
    uiSceneKey: "ui-scene-14",
    ordinal: 14,
    actLabel: "第二幕 · 线索浮现",
    title: "资料室 · 夜",
    slugline: "内景 · 资料室 · 夜",
    status: "read-only",
    candidateCount: 0,
    findingCount: 0,
    blocks: [
      { uiBlockKey: "ui-block-14-01", kind: "scene-heading", text: "内景 · 资料室 · 夜", readOnly: true },
      { uiBlockKey: "ui-block-14-02", kind: "action", text: "尘封的档案盒被依次摆上长桌。", readOnly: true },
    ],
  },
  {
    uiSceneKey: "ui-scene-15",
    ordinal: 15,
    actLabel: "第二幕 · 线索浮现",
    title: "市区街道 · 夜",
    slugline: "外景 · 市区街道 · 夜",
    status: "read-only",
    candidateCount: 0,
    findingCount: 0,
    blocks: [
      { uiBlockKey: "ui-block-15-01", kind: "scene-heading", text: "外景 · 市区街道 · 夜", readOnly: true },
      { uiBlockKey: "ui-block-15-02", kind: "action", text: "林澈穿过最后一班夜车留下的水雾。", readOnly: true },
    ],
  },
];

const activeScene = initialScenes.find((scene) => scene.uiSceneKey === "ui-scene-12")!;

export const initialCandidate: ScriptRewriteCandidate = {
  candidateId: "candidate-local-01",
  kind: "dialogue",
  target: { kind: "scene", uiSceneKey: activeScene.uiSceneKey },
  title: "对白节奏候选",
  proposedText: "让对话更克制，让人物关系的张力留在停顿与暗示中。",
  rationale: "减少解释性表达，保留人物的试探与压迫感。",
  sourceLabel: "本地 AI 候选",
  status: "selected",
  sourceFingerprint: fingerprintScene(activeScene),
  replacements: [
    { uiBlockKey: "ui-block-12-08", proposedText: "你终于来了，林澈。", changeLabel: "语气更克制" },
    { uiBlockKey: "ui-block-12-10", proposedText: "我并不指望被欢迎。", changeLabel: "人物态度更清晰" },
    { uiBlockKey: "ui-block-12-12", proposedText: "有些东西，回来之后也改变了。", changeLabel: "悬念更集中" },
    { uiBlockKey: "ui-block-12-14", proposedText: "我只是想知道真相。\n（停顿）", changeLabel: "目标更明确" },
    { uiBlockKey: "ui-block-12-16", proposedText: "真相，从来不等人。", changeLabel: "收束更有力量" },
  ],
};

export const initialLocalHistory: readonly ScriptLocalSnapshot[] = [
  {
    localSnapshotId: "local-snapshot-entry",
    label: "进入工作区时",
    description: "本次会话的初始剧本投影",
    createdLabel: "本次会话",
    source: "entry",
    scenes: cloneScenes(initialScenes),
  },
];

export const upstreamConstraints: readonly UpstreamConstraintItem[] = [
  {
    owner: "M6",
    category: "character",
    title: "林澈 · 对白规则",
    summary: "短句、低声、少修饰；回避克制、内敛、观察优先。",
  },
  {
    owner: "M6",
    category: "world",
    title: "未来之城 · 记忆信用时代",
    summary: "2148 年的城市按记忆信用分层；记忆交换必须付出情绪代价。",
  },
  {
    owner: "M5",
    category: "episode",
    title: "本集目标",
    summary: "林澈重新进入失踪案，并第一次怀疑旧车站的时间记录。",
  },
];

export const narrativeFindings: readonly NarrativeFindingPreview[] = [
  {
    findingId: "finding-local-01",
    category: "character",
    title: "语气偏直接",
    description: "林澈在旧车站与神秘人的对话过于直接，可强化“试探与压制”的张力。",
    severity: "warning",
    target: { kind: "block", uiSceneKey: "ui-scene-12", uiBlockKey: "ui-block-12-14" },
    authority: "local-preview",
  },
  {
    findingId: "finding-local-02",
    category: "continuity",
    title: "钟表线索可前置",
    description: "可让钟表声先于人物出现，强化旧车站的时间异常。",
    severity: "info",
    target: { kind: "block", uiSceneKey: "ui-scene-12", uiBlockKey: "ui-block-12-05" },
    authority: "local-preview",
  },
];
