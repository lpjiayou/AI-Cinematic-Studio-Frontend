# Frontend full-capability UX audit and redesign G0 — executive decision

Status: `COMPLETE / READ-ONLY / REPORT-ONLY`

## Decision

`DECISION=REVISE_CURRENT_IA_AND_PROCEED_TO_TARGET_IA_AND_DESIGN_SYSTEM_V3_DECISION_CHECKPOINT`

The current Frontend is a credible set of bounded vertical slices, not yet a full cinematic production product surface. Its design-system foundations, authored workspaces, responsive drawers, version patterns and fail-closed Post/Delivery evidence are reusable. Its primary information architecture and K2 Production workspace should not be extended in place as the long-term product shell.

Adopt a guarded dual-mode architecture:

- **Quick Create:** accepted as a bounded entry for one task, using the same Job/Candidate/Asset objects as projects.
- **Project Production:** accepted as the primary long-form mode, organized by creator concepts rather than M1–M19.

Target global navigation: `首页 | 项目 | 快速创作 | 资产 | 任务 | 作品`.

Target project navigation: `概览 | 故事 | 剧本 | 角色 | 分镜 | 生成 | 音频 | 剪辑 | 审片 | 交付`.

## Frozen baselines audited

| Repository / authority | Commit | Tree |
| --- | --- | --- |
| Core current main | `6b10166532c3cac9b8976a5d8986a4e8c1cfd7fc` | `dd9ca7d2d5da9fba65305348aa367698f1145946` |
| Core production-behavior baseline | `e21789d265c4e936b0e0b29921746a4c205889b8` | `086f37ed4e5412d1d6608c4ee856ac75d61625e9` |
| Frontend current main | `4d295718975c0ddb3d2e5d6099d4dea4d63acb54` | `4214fa4a4c5ddf8a61583d94f5ae89248d684da1` |

Frontend Core pin matches the production-behavior baseline. Both repository worktrees were clean; remote main/branch/PR checks found no concurrent same-scope work.

## Coverage result

| Measure | Result |
| --- | ---: |
| Frontend routes / page routes | 13 / 12 |
| Core public resources | 44 unique (52 references) |
| Frontend normalized adapter route patterns | 50 |
| Capability matrix rows | 19 |
| Backend-ready UI missing | 8 |
| Adapter missing | 8 |
| Dedicated page missing | 10 |
| Executable bounded UI | 4 |
| Blocked-visible UI | 5 |
| UX problems | P0 3 / P1 10 / P2 7 |

Counts are independent dimensions and overlap.

## Three P0 conclusions

1. The Frontend does not adapt or consume the four method-aware resources: `execution-method-plan`, `method-aware-input-plan`, `method-aware-video-route`, `explicit-audio-requirement-route`.
2. Legacy G4/G5-compatible asset/media controls still occupy the primary Production workspace although new legacy writes are disabled. Preserve history/replay reads, but do not keep these as successor write affordances.
3. Raw machine states, refs and local-evidence language are visually prominent enough to be mistaken for production authority or completion. Use user-language state plus a persistent AuthorityStatus/CapabilityBlocker, with exact evidence behind disclosure.

## Design and migration disposition

- `CURRENT_DESIGN_SYSTEM_REUSABLE=YES_FOUNDATION_ONLY`
- `CURRENT_INFORMATION_ARCHITECTURE_DISPOSITION=REPLACE_WITH_DUAL_MODE_PROJECT_FIRST_SHELL`
- `CURRENT_PRODUCTION_WORKSPACE_DISPOSITION=RETAIN_AS_LEGACY_COMPATIBILITY_VIEW_REBUILD_PRIMARY_METHOD_AWARE_WORKSPACE`
- `DESIGN_SYSTEM_V3_DELTA=REUSE_FOUNDATION_EXTEND_PRODUCTION_OBJECTS_REFACTOR_SHELL_DEPRECATE_LEGACY_PRIMARY_WORKSPACE`

Design System V3 should reuse Brand V2.3, dark/light semantic tokens, primitives, WorkspaceLayout, EditorLayout, drawers, focus and motion. It should add presentation-only production objects such as ShotNavigator, AssetPicker, JobQueue, MediaCompare, TimelineClip, CapabilityBlocker and AuthorityStatus. Domain authority remains outside components.

## Evidence and prototype limits

The exact Frontend tree launched successfully in an isolated current-tree runtime. The selected cloud browser rejects loopback and local-file URLs, so no new live local-route captures were made. Visual findings use exact-tree Chromium Gate evidence at 1920 plus checked-in current Script Studio acceptance evidence at 1487 and exact 390×844, together with static source inspection. This is not represented as a complete live all-route UX audit.

A Figma file was created at [ACS Frontend Full Capability UX Redesign G0](https://www.figma.com/design/qcVQ6UEKOcvH7Jo21ZQE0a), but the Starter MCP call quota blocked canvas population. The file is not claimed as a completed prototype. The authorized fallback is an editable 14-screen HTML low-fidelity artifact plus Mermaid sitemap and full screen specifications.

`FIGMA_PROTOTYPE=FILE_CREATED_CANVAS_POPULATION_BLOCKED_MCP_QUOTA`

`WIREFRAME_SCREEN_COUNT=14`

## Implementation decision

Eight serial waves are proposed. Wave 0 is the decision freeze; the first code wave is `WAVE_1_GLOBAL_NAV_PROJECT_OVERVIEW_AND_WORKBENCH_SHELLS`. Method-aware adapter/UI work is Wave 2. M12/M13 execution controls remain blocked until their independent runtime/authority gates pass.

This G0 performed no repository or production code changes, created no PR, made no Provider/GPU call, started no A100/ComfyUI, admitted no asset and performed no live canonical mutation.

## Evidence digest

The aggregate is SHA-256 over sorted `relative-path<TAB>file-sha256` lines for every audit file except `EVIDENCE_SHA256SUMS.txt`; this report is normalized by replacing the digest value below with `<NORMALIZED>` before hashing. This makes the final digest reproducible without self-reference.

`FRONTEND_REDESIGN_G0_EVIDENCE_SHA256=45f48b069a618da764e4c74e482d3821511171bee375164fe7fcaa735fb8b3b3`

## Next authorized decision task

`NEXT_TASK=ACS-FRONTEND-TARGET-IA-AND-DESIGN-SYSTEM-V3-DECISION-CHECKPOINT`
