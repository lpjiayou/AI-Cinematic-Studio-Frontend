# Character Studio — Character Canvas Specification

Version: `V4.1`

## Purpose

Define the composition of Character Overview, Identity, Appearance, Personality, State, Relationship and Consistency areas.

## Desktop

Overview full width.

Identity/Appearance:
46/54.

Personality/State:
46/54.

Relationship:
full width.

Visual Consistency:
full width.

AI Suggestions:
full width.

## Character Overview

Uses:
- main character image;
- name;
- role;
- summary;
- arc-stage preview;
- local status.

Image dominates without becoming a marketing hero.

## Identity Canvas

Semantic editable content:
- background;
- motivation;
- belief;
- conflict;
- goal.

Read-only support:
- forbidden behaviors;
- continuity notes.

No technical identity fields.

## Appearance Board

Media-first area:
- main asset;
- face;
- costume;
- props;
- direction text.

Asset selection follows Interaction Spec.

No generation controls in Phase 1.

## Personality / State

Personality:
- traits;
- behavior;
- speech;
- emotional pattern;
- dialogue rules.

Character State:
- arc stage;
- episode range label;
- deltas;
- appearance/continuity notes.

This mirrors future M6 CharacterState semantics at Presentation level only.

## Relationship

Visual graph plus accessible relation list.

No graph-database editor.

## Visual Consistency

Shows:
- main visual;
- references;
- identity rules;
- palette;
- style;
- local consistency notes.

Badge:
`本地一致性预览`.

## Acceptance

PASS when each area has a clear purpose, no card nesting exceeds two levels, and mobile preserves the same semantic order.
