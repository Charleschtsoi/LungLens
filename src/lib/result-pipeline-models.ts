/**
 * Config-driven pipeline result rows on the results page.
 * Add entries here for future supplemental models (e.g. model4) without new pages.
 */
export type PipelineModelRowSource = "analyze" | "supplemental";

export interface PipelineModelRowConfig {
  id: string;
  /** i18n key for the row title (e.g. "Model 1 — ResNet-50") */
  titleKey: string;
  source: PipelineModelRowSource;
  /** For supplemental fetches (DenseNet, future APIs) */
  supplementalKey?: "densenet";
}

export const PIPELINE_MODEL_ROWS: PipelineModelRowConfig[] = [
  { id: "model1", titleKey: "results.model1", source: "analyze" },
  { id: "model2", titleKey: "results.model2", source: "analyze" },
  {
    id: "model3_densenet",
    titleKey: "results.model3DenseNet",
    source: "supplemental",
    supplementalKey: "densenet",
  },
];
