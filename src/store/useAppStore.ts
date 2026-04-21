import { create } from "zustand";
import type { AnalyzeSuccessResponse } from "@/types";

export interface AppState {
  doctorReviewConfirmed: boolean | null;
  privacyAcknowledged: boolean;
  imageFile: File | null;
  previewUrl: string | null;
  analysis: AnalyzeSuccessResponse | null;
  analysisError: string | null;
  analysisLoading: boolean;
  setDoctorReviewConfirmed: (value: boolean | null) => void;
  setPrivacyAcknowledged: (value: boolean) => void;
  setImage: (file: File | null, previewUrl: string | null) => void;
  setAnalysis: (result: AnalyzeSuccessResponse | null) => void;
  setAnalysisError: (message: string | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  resetUploadSession: () => void;
  resetAll: () => void;
}

const initial: Pick<
  AppState,
  | "doctorReviewConfirmed"
  | "privacyAcknowledged"
  | "imageFile"
  | "previewUrl"
  | "analysis"
  | "analysisError"
  | "analysisLoading"
> = {
  doctorReviewConfirmed: null,
  privacyAcknowledged: false,
  imageFile: null,
  previewUrl: null,
  analysis: null,
  analysisError: null,
  analysisLoading: false,
};

export const useAppStore = create<AppState>((set) => ({
  ...initial,
  setDoctorReviewConfirmed: (doctorReviewConfirmed) => set({ doctorReviewConfirmed }),
  setPrivacyAcknowledged: (privacyAcknowledged) => set({ privacyAcknowledged }),
  setImage: (imageFile, previewUrl) =>
    set({ imageFile, previewUrl, analysis: null, analysisError: null }),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setAnalysisLoading: (analysisLoading) => set({ analysisLoading }),
  resetUploadSession: () =>
    set({
      privacyAcknowledged: false,
      imageFile: null,
      previewUrl: null,
      analysis: null,
      analysisError: null,
      analysisLoading: false,
    }),
  resetAll: () => set({ ...initial }),
}));
