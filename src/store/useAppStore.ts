import { create } from "zustand";
import { clearPersistedAnalyzeSuccessSession } from "@/lib/analysis-session-storage";
import type { AnalyzeSuccessResponse, DenseNetResponse, Stage3QuestionnaireInput } from "@/types";
import { predictDenseNet } from "@/lib/api";

export type UploadFlowStep = 1 | 2 | 3 | 4;

export interface AppState {
  uploadFlowStep: UploadFlowStep;
  doctorReviewed: boolean | null;
  doctorGateNoBranch: boolean;
  educationalNotDiagnosticAck: boolean;
  imageFile: File | null;
  previewUrl: string | null;
  analysis: AnalyzeSuccessResponse | null;
  preQuestionnaireAnalysis: AnalyzeSuccessResponse | null;
  questionnaire: Stage3QuestionnaireInput;
  questionnaireSubmitted: boolean;
  analysisError: string | null;
  analysisLoading: boolean;
  /** DenseNet-121 fallback when /analyze `model3` is absent (e.g. older backend). */
  denseNetLoading: boolean;
  denseNetResult: DenseNetResponse | null;
  setUploadFlowStep: (step: UploadFlowStep) => void;
  setDoctorReviewed: (value: boolean | null) => void;
  setDoctorGateNoBranch: (value: boolean) => void;
  setEducationalNotDiagnosticAck: (value: boolean) => void;
  setImage: (file: File | null, previewUrl: string | null) => void;
  setAnalysis: (result: AnalyzeSuccessResponse | null) => void;
  setPreQuestionnaireAnalysis: (result: AnalyzeSuccessResponse | null) => void;
  setQuestionnaire: (partial: Partial<Stage3QuestionnaireInput>) => void;
  setQuestionnaireSubmitted: (value: boolean) => void;
  setAnalysisError: (message: string | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  /** Fire-and-forget DenseNet fetch for current image; does not block analyze. */
  startSupplementalDensenet: () => void;
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
  preQuestionnaireAnalysis: null as AnalyzeSuccessResponse | null,
  questionnaire: {
    age: 45,
    fever: false,
    coughDurationDays: 3,
    smoking: "never",
    breathingDifficulty: "none",
  } as Stage3QuestionnaireInput,
  questionnaireSubmitted: false,
  analysisError: null as string | null,
  analysisLoading: false,
  denseNetLoading: false,
  denseNetResult: null as DenseNetResponse | null,
};

function revokePreview(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export const useAppStore = create<AppState>((set, get) => ({
  ...baseInitial,
  setUploadFlowStep: (uploadFlowStep) => set({ uploadFlowStep }),
  setDoctorReviewed: (doctorReviewed) => set({ doctorReviewed }),
  setDoctorGateNoBranch: (doctorGateNoBranch) => set({ doctorGateNoBranch }),
  setEducationalNotDiagnosticAck: (educationalNotDiagnosticAck) => set({ educationalNotDiagnosticAck }),
  setImage: (imageFile, previewUrl) =>
    set((state) => {
      revokePreview(state.previewUrl);
      return {
        imageFile,
        previewUrl,
        analysis: null,
        preQuestionnaireAnalysis: null,
        questionnaireSubmitted: false,
        analysisError: null,
        denseNetLoading: false,
        denseNetResult: null,
      };
    }),
  setAnalysis: (analysis) => set({ analysis }),
  setPreQuestionnaireAnalysis: (preQuestionnaireAnalysis) => set({ preQuestionnaireAnalysis }),
  setQuestionnaire: (partial) =>
    set((state) => ({ questionnaire: { ...state.questionnaire, ...partial } })),
  setQuestionnaireSubmitted: (questionnaireSubmitted) => set({ questionnaireSubmitted }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setAnalysisLoading: (analysisLoading) => set({ analysisLoading }),
  startSupplementalDensenet: () => {
    const file = get().imageFile;
    if (!file) return;
    set({ denseNetLoading: true, denseNetResult: null });
    void predictDenseNet(file).then((r) => set({ denseNetLoading: false, denseNetResult: r }));
  },
  resetUploadSession: () => {
    clearPersistedAnalyzeSuccessSession();
    return set((state) => {
      revokePreview(state.previewUrl);
      return {
        imageFile: null,
        previewUrl: null,
        analysis: null,
        preQuestionnaireAnalysis: null,
        questionnaireSubmitted: false,
        analysisError: null,
        analysisLoading: false,
        denseNetLoading: false,
        denseNetResult: null,
      };
    });
  },
  resetUploadFlow: () => {
    clearPersistedAnalyzeSuccessSession();
    return set((state) => {
      revokePreview(state.previewUrl);
      return { ...baseInitial };
    });
  },
  resetAll: () => {
    clearPersistedAnalyzeSuccessSession();
    return set((state) => {
      revokePreview(state.previewUrl);
      return { ...baseInitial };
    });
  },
}));
