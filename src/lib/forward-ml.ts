import type { AnalyzeSuccessResponse } from "@/types";

export async function forwardToMlServer(
  image: Buffer,
  mimeType: string,
): Promise<AnalyzeSuccessResponse> {
  const base = process.env.ML_API_URL;
  if (!base) {
    throw new Error("ML_API_URL is not configured");
  }
  const url = new URL("api/analyze", base.endsWith("/") ? base : `${base}/`);
  const form = new FormData();
  const blob = new Blob([new Uint8Array(image)], { type: mimeType || "image/png" });
  form.append("image", blob, "upload");

  const res = await fetch(url.toString(), {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `ML server error ${res.status}`);
  }

  const data = (await res.json()) as AnalyzeSuccessResponse;
  if (!data.success || !data.predictions || !data.gradcam) {
    throw new Error("Invalid ML server response");
  }
  return data;
}
