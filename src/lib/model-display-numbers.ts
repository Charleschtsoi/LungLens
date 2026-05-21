/**
 * User-facing pipeline model numbers on the results page.
 * API JSON fields are unchanged (`model2` = tabular COPD, `model6_vision_h5` = Edward ResNet).
 */
export const DISPLAY_PIPELINE_MODEL = {
  /** Edward ResNet-152V2 (`model6_vision_h5`; legacy H5_MODEL2). */
  edwardResNet: 2,
  /** Tabular COPD from questionnaire (`model2` / `copd_screening`). */
  copdTabular: 6,
} as const;

export type DisplayPipelineModelNumber =
  (typeof DISPLAY_PIPELINE_MODEL)[keyof typeof DISPLAY_PIPELINE_MODEL];
