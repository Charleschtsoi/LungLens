---
name: health-privacy-security
description: Applies privacy and security guardrails for LungLens health-image workflows. Use when changing uploads, API routes, env vars, logs, storage, analytics, ML backend integration, or deployment settings.
---
# Health Privacy And Security

## Purpose
Protect sensitive health-adjacent data (X-ray images and questionnaire inputs) and enforce secure-by-default integration patterns.

## Apply This Skill When
- Editing upload/analyze flows.
- Changing server routes, headers, auth, or backend communication.
- Modifying environment variables or deployment docs.
- Adding telemetry, analytics, or logging.

## Core Rules
- Collect and retain the minimum data needed.
- Keep secrets server-side only. Never expose keys in `NEXT_PUBLIC_*`.
- Do not log raw image payloads, questionnaire values, or sensitive identifiers.
- Validate backend responses before trusting them.
- Use explicit error handling without leaking sensitive internals.

## Required Checks
- [ ] Secret handling verified (`.env.local` ignored, `.env.example` placeholders only).
- [ ] No sensitive values in logs, errors, or analytics events.
- [ ] Route behavior reviewed for OWASP-style risks (auth, validation, injection, exposure).
- [ ] API docs reflect true data flows and retention expectations.

## High-Risk File Areas
- `src/app/api/analyze/route.ts`
- `src/lib/api.ts`
- `src/components/upload/*`
- `.env.example`
- `README.md` (env/security docs)

## Security Review Template
1. Data touched
2. Exposure risk
3. Mitigation implemented
4. Remaining follow-up (if any)

## External Baselines
- FTC mobile health app best practices
- OWASP Top 10 web application risks
