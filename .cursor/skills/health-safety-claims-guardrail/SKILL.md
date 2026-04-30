---
name: health-safety-claims-guardrail
description: Enforces educational-not-diagnostic medical copy standards for LungLens. Use when editing landing text, upload flow copy, findings/report summaries, disclaimers, doctor-question prompts, or any user-facing health claim.
---
# Health Safety And Claims Guardrail

## Purpose
Keep LungLens copy aligned with its educational scope and prevent accidental diagnostic overclaim.

## Apply This Skill When
- Editing user-facing text in upload, results, learn, and about flows.
- Updating AI-generated summary wording or condition explanations.
- Changing CTAs, warning prompts, or disclaimer placement.

## Non-Negotiable Rules
- Do not state diagnosis, clearance, or treatment decisions.
- Do not imply clinical certainty from model output.
- Keep educational framing explicit.
- Keep clinician escalation language visible.

## Preferred Wording Pattern
- Use: "patterns associated with", "model highlighted", "educational output", "discuss with your clinician".
- Avoid: "you have", "you are normal", "confirmed", "ruled out", "safe to ignore".

## Safety Copy Checklist
- [ ] Includes educational-not-diagnostic boundary.
- [ ] Mentions clinician confirmation where needed.
- [ ] Avoids certainty language and treatment advice.
- [ ] Keeps emergency or worsening-symptom guidance intact.

## High-Risk File Areas
- `src/app/results/page.tsx`
- `src/components/results/*`
- `src/components/upload/*`
- `src/lib/i18n.ts`
- `src/lib/constants.ts`
- `src/lib/doctor-questions.ts`

## Review Output Format
When reviewing or proposing wording, return:
1. Risky original phrase
2. Why risky
3. Safe replacement
