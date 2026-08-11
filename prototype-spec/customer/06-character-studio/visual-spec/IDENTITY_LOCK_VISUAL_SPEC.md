# Character Studio — Identity Lock Preview Visual Specification

Version: `V4.1`

## Purpose

Present identity consistency concepts without pretending that V5 Identity Lock has been created.

## Allowed Labels

- `身份方向`
- `视觉一致性预览`
- `本地一致性预览`
- `待后续身份锁接入`

## Forbidden Labels

- `Identity Locked`
- `身份已锁定`
- `生产身份已确认`
- `V5 Identity Approved`

## Visual Structure

```text
Main Character Visual
↓
Reference Assets
↓
Identity Rules
↓
Palette / Style
↓
Consistency Notes
```

## Rules

- same character face/body identity across displayed images;
- costume variants must remain compatible with world and role;
- visual rules are readable HTML;
- no lock icon that implies authoritative approval unless labeled as preview;
- no backend ids;
- no verification score pretending to be real.

## Interaction

- open asset;
- navigate references;
- view identity rules;
- rebuild local preview after edits.

No:
- save Identity Lock;
- approve identity;
- publish asset;
- register asset.

## Staleness

After identity/appearance changes:
- local consistency preview becomes stale;
- display `需要重新整理`;
- previous local confirmation loses visual authority.

## Acceptance

PASS when users understand the intended consistency direction but cannot mistake it for a persisted Identity Lock.
