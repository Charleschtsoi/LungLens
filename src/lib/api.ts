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

const ANALYZE_JOBS_URL = "/api/analyze/jobs";
const POLL_INTERVAL_MS = 2500;
const MAX_POLL_MS = 300_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Single entry point for analysis from the app.
 * Submits an async job via `/api/analyze/jobs` and polls until HF inference completes.
 * Each poll stays under Vercel Hobby limits; long work runs on Hugging Face.
 */
export interface AnalyzeOptions {
  questionnaire?: Stage3QuestionnaireInput | null;
  /** Forwarded as `gemini_api_key` on multipart POST (BYOK); server-only backend use. */
  geminiApiKey?: string;
  locale?: string;
}

function normalizeError(status: number, fallback?: string): string {
  if (fallback) {
    const lower = fallback.toLowerCase();
    if (lower.includes("h5 model unavailable") || lower.includes("model unavailable")) {
      return "Model 2 is temporarily unavailable. We are showing fallback educational output.";
    }
    if (lower.includes("timed out")) {
      return "AI service timed out. First analysis can take up to a minute while the service starts. Please retry.";
    }
  }
  if (fallback && fallback.trim()) return fallback;
  if (status === 401) return "Authentication with AI service failed. Please contact support.";
  if (status === 413) return "The uploaded file is too large. Please keep it under 10MB.";
  if (status === 415) return "Unsupported file type. Please upload JPG, PNG, or WEBP.";
  if (status === 400) return "The AI service rejected this request. Please check file format and try again.";
  if (status === 502 || status === 504) {
    return "AI service timed out. First analysis can take up to a few minutes while models run. Please retry.";
  }
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

function buildAnalyzeForm(file: File, options?: AnalyzeOptions): FormData {
  const form = new FormData();
  form.append("image", file);
  if (options?.questionnaire) {
    form.append("questionnaire", JSON.stringify(options.questionnaire));
  }
  if (options?.geminiApiKey?.trim()) {
    form.append("gemini_api_key", options.geminiApiKey.trim());
  }
  return form;
}

function enrichAnalyzeSuccess(ok: AnalyzeSuccessResponse, reqStart: number): AnalyzeSuccessResponse {
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
    const m2Vision =
      ok.model2 &&
      typeof ok.model2 === "object" &&
      "input_type" in ok.model2 &&
      ok.model2.input_type === "vision";
    ok.provenance = {
      run_mode: "hybrid",
      model1: { source: "model", status: ok.model1 ? "fallback" : "skipped" },
      model2: { source: "model", status: m2Vision ? "fallback" : "skipped" },
      model6: { source: "model", status: ok.model6 ? "fallback" : "skipped" },
      model3: { source: "model", status: ok.model3 != null ? "fallback" : "skipped" },
      clinical_risk: { source: "rule", status: ok.clinical_risk != null ? "fallback" : "skipped" },
      model4: { source: "llm", status: ok.model4 != null ? "fallback" : "skipped" },
    };
    if (!ok.warnings) ok.warnings = [];
    if (!ok.warnings.some((w) => w.code === "missing_provenance")) {
      ok.warnings.push({
        code: "missing_provenance",
        message:
          "Backend did not provide provenance metadata. Run mode is shown as hybrid until backend is updated.",
        stage: "pipeline",
      });
    }
  } else if (!ok.warnings) {
    ok.warnings = [];
  }
  return ok;
}

function parseAnalyzeSuccessPayload(data: unknown, reqStart: number): AnalyzeResponse {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Invalid response from ML server." };
  }
  const ok = data as AnalyzeSuccessResponse;
  if (!ok.success || !isPredictionMap(ok.predictions) || !isValidGradcam(ok.gradcam)) {
    console.error("[LungLens] analyze success payload failed validation", {
      success: ok.success,
      hasPredictions: Boolean(ok.predictions),
      hasGradcam: Boolean(ok.gradcam),
    });
    return { success: false, error: "Invalid ML server payload." };
  }
  return enrichAnalyzeSuccess(ok, reqStart);
}

type AnalyzeJobPollBody = {
  job_id?: string;
  status?: string;
  result?: AnalyzeSuccessResponse;
  error?: string;
  error_code?: AnalyzeErrorCode;
  retryable?: boolean;
  success?: boolean;
};

