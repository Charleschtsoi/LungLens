import { NextResponse } from "next/server";
import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";

const BACKEND_TIMEOUT_MS = 30000;

/** 1×1 PNG — used when backend omits heatmaps (healthy/demo runs) so normalization + client checks succeed. */
const PLACEHOLDER_HEATMAP_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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
  const t = label.trim();
  if (t === "Normal") return null;
  if (t === "COVID-19") return "COVID-19";
  if (t === "Lung Opacity" || t === "Infiltration") return "Lung Opacity";
  if (
    t === "Pneumonia" ||
    t === "Viral Pneumonia" ||
    t === "Pneumonia-Bacteria" ||
    t === "Pneumonia-Virus"
  ) {
    return "Pneumonia";
  }
  return null;
}

function firstRecord(...candidates: unknown[]): JsonRecord | null {
  for (const c of candidates) {
    if (isRecord(c)) return c;
  }
  return null;
}

function pickModelRecord(payload: JsonRecord, newKey: string, oldKey: string): JsonRecord | undefined {
  const raw = newKey in payload ? payload[newKey] : oldKey in payload ? payload[oldKey] : undefined;
  if (raw === undefined || raw === null) return undefined;
  return isRecord(raw) ? raw : undefined;
}

/** Some backends wrap the analyze body in `data` or `result`. Lift models to the root we normalize. */
function unwrapAnalyzeRoot(raw: JsonRecord): JsonRecord {
  if (
    isRecord(raw.model1) ||
    isRecord(raw.stage1) ||
    isRecord(raw.model2) ||
    isRecord(raw.stage2)
  ) {
    return raw;
  }
  const inner = raw.data ?? raw.result;
  if (!isRecord(inner)) return raw;
  if (
    isRecord(inner.model1) ||
    isRecord(inner.stage1) ||
    isRecord(inner.model2) ||
    isRecord(inner.stage2)
  ) {
    return { ...raw, ...inner };
  }
  return raw;
}

function coerceStageRecord(rec: JsonRecord): JsonRecord {
  const out: JsonRecord = { ...rec };
  const normalizeLabel = (raw: string): string => {
    const t = raw.trim();
    if (t === "Lung_Opacity") return "Lung Opacity";
    if (t === "Viral_Pneumonia") return "Viral Pneumonia";
    if (t === "Pneumonia_Bacteria") return "Pneumonia-Bacteria";
    if (t === "Pneumonia_Virus") return "Pneumonia-Virus";
    return t;
  };
  if (typeof out.prediction === "string" && typeof out.label !== "string") {
    out.label = normalizeLabel(out.prediction);
  }
  if (typeof out.label === "string") out.label = normalizeLabel(out.label);
  if (isRecord(out.probabilities)) {
    const p = out.probabilities as Record<string, unknown>;
    const normalized: JsonRecord = {};
    for (const [k, v] of Object.entries(p)) {
      normalized[normalizeLabel(k)] = v;
    }
    out.probabilities = normalized;
  }
  const c = out.confidence;
  if (typeof c === "string") {
    const n = Number(c);
    if (Number.isFinite(n)) {
      out.confidence = n > 1 ? Math.max(0, Math.min(1, n / 100)) : Math.max(0, Math.min(1, n));
    }
  } else if (typeof c === "number" && Number.isFinite(c) && c > 1) {
    out.confidence = Math.max(0, Math.min(1, c / 100));
  }
  return out;
}

function resolveModelRecord(payload: JsonRecord, newKey: string, oldKey: string): JsonRecord | undefined {
  const raw = pickModelRecord(payload, newKey, oldKey);
  if (!raw) return undefined;
  return coerceStageRecord(raw);
}

