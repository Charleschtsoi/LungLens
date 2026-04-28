import { mockAnalyze } from "@/lib/mock";
import { FINDING_LABELS } from "@/lib/constants";
import type {
  AnalyzeResponse,
  AnalyzeSuccessResponse,
  Predictions,
  Stage3QuestionnaireInput,
} from "@/types";

function analyzeUrl(): string {
  return "/api/analyze";
}

/**
 * Single entry point for analysis from the app.
 * - `NEXT_PUBLIC_USE_MOCK=true` → client-side mock (no server hop).
 * - Otherwise → `POST` multipart `image` to frontend `/api/analyze` proxy.
 */
export interface AnalyzeOptions {
  questionnaire?: Stage3QuestionnaireInput | null;
}

function normalizeError(status: number, fallback?: string): string {
  if (fallback && fallback.trim()) return fallback;
  if (status === 401) return "Authentication with AI service failed. Please contact support.";
  if (status === 413) return "The uploaded file is too large. Please keep it under 10MB.";
  if (status === 415) return "Unsupported file type. Please upload JPG, PNG, or WEBP.";
  if (status === 400) return "The AI service rejected this request. Please check file format and try again.";
  if (status >= 500) return "AI service is temporarily unavailable. Please try again shortly.";
  return `Request failed (${status}).`;
}

function isPredictionMap(value: unknown): value is Predictions {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  for (const label of FINDING_LABELS) {
    if (typeof obj[label] !== "number" || Number.isNaN(obj[label] as number)) return false;
  }
  return true;
}

function isValidGradcam(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const g = value as Record<string, unknown>;
  return (
    typeof g.heatmap_base64 === "string" &&
    g.heatmap_base64.length > 0 &&
    typeof g.top_prediction === "string" &&
    FINDING_LABELS.includes(g.top_prediction as (typeof FINDING_LABELS)[number]) &&
    typeof g.confidence === "number"
  );
}

export async function analyzeImageFile(
  file: File,
  options?: AnalyzeOptions,
): Promise<AnalyzeResponse> {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  if (useMock) {
    try {
      return await mockAnalyze(file, { questionnaire: options?.questionnaire ?? null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Mock analysis failed.";
      return { success: false, error: message };
    }
  }

  const url = analyzeUrl();

  const form = new FormData();
  form.append("image", file);
  if (options?.questionnaire) {
    form.append("questionnaire", JSON.stringify(options.questionnaire));
  }

  try {
    const reqStart = performance.now?.() ?? Date.now();
    const res = await fetch(url, {
      method: "POST",
      body: form,
    });

    let data: AnalyzeResponse | null = null;
    try {
      data = (await res.json()) as AnalyzeResponse;
    } catch {
      data = null;
    }

    if (!res.ok) {
      if (!data || !("success" in data) || data.success !== false) {
        return { success: false, error: normalizeError(res.status) };
      }
      return { success: false, error: normalizeError(res.status, data.error) };
    }

    if (!data || typeof data !== "object") {
      return { success: false, error: "Invalid response from ML server." };
    }

    const ok = data as AnalyzeSuccessResponse;
    if (!ok.success || !isPredictionMap(ok.predictions) || !isValidGradcam(ok.gradcam)) {
      return { success: false, error: "Invalid ML server payload." };
    }
    const elapsed = Math.round((performance.now?.() ?? Date.now()) - reqStart);
    if (!ok.timing_ms) {
      ok.timing_ms = {
        stage1: 0,
        stage2: 0,
        stage3: 0,
        stage4: 0,
        total: elapsed,
      };
    }
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error calling ML server.";
    return { success: false, error: message };
  }
}
