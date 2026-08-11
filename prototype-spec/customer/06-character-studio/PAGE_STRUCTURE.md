# Character Studio — Page Structure

Version: `V4.1`

## Global Layout

```text
Customer Header
↓
Character Context Bar
↓
Page Intro
↓
Character Overview
↓
Identity + Appearance Workspace
↓
Personality + Character State
↓
Relationship Graph
↓
Visual Consistency Preview
↓
AI Character Suggestions
↓
Continue to Script Studio
```

## Header

Reuse CustomerLayout/current customer header.

Show:
- brand;
- back to Story World;
- theme;
- help;
- user/workspace.

Do not show:
- characterRef;
- identityRef;
- assetRef;
- GPU/provider/job;
- internal approval ids.

## Context Bar

Customer-visible:
- series/world title;
- character name;
- role;
- current stage `角色设计`;
- local preview status.

## Page Intro

Eyebrow:
`CHARACTER STUDIO`

Title:
`让角色拥有可以持续保持的一致身份`

Subtitle:
`把世界设定转化为角色背景、动机、行为、关系和视觉方向，为剧本与镜头提供稳定的角色约束。`

## Character Overview

One large card containing:
- main character visual;
- name;
- role;
- one-sentence summary;
- current local status;
- optional arc-stage label.

## Identity + Appearance Workspace

Desktop:
- Identity Canvas 46%;
- Appearance Board 54%;
- gap = ACS 24px-equivalent spacing.

Identity contains:
- background;
- motivation;
- belief;
- conflict;
- goal;
- forbidden behaviors preview;
- continuity notes preview.

Appearance contains:
- main visual;
- face;
- hair;
- costume;
- body;
- props;
- local asset thumbnails.

## Personality + Character State

Personality:
- traits;
- behavior rules;
- speech style;
- emotional pattern;
- dialogue rules.

Character State:
- arc stage;
- episode applicability label;
- personality delta;
- relationship delta;
- appearance notes;
- continuity notes.

Phase 1 is preview/local editing only.

## Relationship Graph

Shows:
- primary character;
- related characters;
- relationship type;
- emotional direction;
- concise relation detail;
- continuity-note detail for the selected relationship.

Visual graph is supplemented by an accessible relation list.

## Visual Consistency Preview

Shows:
- main visual;
- reference assets;
- identity rules;
- palette;
- style;
- consistency notes;
- `本地一致性预览` badge.

Must not say:
`Identity Locked`
or
`已完成身份锁`.

## AI Character Suggestions

Structured assistant summary:
- identity gap;
- behavior conflict;
- world mismatch;
- visual consistency hint;
- next-step suggestion.

Not chat.

## CTA

Label:
`进入剧本设计`

Phase 1:
- confirms local preview only;
- if Script route is unavailable, show guided state;
- no Script Entity or Domain write.
