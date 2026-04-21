import type { AnalyzeResponse } from "@/lib/types/analyze";

/**
 * Client → Next.js API route. Swap implementation here when moving to
 * direct browser ML or a different gateway.
 */
export async function analyzeImageFile(file: File): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch("/api/analyze", {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as AnalyzeResponse;
  return data;
}
