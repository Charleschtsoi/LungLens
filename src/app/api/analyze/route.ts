import { NextResponse } from "next/server";
import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";

const BACKEND_TIMEOUT_MS = 30000;

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

function score(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function normalizeGate(payload: JsonRecord): JsonRecord | undefined {
  const gateResult = payload.gate_result;
  if (gateResult === "positive") return { route: "continue", reason: "positive_detected" };
  if (gateResult === "negative") return { route: "early_stop", reason: "both_negative" };

  const gate = payload.gate;
  if (isRecord(gate)) return gate;
  return undefined;
}

function labelToFindingLabel(label: unknown): FindingLabel | null {
  if (typeof label !== "string") return null;
  if (label === "Pneumonia" || label === "Viral Pneumonia") return "Pneumonia";
  if (label === "Lung Opacity") return "Infiltration";
  if (label === "Normal") return null;
  return null;
}

function normalizePredictions(payload: JsonRecord): JsonRecord {
  const existing = payload.predictions;
  const normalized: JsonRecord = {};
  for (const finding of FINDING_LABELS) normalized[finding] = 0;

  if (isRecord(existing)) {
    for (const finding of FINDING_LABELS) {
      normalized[finding] = score(existing[finding]);
    }
    return normalized;
  }

  const stage1 = isRecord(payload.stage1) ? payload.stage1 : null;
  const stage2 = isRecord(payload.stage2) ? payload.stage2 : null;
  const stage1Label = stage1?.label;
  const stage2Label = stage2?.label;
  const stage1Confidence = score(stage1?.confidence);
  const stage2Confidence = score(stage2?.confidence);

  const s1Finding = labelToFindingLabel(stage1Label);
  const s2Finding = labelToFindingLabel(stage2Label);
  if (s1Finding) normalized[s1Finding] = Math.max(score(normalized[s1Finding]), stage1Confidence);
  if (s2Finding) normalized[s2Finding] = Math.max(score(normalized[s2Finding]), stage2Confidence);
  return normalized;
}

function pickTopPrediction(predictions: JsonRecord): { label: FindingLabel; confidence: number } {
  let topLabel: FindingLabel = FINDING_LABELS[0];
  let topScore = score(predictions[topLabel]);
  for (const finding of FINDING_LABELS) {
    const s = score(predictions[finding]);
    if (s > topScore) {
      topScore = s;
      topLabel = finding;
    }
  }
  return { label: topLabel, confidence: topScore };
}

function normalizeGradcam(payload: JsonRecord, predictions: JsonRecord): JsonRecord | null {
  const gradcam = isRecord(payload.gradcam) ? payload.gradcam : null;
  const heatmap =
    (gradcam && typeof gradcam.heatmap_base64 === "string" && gradcam.heatmap_base64) ||
    (gradcam && typeof gradcam.overlay === "string" && gradcam.overlay) ||
    (gradcam && typeof gradcam.stage2_heatmap === "string" && gradcam.stage2_heatmap) ||
    (gradcam && typeof gradcam.stage1_heatmap === "string" && gradcam.stage1_heatmap);

  if (!heatmap) return null;

  const top = pickTopPrediction(predictions);
  const topPrediction = gradcam?.top_prediction;
  const confidence = gradcam?.confidence;
  const validTop =
    typeof topPrediction === "string" && FINDING_LABELS.includes(topPrediction as FindingLabel)
      ? (topPrediction as FindingLabel)
      : top.label;

  return {
    heatmap_base64: heatmap,
    top_prediction: validTop,
    confidence: typeof confidence === "number" ? score(confidence) : top.confidence,
  };
}

function normalizeSuccessPayload(payload: JsonRecord): JsonRecord | null {
  const predictions = normalizePredictions(payload);
  const gradcam = normalizeGradcam(payload, predictions);
  if (!gradcam) return null;

  const normalized: JsonRecord = {
    ...payload,
    success: true,
    predictions,
    gradcam,
  };

  if (typeof normalized.requires_questionnaire !== "boolean") {
    const rcq = normalized.requires_clinical_qa;
    if (typeof rcq === "boolean") {
      normalized.requires_questionnaire = rcq;
    }
  }

  const gate = normalizeGate(payload);
  if (gate) normalized.gate = gate;
  return normalized;
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

async function parseJsonBody(res: Response): Promise<JsonRecord | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!base) {
    return NextResponse.json(
      { success: false, error: "BACKEND_API_BASE_URL is not configured." },
      { status: 500 },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "BACKEND_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const incoming = await req.formData();
    const image = incoming.get("image");
    const questionnaire = incoming.get("questionnaire");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing image file." },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("image", image, image.name);
    const questionnaireRaw = typeof questionnaire === "string" ? questionnaire : null;
    if (questionnaireRaw?.trim()) {
      forward.append("questionnaire", questionnaireRaw);
    }

    const res = await fetchWithTimeout(endpoint(base, "/pipeline/analyze"), {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: forward,
    });
    const payload = await parseJsonBody(res);

    if (!payload) {
      const fallback = res.ok
        ? { success: false, error: "Invalid response from backend API." }
        : { success: false, error: `Backend request failed (${res.status}).` };
      return NextResponse.json(fallback, { status: res.status || 502 });
    }

    if (res.ok) {
      const normalized = normalizeSuccessPayload(payload);
      if (!normalized) {
        return NextResponse.json(
          { success: false, error: "Invalid response from backend API." },
          { status: 502 },
        );
      }
      return NextResponse.json(normalized, { status: res.status });
    }
    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: isAbort
          ? "Backend request timed out."
          : "Network error contacting backend API.",
      },
      { status: 502 },
    );
  }
}
