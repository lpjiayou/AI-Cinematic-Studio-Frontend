# Character Studio — Relationship Visual Specification

Version: `V4.1`

## Purpose

Show narrative relationships that will later align with M6 RelationshipContext.

## Visual Model

Elements:
- character node;
- relation line;
- relation type;
- emotional direction;
- concise relationship description.

Primary character is visually emphasized.

## Graph Rules

- simple cinematic graph;
- maximum prototype graph density should remain readable;
- no database-style port/edge editor;
- no free-form node dragging required;
- visual edges are decorative for assistive technology.

## Accessible Equivalent

A relation list is mandatory and contains the same semantic information.

Each row:
`林澈 — 对立 / 不信任 → 记忆议会`

with a real detail button.

## Detail

Desktop:
ACSModal.

Mobile:
ACSDrawer permitted.

Detail contains:
- source;
- target;
- relation type;
- emotional direction;
- description;
- every `CharacterRelation.continuityNotes` entry as readable HTML;
- an explicit empty-state label `暂无连续性备注` when the array is empty.

## Keyboard

Graph node and relation-list controls:
- Tab reachable;
- Enter/Space opens detail;
- visible focus;
- >=44×44px;
- modal/drawer returns focus.

## Acceptance

PASS when relation meaning is understandable without visual lines and the graph does not resemble a technical graph database.