/** Model 1 ResNet-50: canonical probability keys (`Normal` / `Pneumonia-Bacteria` / `Pneumonia-Virus`). */
function normalizeModel1ProbabilityKeys(rec: JsonRecord | undefined): JsonRecord | undefined {
  if (!rec || !isRecord(rec.probabilities)) return rec;
  const p = rec.probabilities as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    const t = k.trim();
    let nk = t;
    if (t === "Pneumonia_Bacteria" || t === "Pneumonia Bacteria") nk = "Pneumonia-Bacteria";
    else if (t === "Pneumonia_Virus" || t === "Pneumonia Virus") nk = "Pneumonia-Virus";
    else if (t.toLowerCase() === "normal") nk = "Normal";
    out[nk] = v;
  }
  return { ...rec, probabilities: out };
}

function isModel2TabularShape(rec: JsonRecord): boolean {
  return rec.input_type === "tabular";
}

function resolveCopdScreeningRecord(root: JsonRecord): JsonRecord | undefined {
  const legacy = pickModelRecord(root, "copd_screening", "copd_screening");
  if (legacy) {
    const coerced = coerceStageRecord(legacy);
    return {
      ...coerced,
      input_type: "tabular",
      model_name:
        typeof coerced.model_name === "string" ? coerced.model_name : "Chronic Lung Risk (COPD)",
    };
  }
  const fromModel2 = pickModelRecord(root, "model2", "stage2");
  if (!fromModel2) return undefined;
  const coerced = coerceStageRecord(fromModel2);
  if (!isModel2TabularShape(coerced)) return undefined;
  return coerced;
}

function pickModelRecordOrNull(
  payload: JsonRecord,
  newKey: string,
  oldKey: string,
): JsonRecord | null | undefined {
  const raw = newKey in payload ? payload[newKey] : oldKey in payload ? payload[oldKey] : undefined;
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  return isRecord(raw) ? raw : undefined;
}

function numberTiming(val: unknown): number {
  return typeof val === "number" && Number.isFinite(val) ? Math.max(0, val) : 0;
}

function normalizeTimingMs(raw: unknown): JsonRecord | undefined {
  if (!isRecord(raw)) return undefined;
  const r = raw;
  const pick = (a: unknown, b: unknown) => numberTiming(a ?? b);
  if ("model1" in r || "model2" in r) {
    return {
      model1: pick(r.model1, r.stage1),
      model2: pick(r.model2, r.stage2),
      model3: pick(r.model3, r.stage3),
      model4: pick(r.model4, r.stage4),
      total: numberTiming(r.total),
    };
  }
  if ("stage1" in r || "stage2" in r) {
    return {
      model1: numberTiming(r.stage1),
      model2: numberTiming(r.stage2),
      model3: numberTiming(r.stage3),
      model4: numberTiming(r.stage4),
      total: numberTiming(r.total),
    };
  }
  return { model1: 0, model2: 0, model3: 0, model4: 0, total: numberTiming(r.total) };
}

function normalizeProvenanceObject(raw: unknown): JsonRecord | undefined {
  if (!isRecord(raw)) return undefined;
  const p: JsonRecord = { ...raw };
  if (p.model1_result == null && p.stage1_result != null) p.model1_result = p.stage1_result;
  if (p.model2_result == null && p.stage2_result != null) p.model2_result = p.stage2_result;
  delete p.stage1_result;
  delete p.stage2_result;
  if (!isRecord(p.model1) && isRecord(p.stage1)) p.model1 = p.stage1;
  if (!isRecord(p.model2) && isRecord(p.stage2)) p.model2 = p.stage2;
  if (isRecord(p.stage3)) {
    const s3 = p.stage3;
    const clinical = typeof s3.enabled === "boolean" && typeof s3.severity === "string";
    const densenet =
      s3.model_name === "DenseNet-121" ||
      (typeof s3.prediction === "string" && isRecord(s3.probabilities));
    if (clinical && !isRecord(p.clinical_risk)) p.clinical_risk = s3;
    if (densenet && !isRecord(p.model3)) p.model3 = s3;
    if (!clinical && !densenet && !isRecord(p.model3)) p.model3 = s3;
  }
  if (!isRecord(p.model4) && isRecord(p.stage4)) p.model4 = p.stage4;
  delete p.stage1;
  delete p.stage2;
  delete p.stage3;
  delete p.stage4;
  // Nested modelN.source is authoritative; keep flat modelN_result in sync for badges/summaries.
  const m1n = p.model1;
  if (isRecord(m1n) && typeof m1n.source === "string" && m1n.source.trim() !== "") {
    p.model1_result = m1n.source;
  }
  const m2n = p.model2;
  if (isRecord(m2n) && typeof m2n.source === "string" && m2n.source.trim() !== "") {
    p.model2_result = m2n.source;
  }
  const m3n = p.model3;
  if (isRecord(m3n) && typeof m3n.source === "string" && m3n.source.trim() !== "") {
    p.model3_result = m3n.source;
  }
  return p;
}

