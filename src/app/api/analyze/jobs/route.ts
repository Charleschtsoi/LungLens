import { NextResponse } from "next/server";
import {
  BACKEND_JOB_SUBMIT_TIMEOUT_MS,
  backendApiKey,
  backendBaseUrl,
  backendEndpoint,
  fetchBackendWithTimeout,
} from "@/lib/backend-bff-server";

/** Hobby-safe: only submits job; inference runs on HF in background. */
export const maxDuration = 15;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = backendApiKey();

  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_API_BASE_URL is not configured.",
        error_code: "backend_unavailable",
        retryable: false,
      },
      { status: 500 },
    );
  }

  try {
    const incoming = await req.formData();
    const image = incoming.get("image");
    const questionnaire = incoming.get("questionnaire");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing image file.",
          error_code: "missing_image",
          retryable: false,
        },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("image", image, image.name);
    const questionnaireRaw = typeof questionnaire === "string" ? questionnaire : null;
    if (questionnaireRaw?.trim()) {
      forward.append("questionnaire", questionnaireRaw);
    }
    const geminiKey = incoming.get("gemini_api_key");
    if (typeof geminiKey === "string" && geminiKey.trim()) {
      forward.append("gemini_api_key", geminiKey.trim());
    }

    const res = await fetchBackendWithTimeout(
      backendEndpoint(base, "/api/v1/analyze/jobs"),
      {
        method: "POST",
        headers: apiKey ? { "X-API-Key": apiKey } : {},
        body: forward,
      },
      BACKEND_JOB_SUBMIT_TIMEOUT_MS,
    );

    const text = await res.text();
    let payload: JsonRecord | null = null;
    if (text) {
      try {
        const parsed = JSON.parse(text) as unknown;
        payload = isRecord(parsed) ? parsed : null;
      } catch {
        payload = null;
      }
    }

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from backend API.",
          error_code: "backend_unavailable",
          retryable: true,
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
        error: isAbort ? "Backend job submit timed out." : "Network error contacting backend API.",
        error_code: isAbort ? "timeout" : "network_error",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
