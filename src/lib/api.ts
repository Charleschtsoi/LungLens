import { mockAnalyze } from "@/lib/mock";
import { FINDING_LABELS } from "@/lib/constants";
import {
  isDenseNetProbabilities,
  isDistinctDenseNetInputPreview,
  normalizeDenseNetConfidence,
  normalizeDenseNetPrediction,
} from "@/lib/densenet-normalize";
import type {
  AnalyzeResponse,
  AnalyzeSuccessResponse,
  AnalyzeErrorCode,
  DenseNetResponse,
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
  geminiApiKey?: string;
}

function normalizeError(status: number, fallback?: string): string {
  if (fallback) {
    const lower = fallback.toLowerCase();
    if (lower.includes("h5 model unavailable") || lower.includes("model unavailable")) {
      return "Model 2 is temporarily unavailable. We are showing fallback educational output.";
    }
    if (lower.includes("timed out")) {
      return "AI service timed out. Please retry in a moment.";
    }
  }
  if (fallback && fallback.trim()) return fallback;
  if (status === 401) return "Authentication with AI service failed. Please contact support.";
  if (status === 413) return "The uploaded file is too large. Please keep it under 10MB.";
  if (status === 415) return "Unsupported file type. Please upload JPG, PNG, or WEBP.";
  if (status === 400) return "The AI service rejected this request. Please check file format and try again.";
  if (status >= 500) return "AI service is temporarily unavailable. Please try again shortly.";
  return `Request failed (${status}).`;
}

function normalizeErrorCode(status: number): AnalyzeErrorCode {
  if (status === 401) return "invalid_api_key";
  if (status === 413) return "payload_too_large";
  if (status === 415) return "unsupported_file_type";
  if (status === 400) return "invalid_request";
  if (status === 504) return "timeout";
  if (status >= 500) return "backend_unavailable";
  return "internal_error";
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

  /** Browser always POSTs here; Next.js route forwards to BACKEND_API_BASE_URL/api/v1/analyze (see src/app/api/analyze/route.ts). */
  const url = analyzeUrl();

  const form = new FormData();
  form.append("image", file);
  if (options?.questionnaire) {
    form.append("questionnaire", JSON.stringify(options.questionnaire));
  }
  if (options?.geminiApiKey?.trim()) {
    form.append("gemini_api_key", options.geminiApiKey.trim());
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
      console.error("[LungLens] POST /api/analyze failed", {
        httpStatus: res.status,
        response: data,
        hint: "Check server BACKEND_API_BASE_URL (e.g. http://127.0.0.1:8000) and BACKEND_API_KEY; see terminal logs from the Next route.",
      });
      if (!data || !("success" in data) || data.success !== false) {
        return {
          success: false,
          error: normalizeError(res.status),
          error_code: normalizeErrorCode(res.status),
          stage: "pipeline",
          retryable: res.status >= 500,
        };
      }
      return {
        success: false,
        error: normalizeError(res.status, data.error),
        error_code: data.error_code ?? normalizeErrorCode(res.status),
        stage: data.stage ?? "pipeline",
        retryable: data.retryable ?? res.status >= 500,
      };
    }

    if (!data || typeof data !== "object") {
      console.error("[LungLens] /api/analyze returned OK but body is not JSON object");
      return { success: false, error: "Invalid response from ML server." };
    }

    const ok = data as AnalyzeSuccessResponse;
    if (!ok.success || !isPredictionMap(ok.predictions) || !isValidGradcam(ok.gradcam)) {
      console.error("[LungLens] /api/analyze success payload failed validation", {
        success: ok.success,
        hasPredictions: Boolean(ok.predictions),
        hasGradcam: Boolean(ok.gradcam),
        model1: ok.model1,
        model2: ok.model2,
      });
      return { success: false, error: "Invalid ML server payload." };
    }
    const elapsed = Math.round((performance.now?.() ?? Date.now()) - reqStart);
    if (!ok.timing_ms) {
      ok.timing_ms = {
        model1: 0,
        model2: 0,
        model3: 0,
        model4: 0,
        total: elapsed,
      };
    }
    if (!ok.provenance) {
      ok.provenance = {
        run_mode: "hybrid",
        model1: { source: "model", status: ok.model1 ? "fallback" : "skipped" },
        model2: { source: "model", status: ok.model2 ? "fallback" : "skipped" },
        model3: { source: "model", status: ok.model3 != null ? "fallback" : "skipped" },
        clinical_risk: { source: "rule", status: ok.clinical_risk != null ? "fallback" : "skipped" },
        model4: { source: "llm", status: ok.model4 != null ? "fallback" : "skipped" },
      };
      if (!ok.warnings) ok.warnings = [];
      if (!ok.warnings.some((w) => w.code === "missing_provenance")) {
        ok.warnings.push({
          code: "missing_provenance",
          message:
            "Backend did not provide provenance metadata; run mode is shown as hybrid until backend is updated.",
          stage: "pipeline",
        });
      }
    } else if (!ok.warnings) {
      ok.warnings = [];
    }
    return data;
  } catch (e) {
    console.error("[LungLens] analyzeImageFile fetch error (network or CORS)", e);
    const message = e instanceof Error ? e.message : "Network error calling ML server.";
    return {
      success: false,
      error: message,
      error_code: "network_error",
      stage: "pipeline",
      retryable: true,
    };
  }
}

