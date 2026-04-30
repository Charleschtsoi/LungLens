---
name: healthcare-ux-plain-language
description: Improves patient-facing UX clarity and health literacy for LungLens. Use when editing onboarding, consent/privacy steps, questionnaire UX, result explanations, localized copy, and error or loading states.
---
# Healthcare UX And Plain Language

## Purpose
Keep LungLens understandable, calm, and actionable for non-expert users while preserving safety boundaries.

## Apply This Skill When
- Editing any user flow text or component labels.
- Revising onboarding, consent, questionnaire, or result presentation.
- Updating translations or localization keys.
- Changing loading/error messaging.

## Core UX Rules
- Put critical context first (what this is, what it is not, what to do next).
- Use plain language users can understand on first read.
- Explain clinical terms when unavoidable.
- Keep tasks brief and progressive; avoid cognitive overload.
- Avoid anxiety-amplifying or blame-style error text.

## Accessibility And Interaction Rules
- Preserve clear focus/keyboard behavior.
- Keep color from being the only signal for state/risk.
- Keep alt text meaningful for educational visuals.
- Use explicit loading/disabled states for async actions.

## Copy Quality Checklist
- [ ] Uses simple, direct wording.
- [ ] States educational scope where clinically sensitive.
- [ ] Gives clear next action for user.
- [ ] Works in EN / zh-Hant / zh-Hans parity.

## High-Risk File Areas
- `src/components/upload/*`
- `src/components/results/*`
- `src/app/upload/page.tsx`
- `src/app/results/page.tsx`
- `src/lib/i18n.ts`

## Suggested Validation
For substantial UX copy edits, test:
1. First-time upload path
2. Questionnaire submit path
3. Results interpretation path
