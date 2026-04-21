import { create } from "zustand";
import type { AnalyzeSuccessResponse } from "@/types";

export type UploadFlowStep = 1 | 2 | 3;

export interface AppState {
  uploadFlowStep: UploadFlowStep;
  doctorReviewed: boolean | null;
  doctorGateNoBranch: boolean;
  educationalNotDiagnosticAck: boolean;
  imageFile: File | null;
  previewUrl: string | null;
  analysis: AnalyzeSuccessResponse | null;
  analysisError: string | null;
  analysisLoading: boolean;
  setUploadFlowStep: (step: UploadFlowStep) => void;
  setDoctorReviewed: (value: boolean | null) => void;
  setDoctorGateNoBranch: (value: boolean) => void;
  setEducationalNotDiagnosticAck: (value: boolean) => void;
  setImage: (file: File | null, previewUrl: string | null) => void;
  setAnalysis: (result: AnalyzeSuccessResponse | null) => void;
  setAnalysisError: (message: string | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  resetUploadSession: () => void;
  resetUploadFlow: () => void;
  resetAll: () => void;
}

const baseInitial = {
  uploadFlowStep: 1 as UploadFlowStep,
  doctorReviewed: null as boolean | null,
  doctorGateNoBranch: false,
  educationalNotDiagnosticAck: false,
  imageFile: null as File | null,
  previewUrl: null as string | null,
  analysis: null as AnalyzeSuccessResponse | null,
  analysisError: null as string | null,
  analysisLoading: false,
};

function revokePreview(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export const useAppStore = create<AppState>((set) => ({
  ...baseInitial,
  setUploadFlowStep: (uploadFlowStep) => set({ uploadFlowStep }),
  setDoctorReviewed: (doctorReviewed) => set({ doctorReviewed }),
  setDoctorGateNoBranch: (doctorGateNoBranch) => set({ doctorGateNoBranch }),
  setEducationalNotDiagnosticAck: (educationalNotDiagnosticAck) => set({ educationalNotDiagnosticAck }),
  setImage: (imageFile, previewUrl) =>
    set((state) => {
      revokePreview(state.previewUrl);
      return { imageFile, previewUrl, analysis: null, analysisError: null };
    }),
  setAnalysis: (analysis) => set({ analysis }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setAnalysisLoading: (analysisLoading) => set({ analysisLoading }),
  resetUploadSession: () =>
    set((state) => {
      revokePreview(state.previewUrl);
      return {
        imageFile: null,
        previewUrl: null,
        analysis: null,
        analysisError: null,
        analysisLoading: false,
      };
    }),
  resetUploadFlow: () =>
    set((state) => {
      revokePreview(state.previewUrl);
      return { ...baseInitial };
    }),
  resetAll: () =>
    set((state) => {
      revokePreview(state.previewUrl);
      return { ...baseInitial };
    }),
}));
