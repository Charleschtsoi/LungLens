import { NextResponse } from "next/server";
import { forwardToMlServer } from "@/lib/forward-ml";
import { generateMockAnalysis } from "@/lib/mock";
import type { AnalyzeErrorResponse } from "@/types";

export const runtime = "nodejs";

function resolveMockMode(): boolean {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "false") return false;
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") return true;
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
    buffer = Buffer.from(await file.arrayBuffer());
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
      const data = await generateMockAnalysis(buffer);
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
