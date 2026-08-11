# Character Studio — Freeze Checklist

Version: `V4.1`

## Package Integrity

- [ ] Total Markdown file count equals 21.
- [ ] All 21 files declare `V4.1`.
- [ ] Root manifest contains 20 non-root-manifest SHA-256 values.
- [ ] Root manifest contains byte and line counts for those 20 files.
- [ ] All checksum/byte/line values match.
- [ ] No previous active Character Studio spec remains.
- [ ] No title-only, summary-only or redirect-only stub exists.

## Engineering Contract

- [ ] All shared types are defined.
- [ ] All component Props are defined.
- [ ] Required and optional fields are explicit.
- [ ] Callback payloads and signatures are explicit.
- [ ] Page state union is explicit.
- [ ] No component contract directly exposes database or Domain write semantics.

## ACS

- [ ] CustomerLayout mapping exists.
- [ ] ThemeProvider ownership is explicit.
- [ ] ACSCard mappings are explicit.
- [ ] ACSBadge mappings are explicit.
- [ ] ACSButton variant mapping is explicit.
- [ ] AIAssistantPanel/AIThinkingState usage is compatible.
- [ ] ACSModal/ACSDrawer detail-view rules are explicit.

## Domain Alignment

- [ ] M6 primary alignment is explicit.
- [ ] V5 Identity Engine boundary is explicit.
- [ ] V5 Asset Engine boundary is explicit.
- [ ] M9 Asset Requirement + Asset Intelligence is not misnamed.
- [ ] M10 Image Generation is correctly identified.
- [ ] M11 is not used as Character Asset System.
- [ ] Script Studio remains Script authority.
- [ ] UI flow is distinguished from milestone execution order.

## Accessibility / Responsive / Assets

- [ ] Form labels and descriptions are defined.
- [ ] Selector group/ARIA/roving-focus contract is defined.
- [ ] Relationship graph has an accessible equivalent list.
- [ ] Asset viewer focus trap/return-focus contract is defined.
- [ ] Four responsive ranges are complete.
- [ ] Exactly ten labeled verification viewports exist.
- [ ] Every runtime asset has path, dimensions, composition, focal zone, crop, exact Alt and rights rules.
- [ ] Theme pairing preserves the same character identity.
- [ ] Next.js Image and CLS rules are explicit.

## Boundary

- [ ] Presentation-only state boundary is explicit.
- [ ] Identity Lock remains preview-only.
- [ ] Frontend cannot create refs/versions.
- [ ] Browser cannot call Provider/Database directly.

## V4.1 Targeted Closure

- [ ] `CharacterRelation.continuityNotes` exists.
- [ ] `CharacterStateCardProps` exists.
- [ ] `CharacterOverviewCardProps.mainVisual` exists.
- [ ] `CharacterOverviewCardProps.arcStage` is optional and typed.
- [ ] All six runtime assets have numeric focal X/Y.
- [ ] All six runtime assets have numeric desktop/tablet safe X/Y.
- [ ] All six runtime assets have numeric mobile crop source X/Y.
- [ ] All six runtime assets have numeric mobile object-position X/Y.
- [ ] All six runtime assets have numeric maximum zoom.
