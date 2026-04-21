import { create } from "zustand";
import type { AnalyzeSuccessResponse } from "@/lib/types/analyze";

export type FlowStep = "landing" | "consent" | "upload" | "results";

interface LungLensState {
  step: FlowStep;
  doctorReviewConfirmed: boolean | null;
  file: File | null;
  previewUrl: string | null;
  result: AnalyzeSuccessResponse | null;
  loading: boolean;
  error: string | null;
  setStep: (s: FlowStep) => void;
  setDoctorReview: (v: boolean | null) => void;
  setFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setResult: (r: AnalyzeSuccessResponse | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  resetSession: () => void;
}

const initial = {
  step: "landing" as FlowStep,
  doctorReviewConfirmed: null as boolean | null,
  file: null as File | null,
  previewUrl: null as string | null,
  result: null as AnalyzeSuccessResponse | null,
  loading: false,
  error: null as string | null,
};

export const useLungLensStore = create<LungLensState>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setDoctorReview: (doctorReviewConfirmed) => set({ doctorReviewConfirmed }),
  setFile: (file) => set({ file }),
  setPreviewUrl: (previewUrl) => set({ previewUrl }),
  setResult: (result) => set({ result }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetSession: () => set({ ...initial }),
}));
