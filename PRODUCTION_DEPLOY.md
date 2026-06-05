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

On Vercel: upload a chest X-ray at https://lung-lens.vercel.app/upload and confirm Network shows `POST /api/analyze` → results page.

## Push commands

```bash
# Frontend
cd LungLens && git push origin main

# Backend (GitHub + Hugging Face)
cd "LungLens - backend" && git push origin main && git push hf main:main
```
