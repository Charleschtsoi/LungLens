export const FINDING_LABELS = [
  "Atelectasis",
  "Cardiomegaly",
  "Effusion",
  "Infiltration",
  "Mass",
  "Nodule",
  "Pneumonia",
  "Pneumothorax",
  "Consolidation",
  "Edema",
  "Emphysema",
  "Fibrosis",
  "Pleural_Thickening",
  "Hernia",
] as const;

export type FindingLabel = (typeof FINDING_LABELS)[number];

export type Predictions = Record<FindingLabel, number>;

export interface GradCamPayload {
  heatmap_base64: string;
  top_prediction: FindingLabel;
  confidence: number;
}

export interface AnalyzeSuccessResponse {
  success: true;
  predictions: Predictions;
  gradcam: GradCamPayload;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;
