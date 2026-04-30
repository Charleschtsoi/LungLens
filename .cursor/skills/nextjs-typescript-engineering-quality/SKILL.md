---
name: nextjs-typescript-engineering-quality
description: Enforces maintainable Next.js and TypeScript engineering standards for LungLens. Use when refactoring, adding features, reviewing diffs, updating API contracts, or improving reliability and testability.
---
# Next.js TypeScript Engineering Quality

## Purpose
Keep code changes small, typed, testable, and easy to review while preserving mock/real pipeline parity.

## Apply This Skill When
- Refactoring shared logic.
- Adding or changing API contracts and result-shape handling.
- Modifying store state flows.
- Performing senior-style code review before commit.

## Engineering Rules
- Keep routes/pages thin; move logic to `lib`, `components`, or store helpers.
- Prefer explicit types at module boundaries.
- Use `unknown` for untrusted payloads, then validate.
- Minimize exported API surface.
- Keep mock and real API response contracts aligned.
- Avoid hidden coupling across upload → analysis → results steps.

## Review Checklist
- [ ] Inputs validated and narrowed before use.
- [ ] Error paths are explicit and user-safe.
- [ ] No secret or env misuse in client code.
- [ ] Naming and file placement match current project structure.
- [ ] Lint and type checks pass after substantial edits.

## High-Impact File Areas
- `src/lib/api.ts`
- `src/lib/mock.ts`
- `src/types/index.ts`
- `src/store/useAppStore.ts`
- `src/app/api/analyze/route.ts`

## Verification Commands
- `npm run lint`
- `npx tsc --noEmit`

## Review Output Format
1. Correctness risks
2. Contract/type risks
3. Maintainability concerns
4. Recommended minimal diff
