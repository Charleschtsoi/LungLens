import { mockAnalyze } from "@/lib/mock";
import type { AnalyzeResponse, AnalyzeSuccessResponse } from "@/types";

function mlAnalyzeUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_ML_API_URL?.trim();
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/api/analyze`;
}

/**
 * Single entry point for analysis from the app.
 * - `NEXT_PUBLIC_USE_MOCK=true` → client-side mock (no server hop).
 * - Otherwise → `POST` multipart `image` to `NEXT_PUBLIC_ML_API_URL/api/analyze`.
 */
export async function analyzeImageFile(file: File): Promise<AnalyzeResponse> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  if (useMock) {
    try {
      return await mockAnalyze(file);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Mock analysis failed.";
      return { success: false, error: message };
    }
  }

  const url = mlAnalyzeUrl();
  if (!url) {
    return {
      success: false,
      error: "NEXT_PUBLIC_ML_API_URL is not set. Enable mock mode or configure the ML server URL.",
    };
  }

  const form = new FormData();
  form.append("image", file);

  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    const data = (await res.json()) as AnalyzeResponse;

    if (!res.ok) {
      if (!("success" in data) || data.success !== false) {
        return { success: false, error: `Request failed (${res.status})` };
      }
      return data;
    }

    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid response from ML server." };
    }

    const ok = data as AnalyzeSuccessResponse;
    if (!ok.success || !ok.predictions || !ok.gradcam) {
      return { success: false, error: "Invalid ML server payload." };
    }
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error calling ML server.";
    return { success: false, error: message };
  }
}
