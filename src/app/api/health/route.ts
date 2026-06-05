import { NextResponse } from "next/server";
import {
  BACKEND_HEALTH_TIMEOUT_MS,
  backendBaseUrl,
  backendEndpoint,
  fetchBackendWithTimeout,
} from "@/lib/backend-bff-server";

/** Cold HF `/health` can take up to ~60s on cpu-basic. */
export const maxDuration = 60;

export async function GET() {
  const base = backendBaseUrl();
  if (!base) {
    return NextResponse.json(
      { status: "unavailable", error: "BACKEND_API_BASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const res = await fetchBackendWithTimeout(
      backendEndpoint(base, "/health"),
      { method: "GET" },
      BACKEND_HEALTH_TIMEOUT_MS,
    );
    const text = await res.text();
    if (!text) {
      return NextResponse.json({ status: "error", error: "Empty backend health response." }, { status: 502 });
    }
    try {
      const body = JSON.parse(text) as unknown;
      return NextResponse.json(body, { status: res.ok ? 200 : res.status });
    } catch {
      return NextResponse.json({ status: "error", error: "Invalid backend health JSON." }, { status: 502 });
    }
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        status: "error",
        error: isAbort ? "Backend health check timed out." : "Network error contacting backend.",
        error_code: isAbort ? "timeout" : "network_error",
      },
      { status: isAbort ? 504 : 502 },
    );
  }
}
