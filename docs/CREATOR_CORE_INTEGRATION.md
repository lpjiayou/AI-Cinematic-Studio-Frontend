# Creator Core integration

Status: `K2 P0 publishable-production truth mapping`

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
| M10–M12 | K2 production readiness | `episode-production-runs/production-readiness`, `media` | `production_policy_required`; image, video and audio each require rights-cleared live provider policy and evidence |
| M13–M15 | Preview, QC, approval and local master | `episode-production-runs/preview`, `finalize`, `delivery` | `local_evidence_only`; current export remains non-publishable |
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
