/** Visual X-Ray Analysis slots — exactly five backend classifier fields. */
export const VISUAL_PIPELINE_MODEL_SLOTS = [
  "model1",
  "model2",
  "model3",
  "model4_swint",
  "model5_densenet",
] as const;

export type VisualPipelineModelSlot = (typeof VISUAL_PIPELINE_MODEL_SLOTS)[number];

export type EnsembleArchitectureRow = {
  displayName: string;
  architecture: string;
  apiField: string;
  trainedBy: string;
};

/**
 * Ensemble Architecture Details table — fixed Model 1→5 order.
 * Do not sort, filter, or derive from object keys; render this array as-is.
 */
export const ENSEMBLE_ARCHITECTURE_ROWS: readonly EnsembleArchitectureRow[] = [
  {
    displayName: "Model 1 (ResNet-50)",
    architecture: "ResNet-50 (PyTorch)",
    apiField: "model1",
    trainedBy: "Casper Lee",
  },
  {
    displayName: "Model 2 (ResNet-152V2)",
    architecture: "ResNet-152V2 (Keras H5)",
    apiField: "model2",
    trainedBy: "Edward Choi",
  },
  {
    displayName: "Model 3 (DenseNet-121)",
    architecture: "DenseNet-121 (PyTorch)",
    apiField: "model3",
    trainedBy: "Charles Tsoi",
  },
  {
    displayName: "Model 4 (Swin-T)",
    architecture: "Swin Transformer (Swin-T)",
    apiField: "model4_swint",
    trainedBy: "Casper Lee",
  },
  {
    displayName: "Model 5 (DenseNet-121)",
    architecture: "DenseNet-121 expansion (~14 classes)",
    apiField: "model5_densenet",
    trainedBy: "Dicky Ng",
  },
] as const;
