# LungLens Backend Env Notes

Use this as a quick reference when switching between localhost backend testing and production backend.

## 1) Localhost testing mode

Set `.env.local` to:

```env
BACKEND_API_BASE_URL=http://127.0.0.1:7861
BACKEND_API_KEY=test-key
```

Notes:
- This targets local backend (`LungLens - backend`) on port `7861`.
- Useful to verify backend code/model fixes before pushing.

## 2) Production/backend-hosted mode

Set `.env.local` to:

```env
BACKEND_API_BASE_URL=https://charleschtsoi-lunglens-backend.hf.space
BACKEND_API_KEY=<your production backend key>
```

Notes:
- Use the real backend URL and matching API key.
- Keep production secrets out of commits.

## 3) Safe switch checklist

Before local test:
- Confirm local backend is running and healthy.
- Confirm frontend points to `127.0.0.1:7861`.

Before production push/deploy:
- Switch `.env.local` back to production backend values.
- Restart dev server so env is reloaded.
- Smoke test `POST /api/analyze` once.
- Verify no secrets were committed (`git status`, `git diff`).

## 4) Optional one-off run (without editing `.env.local`)

You can override at command run time:

```bash
BACKEND_API_BASE_URL=http://127.0.0.1:7861 \
BACKEND_API_KEY=test-key \
npm run dev -- -p 3006
```
