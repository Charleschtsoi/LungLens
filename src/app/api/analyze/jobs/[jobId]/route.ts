import { NextResponse } from "next/server";
import {
  BACKEND_JOB_POLL_TIMEOUT_MS,
  backendApiKey,
  backendBaseUrl,
  backendEndpoint,
  fetchBackendWithTimeout,
} from "@/lib/backend-bff-server";
import { normalizeSuccessPayload } from "@/lib/analyze-bff-normalize";

/** Hobby-safe: each poll is a short GET. */
export const maxDuration = 10;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const base = backendBaseUrl();
  const apiKey = backendApiKey();
  const { jobId } = await context.params;

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

  if (!jobId?.trim()) {
    return NextResponse.json(
      { success: false, error: "Missing job id.", error_code: "invalid_request" },
      { status: 400 },
    );
  }

  try {
    const res = await fetchBackendWithTimeout(
      backendEndpoint(base, `/api/v1/analyze/jobs/${encodeURIComponent(jobId.trim())}`),
      {
        method: "GET",
        headers: apiKey ? { "X-API-Key": apiKey } : {},
      },
      BACKEND_JOB_POLL_TIMEOUT_MS,
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

    if (payload.status === "complete" && isRecord(payload.result)) {
      const normalized = normalizeSuccessPayload(payload.result);
      if (!normalized) {
        return NextResponse.json(
          {
            job_id: jobId,
            status: "failed",
            error: "Invalid response from backend API.",
            error_code: "backend_unavailable",
            retryable: true,
          },
          { status: 502 },
        );
      }
      return NextResponse.json(
        {
          job_id: jobId,
          status: "complete",
          result: normalized,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: isAbort ? "Backend job poll timed out." : "Network error contacting backend API.",
        error_code: isAbort ? "timeout" : "network_error",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
