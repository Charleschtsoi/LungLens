import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("--- PROXY HIT: /api/generate-questions ---");
  try {
    const body = await req.json();
    console.log("Proxy received body:", body);

    const raw = process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8000";
    const backendUrl = raw.replace(/\/$/, "");
    console.log(`Proxy forwarding to: ${backendUrl}/api/v1/generate-questions`);

    const res = await fetch(`${backendUrl}/api/v1/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    console.log("Proxy received Backend Status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend Error Text:", errorText);
      return NextResponse.json({ suggested_questions: [] }, { status: res.status });
    }

    const data = await res.json();
    console.log("Proxy successfully parsed Backend JSON.");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Q&A Proxy CRASHED:", error);
    return NextResponse.json({ suggested_questions: [] }, { status: 500 });
  }
}
