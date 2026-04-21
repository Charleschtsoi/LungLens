import type { AnalyzeResponse } from "@/types";

/** Client call to the Next.js analyze route (multipart field `image`). */
export async function analyzeImageFile(file: File): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: form,
  });

  return (await res.json()) as AnalyzeResponse;
}