function normalizeWarningsArray(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((w) => {
    if (!isRecord(w)) return w;
    const o: JsonRecord = { ...w };
    if (o.stage == null && typeof o.scope === "string") o.stage = o.scope;
    return o;
  });
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

  const m1 = firstRecord(payload.model1, payload.stage1);
  const m2 = firstRecord(payload.model2, payload.stage2);
  const m1Label = m1?.label;
  const m1Confidence = score(m1?.confidence);

  const s1Finding = labelToFindingLabel(m1Label);
  if (s1Finding) normalized[s1Finding] = Math.max(score(normalized[s1Finding]), m1Confidence);

  if (m2 && m2.input_type !== "tabular") {
    const m2Label = m2.label;
    const m2Confidence = score(m2.confidence);
    const s2Finding = labelToFindingLabel(m2Label);
    if (s2Finding) normalized[s2Finding] = Math.max(score(normalized[s2Finding]), m2Confidence);
  }
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

function isClinicalRiskShape(rec: unknown): rec is JsonRecord {
  return isRecord(rec) && typeof rec.enabled === "boolean" && typeof rec.severity === "string";
}

/** Whether `model3` looks like DenseNet-121 output (not questionnaire `clinical_risk`). */
function isDenseNetAnalyzeShape(rec: unknown): rec is JsonRecord {
  if (!isRecord(rec)) return false;
  const mn = rec.model_name;
  if (typeof mn === "string" && /densenet-121/i.test(mn.trim())) return true;
  const hasProbs = isRecord(rec.probabilities) || isRecord(rec.all_probabilities);
  const pred = rec.prediction;
  const predString = typeof pred === "string" && pred.trim().length > 0;
  const predNested =
    isRecord(pred) && typeof pred.class_name === "string" && pred.class_name.trim().length > 0;
  const hasTopClassName = typeof rec.class_name === "string" && rec.class_name.trim().length > 0;
  if (hasProbs && (predString || predNested || hasTopClassName)) return true;
  // Grad-CAM + probability map without top-level string prediction (some deployments).
  if (hasProbs && typeof rec.gradcam === "string" && rec.gradcam.trim().length > 0) return true;
  return false;
}

/** Flatten nested DenseNet `prediction` / `class_name` so client code sees string `prediction` + 0–1 confidence. */
function coerceDenseNetModel3ForClient(rec: JsonRecord): JsonRecord {
  let out: JsonRecord = { ...rec };
  const pred = out.prediction;
  if (isRecord(pred)) {
    const className = typeof pred.class_name === "string" ? pred.class_name : "";
    const cs = pred.confidence_score;
    out = { ...out, prediction: className };
    if (typeof cs === "number" && Number.isFinite(cs) && out.confidence == null) {
      out.confidence = cs;
    }
  }
  const ps = out.prediction;
  if ((typeof ps !== "string" || !ps.trim()) && typeof out.class_name === "string" && out.class_name.trim()) {
    out.prediction = out.class_name.trim();
  }
  let c = out.confidence;
  if (typeof c === "number" && Number.isFinite(c) && c > 1) {
    out.confidence = Math.max(0, Math.min(1, c / 100));
  }
  if (out.confidence == null && typeof out.confidence_score === "number" && Number.isFinite(out.confidence_score)) {
    const cs = out.confidence_score;
    out.confidence = cs > 1 ? Math.max(0, Math.min(1, cs / 100)) : Math.max(0, Math.min(1, cs));
  }
  return out;
}

/** Raw base64 for `gradcam.heatmap_base64` (strip `data:image/...;base64,` if present). */
function heatmapBase64Payload(s: string): string {
  const t = s.trim();
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(t);
  return m && m[1] ? m[1] : t;
}

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Coerce `llm_evaluation` aliases and ensure `text` is populated when per-locale markdown exists. */
function normalizeLlmEvaluationField(raw: JsonRecord): JsonRecord {
  const out: JsonRecord = { ...raw };
  const alias = out.text_by_locale ?? out.textByLocale ?? out.translations;
  const textByLocale: JsonRecord = {};
  if (isRecord(alias)) {
    const en = trimStr(alias.en);
    const zhHans = trimStr(alias["zh-Hans"] ?? alias.zh_Hans ?? alias.zhHans);
    const zhHant = trimStr(alias["zh-Hant"] ?? alias.zh_Hant ?? alias.zhHant);
    if (en) textByLocale.en = en;
    if (zhHans) textByLocale["zh-Hans"] = zhHans;
    if (zhHant) textByLocale["zh-Hant"] = zhHant;
  }
  if (Object.keys(textByLocale).length > 0) {
    out.text_by_locale = textByLocale;
  } else {
    delete out.text_by_locale;
  }
  delete out.textByLocale;
  delete out.translations;

  const primary =
    trimStr(out.text) ||
    trimStr(textByLocale.en) ||
    trimStr(textByLocale["zh-Hant"]) ||
    trimStr(textByLocale["zh-Hans"]);
  out.text = primary;
  return out;
}

function normalizeGradcam(payload: JsonRecord, predictions: JsonRecord): JsonRecord | null {
  const gradcam = isRecord(payload.gradcam) ? payload.gradcam : null;
  const m1rec = firstRecord(payload.model1, payload.stage1);
  const m3rec = firstRecord(payload.model3, payload.stage3);
  const m1Heat =
    m1rec && typeof m1rec.gradcam === "string" && m1rec.gradcam.trim().length > 0
      ? m1rec.gradcam.trim()
      : null;
  const m3Heat =
    m3rec && typeof m3rec.gradcam === "string" && m3rec.gradcam.trim().length > 0
      ? m3rec.gradcam.trim()
      : null;
  const heatmap =
    (gradcam && typeof gradcam.heatmap_base64 === "string" && gradcam.heatmap_base64) ||
    (gradcam && typeof gradcam.overlay === "string" && gradcam.overlay) ||
    (gradcam && typeof gradcam.model2_heatmap === "string" && gradcam.model2_heatmap) ||
    (gradcam && typeof gradcam.model1_heatmap === "string" && gradcam.model1_heatmap) ||
    (gradcam && typeof gradcam.stage2_heatmap === "string" && gradcam.stage2_heatmap) ||
    (gradcam && typeof gradcam.stage1_heatmap === "string" && gradcam.stage1_heatmap) ||
    m3Heat ||
    m1Heat;

  let heatmapNorm = heatmap ? heatmapBase64Payload(heatmap) : "";
  if (!heatmapNorm) {
    heatmapNorm = PLACEHOLDER_HEATMAP_BASE64;
  }

  const top = pickTopPrediction(predictions);
  const topPrediction = gradcam?.top_prediction;
  const confidence = gradcam?.confidence;
  let validTop: FindingLabel = top.label;
  if (typeof topPrediction === "string") {
    const tp = topPrediction.trim();
    if (FINDING_LABELS.includes(tp as FindingLabel)) {
      validTop = tp as FindingLabel;
    } else if (tp === "Normal") {
      validTop = top.label;
    }
  }

  return {
    heatmap_base64: heatmapNorm,
    top_prediction: validTop,
    confidence: typeof confidence === "number" ? score(confidence) : top.confidence,
  };
}

function normalizeSuccessPayload(payload: JsonRecord): JsonRecord | null {
  const root = unwrapAnalyzeRoot(payload);
  const predictions = normalizePredictions(root);
  const gradcam = normalizeGradcam(root, predictions);
  if (!gradcam) return null;

  const m1 = normalizeModel1ProbabilityKeys(resolveModelRecord(root, "model1", "stage1"));
  const copdScreening = resolveCopdScreeningRecord(root);
  const m4SwintRaw = pickModelRecord(root, "model4_swint", "model4_swint");
  const m4Swint = m4SwintRaw ? coerceStageRecord(m4SwintRaw) : undefined;
  const m5DenseNetRaw = pickModelRecord(root, "model5_densenet", "model5_densenet");
  const m5DenseNet = m5DenseNetRaw ? coerceStageRecord(m5DenseNetRaw) : undefined;
  const m4Raw = pickModelRecordOrNull(root, "model4", "report");
  const m4 = m4Raw == null ? m4Raw : coerceStageRecord(m4Raw);

  const model3Raw = root.model3;
  const clinicalFromRoot = root.clinical_risk;

  let clinicalRisk: JsonRecord | null = null;
  if (isClinicalRiskShape(clinicalFromRoot)) clinicalRisk = clinicalFromRoot;
  else if (isClinicalRiskShape(model3Raw) && !isDenseNetAnalyzeShape(model3Raw)) {
    clinicalRisk = model3Raw;
  }

  let model3DenseNet: JsonRecord | null = null;
  if (isDenseNetAnalyzeShape(model3Raw)) {
    model3DenseNet = coerceDenseNetModel3ForClient(model3Raw as JsonRecord);
  }

  const normalized: JsonRecord = {
    ...root,
    success: true,
    predictions,
    gradcam,
    model1: m1,
    model2: copdScreening,
    copd_screening: copdScreening,
    clinical_risk: clinicalRisk,
    model3: model3DenseNet,
    model4: m4,
    model4_swint: m4Swint,
    model5_densenet: m5DenseNet,
  };

  if (!copdScreening) delete normalized.copd_screening;
  delete normalized.stage1;
  delete normalized.stage2;
  delete normalized.stage3;
  delete normalized.stage4;
  delete normalized.report;

  if (typeof normalized.requires_questionnaire !== "boolean") {
    const rcq = normalized.requires_clinical_qa;
    if (typeof rcq === "boolean") {
      normalized.requires_questionnaire = rcq;
    }
  }

  const gate = normalizeGate(root);
  if (gate) normalized.gate = gate;
  const baseWarnings = normalizeWarningsArray(root.warnings);
  normalized.warnings = baseWarnings;

  const timingNorm = normalizeTimingMs(root.timing_ms);
  if (timingNorm) normalized.timing_ms = timingNorm;

  if (isRecord(root.provenance)) {
    normalized.provenance = normalizeProvenanceObject(root.provenance);
  } else {
    normalized.provenance = {
      run_mode: "hybrid",
      model1: { source: "model", status: m1 ? "fallback" : "skipped" },
      model2: { source: "model", status: copdScreening ? "fallback" : "skipped" },
      model3: { source: "model", status: model3DenseNet != null ? "fallback" : "skipped" },
      clinical_risk: { source: "rule", status: clinicalRisk != null ? "fallback" : "skipped" },
      model4: { source: "llm", status: m4 != null ? "fallback" : "skipped" },
    };
    normalized.warnings = [
      ...baseWarnings,
      {
        code: "missing_provenance",
        message:
          "Backend did not provide provenance metadata; run mode is shown as hybrid until backend is updated.",
        stage: "pipeline",
      },
    ];
  }

  if (isRecord(normalized.llm_evaluation)) {
    normalized.llm_evaluation = normalizeLlmEvaluationField(normalized.llm_evaluation as JsonRecord);
  }

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

/**
 * Proxies multipart `POST /api/v1/analyze` to the Python backend.
 *
 * **`Invalid response from backend API.`** (502) when:
 * - Response body is empty, non-JSON, or JSON that isn’t an object (`parseJsonBody`).
 * - HTTP 200 but `normalizeSuccessPayload` fails (unexpected — heatmaps fall back to a 1×1 placeholder if all sources are empty).
 *
 * There is **no Zod** here; validation is manual. Browser `analyzeImageFile` (`src/lib/api.ts`) may return
 * **`Invalid ML server payload.`** when **predictions** (three finding scores) or **gradcam** fail `isPredictionMap` /
 * `isValidGradcam` after proxy normalization.
 */
export async function POST(req: Request) {
  const base = backendBaseUrl();
  const apiKey = process.env.BACKEND_API_KEY?.trim();

  if (!base) {
    return NextResponse.json(
      {
        success: false,
        error: "BACKEND_API_BASE_URL is not configured.",
        error_code: "backend_unavailable",
        stage: "pipeline",
        retryable: false,
      },
      { status: 500 },
    );
  }


  try {
    const incoming = await req.formData();
    const image = incoming.get("image");
    const questionnaire = incoming.get("questionnaire");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing image file.",
          error_code: "missing_image",
          stage: "pipeline",
          retryable: false,
        },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("image", image, image.name);
    const questionnaireRaw = typeof questionnaire === "string" ? questionnaire : null;
    if (questionnaireRaw?.trim()) {
      forward.append("questionnaire", questionnaireRaw);
    }
    const geminiKey = incoming.get("gemini_api_key");
    if (typeof geminiKey === "string" && geminiKey.trim()) {
      forward.append("gemini_api_key", geminiKey.trim());
    }

    const res = await fetchWithTimeout(endpoint(base, "/api/v1/analyze"), {
      method: "POST",
      headers: apiKey ? { "X-API-Key": apiKey } : {},
      body: forward,
    });
    const payload = await parseJsonBody(res);

    if (!payload) {
      console.error("[LungLens /api/analyze proxy] Backend returned empty or invalid JSON", {
        status: res.status,
        backendBase: base,
        path: "/api/v1/analyze",
      });
      const fallback = res.ok
        ? {
            success: false,
            error: "Invalid response from backend API.",
            error_code: "backend_unavailable",
            stage: "pipeline",
            retryable: true,
          }
        : {
            success: false,
            error: `Backend request failed (${res.status}).`,
            error_code: res.status >= 500 ? "backend_unavailable" : "invalid_request",
            stage: "pipeline",
            retryable: res.status >= 500,
          };
      return NextResponse.json(fallback, { status: res.status || 502 });
    }

    if (res.ok) {
      const normalized = normalizeSuccessPayload(payload);
      if (!normalized) {
        console.error(
          "[LungLens /api/analyze proxy] Response failed normalization (e.g. missing heatmap). Check backend shape vs route.ts.",
          { backendBase: base },
        );
        return NextResponse.json(
          { success: false, error: "Invalid response from backend API." },
          { status: 502 },
        );
      }
      return NextResponse.json(normalized, { status: res.status });
    }
    console.error("[LungLens /api/analyze proxy] Backend error response", {
      status: res.status,
      backendBase: base,
      bodyKeys: Object.keys(payload),
    });
    return NextResponse.json(payload, { status: res.status });
  } catch (e) {
    console.error("[LungLens /api/analyze proxy] Network or unexpected error", e, {
      backendBase: base,
    });
    const isAbort = e instanceof Error && e.name === "AbortError";
    return NextResponse.json(
      {
        success: false,
        error: isAbort
          ? "Backend request timed out."
          : "Network error contacting backend API.",
        error_code: isAbort ? "timeout" : "network_error",
        stage: "pipeline",
        retryable: true,
      },
      { status: 502 },
    );
  }
}
