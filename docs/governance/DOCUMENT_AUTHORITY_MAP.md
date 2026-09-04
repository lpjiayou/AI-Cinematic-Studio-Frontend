# Frontend Document Authority Map

Status: GENERATED_REFERENCE

This map mirrors [`DOCUMENT_REGISTRY.json`](DOCUMENT_REGISTRY.json) and creates no
independent authority.

## Authority boundary

Core Accepted ADRs and public contracts control Core facts. Frontend accepted
decisions control only their declared target experience scope and do not prove
implementation. Current status is evidence-backed; historical/prototype material
cannot authorize execution.

## Classification totals

| Class | Count | Current-state claims allowed |
| --- | ---: | --- |
| `ACCEPTED_DECISION` | 4 | no |
| `NORMATIVE_ARCHITECTURE` | 0 | no |
| `NORMATIVE_CONTRACT` | 53 | no |
| `CURRENT_STATUS` | 2 | yes |
| `CAPABILITY_MATRIX` | 0 | yes |
| `OPERATIONAL_RUNBOOK` | 3 | no |
| `IMPLEMENTATION_EVIDENCE` | 4 | no |
| `HISTORICAL_EVIDENCE` | 16 | no |
| `SUPERSEDED` | 4 | no |
| `DRAFT` | 0 | no |
| `DEPRECATED` | 0 | no |
| `GENERATED_REFERENCE` | 10 | no |

## ACCEPTED_DECISION

| Document | Status | Owner |
| --- | --- | --- |
| [`docs/design-system/ACS_DESIGN_SYSTEM_V3_DECISION.md`](../design-system/ACS_DESIGN_SYSTEM_V3_DECISION.md) | `ACCEPTED` | Frontend Design System Owner |
| [`docs/product/ACS_FRONTEND_V3_PRODUCT_IA_DECISION.md`](../product/ACS_FRONTEND_V3_PRODUCT_IA_DECISION.md) | `ACCEPTED` | Frontend Product / Architecture Owner |
| [`docs/product/ACS_FRONTEND_V3_REBUILD_AND_ROUTE_MIGRATION.md`](../product/ACS_FRONTEND_V3_REBUILD_AND_ROUTE_MIGRATION.md) | `ACCEPTED` | Frontend Architecture / Repository Governance Owner |
| [`docs/product/ACS_FRONTEND_V3_SCREEN_CONTRACT.md`](../product/ACS_FRONTEND_V3_SCREEN_CONTRACT.md) | `ACCEPTED` | Frontend Product / UX Owner |

## NORMATIVE_ARCHITECTURE

| Document | Status | Owner |
| --- | --- | --- |
| _None_ | — | — |

## NORMATIVE_CONTRACT

