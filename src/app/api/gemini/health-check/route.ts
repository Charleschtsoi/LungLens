import { NextResponse } from "next/server";

/** Shorter than full analyze; matches backend short `generate_content` probe. */
const GEMINI_PROBE_TIMEOUT_MS = 25_000;

type JsonRecord = Record<string, unknown>;

function backendBaseUrl(): string | null {
  const base = process.env.BACKEND_API_BASE_URL?.trim();
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function endpoint(base: string, path: string): string {
  return `${base}${path}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_PROBE_TIMEOUT_MS);
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

async function parseJsonBody(res: Response): Promise<JsonRecord | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Proxies `POST /api/v1/gemini/health-check` (multipart `gemini_api_key`) to the Python backend.
 * Does not log the key; forwards the same field name as analyze BYOK.
 */
export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!base) {
    return NextResponse.json(
      {
        ok: false,
        error: "BACKEND_API_BASE_URL is not configured.",
        error_code: "backend_unavailable",
      },
      { status: 500 },
    );
  }

  try {
    const incoming = await req.formData();
    const raw = incoming.get("gemini_api_key");
    const geminiKey = typeof raw === "string" ? raw : "";

    const forward = new FormData();
    forward.append("gemini_api_key", geminiKey);

    const res = await fetchWithTimeout(endpoint(base, "/api/v1/gemini/health-check"), {
      method: "POST",
      headers: apiKey ? { "X-API-Key": apiKey } : {},
      body: forward,
    });

    const payload = await parseJsonBody(res);
    if (!payload) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid response from backend API.",
          error_code: "backend_unavailable",
        },
        { status: res.ok ? 502 : res.status || 502 },
      );
    }

    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    console.error("[LungLens /api/gemini/health-check proxy] Network or unexpected error", e, {
      backendBase: base,
    });
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        ok: false,
        error: isAbort ? "Gemini health check timed out." : "Network error contacting backend API.",
        error_code: isAbort ? "timeout" : "network_error",
      },
      { status: 502 },
    );
  }
}
