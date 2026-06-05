/** Server-only helpers for Next.js BFF routes → Hugging Face / local FastAPI. */

/** HF analyze on cpu-basic often exceeds 30s (cold ~60s, warm ~15–20s). Align with `maxDuration`. */
export const BACKEND_ANALYZE_TIMEOUT_MS = 60_000;

/** Wake + model load via `/health` can be slow on cold HF Spaces. */
export const BACKEND_HEALTH_TIMEOUT_MS = 60_000;

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