| Document | Status | Owner |
| --- | --- | --- |
| [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | `ACTIVE` | Frontend Engineering Owner |
| [`AGENTS.md`](../../AGENTS.md) | `ACTIVE` | Frontend Engineering Owner |
| [`CLAUDE.md`](../../CLAUDE.md) | `ACTIVE` | Frontend Engineering Owner |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | `ACTIVE` | Frontend Engineering Owner |
| [`docs/CREATOR_CORE_INTEGRATION.md`](../CREATOR_CORE_INTEGRATION.md) | `ACTIVE` | Frontend Owner / Core Integration Owner |
| [`docs/design-system/ACS_BRAND_GUIDE.md`](../design-system/ACS_BRAND_GUIDE.md) | `ACTIVE` | Frontend Design System Owner |
| [`docs/design-system/ACS_COMPONENT_GUIDE.md`](../design-system/ACS_COMPONENT_GUIDE.md) | `ACTIVE` | Frontend Design System Owner |
| [`docs/design-system/ACS_LAYOUT_SYSTEM.md`](../design-system/ACS_LAYOUT_SYSTEM.md) | `ACTIVE` | Frontend Design System Owner |
| [`docs/design-system/ACS_STATUS_SYSTEM.md`](../design-system/ACS_STATUS_SYSTEM.md) | `ACTIVE` | Frontend Design System Owner |
| [`docs/design-system/ACS_THEME_GUIDE.md`](../design-system/ACS_THEME_GUIDE.md) | `ACTIVE` | Frontend Design System Owner |
| [`docs/governance/DOCUMENTATION_GOVERNANCE_POLICY.md`](DOCUMENTATION_GOVERNANCE_POLICY.md) | `ACTIVE` | Frontend Owner / Documentation Governance Owner |
| [`prototype-spec/customer/01-landing-page/assets-spec/HERO_ASSET_SPEC.md`](../../prototype-spec/customer/01-landing-page/assets-spec/HERO_ASSET_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/assets-spec/IMAGE_ASSET_SPEC.md`](../../prototype-spec/customer/01-landing-page/assets-spec/IMAGE_ASSET_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/assets-spec/LOGO_USAGE_SPEC.md`](../../prototype-spec/customer/01-landing-page/assets-spec/LOGO_USAGE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/assets-spec/VISUAL_REFERENCE.md`](../../prototype-spec/customer/01-landing-page/assets-spec/VISUAL_REFERENCE.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/assets-spec/WORK_GALLERY_SPEC.md`](../../prototype-spec/customer/01-landing-page/assets-spec/WORK_GALLERY_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/COMPONENT_MAP.md`](../../prototype-spec/customer/01-landing-page/COMPONENT_MAP.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/PAGE_STRUCTURE.md`](../../prototype-spec/customer/01-landing-page/PAGE_STRUCTURE.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/RESPONSIVE_SPEC.md`](../../prototype-spec/customer/01-landing-page/RESPONSIVE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/STATE_SPEC.md`](../../prototype-spec/customer/01-landing-page/STATE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/STYLE_SPEC.md`](../../prototype-spec/customer/01-landing-page/STYLE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/visual-spec/HERO_VISUAL_SPEC.md`](../../prototype-spec/customer/01-landing-page/visual-spec/HERO_VISUAL_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/visual-spec/SECTION_DETAIL_SPEC.md`](../../prototype-spec/customer/01-landing-page/visual-spec/SECTION_DETAIL_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/01-landing-page/visual-spec/VISUAL_DIRECTION.md`](../../prototype-spec/customer/01-landing-page/visual-spec/VISUAL_DIRECTION.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/assets-spec/PROJECT_COVER_SPEC.md`](../../prototype-spec/customer/02-workspace-home/assets-spec/PROJECT_COVER_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/assets-spec/WORKSPACE_VISUAL_SPEC.md`](../../prototype-spec/customer/02-workspace-home/assets-spec/WORKSPACE_VISUAL_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/COMPONENT_MAP.md`](../../prototype-spec/customer/02-workspace-home/COMPONENT_MAP.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/DATA_BINDING_SPEC.md`](../../prototype-spec/customer/02-workspace-home/DATA_BINDING_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/INTERACTION_SPEC.md`](../../prototype-spec/customer/02-workspace-home/INTERACTION_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/PAGE_STRUCTURE.md`](../../prototype-spec/customer/02-workspace-home/PAGE_STRUCTURE.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/RESPONSIVE_SPEC.md`](../../prototype-spec/customer/02-workspace-home/RESPONSIVE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/STATE_SPEC.md`](../../prototype-spec/customer/02-workspace-home/STATE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/STYLE_SPEC.md`](../../prototype-spec/customer/02-workspace-home/STYLE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/visual-spec/CONTENT_SECTION_SPEC.md`](../../prototype-spec/customer/02-workspace-home/visual-spec/CONTENT_SECTION_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/visual-spec/HERO_SECTION_SPEC.md`](../../prototype-spec/customer/02-workspace-home/visual-spec/HERO_SECTION_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/visual-spec/VISUAL_DIRECTION.md`](../../prototype-spec/customer/02-workspace-home/visual-spec/VISUAL_DIRECTION.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/ASSET_SPEC.md`](../../prototype-spec/customer/06-character-studio/ASSET_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/assets-spec/CHARACTER_ASSET_SPEC.md`](../../prototype-spec/customer/06-character-studio/assets-spec/CHARACTER_ASSET_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/CHARACTER_STUDIO_FIELD_ALIGNMENT_SPEC.md`](../../prototype-spec/customer/06-character-studio/CHARACTER_STUDIO_FIELD_ALIGNMENT_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/COMPONENT_MAP.md`](../../prototype-spec/customer/06-character-studio/COMPONENT_MAP.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/DATA_BINDING_SPEC.md`](../../prototype-spec/customer/06-character-studio/DATA_BINDING_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/DOMAIN_ALIGNMENT.md`](../../prototype-spec/customer/06-character-studio/DOMAIN_ALIGNMENT.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/IMPLEMENTATION_CONTRACT.md`](../../prototype-spec/customer/06-character-studio/IMPLEMENTATION_CONTRACT.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/INTERACTION_SPEC.md`](../../prototype-spec/customer/06-character-studio/INTERACTION_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/PAGE_STRUCTURE.md`](../../prototype-spec/customer/06-character-studio/PAGE_STRUCTURE.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/RESPONSIVE_SPEC.md`](../../prototype-spec/customer/06-character-studio/RESPONSIVE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/STATE_SPEC.md`](../../prototype-spec/customer/06-character-studio/STATE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/STYLE_SPEC.md`](../../prototype-spec/customer/06-character-studio/STYLE_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/TOKEN_MAPPING.md`](../../prototype-spec/customer/06-character-studio/TOKEN_MAPPING.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/visual-spec/CHARACTER_CANVAS_SPEC.md`](../../prototype-spec/customer/06-character-studio/visual-spec/CHARACTER_CANVAS_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/visual-spec/CHARACTER_RELATION_SPEC.md`](../../prototype-spec/customer/06-character-studio/visual-spec/CHARACTER_RELATION_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/visual-spec/IDENTITY_LOCK_VISUAL_SPEC.md`](../../prototype-spec/customer/06-character-studio/visual-spec/IDENTITY_LOCK_VISUAL_SPEC.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/visual-spec/VISUAL_DIRECTION.md`](../../prototype-spec/customer/06-character-studio/visual-spec/VISUAL_DIRECTION.md) | `ACTIVE` | Frontend Product Design Owner |

## CURRENT_STATUS

| Document | Status | Owner |
| --- | --- | --- |
| [`docs/status/CROSS_REPOSITORY_BASELINE.md`](../status/CROSS_REPOSITORY_BASELINE.md) | `CURRENT` | Frontend Owner / Core Integration Owner |
| [`docs/status/FRONTEND_REDESIGN_G0_ACCEPTANCE_2026-09-04.md`](../status/FRONTEND_REDESIGN_G0_ACCEPTANCE_2026-09-04.md) | `CURRENT` | Frontend Product / Repository Governance Owner |

## CAPABILITY_MATRIX

| Document | Status | Owner |
| --- | --- | --- |
| _None_ | — | — |

## OPERATIONAL_RUNBOOK

| Document | Status | Owner |
| --- | --- | --- |
| [`prototype-spec/customer/02-workspace-home/CODEX_VERIFY_PROMPT.txt`](../../prototype-spec/customer/02-workspace-home/CODEX_VERIFY_PROMPT.txt) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/FREEZE_CHECKLIST.md`](../../prototype-spec/customer/06-character-studio/FREEZE_CHECKLIST.md) | `ACTIVE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/IMPLEMENTATION_READINESS_CHECKLIST.md`](../../prototype-spec/customer/06-character-studio/IMPLEMENTATION_READINESS_CHECKLIST.md) | `ACTIVE` | Frontend Product Design Owner |

