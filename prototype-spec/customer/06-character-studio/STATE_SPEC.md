# Character Studio — State Specification

Version: `V4.1`

## State Union

```ts
export type CharacterStudioPageState =
  | "empty"
  | "editing"
  | "preview-ready"
  | "consistency-preview-ready"
  | "confirmed-preview"
  | "stale-preview"
  | "local-error"
  | "next-route-unavailable";
```

## Empty

No meaningful character content.

UI:
- overview visual remains;
- guided identity copy;
- CTA disabled.

Copy:
`从角色背景、动机和冲突开始建立角色身份。`

## Editing

Local fields changed.

UI:
- local status `设计中`;
- consistency preview becomes stale after a relevant identity/appearance change;
- no Provider call.

## Preview Ready

Narrative character preview exists:
- identity;
- appearance;
- personality;
- state;
- relationships.

This does not mean M6/V5 state exists.

## Consistency Preview Ready

Local visual consistency preview can be shown.

Allowed label:
`本地一致性预览`

Forbidden labels:
- `Identity Locked`
- `身份锁定完成`
- `Production Ready`

## Confirmed Preview

User accepted the local character direction.

It does NOT mean:
- CharacterDefinition persisted;
- CharacterState persisted;
- Identity Lock created;
- asset registered;
- consistency validation passed in M6;
- Script constraint binding persisted.

## Stale Preview

If identity/appearance/personality/state changes after local confirmation:
- old consistency preview is marked stale;
- confirmation cannot remain visually authoritative;
- user must rebuild local preview.

This is local UI staleness, not M6 persistence semantics.

## Local Error

Copy:
`角色预览暂时无法准备，请检查当前角色设定后重试。`

No technical/provider/database errors.

## Next Route Unavailable

If Script Studio route is not connected:
- remain on page;
- show guided state;
- no 404;
- no false persistence success.

## Theme

Theme is global ACS Theme Provider state, not CharacterStudioPageState.
