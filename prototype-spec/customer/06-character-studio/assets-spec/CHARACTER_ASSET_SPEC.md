# Character Studio — Runtime Asset Implementation Specification

Version: `V4.1`

## Runtime Files

```text
public/assets/character-studio/
├─ hero/character-overview.webp
├─ identity/identity-board.webp
├─ appearance/character-face.webp
├─ appearance/character-costume.webp
├─ appearance/character-props.webp
├─ relation/relationship-board.webp
└─ ASSET_PROVENANCE.md
```

## Shared Rendering Contract

All images:
- local files only;
- WebP preferred;
- Next.js Image;
- stable aspect-ratio container;
- no CLS;
- exact Alt from root ASSET_SPEC;
- no baked readable UI/text/logo;
- Light/Dark preserve identical character identity.

## Exact Asset Geometry

| Asset | Min Size / Ratio | Focal X/Y | Desktop Safe X/Y | Mobile Crop Source X/Y | Mobile object-position X/Y | Max Zoom |
|---|---|---|---|---|---|---|
| character-overview.webp | 1920×1080 / 16:9 | 62% / 34% | 35–82% / 10–92% | 38–86% / 8–96% | 56–68% / 38–52% | 1.12 |
| identity-board.webp | 1600×900 / 16:9 | 56% / 46% | 25–82% / 12–88% | 34–80% / 10–92% | 50–62% / 42–54% | 1.10 |
| character-face.webp | 1024×768 / 4:3 | 50% / 40% | 28–72% / 12–82% | 30–70% / 8–88% | 46–54% / 36–46% | 1.12 |
| character-costume.webp | 1024×768 / 4:3 | 50% / 48% | 18–82% / 8–95% | 24–76% / 6–96% | 46–54% / 44–54% | 1.10 |
| character-props.webp | 1024×768 / 4:3 | 54% / 50% | 18–86% / 14–88% | 26–80% / 10–92% | 50–60% / 46–54% | 1.10 |
| relationship-board.webp | 1600×900 / 16:9 | 52% / 46% | 14–88% / 10–90% | 18–84% / 8–92% | 48–56% / 42–52% | 1.08 |

## Exact Alt

- character-overview.webp: `电影角色站在所属世界环境中的整体身份与视觉设定`
- identity-board.webp: `展示电影角色背景、动机、信念、目标和核心冲突的身份视觉设计板`
- character-face.webp: `电影角色面部特征、年龄感和表情方向参考`
- character-costume.webp: `电影角色服装轮廓、材质和世界文化风格参考`
- character-props.webp: `电影角色标志性道具、工作工具和重要物件参考`
- relationship-board.webp: `展示主要电影角色之间关系、情绪距离和叙事张力的视觉设计板`

## Mobile Preservation Rules

- Overview: face and torso remain visible.
- Identity: silhouette plus motivation/conflict anchors remain visible.
- Face: eyes, nose, mouth, jawline and hairline remain visible.
- Costume: face plus principal costume silhouette/material area remain visible.
- Props: primary prop plus one supporting object remain fully legible.
- Relationship: primary character plus at least one related-character cluster remain visible.

## Theme Pairing

The same source assets should normally render in both themes.

If derivatives are later introduced:
- face/body/costume identity remains identical;
- focal/safe/mobile coordinates remain equivalent;
- only lighting/presentation treatment may differ.

## Provenance

`ASSET_PROVENANCE.md` must include every exact path plus:
- source method;
- creation date;
- rights status;
- internal prototype flag;
- prompt/reference id when applicable;
- identity-consistency note.

Allowed:
- project-generated;
- owned;
- licensed.

Forbidden:
- celebrity likeness;
- unlicensed commercial character/IP;
- scraped movie still;
- random remote URL.

## Acceptance

All six assets must:
- exist locally;
- satisfy min size/ratio;
- satisfy focal/safe/mobile crop bounds above;
- use exact Alt;
- preserve identity in Light/Dark;
- have provenance;
- render through Next.js Image;
- produce zero CLS.
