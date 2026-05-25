# LungLens

LungLens is a chest X-ray education companion built with Next.js. It helps users understand imaging terms, view attention overlays, and prepare better questions for clinicians.

Important: this project is educational and research-oriented. It is not a medical diagnostic tool.

## Teammate Quick Run (5-10 minutes)

1. Install dependencies: `npm install`
2. Copy env template: `cp .env.example .env.local`
3. Start in mock mode first:
   - set `NEXT_PUBLIC_USE_MOCK=true`
   - run `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000), upload any chest image, confirm results page renders.
5. Switch to real backend:
   - set `NEXT_PUBLIC_USE_MOCK=false`
   - set `BACKEND_API_BASE_URL` and `BACKEND_API_KEY`
   - restart dev server
6. Re-test upload + results flow.

## What This App Does

- Guides users through doctor-review + disclaimer-aware upload flow.
- Runs analysis through:
  - browser mock mode (`NEXT_PUBLIC_USE_MOCK=true`), or
  - server proxy route (`/api/analyze`) forwarding to backend.
- Shows educational results:
  - original image,
  - AI attention overlay,
  - anatomy guide,
  - primary finding explanations,
  - suggested doctor questions.

## Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- State: Zustand
- UI: Radix primitives + reusable UI components
- Upload: react-dropzone
- Charts: Recharts
- Integration:
  - Mock path: `src/lib/mock.ts`
  - Real path: `src/lib/api.ts` -> `src/app/api/analyze/route.ts`, `src/app/api/gemini/health-check/route.ts`, `src/app/api/demo-llm-evaluation/route.ts`

## Local Setup (Detailed)

### Prerequisites

- Node.js 20+ recommended
- npm 10+
- Optional (for local backend sample): Python 3.10+

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env.local
```

Set values in `.env.local`:

- `NEXT_PUBLIC_USE_MOCK`
  - `true` = browser mock pipeline
  - `false` = use server proxy routes
- `NEXT_PUBLIC_API_URL`
  - Used only for silent warm-up ping (`${NEXT_PUBLIC_API_URL}/health`).
- `BACKEND_API_BASE_URL` (server-only)
  - Backend root — must match your uvicorn port (often `http://127.0.0.1:7861`, not 8000)
  - Frontend routes call:
    - `${BACKEND_API_BASE_URL}/api/v1/analyze`
    - `${BACKEND_API_BASE_URL}/api/v1/gemini/health-check` (BYOK key probe; proxied by Next as `POST /api/gemini/health-check`)
    - `${BACKEND_API_BASE_URL}/api/v1/demo-llm-evaluation` (demo filename flow with real Gemini synthesis)
    - `${BACKEND_API_BASE_URL}/api/v1/generate-questions`
    - `${BACKEND_API_BASE_URL}/api/v1/predict/densenet` (if used)
- `BACKEND_API_KEY` (server-only)
  - Sent by Next.js API routes as `X-API-Key`.

Never store secrets in `NEXT_PUBLIC_*` vars.

### 3) Run frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4) Production sanity check

```bash
npm run build
```

## Local Backend Sample (optional but useful)

This repo includes a lightweight FastAPI sample under `backend/` for doctor-question endpoint testing and local wiring checks.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 7861
```

Then set:

- `BACKEND_API_BASE_URL=http://127.0.0.1:7861`
- restart Next dev server if already running.

## Pipeline Architecture

API fields: `model1`, `model2`, `model3`, `clinical_risk`, `model4`, `model4_swint`, `model5_densenet`, `copd_screening`.

Model stages:

1. **Model 1 (ResNet-50)** — visual X-ray: 3-class (Normal / Pneumonia-Bacteria / Pneumonia-Virus)
2. **Model 2 (ResNet-152V2, Edward)** — visual X-ray in the pipeline card (`model6_vision_h5`; legacy H5_MODEL2 naming)
3. **Model 6 (Chronic Lung Risk / COPD)** — clinical questionnaire: tabular neural network (`model6` or `copd_screening`); shown under **Clinical Patient Assessment**, not in the visual X-ray list
4. **Gate**: `early_stop` or `continue`
5. **Model 3 (DenseNet-121)** — visual X-ray: `COVID-19` / `Normal` / `Pneumonia` (+ optional Grad-CAM)
6. **Model 4 (Swin-T)** — visual X-ray: `model4_swint`
7. **Model 5 (DenseNet-121 H5)** — visual X-ray: `model5_densenet`
8. **clinical_risk**: rule-based questionnaire severity (separate from Model 6 COPD score)
9. **model4**: report synthesis

Primary `predictions` dictionary is now expected to use:

- `Pneumonia`
- `Lung Opacity`
- `COVID-19`

See [`docs/BACKEND_MODELS.md`](docs/BACKEND_MODELS.md) for detailed payload contracts.

## Manual Test Checklist

### A) Mock mode test

Use:

- `NEXT_PUBLIC_USE_MOCK=true`

Steps:

