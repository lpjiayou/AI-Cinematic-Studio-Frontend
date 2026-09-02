# Creator Core integration

Status: `CURRENT CORE BEHAVIOR MAPPING / FRONTEND PRODUCT SURFACE PARTIAL`

Reviewed baseline: Frontend `a0be9edc91437bf0e7c5dd14883e656e750b3aee`; Core
accepted behavior tag `m13-base-backend-v1` at
`a455c8e76427d53d75bb7f15259b9875d9768914`. The existing Frontend CI behavior pin
remains `5c9ea7fe6993eddb7a492b2ae8f6bd8c2d5ae326`; this document does not move it.

Pin compatibility and a public route mapping do not prove a complete Frontend product
surface. The current cross-repository truth is recorded in
[`status/CROSS_REPOSITORY_BASELINE.md`](status/CROSS_REPOSITORY_BASELINE.md).

## Runtime boundary

The browser calls only the same-origin `/api/creator/**` route. The server-only
Experience Adapter allowlists the corresponding `/creator/api/v1/**` resource,
adds the server-only bearer credential, applies request-size and timeout bounds, and
preserves Core product errors. Core resolves `workspaceRef` exclusively from that
credential. The adapter removes every browser-supplied workspace, profile, or tenant
claim; it injects only the configured content profile on Series/Project creation.

Configuration:

| Variable | Default | Exposure |
| --- | --- | --- |
| `CREATOR_CORE_BASE_URL` | `http://127.0.0.1:8765` | server only |
| `CREATOR_CORE_TOKEN` | none; required | server only, secret |
| `CREATOR_CONTENT_PROFILE_REF` | `content-profile-local-creator` | server only |

The token is never returned to the browser, logged, stored in a `NEXT_PUBLIC_*`
variable, or used as a workspace identifier. Core stores only its SHA-256 digest in
the runtime credential registry and maps the credential to exactly one workspace.

## Capability mapping

| Milestone | Frontend surface | Public Core resources | Truth state |
| --- | --- | --- | --- |
| M1 | AI Director | `ai-director/candidates`, `creative-plans/confirm` | candidate then explicit human confirmation |
| M2 | Series and Episode creation | `series`, `episodes` | authoritative Core references only |
| M3 | Script workspace | `script-workspaces`, `script-versions/*` | generate, manual version, explicit confirmation |
| M4 | Project center and context | `projects`, `project-contexts` | authoritative Core collection and detail |
| M5 | Story World / series planning | `series-planning-workspaces`, `series-plan-*` | candidate then explicit human confirmation |
| M6 | Story World / character continuity | `series-intelligence-workspaces`, `series-intelligence/*` | accepted surface; fail closed when external authorities are absent |
| M7–M9 | K2 production workspace | `episode-production-runs/shot-graph`, `assets` | deterministic `local_evidence_only`; never presented as provider output |
| M10–M11 | K2 production readiness | `episode-production-runs/production-readiness`, `media` | `production_policy_required`; historical K2 image/video evidence does not establish a general or publishable product |
| M12 | Core audio domain and runtime protocol | no complete Frontend audio product surface verified | `not_open`; runtimes are not installed and Runtime G0 is not complete |
| M13 | Preview/composition/render-candidate backend | existing preview/finalize/delivery mappings do not expose a complete Timeline Studio, Effect Inspector or RenderCandidate review product | `local_evidence_only`; Core base backend is accepted, Frontend product surface is incomplete, and Extension G0 is not authorized |
| M14–M15 | QC/Approval and Master/Export | no accepted complete product integration | `not_open`; M13 candidates remain non-publishing and cannot become Master/Export |
| M16–M19 | Batch, release, feedback and commercial SaaS | `capabilities` only | `not_open`; no executable controls |

The M1 candidate response includes a Core-issued `sourcePlanRef` and
`sourcePlanVersion`. The browser returns those exact values when confirming; it never
mints a source-plan identity. Project, Series, Episode, Script and version references
likewise come only from successful Core responses.

## UI states

- `connected`: the exact 19-item public capability contract has passed validation.
- `disconnected`: Core cannot be reached; no fixture fallback is allowed.
- `authentication_required`: the server credential is missing, invalid, or disabled;
  this is an HTTP 401 configuration/security failure.
- `authority_required`: the accepted Core surface exists but required external scope
  or identity authority is absent; the existing M6 failure remains HTTP 403 and is
  not merged with authentication failure.
- `local_evidence_only`: the route can produce deterministic local proof, but no
  provider, GPU, production runtime, rights, or publication claim is inferred.
- `production_policy_required`: the API exposes the exact missing policy/evidence
  facts, while any live generation or publication claim remains fail-closed.
- `not_open`: no executable route is exposed for that milestone.
- `LOCAL_FIXTURE`: explicit non-authoritative demonstration selected by the user.

## Verification

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Gate C additionally starts both the Core server and this Next.js server and exercises
the project-first chain through the same-origin adapter. Provider-backed generation is
expected to fail with the stable `provider_unavailable` product error when no provider
authority is installed; a local run must not require production credentials. With both
processes running, execute `npm run test:gate-c` to repeat the HTTP assertions.

The production workspace reads `production-readiness` for the selected K2 run. The
Experience Adapter permits browser `GET` only: the browser may display its blocker
list, but it cannot mint a rights manifest, provider
attestation, GPU fact, human decision, or publication authorization. Those records must
enter through their bounded server-side authorities and remain linked to the same
`EpisodeProductionRun` lineage.
