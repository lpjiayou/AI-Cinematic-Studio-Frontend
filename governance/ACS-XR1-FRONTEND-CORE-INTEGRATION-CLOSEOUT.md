# ACS-XR1 Frontend ↔ Core integration closeout

Date: `2026-08-17`

Status: `LOCAL GATE C PASS / REMOTE VERIFY PENDING`

## Authority and implementation baseline

- Core baseline: `9c13e8f8d7ccef079dd382fe11b1d173fdef13d7`.
- Frontend baseline: `efaaa2546c37ed7c514f10b3bec2fb9893009260`.
- Core public-integration implementation: `9199b4b` (with preceding XR1 commits).
- Frontend integration implementation: `bb47914`.

This record supersedes older Frontend documents only for the separately authorized XR1
integration wave. It does not rewrite their historical conclusions.

## Closed dependency direction

```text
Commercial Frontend
→ server-only Frontend Experience Adapter
→ Creator Public HTTP/API v1
→ Creator Application
→ V5 → V4 → V3 → Compute/Foundation
```

Browser code calls only same-origin `/api/creator/**`. The adapter allowlists public v1
resources and injects workspace/profile scope. No Frontend source imports Core code,
uses SQL, calls providers or accesses `/creator/internal/*`.

## Accepted page mapping

| Surface | Core milestones | Result |
| --- | --- | --- |
| Creator home | M1–M19 capability projection | exact 19-item contract; M7–M19 non-executable |
| AI Director | M1 | Core candidate lineage; explicit human confirmation |
| New project / project center | M2 + M4 | Core Series/Project refs; list and detail round trip |
| Story World | M4 + M5 + M6 | M5 candidate/confirmation; M6 read or authority gate |
| Character Studio | M6 | authoritative read-only state or exact authority gate |
| Project Script Studio | M2 + M3 | Episode, generation, manual version and confirmation |
| LOCAL_FIXTURE routes | none | visibly non-authoritative and never an error fallback |

M1 candidate `sourcePlanRef`, Project, Series, Episode, Script and version references
come only from Core responses. The Frontend does not infer or mint them.

## Verification evidence

- `23` Frontend test files, `108 / 108` tests passed.
- TypeScript `--noEmit` passed.
- ESLint passed.
- Next.js production build passed.
- Core full suite passed `471 / 471`.
- Two-process Gate C passed through the Frontend origin, including server scope
  injection, project round trip, forged-scope isolation, provider fail-closed and M6
  authority fail-closed checks.

Repeat the HTTP assertions with `npm run test:gate-c` while the Core and production
Frontend processes are running with the documented Gate C scope configuration.

## Preserved stop conditions

- M6 is not presented as generally writable without its external authorities.
- M7–M19 have no executable Frontend controls.
- Provider absence is an error state, not a generated sample.
- Core disconnection never selects a fixture automatically.
- No deployment, production provider call, production database write or GPU execution
  is claimed by this closeout.