1. Open `/upload`
2. Complete doctor gate + privacy step
3. Upload image and run analysis
4. Verify `/results` renders:
   - pipeline cards
   - findings section with three-class labels only
   - doctor questions section
   - visible educational disclaimers
5. Export PDF and confirm file downloads.

Expected:

- Findings badge may show `Mock Data`
- Findings notice indicates demo/mock context.

### B) Real backend test

Use:

- `NEXT_PUBLIC_USE_MOCK=false`
- valid `BACKEND_API_BASE_URL` and `BACKEND_API_KEY`

Steps:

1. Repeat upload flow
2. Open browser devtools -> Network
3. Confirm browser calls Next routes (not backend directly):
   - `POST /api/analyze`
   - `POST /api/generate-questions`
4. Verify findings section:
   - explanations for `Pneumonia`, `Lung Opacity`, `COVID-19`
   - provenance badge aligns with backend source metadata
   - text: "These findings are generated directly from the AI models' primary classifications."

### C) Error handling test

1. Stop backend and run with `NEXT_PUBLIC_USE_MOCK=false`
2. Upload an image
3. Confirm user-facing error is graceful and app does not crash.

### D) i18n smoke test

1. Switch language in UI
2. Verify findings titles/descriptions and provenance messages render in selected locale.

## Developer Quality Checks (before opening PR)

Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Optional:

```bash
npm audit --audit-level=high
```

Note: current audit may report high-severity advisories tied to Next.js/eslint-config-next major upgrade path; track separately if not upgrading framework in the same PR.

## Key Files to Know

```text
src/app/results/page.tsx                 # Results orchestration and provenance summaries
src/components/results/FindingsCard.tsx  # Findings UI + provenance notice
src/lib/constants.ts                     # Finding labels and English explanations
src/lib/i18n.ts                          # Localized copy
src/lib/provenance-ui.ts                 # Badge normalization and provenance mapping
src/app/api/analyze/route.ts             # Backend response normalization
src/lib/high-attention-findings.ts       # Mapping to doctor-question triggers
src/lib/mock.ts                          # Browser mock pipeline implementation
src/types/index.ts                       # Shared API/types contract
docs/BACKEND_MODELS.md                   # Backend payload expectations
```

## Backend connectivity (network errors)

`Network error contacting backend API` from the Next BFF means `fetch` to `BACKEND_API_BASE_URL` failed (connection refused, wrong host/port, timeout)—not a bad JSON schema.

| Check | Action |
|--------|--------|
| Port | `BACKEND_API_BASE_URL` must match uvicorn (e.g. `http://127.0.0.1:7861`) |
| API key | `BACKEND_API_KEY` = backend `API_KEY` when `REQUIRE_API_KEY=true` |
| Backend running | `uvicorn main:app --host 0.0.0.0 --port 7861` (restart after backend code changes) |
| CORS | Backend `ALLOWED_ORIGINS` includes `http://localhost:3000` |

**API slots (current backend):** `model2` = Edward ResNet vision (`input_type: "vision"`); `model6` = COPD tabular (`input_type: "tabular"` after questionnaire). BFF maps legacy `model6_vision_h5` / tabular `model2` when present.

**Insights:** `POST /api/generate-questions` returns `educational_insights[]` (not `suggested_questions`). UI section: “Health information for your scan”.

## Deployment Notes

- Frontend: Vercel, **Cloudflare Workers** (OpenNext), or any Next.js-compatible runtime
- Backend: container host (Railway, Cloud Run, etc.)
- Set platform env vars:
  - `NEXT_PUBLIC_USE_MOCK`
  - `NEXT_PUBLIC_API_URL`
  - `BACKEND_API_BASE_URL`
  - `BACKEND_API_KEY`

### Cloudflare Workers (OpenNext)

Cloudflare’s auto-migrate installs `@opennextjs/cloudflare@latest`, which **requires Next.js 15.5+** and breaks this repo on **Next 14.2.35**. Use the pinned adapter already in `package.json`:

| Setting | Value |
|--------|--------|
| Build command | `npm run build:cloudflare` |
| Deploy (CLI) | `npm run deploy:cloudflare` |
| Adapter | `@opennextjs/cloudflare@1.15.1` (supports Next `14.2.35`) |

**Worker secrets / vars** (Dashboard → Workers → lunglens → Settings → Variables):

- `BACKEND_API_BASE_URL` — your ML API root (HTTPS)
- `BACKEND_API_KEY` — server API key
- `NEXT_PUBLIC_USE_MOCK` — `false` for production
- `NEXT_PUBLIC_API_URL` — optional warm-up health URL

The log line `WARN Failed to set up cache for your project` is expected when R2 is not enabled; caching uses the default in-memory config in `open-next.config.ts` until you add an R2 bucket binding.

Local Workers preview: `cp .dev.vars.example .dev.vars` then `npm run preview:cloudflare`.

## License

- MIT, see [LICENSE](LICENSE)
- Copyright (c) 2026 Chung Him TSOI

## Safety Disclaimer

- Educational/research use only
- Not a substitute for medical diagnosis
- Always consult a qualified healthcare professional
