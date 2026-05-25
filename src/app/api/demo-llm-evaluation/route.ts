import { NextResponse } from "next/server";
import type {
  DemoLlmSynthesisContext,
  DemoLlmSynthesisRequest,
  DemoLlmSynthesisResponse,
  LlmEvaluationResult,
  StageReportResult,
} from "@/types";

const BACKEND_TIMEOUT_MS = 30_000;

type JsonRecord = Record<string, unknown>;

function backendBaseUrl(): string | null {
  const base = process.env.BACKEND_API_BASE_URL?.trim();
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function endpoint(base: string, path: string): string {
  return `${base}${path}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function isStageReportResult(value: unknown): value is StageReportResult {
  return (
    isRecord(value) &&
    typeof value.summary === "string" &&
    Array.isArray(value.recommended_actions) &&
    value.recommended_actions.every((item) => typeof item === "string") &&
    typeof value.disclaimer === "string"
  );
}

function normalizeTextByLocale(raw: unknown): LlmEvaluationResult["text_by_locale"] | undefined {
  if (!isRecord(raw)) return undefined;
  const out: LlmEvaluationResult["text_by_locale"] = {};
  if (typeof raw.en === "string") out.en = raw.en;
  if (typeof raw["zh-Hans"] === "string") out["zh-Hans"] = raw["zh-Hans"];
  if (typeof raw["zh-Hant"] === "string") out["zh-Hant"] = raw["zh-Hant"];
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeLlmEvaluation(value: unknown): LlmEvaluationResult | null {
  if (!isRecord(value) || typeof value.status !== "string" || typeof value.text !== "string") {
    return null;
  }
  const text_by_locale = normalizeTextByLocale(value.text_by_locale);
  return text_by_locale ? { status: value.status, text: value.text, text_by_locale } : { status: value.status, text: value.text };
}

function isDemoLlmSynthesisContext(value: unknown): value is DemoLlmSynthesisContext {
  return (
    isRecord(value) &&
    (value.demo_kind === "normal" || value.demo_kind === "viral") &&
    typeof value.questionnaire_summary === "string" &&
    isRecord(value.predictions) &&
    typeof value.gradcam_top_prediction === "string" &&
    typeof value.gradcam_confidence === "number" &&
    typeof value.model1_label === "string" &&
    typeof value.model1_confidence === "number" &&
    typeof value.model2_prediction === "string" &&
    typeof value.model2_confidence === "number" &&
    typeof value.model3_prediction === "string" &&
    typeof value.model3_confidence === "number" &&
    typeof value.model6_prediction === "string" &&
    typeof value.model6_confidence === "number" &&
    (value.locale === undefined || typeof value.locale === "string")
  );
}

function isDemoLlmSynthesisRequest(value: unknown): value is DemoLlmSynthesisRequest {
  return (
    isRecord(value) &&
    typeof value.gemini_api_key === "string" &&
    value.gemini_api_key.trim().length > 0 &&
    isDemoLlmSynthesisContext(value.context)
  );
}

export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!base) {
    return NextResponse.json(
      { error: "BACKEND_API_BASE_URL is not configured.", error_code: "backend_unavailable" },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as unknown;
    if (!isDemoLlmSynthesisRequest(body)) {
      return NextResponse.json(
        { error: "Invalid demo LLM request body.", error_code: "invalid_request" },
        { status: 400 },
      );
    }

    const res = await fetchWithTimeout(endpoint(base, "/api/v1/demo-llm-evaluation"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
      },
      body: JSON.stringify(body),
    });

    let payload: unknown = null;
    try {
      payload = (await res.json()) as unknown;
    } catch {
      payload = null;
    }

    if (!isRecord(payload)) {
      return NextResponse.json(
        { error: "Invalid response from backend API.", error_code: "backend_unavailable" },
        { status: res.ok ? 502 : res.status || 502 },
      );
    }

    const model4 = isStageReportResult(payload.model4) ? payload.model4 : null;
    const llm_evaluation = normalizeLlmEvaluation(payload.llm_evaluation);
    if (!res.ok) {
      const error =
        typeof payload.error === "string" ? payload.error : "Demo LLM synthesis failed.";
      const error_code =
        typeof payload.error_code === "string" ? payload.error_code : undefined;
      return NextResponse.json(
        { error, error_code },
        { status: res.status || 502 },
      );
    }
    if (!model4 || !llm_evaluation) {
      return NextResponse.json(
        { error: "Invalid demo LLM payload from backend.", error_code: "backend_unavailable" },
        { status: 502 },
      );
    }

    const normalized: DemoLlmSynthesisResponse = {
      model4,
      llm_evaluation,
    };
    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    console.error("[LungLens /api/demo-llm-evaluation proxy] Network or unexpected error", {
      backendBase: base,
      timeout: isAbort,
    });
    return NextResponse.json(
      {
        error: isAbort ? "Demo LLM synthesis timed out." : "Network error contacting backend API.",
        error_code: isAbort ? "timeout" : "network_error",
      },
      { status: 502 },
    );
  }
}
