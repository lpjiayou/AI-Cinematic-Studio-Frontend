# Character Studio — Asset Content Specification

Version: `V4.1`

## Runtime Tree

```text
public/assets/character-studio/
├─ hero/
│  └─ character-overview.webp
├─ identity/
│  └─ identity-board.webp
├─ appearance/
│  ├─ character-face.webp
│  ├─ character-costume.webp
│  └─ character-props.webp
├─ relation/
│  └─ relationship-board.webp
└─ ASSET_PROVENANCE.md
```

## Identity Invariance Rule

All images represent the same approved prototype character identity.

Light/Dark UI themes do not substitute a different face, body, costume identity or age.

Theme changes surrounding ACS surfaces/overlays only.

## character-overview.webp

Purpose:
primary cinematic character visual.

Scene:
- character in the established Story World environment;
- full/three-quarter body readable;
- environment explains role/era;
- cinematic photography;
- not a passport/headshot image.

Technical:
- WebP;
- 16:9;
- minimum 1920×1080;
- recommended 2560×1440.

Focal point:
- X = 62%;
- Y = 34%.

Desktop/tablet safe zone:
- X = 35%–82%;
- Y = 10%–92%.

Default object-position:
`62% 45%`.

Mobile crop limits:
- crop source X = 38%–86%;
- crop source Y = 8%–96%;
- object-position X must remain 56%–68%;
- object-position Y must remain 38%–52%;
- maximum scale/zoom = 1.12;
- face and torso must remain visible.

Exact Alt:
`电影角色站在所属世界环境中的整体身份与视觉设定`

## identity-board.webp

Purpose:
identity and narrative reference board.

Content:
- character silhouette/profile;
- world-context references;
- symbolic motivation/conflict imagery;
- non-readable note textures;
- no real UI.

Technical:
- WebP;
- 16:9;
- minimum 1600×900.

Focal point:
- X = 56%;
- Y = 46%.

Desktop/tablet safe zone:
- X = 25%–82%;
- Y = 12%–88%.

Default object-position:
`56% 46%`.

Mobile crop limits:
- crop source X = 34%–80%;
- crop source Y = 10%–92%;
- object-position X must remain 50%–62%;
- object-position Y must remain 42%–54%;
- maximum scale/zoom = 1.10;
- character silhouette and conflict/motivation anchors must remain visible.

Exact Alt:
`展示电影角色背景、动机、信念、目标和核心冲突的身份视觉设计板`

## character-face.webp

Purpose:
face/age/expression direction.

Content:
- same character face;
- neutral plus restrained expression references;
- age and facial geometry readable;
- no celebrity likeness;
- no collage text.

Technical:
- WebP;
- 4:3;
- minimum 1024×768.

Focal point:
- X = 50%;
- Y = 40%.

Desktop/tablet safe zone:
- X = 28%–72%;
- Y = 12%–82%.

Default object-position:
`50% 40%`.

Mobile crop limits:
- crop source X = 30%–70%;
- crop source Y = 8%–88%;
- object-position X must remain 46%–54%;
- object-position Y must remain 36%–46%;
- maximum scale/zoom = 1.12;
- both eyes, nose, mouth, jawline and hairline must remain visible.

Exact Alt:
`电影角色面部特征、年龄感和表情方向参考`

## character-costume.webp

Purpose:
costume/material/world-culture direction.

Content:
- same character;
- approved costume silhouette;
- material details;
- world/occupation consistency;
- no unrelated alternate identity.

Technical:
- WebP;
- 4:3;
- minimum 1024×768.

Focal point:
- X = 50%;
- Y = 48%.

Desktop/tablet safe zone:
- X = 18%–82%;
- Y = 8%–95%.

Default object-position:
`50% 48%`.

Mobile crop limits:
- crop source X = 24%–76%;
- crop source Y = 6%–96%;
- object-position X must remain 46%–54%;
- object-position Y must remain 44%–54%;
- maximum scale/zoom = 1.10;
- face plus principal costume silhouette/material area must remain visible.

Exact Alt:
`电影角色服装轮廓、材质和世界文化风格参考`

## character-props.webp

Purpose:
signature objects/tools.

Content:
- tools, symbolic object or weapon only when story requires;
- same world art direction;
- no branded real-world protected product presentation.

Technical:
- WebP;
- 4:3;
- minimum 1024×768.

Focal point:
- X = 54%;
- Y = 50%.

Desktop/tablet safe zone:
- X = 18%–86%;
- Y = 14%–88%.

Default object-position:
`54% 50%`.

Mobile crop limits:
- crop source X = 26%–80%;
- crop source Y = 10%–92%;
- object-position X must remain 50%–60%;
- object-position Y must remain 46%–54%;
- maximum scale/zoom = 1.10;
- at least the primary prop and one supporting object must remain fully legible.

Exact Alt:
`电影角色标志性道具、工作工具和重要物件参考`

## relationship-board.webp

Purpose:
cinematic supporting relation visual.

Content:
- primary character plus related character silhouettes/portraits;
- emotional distance/tension;
- no readable social-network UI;
- visual lines may be baked as non-semantic graphic, but all relation text remains HTML.

Technical:
- WebP;
- 16:9;
- minimum 1600×900.

Focal point:
- X = 52%;
- Y = 46%.

Desktop/tablet safe zone:
- X = 14%–88%;
- Y = 10%–90%.

Default object-position:
`52% 46%`.

Mobile crop limits:
- crop source X = 18%–84%;
- crop source Y = 8%–92%;
- object-position X must remain 48%–56%;
- object-position Y must remain 42%–52%;
- maximum scale/zoom = 1.08;
- the primary character and at least one related-character cluster must remain visible.

Exact Alt:
`展示主要电影角色之间关系、情绪距离和叙事张力的视觉设计板`

## Rights / Provenance

Implementation must create:
`public/assets/character-studio/ASSET_PROVENANCE.md`

For every asset record:
- exact path;
- source method;
- generation/creation date;
- rights status;
- internal prototype flag;
- prompt/reference id when applicable;
- character-identity consistency note.

Allowed:
- project-generated;
- owned;
- licensed.

Forbidden:
- celebrity photo;
- unlicensed commercial character/IP;
- scraped movie still;
- random remote URL.

## Next.js Rendering

- Next.js Image;
- intrinsic width/height or fill in stable ratio wrapper;
- correct sizes;
- priority only for above-fold overview image;
- no CLS;
- fallback maintains same container;
- exact Alt;
- decorative overlays aria-hidden.