const DENSENET_UNAVAILABLE = "__DENSENET_UNAVAILABLE__";

/**
 * POST /api/predict/densenet → backend /predict (multipart `file`) via Next proxy.
 * Does not use mock mode; requires Next proxy + backend configured.
 */
export async function predictDenseNet(imageFile: File): Promise<DenseNetResponse> {
  const form = new FormData();
  form.append("file", imageFile);

  const emptyError = (error: string): DenseNetResponse => ({
    success: false,
    prediction: "",
    confidence: 0,
    probabilities: {},
    gradcam: "",
    error,
  });

  try {
    const res = await fetch("/api/predict/densenet", {
      method: "POST",
      body: form,
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    const rec = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;

    if (!res.ok) {
      const raw =
        rec && typeof rec.error === "string"
          ? rec.error
          : res.status === 503 || res.status === 502
            ? DENSENET_UNAVAILABLE
            : `Request failed (${res.status}).`;
      const error =
        res.status === 503 || /not loaded|disabled/i.test(raw) ? DENSENET_UNAVAILABLE : raw;
      return emptyError(error);
    }

    if (!rec || rec.success !== true) {
      const err =
        rec && typeof rec.error === "string"
          ? rec.error
          : "Invalid response from DenseNet endpoint.";
      return emptyError(err);
    }

    const predictionPayload =
      rec.prediction && typeof rec.prediction === "object" && !Array.isArray(rec.prediction)
        ? (rec.prediction as Record<string, unknown>)
        : null;
    const rawPrediction =
      (predictionPayload && typeof predictionPayload.class_name === "string"
        ? predictionPayload.class_name
        : undefined) ??
      (typeof rec.prediction === "string" ? rec.prediction : "");
    const probs =
      (predictionPayload && predictionPayload.all_probabilities && typeof predictionPayload.all_probabilities === "object"
        ? (predictionPayload.all_probabilities as Record<string, number>)
        : undefined) ??
      (rec.all_probabilities && typeof rec.all_probabilities === "object"
        ? (rec.all_probabilities as Record<string, number>)
        : undefined) ??
      (rec.probabilities && typeof rec.probabilities === "object"
        ? (rec.probabilities as Record<string, number>)
        : {});
    const prediction = normalizeDenseNetPrediction(rawPrediction, probs);
    const confidence = normalizeDenseNetConfidence(
      (predictionPayload && typeof predictionPayload.confidence_score === "number" && Number.isFinite(predictionPayload.confidence_score)
        ? predictionPayload.confidence_score
        : undefined) ??
        (typeof rec.confidence === "number" && Number.isFinite(rec.confidence) ? rec.confidence : NaN),
    );
    const gradcam = typeof rec.gradcam === "string" ? rec.gradcam : "";
    const ipB64 = typeof rec.input_preview_base64 === "string" ? rec.input_preview_base64.trim() : "";
    const ipAlias = typeof rec.input_preview === "string" ? rec.input_preview.trim() : "";
    let inputPreviewRaw = ipB64 || ipAlias;
    if (inputPreviewRaw && !isDistinctDenseNetInputPreview(inputPreviewRaw, gradcam)) {
      inputPreviewRaw = "";
    }

    if (!isDenseNetProbabilities(probs)) {
      return emptyError("Invalid probabilities in response.");
    }
    if (!prediction) {
      return emptyError("Invalid prediction in response.");
    }
    if (!Number.isFinite(confidence)) {
      return emptyError("Invalid confidence in response.");
    }
    if (!gradcam) {
      return emptyError("Missing Grad-CAM in response.");
    }

    return {
      success: true,
      prediction,
      confidence,
      probabilities: probs,
      gradcam,
      ...(inputPreviewRaw ? { input_preview_base64: inputPreviewRaw } : {}),
    };
  } catch (e) {
    console.error("[LungLens] predictDenseNet fetch error", e);
    return emptyError(DENSENET_UNAVAILABLE);
  }
}

export { DENSENET_UNAVAILABLE };
