import { NextResponse } from "next/server";
import { mockAnalyze } from "@/lib/mock-analyze";
import { forwardToMlServer } from "@/lib/ml-client";
import type { AnalyzeErrorResponse } from "@/lib/types/analyze";

export const runtime = "nodejs";

function resolveMockMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "false") return false;
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") return true;
  // Dev-friendly default: mock when no ML server URL is configured
  return !process.env.ML_API_URL;
}

export async function POST(req: Request) {
  let buffer: Buffer;
  let mimeType = "image/png";

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("image");
    if (!file || !(file instanceof Blob)) {
      const err: AnalyzeErrorResponse = {
        success: false,
        error: 'Missing multipart field "image" (JPEG/PNG).',
      };
      return NextResponse.json(err, { status: 400 });
    }
    mimeType = file.type || mimeType;
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  } else {
    const err: AnalyzeErrorResponse = {
      success: false,
      error: "Expected multipart/form-data with field image.",
    };
    return NextResponse.json(err, { status: 400 });
  }

  if (buffer.length === 0) {
    const err: AnalyzeErrorResponse = { success: false, error: "Empty image upload." };
    return NextResponse.json(err, { status: 400 });
  }

  try {
    if (resolveMockMode()) {
      const data = await mockAnalyze(buffer);
      return NextResponse.json(data);
    }
    const data = await forwardToMlServer(buffer, mimeType);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed.";
    const err: AnalyzeErrorResponse = { success: false, error: message };
    return NextResponse.json(err, { status: 502 });
  }
}
