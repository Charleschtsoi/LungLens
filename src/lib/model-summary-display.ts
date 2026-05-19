import {
  VISUAL_PIPELINE_MODEL_SLOTS,
  type VisualPipelineModelSlot,
} from "@/lib/ensemble-architecture";

/** Normalize a model probability or confidence value to 0–100 for display. */
export function probabilityToPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const pct = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, pct));
}

/** Top score from a probability map, or fall back to a single confidence field. */
export function topProbabilityPercent(
  probabilities: Record<string, number> | null | undefined,
  confidence?: number,
): number {
  if (probabilities && Object.keys(probabilities).length > 0) {
    let max = 0;
    for (const v of Object.values(probabilities)) {
      if (typeof v !== "number" || !Number.isFinite(v)) continue;
      max = Math.max(max, probabilityToPercent(v));
    }
    return Math.round(max);
  }
  if (confidence != null && Number.isFinite(confidence)) {
    return Math.round(probabilityToPercent(confidence));
  }
  return 0;
}

/**
 * Pipeline card headline: emphasize that the % is the top class among many (e.g. 14-way Model 5),
 * not clinical diagnostic confidence.
 */
export function highestProbabilityLabel(
  t: (key: string, fallback?: string) => string,
  pct: number,
): string {
  const template = t("results.modelSummary.highestPct", "{pct}% — highest probability");
  return template.replace(/\{pct\}/g, String(pct));
}

export function formatClassifierSummaryLine(
  stageLabel: (value: string) => string,
  prediction: string,
  options: {
    confidence?: number;
    probabilities?: Record<string, number> | null;
    t: (key: string, fallback?: string) => string;
  },
): string {
  const pct = topProbabilityPercent(options.probabilities, options.confidence);
  return `${stageLabel(prediction)} (${highestProbabilityLabel(options.t, pct)})`;
}

/** Live models first (1→5), unavailable slots at the bottom of the Visual X-Ray list. */
export function sortVisualPipelineSlots(
  rows: Record<VisualPipelineModelSlot, { available?: boolean }>,
): VisualPipelineModelSlot[] {
  return [...VISUAL_PIPELINE_MODEL_SLOTS].sort((a, b) => {
    const aLive = rows[a].available !== false;
    const bLive = rows[b].available !== false;
    if (aLive !== bLive) return aLive ? -1 : 1;
    return VISUAL_PIPELINE_MODEL_SLOTS.indexOf(a) - VISUAL_PIPELINE_MODEL_SLOTS.indexOf(b);
  });
}
