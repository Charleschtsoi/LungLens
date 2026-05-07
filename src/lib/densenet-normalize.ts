export const DENSENET_LABELS = ["Normal", "Pneumonia-Bacteria", "Pneumonia-Virus"] as const;
export type DenseNetClass = (typeof DENSENET_LABELS)[number];

function isDenseNetClass(s: string): s is DenseNetClass {
  return (DENSENET_LABELS as readonly string[]).includes(s);
}

/** Backend may return 0–100 (e.g. 95.32) or a fraction 0–1. */
export function normalizeDenseNetConfidence(raw: number): number {
  if (!Number.isFinite(raw)) return NaN;
  if (raw >= 0 && raw <= 1) return raw * 100;
  return Math.min(100, Math.max(0, raw));
}

export function normalizeDenseNetPrediction(
  raw: string,
  probs: Record<string, number>,
): DenseNetClass | null {
  const trimmed = raw.trim();
  if (isDenseNetClass(trimmed)) return trimmed;
  const parts = trimmed
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of parts) {
    if (isDenseNetClass(p)) return p;
  }
  let best: DenseNetClass | null = null;
  let bestScore = -1;
  for (const k of DENSENET_LABELS) {
    const v = probs[k];
    if (typeof v === "number" && Number.isFinite(v) && v > bestScore) {
      bestScore = v;
      best = k;
    }
  }
  return best;
}

export function isDenseNetProbabilities(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  for (const k of DENSENET_LABELS) {
    const n = o[k];
    if (typeof n !== "number" || Number.isNaN(n)) return false;
  }
  return true;
}

/** Raw base64 without optional `data:image/...;base64,` prefix. */
export function normalizeDenseNetImagePayload(s: string): string {
  const t = s.trim();
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(t);
  return m && m[1] ? m[1] : t;
}

/**
 * True when `input_preview_base64` is non-empty and not identical to Grad-CAM
 * (backend must never alias the heatmap as the crop).
 */
export function isDistinctDenseNetInputPreview(preview: string, gradcam: string): boolean {
  const p = preview.trim();
  const g = gradcam.trim();
  if (!p) return false;
  if (!g) return true;
  return normalizeDenseNetImagePayload(p) !== normalizeDenseNetImagePayload(g);
}
