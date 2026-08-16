# Creator Core integration

Status: `XR1 frontend mapping`

## Runtime boundary

The browser calls only the same-origin `/api/creator/**` route. The server-only
Experience Adapter allowlists the corresponding `/creator/api/v1/**` resource,
injects `workspaceRef` and `contentProfileRef`, applies request-size and timeout
bounds, and preserves Core product errors. It never forwards a browser-supplied
workspace, profile or tenant claim.

Configuration:

| Variable | Default | Exposure |
| --- | --- | --- |
| `CREATOR_CORE_BASE_URL` | `http://127.0.0.1:8765` | server only |
| `CREATOR_WORKSPACE_REF` | `workspace-local-creator` | server only |
| `CREATOR_CONTENT_PROFILE_REF` | `content-profile-local-creator` | server only |

## Capability mapping

| Milestone | Frontend surface | Public Core resources | Truth state |
| --- | --- | --- | --- |
| M1 | AI Director | `ai-director/candidates`, `creative-plans/confirm` | candidate then explicit human confirmation |
| M2 | Series and Episode creation | `series`, `episodes` | authoritative Core references only |
| M3 | Script workspace | `script-workspaces`, `script-versions/*` | generate, manual version, explicit confirmation |
| M4 | Project center and context | `projects`, `project-contexts` | authoritative Core collection and detail |
| M5 | Story World / series planning | `series-planning-workspaces`, `series-plan-*` | candidate then explicit human confirmation |
| M6 | Story World / character continuity | `series-intelligence-workspaces`, `series-intelligence/*` | accepted surface; fail closed when external authorities are absent |
| M7–M19 | Workspace capability matrix | `capabilities` only | `not_open`; no executable controls |

The M1 candidate response includes a Core-issued `sourcePlanRef` and
`sourcePlanVersion`. The browser returns those exact values when confirming; it never
mints a source-plan identity. Project, Series, Episode, Script and version references
likewise come only from successful Core responses.

## UI states

- `connected`: the exact 19-item public capability contract has passed validation.
- `disconnected`: Core cannot be reached; no fixture fallback is allowed.
- `authority_required`: the accepted Core surface exists but required external scope
  or identity authority is absent.
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
