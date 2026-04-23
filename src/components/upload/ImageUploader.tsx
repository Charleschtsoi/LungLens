"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDropzone, type FileRejection } from "react-dropzone";
import { FileImage, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeImageFile } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useI18n } from "@/hooks/useI18n";

const MAX_BYTES = 10 * 1024 * 1024;

const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/dicom": [".dcm"],
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
  const [rejectError, setRejectError] = useState<string | null>(null);

  const imageFile = useAppStore((s) => s.imageFile);
  const previewUrl = useAppStore((s) => s.previewUrl);
  const analysisLoading = useAppStore((s) => s.analysisLoading);
  const setImage = useAppStore((s) => s.setImage);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setPreQuestionnaireAnalysis = useAppStore((s) => s.setPreQuestionnaireAnalysis);
  const setAnalysisError = useAppStore((s) => s.setAnalysisError);
  const setAnalysisLoading = useAppStore((s) => s.setAnalysisLoading);
  const setUploadFlowStep = useAppStore((s) => s.setUploadFlowStep);

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
    disabled: analysisLoading,
    validator: (file) => {
      const lower = file.name.toLowerCase();
      const ok =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".dcm");
      if (!ok) {
        return { code: "file-invalid-type", message: t("upload.fileError.type") };
      }
      return null;
    },
  });

  const runAnalyze = async () => {
    const file = useAppStore.getState().imageFile;
    if (!file || analysisLoading) return;
    setAnalysisError(null);
    setAnalysisLoading(true);
    const res = await analyzeImageFile(file);
    setAnalysisLoading(false);
    if (!res.success) {
      setAnalysisError(res.error || "Analysis failed");
      return;
    }
    if (res.requires_questionnaire) {
      setPreQuestionnaireAnalysis(res);
      setAnalysis(null);
      setUploadFlowStep(4);
      return;
    }
    setAnalysis(res);
    setPreQuestionnaireAnalysis(null);
    router.push("/results");
  };

  const isDicom =
    imageFile &&
    (imageFile.name.toLowerCase().endsWith(".dcm") || imageFile.type === "application/dicom");

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>{t("upload.dicom.title")}</AlertTitle>
        <AlertDescription>
          {t("upload.dicom.desc")}
        </AlertDescription>
      </Alert>

      {rejectError && (
        <p className="text-sm text-destructive" role="alert">
          {rejectError}
        </p>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-10 text-center transition-colors",
          isDragActive && "border-primary bg-primary/5",
          analysisLoading && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-3 h-9 w-9 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">{t("upload.drop.prompt")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("upload.drop.note")}</p>
      </div>

      {imageFile && (
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">{t("upload.preview")}</h3>
          {previewUrl ? (
            <div className="relative aspect-[4/3] max-h-[280px] w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={previewUrl}
                alt="Selected X-ray preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              <FileImage className="h-10 w-10 opacity-60" aria-hidden />
              <p>
                {isDicom
                  ? t("upload.preview.noInline")
                  : t("upload.preview.noType")}
              </p>
              <p className="text-xs">{imageFile.name}</p>
            </div>
          )}

          <Button type="button" className="w-full sm:w-auto" size="lg" disabled={analysisLoading} onClick={runAnalyze}>
            {t("upload.analyze")}
          </Button>
        </div>
      )}

      {analysisLoading && (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 py-10"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {t("upload.analyzing")}
          </p>
        </div>
      )}
    </div>
  );
}
