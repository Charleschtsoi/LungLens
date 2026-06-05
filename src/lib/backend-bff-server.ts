/** Server-only helpers for Next.js BFF routes → Hugging Face / local FastAPI. */

/**
 * HF 6-model analyze on cpu-basic often exceeds 60s even when warm.
 * Keep below `maxDuration` on analyze route (Vercel Pro allows up to 300s).
 */
export const BACKEND_ANALYZE_TIMEOUT_MS = 280_000;

/** Wake + model load via `/health` can be slow on cold HF Spaces. */
export const BACKEND_HEALTH_TIMEOUT_MS = 60_000;

/** Submit async analyze job (returns job_id quickly). */
export const BACKEND_JOB_SUBMIT_TIMEOUT_MS = 15_000;

/** Poll async analyze job status (each poll must stay under Vercel Hobby ~10s). */
export const BACKEND_JOB_POLL_TIMEOUT_MS = 10_000;

export function backendBaseUrl(): string | null {
  const base = process.env.BACKEND_API_BASE_URL?.trim();
  if (!base) return null;
  return base.replace(/\/$/, "");
}

export function backendEndpoint(base: string, path: string): string {
  return `${base}${path}`;
}

export function backendApiKey(): string | undefined {
  const key = process.env.BACKEND_API_KEY?.trim();
  return key || undefined;
}

export async function fetchBackendWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}