## IMPLEMENTATION_EVIDENCE

| Document | Status | Owner |
| --- | --- | --- |
| [`design-qa.md`](../../design-qa.md) | `RECORDED` | Frontend Documentation Owner |
| [`public/assets/ai-director/ASSET_PROVENANCE.md`](../../public/assets/ai-director/ASSET_PROVENANCE.md) | `RECORDED` | Frontend Asset Owner |
| [`public/assets/character-studio/ASSET_PROVENANCE.md`](../../public/assets/character-studio/ASSET_PROVENANCE.md) | `RECORDED` | Frontend Asset Owner |
| [`public/assets/story-world/ASSET_PROVENANCE.md`](../../public/assets/story-world/ASSET_PROVENANCE.md) | `RECORDED` | Frontend Asset Owner |

## HISTORICAL_EVIDENCE

| Document | Status | Owner |
| --- | --- | --- |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/COMPETITOR_PATTERN_MATRIX.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/COMPETITOR_PATTERN_MATRIX.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/CORE_FRONTEND_CAPABILITY_MATRIX.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/CORE_FRONTEND_CAPABILITY_MATRIX.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/CURRENT_SCREEN_BASELINE.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/CURRENT_SCREEN_BASELINE.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/DESIGN_SYSTEM_V3_DELTA.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/DESIGN_SYSTEM_V3_DELTA.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/FRONTEND_IMPLEMENTATION_WAVES.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/FRONTEND_IMPLEMENTATION_WAVES.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/FRONTEND_REDESIGN_G0_EXECUTIVE_DECISION.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/FRONTEND_REDESIGN_G0_EXECUTIVE_DECISION.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/README.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/README.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/TARGET_INFORMATION_ARCHITECTURE.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/TARGET_INFORMATION_ARCHITECTURE.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/TARGET_SCREEN_SPECIFICATIONS.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/TARGET_SCREEN_SPECIFICATIONS.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`docs/audits/frontend-redesign-g0/2026-09-04/decision-inputs/TARGET_USER_FLOWS.md`](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/TARGET_USER_FLOWS.md) | `HISTORICAL` | Frontend Product / UX Audit Owner |
| [`governance/ACS-XR1-FRONTEND-CORE-INTEGRATION-CLOSEOUT.md`](../../governance/ACS-XR1-FRONTEND-CORE-INTEGRATION-CLOSEOUT.md) | `HISTORICAL` | Frontend Owner / Documentation Governance Owner |
| [`governance/FE-G0-R1_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md`](../../governance/FE-G0-R1_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md) | `HISTORICAL` | Frontend Owner / Documentation Governance Owner |
| [`governance/FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md`](../../governance/FRONTEND_CORE_DOMAIN_ALIGNMENT_STANDARD.md) | `HISTORICAL` | Frontend Owner / Documentation Governance Owner |
| [`governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV3.md`](../../governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV3.md) | `HISTORICAL` | Frontend Owner / Documentation Governance Owner |
| [`governance/FRONTEND_IA_CORRECTION_CONTRACT.md`](../../governance/FRONTEND_IA_CORRECTION_CONTRACT.md) | `HISTORICAL` | Frontend Owner / Documentation Governance Owner |
| [`governance/K2_G7_CONNECTED_PRODUCTION_WORKSPACE_CONTRACT.md`](../../governance/K2_G7_CONNECTED_PRODUCTION_WORKSPACE_CONTRACT.md) | `HISTORICAL` | Frontend Owner / Documentation Governance Owner |

