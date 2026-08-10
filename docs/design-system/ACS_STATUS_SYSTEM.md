# ACS Status System

**Status:** Official

**Version:** V2.3

**Scope:** Presentation semantics only

## 1. Core rule

A visual status communicates supplied state. It does not create, approve, confirm, validate, persist, or publish that state.

The design system distinguishes:

- interaction state;
- AI provenance and activity;
- workflow presentation;
- success, warning, information, and danger feedback;
- authoritative domain decisions, which remain outside the component library.

Never interpret a green badge, completed workflow node, selected card, or generated candidate as human approval.

## 2. Badge tones

| Tone | Tokens | Meaning | Examples |
| --- | --- | --- | --- |
| `neutral` | surface, border, secondary text | Unclassified or quiet metadata | Draft label, type label |
| `primary` | primary + primary soft | Current interaction or selected context | Active view, current item |
| `ai` | AI accent + AI soft | AI provenance or AI activity | Candidate, generating |
| `success` | success + success soft | Operation completed successfully | Saved, generated successfully |
| `warning` | accent + accent soft | Attention or constraint | Review needed, incomplete input |
| `danger` | danger + danger soft | Failure, destructive intent, or blocked state | Failed, blocked, delete intent |
| `info` | information + information soft | Informational context | Processing detail, informational notice |

Tone must be paired with a visible text label. The optional badge dot reinforces but never replaces that label.

## 3. Interaction states

| State | Visual treatment | Semantic boundary |
| --- | --- | --- |
| Hover | hover surface / stronger border | Pointer feedback only |
| Focus | primary outline + focus ring | Keyboard focus only |
| Selected | selected surface + primary border | Current UI selection only |
| Disabled | reduced opacity and no interaction | Temporary inability to act |
| Loading | spinner + `aria-busy` + disabled button | Operation in progress |

Selection is not confirmation. Disabled is not blocked domain state. Loading is not workflow completion.

## 4. AI states

Purple is reserved for AI provenance and AI activity.

| Presentation | Component | Meaning |
| --- | --- | --- |
| AI context | `AIAssistantPanel` | Content belongs to an AI assistance region |
| Thinking | `AIThinkingState` | An AI-related operation is active |
| Candidate | `AICandidateCard` | Content is candidate output |
| Selected candidate | `AICandidateCard selected` | Current UI choice among candidates |

AI output follows the conceptual sequence candidate → validation → optional human confirmation → authoritative version. The design system only presents the state supplied at each step.

## 5. Version timeline states

| State | Treatment | Meaning |
| --- | --- | --- |
| `pending` | neutral marker | Historical or inactive item |
| `current` | primary marker and ring | Currently referenced version in the view |
| `complete` | success marker | A displayed step is complete |

`current` does not imply approved. `complete` does not imply current. Consumers must provide explicit labels for confirmation, validation, rights, or publication state.

## 6. Workflow map states

| State | Treatment | Meaning |
| --- | --- | --- |
| `idle` | neutral node | Not active |
| `active` | primary selected surface | Current stage |
| `complete` | success treatment | Stage reported complete |
| `blocked` | danger treatment | Stage cannot currently proceed |

The workflow component is ordered presentation. It does not enforce transitions or calculate readiness.

## 7. Human and governance gates

Do not collapse these meanings into one generic `approved` visual state:

- creative confirmation;
- script confirmation;
- consistency validation;
- rights clearance;
- technical QC;
- final approval;
- publication eligibility.

When a product surface displays one of these gates, use explicit text. Choose a badge tone only after the authoritative application state has supplied the meaning.

## 8. Status copy

- Use concise Chinese-first labels in product UI.
- Prefer a state phrase such as `生成中`, `待确认`, `已保存`, or `受阻`.
- Add a short explanation when the user must act.
- Do not expose provider errors, stack traces, queue names, or internal identifiers.
- Do not use celebratory copy for routine system success.

## 9. Accessibility

- Pair color with visible text.
- Use `role="status"` and polite live regions for nonurgent asynchronous updates.
- Use alert semantics only for urgent information that requires immediate attention.
- Preserve focus when overlays close.
- Do not announce decorative animation.
- Ensure status changes are understandable without motion.

## 10. Adding a status

Before adding a new shared status, verify:

1. it is not an existing status with different copy;
2. it has a stable meaning across more than one feature;
3. it maps to an existing semantic tone where possible;
4. it does not duplicate a domain lifecycle inside the frontend;
5. this guide, tokens, components, and tests are updated together if a new global tone is genuinely required.
