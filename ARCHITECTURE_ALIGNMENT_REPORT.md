# LungLens Architecture Alignment Report

This report compares the current codebase against the "LUNGLENS - ARCHITECTURE NOTES FOR CURSOR" guidance.

## Aligned and Working

- Frontend does not run ML inference and does not import torch/tensorflow-style runtime dependencies (`package.json`, `src/`).
- Frontend sends raw image files, and backend-side route forwarding keeps secrets server-side (`src/lib/api.ts`, `src/app/api/analyze/route.ts`).
- Gate-driven staged flow already exists: upload -> gate -> conditional questionnaire -> report (`src/components/upload/ImageUploader.tsx`, `src/components/upload/ClinicalQuestionnaire.tsx`, `src/app/results/page.tsx`).
- Medical disclaimers are shown pre-upload and on results/footer (`src/components/upload/PrivacyNotice.tsx`, `src/components/results/ResultsStickyDisclaimer.tsx`, `src/components/shared/MedicalDisclaimer.tsx`).

## Misaligned and Needs Adjustment

- Contract names differ across architecture notes and current frontend assumptions:
  - Current frontend expects `requires_questionnaire` and `gradcam.heatmap_base64`.
  - New notes describe `requires_clinical_qa`, `gate_result`, and staged Grad-CAM keys.
- Existing route previously only forwarded `/pipeline/analyze`, while notes also describe `/predict` and `/assess`.
- Warm-up health ping was missing in top-level frontend session flow.
- Documentation had drift:
  - README previously referenced legacy `NEXT_PUBLIC_ML_API_URL`.
  - Product roadmap privacy section previously implied in-browser tensor inference.

## Missing Before This Alignment Pass

- Silent, fire-and-forget backend health warm-up on app load.
- Explicit compatibility adapter for old/new backend field names.
- Single source of project execution rules for future Cursor tasks.

## Implemented in This Pass

- Added response normalization in Next API route so frontend remains stable while backend contracts vary:
  - Maps `requires_clinical_qa` -> `requires_questionnaire`
  - Maps `gate_result` -> `gate`
  - Normalizes staged Grad-CAM fields to `gradcam.heatmap_base64`
  - Adds `/predict` + `/assess` fallback when `/pipeline/analyze` is unavailable
- Added silent health warm-up component on app load (`src/components/shared/BackendWarmup.tsx`) and wired it in root layout.
- Reconciled docs with implemented architecture in `README.md` and `PRODUCT_ROADMAP.md`.
- Added project root `.cursorrules` to keep future work aligned with the architecture notes.
