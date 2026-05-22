"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useAppMotion } from "@/lib/app-motion";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileImage, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeImageFile } from "@/lib/api";
import { persistAnalyzeSuccessToSession } from "@/lib/analysis-session-storage";
import { holdPipelineCompleteAnimation } from "@/lib/analysis-pipeline-loading";
import { denseNetResponseFromAnalyzeModel3 } from "@/lib/dense-net-from-analysis";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { AnalysisPipelineLoader } from "@/components/upload/AnalysisPipelineLoader";
import { UploadDestructiveAlert } from "@/components/upload/UploadDestructiveAlert";
import { useI18n } from "@/hooks/useI18n";
import type { AnalyzeSuccessResponse } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024;

const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
} as const;

function isPreviewableImage(file: File): boolean {
  return file.type.startsWith("image/") && (file.type === "image/jpeg" || file.type === "image/png");
}

function formatRejections(rejections: FileRejection[], t: (k: string) => string): string {
  const first = rejections[0];
  if (!first) return t("upload.fileError.type");
  const code = first.errors[0]?.code;
  if (code === "file-too-large") return t("upload.fileError.size");
  if (code === "file-invalid-type") return t("upload.fileError.type");
  return first.errors[0]?.message || t("upload.fileError.type");
}

export function ImageUploader() {
  const router = useRouter();
  const { t } = useI18n();
  const { reduced } = useAppMotion();
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [pipelineFinishing, setPipelineFinishing] = useState(false);

  const imageFile = useAppStore((s) => s.imageFile);
  const previewUrl = useAppStore((s) => s.previewUrl);
  const analysisError = useAppStore((s) => s.analysisError);
  const analysisLoading = useAppStore((s) => s.analysisLoading);
  const setImage = useAppStore((s) => s.setImage);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setPreQuestionnaireAnalysis = useAppStore((s) => s.setPreQuestionnaireAnalysis);
  const setAnalysisError = useAppStore((s) => s.setAnalysisError);
  const setAnalysisLoading = useAppStore((s) => s.setAnalysisLoading);
  const setUploadFlowStep = useAppStore((s) => s.setUploadFlowStep);
  const startSupplementalDensenet = useAppStore((s) => s.startSupplementalDensenet);

  const showPipelineLoader = analysisLoading || pipelineFinishing;

  const stopPipeline = useCallback(() => {
    setPipelineFinishing(false);
    setAnalysisLoading(false);
  }, [setAnalysisLoading]);

  const applySuccess = useCallback(
    (res: AnalyzeSuccessResponse) => {
      if (res.requires_questionnaire) {
        stopPipeline();
        setPreQuestionnaireAnalysis(res);
        setAnalysis(null);
        setUploadFlowStep(4);
        return;
      }
      setAnalysis(res);
      persistAnalyzeSuccessToSession(res);
      setPreQuestionnaireAnalysis(null);
      const dn = denseNetResponseFromAnalyzeModel3(res);
      if (!(dn?.success === true && Boolean(dn.gradcam?.trim()))) {
        startSupplementalDensenet();
      }
      router.replace("/results");
    },
    [
      router,
      setAnalysis,
      setPreQuestionnaireAnalysis,
      setUploadFlowStep,
      startSupplementalDensenet,
      stopPipeline,
    ],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      setRejectError(null);
      const file = accepted[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        setRejectError(t("upload.fileError.size"));
        return;
      }
      const url = isPreviewableImage(file) ? URL.createObjectURL(file) : null;
      setImage(file, url);
    },
    [setImage, t],
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    setRejectError(formatRejections(fileRejections, t));
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPT as unknown as Record<string, string[]>,
    maxFiles: 1,
    maxSize: MAX_BYTES,
    disabled: showPipelineLoader,
    validator: (file) => {
      const lower = file.name.toLowerCase();
      const ok =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp");
      if (!ok) {
        return { code: "file-invalid-type", message: t("upload.fileError.type") };
      }
      return null;
    },
  });

  const runAnalyze = async () => {
    const file = useAppStore.getState().imageFile;
    if (!file || showPipelineLoader) return;
    setAnalysisError(null);
    setPipelineFinishing(false);
    setAnalysisLoading(true);

    try {
      const res = await analyzeImageFile(file);
      if (!res.success) {
        setAnalysisError(res.error || t("upload.error.analysisFailed"));
        stopPipeline();
        return;
      }

      setPipelineFinishing(true);
      await holdPipelineCompleteAnimation();
      applySuccess(res);
    } catch {
      setAnalysisError(t("upload.error.analysisFailed"));
      stopPipeline();
    }
  };

  const isDicom =
    imageFile &&
    (imageFile.name.toLowerCase().endsWith(".dcm") || imageFile.type === "application/dicom");

  if (showPipelineLoader) {
    return (
      <div className="space-y-6">
        <AnalysisPipelineLoader active complete={pipelineFinishing} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rejectError && <UploadDestructiveAlert description={rejectError} />}
      {analysisError && (
        <UploadDestructiveAlert
          title={t("upload.error.analysisFailed")}
          description={analysisError}
        />
      )}

      <motion.div
        whileHover={showPipelineLoader || reduced ? undefined : { scale: 1.01 }}
        whileTap={showPipelineLoader || reduced ? undefined : { scale: 0.99 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="group rounded-xl"
      >
        <div
          {...getRootProps()}
          className={cn(
            "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-10 text-center transition-colors",
            !showPipelineLoader &&
              !reduced &&
              "group-hover:border-[#005088]",
            isDragActive && "border-primary bg-primary/5",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mb-3 h-9 w-9 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{t("upload.drop.prompt")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("upload.drop.note")}</p>
        </div>
      </motion.div>

      {imageFile && (
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">{t("upload.preview")}</h3>
          {previewUrl ? (
            <div className="relative aspect-[4/3] max-h-[280px] w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={previewUrl}
                alt={t("alt.selectedPreview")}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              <FileImage className="h-10 w-10 opacity-60" aria-hidden />
              <p>{isDicom ? t("upload.preview.noInline") : t("upload.preview.noType")}</p>
              <p className="text-xs">{imageFile.name}</p>
            </div>
          )}

          <Button type="button" className="w-full sm:w-auto" size="lg" onClick={runAnalyze}>
            {t("upload.analyze")}
          </Button>
        </div>
      )}
    </div>
  );
}
