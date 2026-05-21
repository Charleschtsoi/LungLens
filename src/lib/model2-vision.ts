import type { AnalyzeSuccessResponse, Model2VisionResult } from "@/types";

export function isModel2Vision(m: unknown): m is Model2VisionResult {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  if (r.input_type === "tabular") return false;
  return (
    r.status === "success" &&
    (typeof r.prediction === "string" || typeof r.label === "string")
  );
}

/** Model 2 ResNet-152V2 — `model2` (vision) or legacy `model6_vision_h5`. */
export function model2VisionFromAnalysis(
  analysis: Pick<AnalyzeSuccessResponse, "model2" | "model6_vision_h5">,
): Model2VisionResult | undefined {
  if (isModel2Vision(analysis.model2)) return analysis.model2;
  if (isModel2Vision(analysis.model6_vision_h5)) return analysis.model6_vision_h5;
  return undefined;
}
