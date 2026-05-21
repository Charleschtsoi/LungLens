import { NextResponse } from "next/server";

function backendBaseUrl(): string | null {
  const base = process.env.BACKEND_API_BASE_URL?.trim();
  if (!base) return null;
  return base.replace(/\/$/, "");
}

export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!base) {
    return NextResponse.json(
      { status: "failed", educational_insights: [], error: "BACKEND_API_BASE_URL is not configured." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const res = await fetch(`${base}/api/v1/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[LungLens /api/generate-questions proxy] Backend error", {
        status: res.status,
        backendBase: base,
        errorText: errorText.slice(0, 500),
      });
      return NextResponse.json({ educational_insights: [] }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[LungLens /api/generate-questions proxy] Network or unexpected error", error, {
      backendBase: base,
    });
    return NextResponse.json({ educational_insights: [] }, { status: 502 });
  }
}
