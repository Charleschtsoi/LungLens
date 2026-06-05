# Production deployment

## Repositories

| Component | GitHub | Live host |
|-----------|--------|-----------|
| Frontend | https://github.com/Charleschtsoi/LungLens (`main`) | Vercel: https://lung-lens.vercel.app |
| Backend | https://github.com/Charleschtsoi/lunglens-backend (`main`) | Hugging Face: https://charleschtsoi-lunglens-backend.hf.space |

## Vercel environment variables

Set in **Project → Settings → Environment Variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `BACKEND_API_BASE_URL` | `https://charleschtsoi-lunglens-backend.hf.space` |
| `BACKEND_API_KEY` | Same as Hugging Face Space `API_KEY` |
| `NEXT_PUBLIC_API_URL` | Optional: same HF base URL (silent backend warm-up) |

Do **not** set `NEXT_PUBLIC_USE_MOCK` (removed from codebase).

Redeploy after changing env vars.

## Hugging Face Space variables

In **Settings → Variables** for `Charleschtsoi/lunglens-backend`:

- `ENVIRONMENT=production`
- `REQUIRE_API_KEY=true`
- `API_KEY` — must match Vercel `BACKEND_API_KEY`
- `ALLOWED_ORIGINS` — include `https://lung-lens.vercel.app` (no `*` in production)
- Enable models and set `*_PATH` for weights under `/app/models/` (weights are not in Git)

## Smoke tests

```bash
curl https://charleschtsoi-lunglens-backend.hf.space/healthz
curl -H "X-API-Key: <API_KEY>" -X POST "https://charleschtsoi-lunglens-backend.hf.space/api/v1/analyze" \
  -F "image=@testfile/Lung Xray.jpeg;type=image/jpeg" -F 'questionnaire={}'
```

On Vercel: upload a chest X-ray and confirm Network shows `POST /api/analyze` → results page.

### Verified (agent run)

- HF `GET /healthz` → healthy (allow ~60s on cold start).
- HF `POST /api/v1/analyze` with valid `X-API-Key` → `success: true` (may show `run_mode: rules` until model files are loaded on the Space).
- `GET /health` on HF: enable flags and upload weights under `/app/models/` if `loaded: false`.

### Action required on Vercel

1. Confirm the Vercel project is linked to `Charleschtsoi/LungLens`, branch `main`.
2. Set env vars above and **Redeploy** after `main` includes commit `5eac1a9` (or later).
3. If `https://lung-lens.vercel.app/upload` returns 404, the live deployment is stale or points at the wrong project—fix linkage and redeploy.

## Push commands

```bash
# Frontend
cd LungLens && git push origin main

# Backend (GitHub + Hugging Face)
cd "LungLens - backend" && git push origin main && git push hf main:main
```
