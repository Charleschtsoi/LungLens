import { NextResponse } from "next/server";
import {
  BACKEND_ANALYZE_TIMEOUT_MS,
  backendApiKey,
  backendBaseUrl,
  backendEndpoint,
  fetchBackendWithTimeout,
} from "@/lib/backend-bff-server";

export const maxDuration = 60;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
 * Proxies multipart image to backend POST /predict.
 * Accept backend contract with FormData key `file`.
 */
export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = backendApiKey();

  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_API_BASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const incoming = await req.formData();
    const image = incoming.get("file") ?? incoming.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing image file." },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("file", image, image.name);

    const res = await fetchBackendWithTimeout(
      backendEndpoint(base, "/predict/densenet"),
      {
        method: "POST",
        headers: apiKey ? { "X-API-Key": apiKey } : {},
        body: forward,
      },
      BACKEND_ANALYZE_TIMEOUT_MS,
    );

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
      { status: isAbort ? 504 : 502 },
    );
  }
}
