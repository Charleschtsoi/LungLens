import { NextResponse } from "next/server";

const BACKEND_TIMEOUT_MS = 30000;

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
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
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
 * Proxies multipart image to backend POST /predict/densenet (separate from /api/v1/analyze).
 */
export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_API_BASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_API_KEY is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const incoming = await req.formData();
    const image = incoming.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing image file." },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("image", image, image.name);

    const res = await fetchWithTimeout(endpoint(base, "/predict/densenet"), {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: forward,
    });

    const payload = await parseJsonBody(res);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: res.ok ? "Invalid response from backend." : `Backend request failed (${res.status}).`,
        },
        { status: res.ok ? 502 : res.status || 502 },
      );
    }

    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: isAbort ? "Backend request timed out." : "Network error contacting backend.",
      },
      { status: 502 },
    );
  }
}
