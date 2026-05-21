/**
 * User-facing pipeline model numbers match API slots:
 * Model 2 = ResNet-152V2 (`model2`), Model 6 = COPD tabular (`model6`).
 */
export const DISPLAY_PIPELINE_MODEL = {
  edwardResNet: 2,
  copdTabular: 6,
} as const;

export type DisplayPipelineModelNumber =
  (typeof DISPLAY_PIPELINE_MODEL)[keyof typeof DISPLAY_PIPELINE_MODEL];