export async function analyzeImageFile(
  file: File,
  options?: AnalyzeOptions,
): Promise<AnalyzeResponse> {
  const form = buildAnalyzeForm(file, options);

  try {
    const reqStart = performance.now?.() ?? Date.now();
    const submitRes = await fetch(ANALYZE_JOBS_URL, {
      method: "POST",
      body: form,
    });

    let submitBody: AnalyzeJobPollBody | null = null;
    try {
      submitBody = (await submitRes.json()) as AnalyzeJobPollBody;
    } catch {
      submitBody = null;
    }

    if (!submitRes.ok) {
      console.error("[LungLens] POST /api/analyze/jobs failed", {
        httpStatus: submitRes.status,
        response: submitBody,
      });
      const errText = submitBody?.error;
      const errCode = submitBody?.error_code ?? normalizeErrorCode(submitRes.status);
      return {
        success: false,
        error: normalizeError(submitRes.status, errText),
        error_code: errCode,
        stage: "pipeline",
        retryable: submitBody?.retryable ?? submitRes.status >= 500,
      };
    }

    const jobId = typeof submitBody?.job_id === "string" ? submitBody.job_id.trim() : "";
    if (!jobId) {
      return { success: false, error: "Invalid ML server job response." };
    }

    const deadline = (performance.now?.() ?? Date.now()) + MAX_POLL_MS;
    while ((performance.now?.() ?? Date.now()) < deadline) {
      await sleep(POLL_INTERVAL_MS);

      const pollRes = await fetch(`${ANALYZE_JOBS_URL}/${encodeURIComponent(jobId)}`, {
        cache: "no-store",
      });
      let pollBody: AnalyzeJobPollBody | null = null;
      try {
        pollBody = (await pollRes.json()) as AnalyzeJobPollBody;
      } catch {
        pollBody = null;
      }

      if (!pollRes.ok) {
        console.error("[LungLens] GET /api/analyze/jobs poll failed", {
          httpStatus: pollRes.status,
          jobId,
          response: pollBody,
        });
        if (pollRes.status >= 500) {
          continue;
        }
        return {
          success: false,
          error: normalizeError(pollRes.status, pollBody?.error),
          error_code: pollBody?.error_code ?? normalizeErrorCode(pollRes.status),
          stage: "pipeline",
          retryable: pollBody?.retryable ?? false,
        };
      }

      if (!pollBody || typeof pollBody !== "object") {
        continue;
      }

      if (pollBody.status === "failed") {
        return {
          success: false,
          error: pollBody.error || "Analysis failed on the AI service.",
          error_code: pollBody.error_code ?? "backend_unavailable",
          stage: "pipeline",
          retryable: pollBody.retryable ?? true,
        };
      }

      if (pollBody.status === "complete" && pollBody.result) {
        return parseAnalyzeSuccessPayload(pollBody.result, reqStart);
      }
    }

    return {
      success: false,
      error:
        "AI service timed out. First analysis can take a few minutes while models run. Please retry.",
      error_code: "timeout",
      stage: "pipeline",
      retryable: true,
    };
  } catch (e) {
    console.error("[LungLens] analyzeImageFile fetch error (network or CORS)", e);
    return {
      success: false,
      error:
        "Network error contacting backend API. Check BACKEND_API_BASE_URL and BACKEND_API_KEY.",
      error_code: "network_error",
      stage: "pipeline",
      retryable: true,
    };
  }
}

const GEMINI_HEALTH_URL = "/api/gemini/health-check";

export type GeminiHealthCheckResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error?: string; error_code?: string };

/**
 * BYOK probe: short backend `generate_content` using the same model path as analyze.
 * - Empty / whitespace-only key → `{ ok: true, skipped: true }` (no network).
 */
export async function probeGeminiApiKey(
  geminiApiKey: string | undefined | null,
  file?: File | null,
): Promise<GeminiHealthCheckResult> {
  const trimmed = typeof geminiApiKey === "string" ? geminiApiKey.trim() : "";
  if (!trimmed) {
    return { ok: true, skipped: true };
  }

  const form = new FormData();
  form.append("gemini_api_key", trimmed);

  try {
    const res = await fetch(GEMINI_HEALTH_URL, {
      method: "POST",
      body: form,
    });

    let data: Record<string, unknown> | null = null;
    try {
      const j: unknown = await res.json();
      data = j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : null;
    } catch {
      data = null;
    }

    if (!data) {
      return {
        ok: false,
        error: "Invalid response from Gemini health check.",
        error_code: "internal_error",
      };
    }

    if (data.ok === true) {
      return { ok: true, skipped: data.skipped === true };
    }

    const err =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : "Gemini API key check failed.";
    const code = typeof data.error_code === "string" ? data.error_code : undefined;
    return { ok: false, error: err, error_code: code };
  } catch (e) {
    console.error("[LungLens] probeGeminiApiKey fetch error", e);
    return {
      ok: false,
      error: "Network error during Gemini key check.",
      error_code: "network_error",
    };
  }
}

const DENSENET_UNAVAILABLE = "__DENSENET_UNAVAILABLE__";

/**
 * POST /api/predict/densenet → backend /predict (multipart `file`) via Next proxy.
 * Requires Next proxy + backend configured.
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
