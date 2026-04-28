import { NextResponse } from "next/server";

const BACKEND_TIMEOUT_MS = 30000;

function backendAnalyzeUrl(): string | null {
  const base = process.env.BACKEND_API_BASE_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/pipeline/analyze`;
}

export async function POST(req: Request) {
  const url = backendAnalyzeUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!url) {
    return NextResponse.json(
      { success: false, error: "BACKEND_API_BASE_URL is not configured." },
      { status: 500 },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "BACKEND_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const incoming = await req.formData();
    const image = incoming.get("image");
    const questionnaire = incoming.get("questionnaire");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing image file." },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("image", image, image.name);
    if (typeof questionnaire === "string" && questionnaire.trim()) {
      forward.append("questionnaire", questionnaire);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: forward,
      signal: controller.signal,
      cache: "no-store",
    }).finally(() => clearTimeout(timer));

    const text = await res.text();
    let payload: unknown = null;
    try {
      payload = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      payload = null;
    }

    if (!payload || typeof payload !== "object") {
      const fallback = res.ok
        ? { success: false, error: "Invalid response from backend API." }
        : { success: false, error: `Backend request failed (${res.status}).` };
      return NextResponse.json(fallback, { status: res.status || 502 });
    }

    return NextResponse.json(payload as Record<string, unknown>, {
      status: res.status,
    });
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: isAbort
          ? "Backend request timed out."
          : "Network error contacting backend API.",
      },
      { status: 502 },
    );
  }
}
