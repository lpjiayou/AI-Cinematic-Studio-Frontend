# Target user flows

Status vocabulary: `SUPPORTED_NOW`, `BACKEND_READY_UI_MISSING`, `RUNTIME_BLOCKED`, `NOT_AUTHORIZED`, `FUTURE`. Multiple labels mean different steps have different readiness; the most restrictive applicable state wins for execution.

## 1. Create a short-drama project

**Status:** `SUPPORTED_NOW`

Home/Projects → New project → creative brief → series/project/episode foundations → Project Overview. Keep server-owned content profile injection and show a recoverable error if Core is disconnected.

## 2. Import or create a script

**Status:** `SUPPORTED_NOW` for manual/generate/rewrite/confirm; `BACKEND_READY_UI_MISSING` for reviewed import/accept.

Project → Script → select manual, AI candidate or reviewed import → compare versions → explicitly confirm. The import path must preserve actor binding, digest and stale-input failures through the adapter.

## 3. Create characters and continuity facts

**Status:** `SUPPORTED_NOW` for bounded authoring; `NOT_AUTHORIZED` for production-authoritative activation.

Project → Story/Characters → draft identity/appearance/relationships → inspect source version → resolve conflicts → request confirmation only when authority is available. A blocked action explains the missing external approval/identity authority.

## 4. Generate shot planning from the script

**Status:** `BACKEND_READY_UI_MISSING`

Confirmed Script → Storyboard → bootstrap/refresh shot graph → compare source currentness → inspect scene-to-shot lineage. Stale script or foreign workspace stops the flow; no auto-rewrite or warning bypass.

## 5. View the server-derived execution class

**Status:** `BACKEND_READY_UI_MISSING`

Select a shot → Method plan → display class, reason and image/video/audio axes → offer only inputs compatible with the returned plan. The class is read-only and no model/provider selector can override it.

## 6. Generate a Micro Motion shot

**Status:** `RUNTIME_BLOCKED` + `NOT_AUTHORIZED`

Shot → resolved method-aware inputs → dynamic preflight → server returns Micro Motion route → create the bounded job only after policy/runtime authority → monitor → review candidates. Current G0 must stop before Provider execution.

## 7. Understand why Contact/Gait is unavailable

**Status:** `BACKEND_READY_UI_MISSING`

Shot → Method plan → CapabilityBlocker shows “Contact/Gait runtime unavailable” with remediation/owner → keep Generate disabled. Never fall back to Wan Micro, deterministic events or a local fixture.

## 8. Create or inspect an audio requirement

**Status:** `BACKEND_READY_UI_MISSING` + `RUNTIME_BLOCKED`

Shot/Audio Studio → display the explicit M9 AudioRequirement or `SILENCE` → inspect source and need → route through `explicit-audio-requirement-route` when available → keep execution blocked until M12 Runtime G0 and authority are complete.

## 9. Arrange video, audio, captions and effects in Timeline

**Status:** `BACKEND_READY_UI_MISSING`

Project → Edit → choose admitted assets → add clips/tracks → edit timeline version → attach deterministic effects → validate current inputs. Candidate media is not silently treated as admitted media.

## 10. Create a PreviewCandidate

**Status:** `BACKEND_READY_UI_MISSING`

Timeline → preflight → create RenderCandidate/PreviewCandidate → monitor CPU evidence path → open Review. The label remains “Preview candidate,” never “Master.”

## 11. Review and QC

**Status:** `SUPPORTED_NOW` for legacy evidence read; `NOT_AUTHORIZED` for full M14 approval/regeneration.

Review → play preview → inspect semantic/technical QC → comment by time/shot → fail or request correction → approve only with external human authority. Existing QC `FAIL` truth preservation is retained.

## 12. Form a restricted delivery

**Status:** `SUPPORTED_NOW` for blocked/eligibility read; `NOT_AUTHORIZED` for master/publication.

Delivery → inspect upstream approval and production-readiness → create restricted export only when eligible → record evidence → keep publication unavailable. A missing master/export routes to the exact blocker.

## 13. Quickly generate one video

**Status:** `FUTURE` + `NOT_AUTHORIZED`

Quick Create → Video → prompt/references → display server-derived requirements/route → queue → candidates. This flow is designed now but cannot execute until adapter, policy and runtime authorization exist.

## 14. Add a generated result to an existing project

**Status:** `BACKEND_READY_UI_MISSING`

Candidate review → Add to project → choose project/episode/shot → create explicit binding or admission request → return to Generation/Timeline. Copying a file alone does not establish asset admission or canonical identity.

## 15. Recover from a failed task

**Status:** `BACKEND_READY_UI_MISSING`

Tasks → failed job → user-readable cause + technical details disclosure → choose exact replay when inputs match, revise when supported, or return to blocker owner. Changed replay conflict, stale input and foreign workspace rejection remain visible and non-bypassable.

## Cross-flow acceptance rules

- Every mutation shows target object, authority status and expected state transition before submission.
- Every blocked state names the blocker class: UI missing, runtime unavailable, authority absent, policy denied, stale input or Core disconnected.
- The Job Center is the recovery spine; failures never disappear from a toast-only history.
- Mobile fully supports flows 1, 5, 7, 8 (read), 11, 12 (read), 13, 14 and 15. Detailed storyboard/timeline manipulation remains tablet/desktop-first.
