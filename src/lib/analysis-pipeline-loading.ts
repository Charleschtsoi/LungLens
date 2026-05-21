/** i18n keys for rotating upload → analyze pipeline status copy (order matters). */
export const ANALYSIS_PIPELINE_MESSAGE_KEYS = [
  "upload.pipeline.init",
  "upload.pipeline.model1",
  "upload.pipeline.model2",
  "upload.pipeline.model3",
  "upload.pipeline.model4",
  "upload.pipeline.model5",
  "upload.pipeline.gemini",
  "upload.pipeline.finalize",
] as const;

export type AnalysisPipelineMessageKey = (typeof ANALYSIS_PIPELINE_MESSAGE_KEYS)[number];

/** Progress cap while waiting on the network (snaps to 100% on `complete`). */
export const ANALYSIS_PIPELINE_PROGRESS_CAP = 95;

/** Target duration to reach progress cap (ms). */
export const ANALYSIS_PIPELINE_PROGRESS_DURATION_MS = 10_000;

/** Rotate status message every N ms. */
export const ANALYSIS_PIPELINE_MESSAGE_INTERVAL_MS = 1_750;

/** Brief pause at 100% before navigating away (ms). Loader stays visible until route change. */
export const ANALYSIS_PIPELINE_COMPLETE_HOLD_MS = 400;

/** Snap progress to 100% and wait; does not clear loading — caller navigates then results page clears. */
export async function holdPipelineCompleteAnimation(): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ANALYSIS_PIPELINE_COMPLETE_HOLD_MS);
  });
}
