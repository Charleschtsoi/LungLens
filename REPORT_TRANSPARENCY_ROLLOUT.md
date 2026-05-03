# Report Transparency Rollout

This note tracks the phased rollout for model attribution, failure handling, and mock-data disclosure.

## Phase A (implemented)

- Added visible run-mode disclosure in upload/results (`real`, `mock`, `hybrid`).
- Added results warning banner driven by response `warnings[]`.
- Added a `Model impact map` section in results.
- Added the same transparency metadata (run mode, warnings, impact map) to PDF export.

## Phase B (implemented, backward-compatible)

- Extended response typing and backend payload support with:
  - `provenance`
  - `warnings[]`
  - structured error fields: `error_code`, `stage`, `retryable`
- Kept existing fields unchanged (`predictions`, `gradcam`, `stage1`, `stage2`, `gate`, `stage3`, `report`), so existing clients remain compatible.

## Phase C (next)

- Add stable model IDs/version registry and use real model metadata values.
- Replace placeholder/mock stage provenance for fully live stages.
- Add dashboard analytics for `error_code` and degradation rates.

## Safety / compatibility guardrails

- Do not remove existing response keys while frontend still consumes them.
- If provenance is missing, frontend should default to `run_mode=real` and keep rendering.
- Degraded stage behavior should return success with warnings when educational fallback is possible.
- Hard failures should use structured error fields so UX can map clear user actions.
