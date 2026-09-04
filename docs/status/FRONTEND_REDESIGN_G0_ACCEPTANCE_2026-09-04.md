# Frontend Redesign G0 Acceptance — 2026-09-04

Status: CURRENT

Document class: CURRENT_STATUS

## Acceptance result

FRONTEND_REDESIGN_G0=ACCEPTED_WITH_REVISIONS

FRONTEND_V3_TARGET_IA=ACCEPTED

FRONTEND_V3_SCREEN_CONTRACT_COUNT=16

FRONTEND_V3_DESIGN_SYSTEM_DECISION=ACCEPTED

FRONTEND_V3_IMPLEMENTATION=NOT_STARTED

FRONTEND_V3_REDESIGN_COMPLETE=false

The G0 audit is accepted as decision input with two explicit revisions: Story Workspace
is a standalone canonical screen, and the combined Works & Delivery proposal is split
into Global Works and Project Delivery. The accepted authority is the current V3
decision set, not the historical low-fidelity wireframe.

## Frozen repository evidence

| Repository authority | Commit | Tree |
| --- | --- | --- |
| Frontend decision start | 4d295718975c0ddb3d2e5d6099d4dea4d63acb54 | 4214fa4a4c5ddf8a61583d94f5ae89248d684da1 |
| Core repository input | 6b10166532c3cac9b8976a5d8986a4e8c1cfd7fc | dd9ca7d2d5da9fba65305348aa367698f1145946 |
| Core production behavior | e21789d265c4e936b0e0b29921746a4c205889b8 | 086f37ed4e5412d1d6608c4ee856ac75d61625e9 |

FRONTEND_PIN_CORE_SHA=e21789d265c4e936b0e0b29921746a4c205889b8

FRONTEND_PIN_CORE_TREE=086f37ed4e5412d1d6608c4ee856ac75d61625e9

FRONTEND_PIN_MATCHES_CORE_BEHAVIOR=true

This docs-only checkpoint does not move the pin.

## Input integrity

INPUT_PACKAGE_SHA256=c230171b45fbc2bf0925ad4562c75145dd7a4816369bec96932ceb0680909636

AUDIT_AGGREGATE_SHA256=45f48b069a618da764e4c74e482d3821511171bee375164fe7fcaa735fb8b3b3

AUDIT_INPUT_FILE_COUNT=15

The package is the core decision-input subset, not a complete archive of Gate logs,
screenshots, or raw runtime artifacts. The 15 files are archived byte-for-byte in the
[historical decision-input index](../audits/frontend-redesign-g0/2026-09-04/decision-inputs/README.md).
Seven referenced screenshot objects were preserved beside the inputs only because
their original bytes matched the package manifest hashes; they are not counted as
package inputs and do not turn this subset into a complete audit archive. Other
manifested Gate logs and raw artifacts remain external references and were not
reconstructed.

## Audit findings retained

| Measure | Accepted evidence |
| --- | ---: |
| Frontend routes / page routes | 13 / 12 |
| Core public resources | 44 unique / 52 references |
| Frontend normalized adapter route patterns | 50 |
| Capability matrix rows | 19 |
| Backend-ready UI missing | 8 |
| Adapter missing | 8 |
| Dedicated page missing | 10 |
| Executable bounded UI | 4 |
| Blocked-visible UI | 5 |
| UX problems P0 / P1 / P2 | 3 / 10 / 7 |

The counts are overlapping dimensions and must not be summed as a coverage total.

The three accepted P0 findings are:

1. Four method-aware public resources are absent from the Frontend adapter/client:
   execution-method-plan, method-aware-input-plan, method-aware-video-route, and
   explicit-audio-requirement-route.
2. Legacy G4/G5-compatible assets/media controls cannot remain the primary write
   surface because successor new writes are disabled.
3. Machine states and local-evidence details are too prominent and require separate
   AuthorityStatus, CapabilityBlocker, and EvidenceDisclosure presentation.

## Browser evidence limit

The audited Frontend tree launched in an isolated current-tree runtime. The selected
cloud browser rejected loopback and local-file navigation, so G0 did not perform a new
live all-route audit at all target viewports. Visual findings use exact-tree Chromium
Gate evidence at 1920×1080, checked-in Script Studio evidence at 1487×1033 and exact
390×844, plus static source inspection. This does not prove every target screen,
interaction, responsive state, or V3 implementation.

The 14-screen HTML artifact is editable low-fidelity historical input. It is not a
final design, implemented UI, live prototype, or screen authority.

## Accepted authority set

- [Product IA decision](../product/ACS_FRONTEND_V3_PRODUCT_IA_DECISION.md)
- [16-screen contract](../product/ACS_FRONTEND_V3_SCREEN_CONTRACT.md)
- [Design System V3 decision](../design-system/ACS_DESIGN_SYSTEM_V3_DECISION.md)
- [Rebuild and route migration](../product/ACS_FRONTEND_V3_REBUILD_AND_ROUTE_MIGRATION.md)

The accepted revisions freeze guarded dual mode with one object lifecycle, exact six-
item global navigation, exact ten-item project navigation, 16 canonical screens, 21
new presentation-only design-system objects, and parallel page rebuild with atomic
route cutover.

## Current Frontend disposition

CURRENT_DESIGN_SYSTEM_REUSABLE=YES_FOUNDATION_ONLY

CURRENT_INFORMATION_ARCHITECTURE_DISPOSITION=REPLACE_WITH_DUAL_MODE_PROJECT_FIRST_SHELL

CURRENT_PRODUCTION_WORKSPACE_DISPOSITION=RETAIN_AS_LEGACY_READ_COMPATIBILITY

CURRENT_PRODUCTION_WORKSPACE_DISPOSITION=REBUILD_PRIMARY_METHOD_AWARE_WORKSPACE

PAGE_LEVEL_IN_PLACE_PATCHING_ALLOWED=false

PARALLEL_REBUILD_REQUIRED=true

ATOMIC_ROUTE_CUTOVER_REQUIRED=true

LEGACY_G4_G5_READ_COMPATIBILITY_PRESERVED=true

LEGACY_G4_G5_NEW_WRITE_UI_ALLOWED=false

The current production route remains a legacy read/exact-replay compatibility surface
until the authorized method-aware successor passes its atomic cutover. Acceptance of
the target does not make its routes, components, adapters, or actions present.

## M12/M13 and execution boundary

M12_FRONTEND_EXECUTION=BLOCKED

M13_FRONTEND_PRODUCT_SURFACE=INCOMPLETE

A100_START_AUTHORIZED=false

M12_C3_AUTHORIZED=false

M12_C4_AUTHORIZED=false

PROVIDER_CALLS_ALLOWED=false

LIVE_CANONICAL_MUTATIONS_ALLOWED=false

No runtime, Provider/GPU, Core, route, source, dependency, lockfile, or workflow change
is part of this decision checkpoint.

## Next boundary

NEXT_TASK=ACS-FRONTEND-WAVE-1A-V3-SHELL-AND-TRUTH-PRESENTATION-COMPONENTS

Wave 1A requires separate authorization and is not started.
