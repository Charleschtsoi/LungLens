import { FINDING_LABELS, type FindingLabel } from "@/lib/constants";
import type { Predictions } from "@/types";

const THRESHOLD = 0.3;

export type ConfidenceTier = "Low" | "Moderate" | "High";

export function confidenceTier(score: number): ConfidenceTier {
  if (score < 0.45) return "Low";
  if (score < 0.65) return "Moderate";
  return "High";
}

export function tierBarSegments(tier: ConfidenceTier): 1 | 2 | 3 {
  if (tier === "Low") return 1;
  if (tier === "Moderate") return 2;
  return 3;
}

export function formatConditionName(label: FindingLabel): string {
  return label.replace(/_/g, " ");
}

/** Top findings above threshold, sorted by score descending, max 3. */
export function getNotableFindings(predictions: Predictions): { label: FindingLabel; score: number }[] {
  return (FINDING_LABELS as readonly FindingLabel[])
    .map((label) => ({ label, score: predictions[label] }))
    .filter((x) => x.score > THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export { THRESHOLD as FINDINGS_CONFIDENCE_THRESHOLD };
