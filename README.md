# LungLens

LungLens is a chest X-ray education companion built with Next.js. It helps users understand imaging terms, view model attention maps, and prepare questions for clinicians.

Important: this project is educational and research-oriented. It is not a medical diagnostic tool.

## What This App Does

- Guides users through a safe upload flow with doctor-review and educational disclaimers.
- Runs image analysis via:
  - browser mock mode (`NEXT_PUBLIC_USE_MOCK=true`), or
  - a real ML HTTP endpoint (`NEXT_PUBLIC_ML_API_URL`).
- Presents results in an educational dashboard:
  - original image tab,
  - AI attention map tab,
  - anatomy guide tab,
  - top findings context,
  - doctor-question suggestions.

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- State: Zustand
- UI: shadcn-style components + Radix primitives
- Upload: react-dropzone
- Charts: Recharts
- ML integration:
  - Mock: `src/lib/mock.ts`
  - Real API call gateway: `src/lib/api.ts`

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

Current variables:

- `NEXT_PUBLIC_USE_MOCK`
  - `true`: use browser-side mock analysis
  - `false`: call real ML endpoint
- `NEXT_PUBLIC_ML_API_URL`
  - Base URL of ML service. App posts to `${NEXT_PUBLIC_ML_API_URL}/pipeline/analyze`.

### 3) Run development server

```bash
npm run dev
```

Open `http://localhost:3000` (or the port shown in terminal).

### 4) Build check

```bash
npm run build
```

## Project Structure

```text
src/
  app/
    page.tsx               # Landing
    upload/page.tsx        # Multi-step upload flow
    results/page.tsx       # Results dashboard
    learn/page.tsx         # Learning hub
    about/page.tsx         # Project/about page
  components/
    landing/               # Landing sections
    upload/                # Upload flow UI
    results/               # Results dashboard UI
    shared/                # Navbar/footer/disclaimers
    ui/                    # Reusable UI primitives
  lib/
    api.ts                 # Single integration switch: mock vs real ML
    mock.ts                # Mock analysis generator
    constants.ts           # Condition/anatomy copy and labels
    findings-utils.ts      # Finding thresholds and helper logic
    doctor-questions.ts    # Contextual question generation
  store/
    useAppStore.ts         # Global app state (wizard, image, analysis)
  types/
    index.ts               # Shared TypeScript types
```

## Staged Pipeline Architecture

LungLens follows a staged routing design:

1. **Stage 1**: binary pneumonia signal
2. **Stage 2**: multiclass X-ray classification
3. **Gate check**:
   - `early_stop` when both stages are effectively negative
   - `continue` when positive findings are present
4. **Stage 3 (conditional)**: short clinical questionnaire + risk scoring
5. **Stage 4**: final report synthesis with medical disclaimer

Implementation mapping:

- Types contract: `src/types/index.ts`
- API orchestration switch: `src/lib/api.ts`
- Mock parity implementation: `src/lib/mock.ts`
- Upload routing + questionnaire state: `src/store/useAppStore.ts`, `src/components/upload/*`
- Results stage rendering: `src/app/results/page.tsx`, `src/components/results/*`

Mock mode parity:

- In `NEXT_PUBLIC_USE_MOCK=true`, the mock returns staged outputs (`stage1`, `stage2`, `gate`, optional `stage3`, `report`, `timing_ms`), so UI behavior matches real pipeline routing as closely as possible.

## How to Update This Project

### A) Update UI pages/components

1. Edit route files under `src/app/*/page.tsx`.
2. Keep reusable UI in `src/components/*`.
3. Prefer adding logic to `src/lib/*` and keep pages relatively thin.

### B) Update upload flow behavior

- Flow state is managed in `src/store/useAppStore.ts`.
- Step rendering shell: `src/components/upload/UploadFlowShell.tsx`.
- Step components:
  - doctor gate: `DoctorGateQuestion.tsx`
  - privacy acknowledgment: `PrivacyNotice.tsx`
  - upload/analyze: `ImageUploader.tsx`
  - clinical questionnaire: `ClinicalQuestionnaire.tsx`

### C) Update results logic

- Main page: `src/app/results/page.tsx`
- Notable findings threshold/tiering: `src/lib/findings-utils.ts`
- Educational descriptions: `src/lib/constants.ts`
- Generated doctor questions: `src/lib/doctor-questions.ts`

### D) Connect real ML model

You only need to change integration behavior in one place:

- `src/lib/api.ts`

Current behavior:

- `NEXT_PUBLIC_USE_MOCK=true` -> `mockAnalyze(file)` from `src/lib/mock.ts`
- `NEXT_PUBLIC_USE_MOCK=false` -> POST file to real ML endpoint

Expected ML response shape:

```json
{
  "success": true,
  "predictions": {
    "Atelectasis": 0.12
  },
  "gradcam": {
    "heatmap_base64": "...",
    "top_prediction": "Effusion",
    "confidence": 0.78
  }
}
```

Tip: ensure your ML service supports CORS for the web app origin when called directly from browser.

## Quality Checks Before Pushing

Run:

```bash
npm run build
```

Optional additional check:

```bash
npm run lint
```

## Deployment Notes

- Frontend can be deployed to Vercel or other Next.js-compatible platforms.
- ML service can run on Railway, Cloud Run, or another container host.
- Set environment variables on your deployment platform:
  - `NEXT_PUBLIC_USE_MOCK`
  - `NEXT_PUBLIC_ML_API_URL`

## License

This project is licensed under the MIT License.

- See [LICENSE](LICENSE)
- Copyright (c) 2026 Chung Him TSOI

## Safety and Disclaimer

- For educational and research purposes only.
- Not a substitute for professional medical diagnosis.
- Always consult a qualified healthcare professional.
