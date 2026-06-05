import { NextResponse } from "next/server";
import { normalizeSuccessPayload } from "@/lib/analyze-bff-normalize";
import {
  BACKEND_ANALYZE_TIMEOUT_MS,
  backendApiKey,
  backendBaseUrl as resolveBackendBaseUrl,
  backendEndpoint,
  fetchBackendWithTimeout,
} from "@/lib/backend-bff-server";

/** Legacy sync proxy; primary flow uses `/api/analyze/jobs` polling. */
export const maxDuration = 300;

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
 * Proxies multipart `POST /api/v1/analyze` to the Python backend.
 *
 * **`Invalid response from backend API.`** (502) when:
 * - Response body is empty, non-JSON, or JSON that isn’t an object (`parseJsonBody`).
 * - HTTP 200 but `normalizeSuccessPayload` fails (unexpected — heatmaps fall back to a 1×1 placeholder if all sources are empty).
 *
 * There is **no Zod** here; validation is manual. Browser `analyzeImageFile` (`src/lib/api.ts`) may return
 * **`Invalid ML server payload.`** when **predictions** (three finding scores) or **gradcam** fail `isPredictionMap` /
 * `isValidGradcam` after proxy normalization.
 */
export async function POST(req: Request) {
  const base = resolveBackendBaseUrl();
  const apiKey = backendApiKey();

  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_API_BASE_URL is not configured.",
        error_code: "backend_unavailable",
        stage: "pipeline",
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
          stage: "pipeline",
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
      backendEndpoint(base, "/api/v1/analyze"),
      {
        method: "POST",
        headers: apiKey ? { "X-API-Key": apiKey } : {},
        body: forward,
      },
      BACKEND_ANALYZE_TIMEOUT_MS,
    );
    const payload = await parseJsonBody(res);

    if (!payload) {
      console.error("[LungLens /api/analyze proxy] Backend returned empty or invalid JSON", {
        status: res.status,
        backendBase: base,
        path: "/api/v1/analyze",
      });
      const fallback = res.ok
        ? {
            success: false,
            error: "Invalid response from backend API.",
            error_code: "backend_unavailable",
            stage: "pipeline",
            retryable: true,
          }
        : {
            success: false,
            error: `Backend request failed (${res.status}).`,
            error_code: res.status >= 500 ? "backend_unavailable" : "invalid_request",
            stage: "pipeline",
            retryable: res.status >= 500,
          };
      return NextResponse.json(fallback, { status: res.status || 502 });
    }

    if (res.ok) {
      const normalized = normalizeSuccessPayload(payload);
      if (!normalized) {
        console.error(
          "[LungLens /api/analyze proxy] Response failed normalization (e.g. missing heatmap). Check backend shape vs route.ts.",
          { backendBase: base },
        );
        return NextResponse.json(
          { success: false, error: "Invalid response from backend API." },
          { status: 502 },
        );
      }
      return NextResponse.json(normalized, { status: res.status });
    }
    console.error("[LungLens /api/analyze proxy] Backend error response", {
      status: res.status,
      backendBase: base,
      bodyKeys: Object.keys(payload),
    });
    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    console.error("[LungLens /api/analyze proxy] Network or unexpected error", e, {
      backendBase: base,
    });
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: isAbort
          ? "Backend request timed out."
          : "Network error contacting backend API.",
        error_code: isAbort ? "timeout" : "network_error",
        stage: "pipeline",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
