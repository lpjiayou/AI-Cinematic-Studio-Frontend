import type {
  CandidateId,
  ScriptCanvasSelection,
  ScriptCandidateKind,
  ScriptRewriteCandidate,
  ScriptSceneProjection,
  UISceneKey,
} from "./script-studio.types";

export function cloneScenes(scenes: readonly ScriptSceneProjection[]): ScriptSceneProjection[] {
  return scenes.map((scene) => ({
    ...scene,
    blocks: scene.blocks.map((block) => ({ ...block })),
  }));
}

export function fingerprintScene(scene: ScriptSceneProjection): string {
  return JSON.stringify(
    scene.blocks.map((block) => [block.uiBlockKey, block.kind, block.text]),
  );
}

export function fingerprintDocument(scenes: readonly ScriptSceneProjection[]): string {
  return JSON.stringify(
    scenes.map((scene) => [
      scene.uiSceneKey,
      scene.blocks.map((block) => [block.uiBlockKey, block.kind, block.text]),
    ]),
  );
}

function selectionText(scene: ScriptSceneProjection, selection: ScriptCanvasSelection): string {
  if (selection.kind === "scene") {
    return scene.blocks.map((block) => block.text).join("\n");
  }

  const block = scene.blocks.find((item) => item.uiBlockKey === selection.uiBlockKey);
  if (!block) return "";

  if (selection.kind === "text") {
    return block.text.slice(selection.start, selection.end);
  }

  return block.text;
}

function proposedTextFor(kind: ScriptCandidateKind, text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();

  switch (kind) {
    case "condense":
      return compact.length > 28 ? `${compact.slice(0, 26)}。` : compact;
    case "expand":
      return `${compact} 空气停了一瞬，人物没有立刻移开视线。`;
    case "dialogue":
      return compact.replace(/。$/, "") + "。";
    case "pacing":
      return `${compact}\n（短暂停顿）`;
    default:
      return compact.replace("更冷", "冷得反常");
  }
}

export async function generateLocalCandidate({
  scene,
  selection,
  kind,
  candidateId,
  delay = 420,
}: {
  scene: ScriptSceneProjection;
  selection: ScriptCanvasSelection;
  kind: ScriptCandidateKind;
  candidateId: CandidateId;
  delay?: number;
}): Promise<ScriptRewriteCandidate> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, delay));

  const sourceText = selectionText(scene, selection).trim();
  if (!sourceText) {
    throw new Error("EMPTY_SELECTION");
  }

  const targetBlock =
    selection.kind === "scene"
      ? scene.blocks.find((block) => block.kind === "dialogue") ?? scene.blocks[0]
      : scene.blocks.find((block) => block.uiBlockKey === selection.uiBlockKey);

  if (!targetBlock) {
    throw new Error("MISSING_TARGET");
  }

  const proposedText = proposedTextFor(kind, targetBlock.text);

  return {
    candidateId,
    kind,
    target: selection,
    title: kind === "dialogue" ? "对白调整候选" : "场景改写候选",
    proposedText,
    rationale: "在保留当前剧情事实的前提下，收紧表达并强化人物动作。",
    sourceLabel: "本地 AI 候选",
    status: "selected",
    sourceFingerprint: fingerprintScene(scene),
    replacements: [
      {
        uiBlockKey: targetBlock.uiBlockKey,
        proposedText,
        changeLabel: "本地候选改写",
      },
    ],
  };
}

export function applyCandidateToScenes(
  scenes: readonly ScriptSceneProjection[],
  candidate: ScriptRewriteCandidate,
): ScriptSceneProjection[] {
  const targetSceneKey: UISceneKey = candidate.target.uiSceneKey;
  const replacementMap = new Map(
    candidate.replacements.map((replacement) => [replacement.uiBlockKey, replacement.proposedText]),
  );

  return scenes.map((scene) => {
    if (scene.uiSceneKey !== targetSceneKey) return { ...scene, blocks: scene.blocks.map((block) => ({ ...block })) };

    return {
      ...scene,
      status: "edited",
      blocks: scene.blocks.map((block) => ({
        ...block,
        text: replacementMap.get(block.uiBlockKey) ?? block.text,
      })),
    };
  });
}