## SUPERSEDED

| Document | Status | Owner |
| --- | --- | --- |
| [`governance/FE-G0_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md`](../../governance/FE-G0_FRONTEND_GLOBAL_SHELL_ROUTE_GOVERNANCE.md) | `SUPERSEDED` | Frontend Owner / Documentation Governance Owner |
| [`governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV2.md`](../../governance/FRONTEND_GLOBAL_SHELL_REMEDIATION_CONTRACT_REV2.md) | `SUPERSEDED` | Frontend Owner / Documentation Governance Owner |
| [`governance/FRONTEND_PAGE_ARCHETYPE_AND_REMEDIATION_MATRIX.md`](../../governance/FRONTEND_PAGE_ARCHETYPE_AND_REMEDIATION_MATRIX.md) | `SUPERSEDED` | Frontend Owner / Documentation Governance Owner |
| [`governance/PRODUCTION_WORKSPACE_USABILITY_AND_LAYOUT_CONTRACT.md`](../../governance/PRODUCTION_WORKSPACE_USABILITY_AND_LAYOUT_CONTRACT.md) | `SUPERSEDED` | Frontend Owner / Documentation Governance Owner |

## DRAFT

| Document | Status | Owner |
| --- | --- | --- |
| _None_ | — | — |

## DEPRECATED

| Document | Status | Owner |
| --- | --- | --- |
| _None_ | — | — |

## GENERATED_REFERENCE

| Document | Status | Owner |
| --- | --- | --- |
| [`docs/governance/DOCUMENT_AUTHORITY_MAP.md`](DOCUMENT_AUTHORITY_MAP.md) | `REFERENCE` | Frontend Owner / Documentation Governance Owner |
| [`docs/governance/DOCUMENT_REGISTRY.json`](DOCUMENT_REGISTRY.json) | `REFERENCE` | Frontend Owner / Documentation Governance Owner |
| [`docs/README.md`](../README.md) | `REFERENCE` | Frontend Documentation Owner |
| [`prototype-spec/customer/01-landing-page/README.md`](../../prototype-spec/customer/01-landing-page/README.md) | `REFERENCE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/PACKAGE_MANIFEST.md`](../../prototype-spec/customer/02-workspace-home/PACKAGE_MANIFEST.md) | `REFERENCE` | Frontend Product Design Owner |
| [`prototype-spec/customer/02-workspace-home/README.md`](../../prototype-spec/customer/02-workspace-home/README.md) | `REFERENCE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/assets-spec/PACKAGE_MANIFEST.md`](../../prototype-spec/customer/06-character-studio/assets-spec/PACKAGE_MANIFEST.md) | `REFERENCE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/PACKAGE_MANIFEST.md`](../../prototype-spec/customer/06-character-studio/PACKAGE_MANIFEST.md) | `REFERENCE` | Frontend Product Design Owner |
| [`prototype-spec/customer/06-character-studio/README.md`](../../prototype-spec/customer/06-character-studio/README.md) | `REFERENCE` | Frontend Product Design Owner |
| [`README.md`](../../README.md) | `REFERENCE` | Frontend Documentation Owner |

## Historical isolation

Historical, implementation, and superseded records do not grant current execution
authority and carry `HISTORICAL_PATH_NOT_EXECUTION_AUTHORITY=true` in the registry.
The 15-file G0 package remains a historical decision-input subset; its current
authority is the accepted V3 decision set and bounded acceptance projection.
