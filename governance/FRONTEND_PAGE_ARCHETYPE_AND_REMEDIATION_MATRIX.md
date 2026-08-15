# Frontend Page Archetype and Remediation Matrix

> Status: `ACTIVE IMPLEMENTATION CONTROL`
>
> Parent contract: `PRODUCTION_WORKSPACE_USABILITY_AND_LAYOUT_CONTRACT.md`
>
> Baseline commit: `04aa9540dfed1bfd560408cd4d81016db0740e24`

## 1. Purpose

Every route must communicate a real job, a truthful data boundary, and a valid next
action. A visually complete screen is not acceptable when its projects, metrics,
activity, save state, compute state, or production capability are fabricated.

## 2. Route matrix

| Route | Archetype | Primary job | Current authority | Required correction |
| --- | --- | --- | --- | --- |
| `/` | Public landing | Understand product and enter Creator | Static product presentation | Preserve; later verify claims and conversion path |
| `/creator` | Task launchpad | Choose the next real creation task | Route availability only | Remove fictional projects, metrics, activity, team and storage data |
| `/creator/projects` | Collection browser | Find or create a project | Authoritative project collection unavailable | Show actionable disconnected state; never fabricate recent projects |
| `/creator/projects/new` | Guided creation flow | Define a local creative brief | Page-local preview state | Make local/unsaved boundary and completion requirements explicit |
| `/creator/ai-director` | Structured decision workspace | Form a director brief and plan preview | Page-local preview state | Remove fictional active-project identity and unsupported AI claims |
| `/creator/projects/[projectRef]/planning/bible` | Knowledge workspace | Build and validate story-world knowledge | Accepted presentation model plus disclosed fixtures | Implemented under production workspace contract |
| `/creator/projects/[projectRef]/planning/characters` | Visual identity workspace | Edit identity and inspect candidate directions | Accepted presentation model plus disclosed fixtures | Implemented under production workspace contract |
| `/script-studio` | Text editor workspace | Edit scenes and compare rewrites | Local service and fixtures | Existing editor archetype retained; visual audit remains |

Unavailable navigation destinations remain disabled. They must not be represented by
clickable cards or modal simulations:

- `/creator/assets`
- `/creator/create`
- `/creator/works`

## 3. Cross-page rules

1. Launchpads show only reachable routes and factual connection state.
2. Browsers render authoritative collections or an honest empty/unavailable state.
3. Guided flows distinguish input completeness, local preview, saved state, and authoritative creation.
4. Workspaces keep the edited artifact central and secondary controls peripheral.
5. Static fixtures may demonstrate a bounded editor state only when labelled as local sample data; they never become account, project, activity, quota, or billing facts.
6. A disabled capability includes a reason and is not duplicated as an apparently active control elsewhere.
7. Each page exposes one primary next action and no more than two peer secondary actions above the fold.

## 4. Delivery sequence

1. Correct Creator launchpad and Project Center truthfulness.
2. Correct Create Project completion gates and local-state language.
3. Correct AI Director context and deterministic local-preview claims.
4. Run route, keyboard, reflow, contrast, test, lint, type, and build gates.
5. Continue to FE-G5 only after this matrix has no open P0/P1 usability issue.
