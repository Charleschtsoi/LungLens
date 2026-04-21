"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeImageFile } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";

export function ImageUploader() {
  const router = useRouter();
  const {
    setImage,
    setAnalysis,
    setAnalysisError,
    setAnalysisLoading,
    privacyAcknowledged,
    doctorReviewConfirmed,
  } = useAppStore();
  const canUpload = privacyAcknowledged && doctorReviewConfirmed !== null;

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setImage(file, url);
      setAnalysisError(null);
      setAnalysisLoading(true);
      const res = await analyzeImageFile(file);
      setAnalysisLoading(false);
      if (!res.success) {
        setAnalysisError(res.error || "Analysis failed");
        return;
      }
      setAnalysis(res);
      router.push("/results");
    },
    [router, setAnalysis, setAnalysisError, setAnalysisLoading, setImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxFiles: 1,
    disabled: !canUpload,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-8 text-center",
          isDragActive && "border-primary bg-primary/5",
          !canUpload && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Drop X-ray (JPEG/PNG) — skeleton uploader</p>
      </div>
      {!canUpload && (
        <p className="text-xs text-muted-foreground">
          Answer the doctor-review question and acknowledge privacy to enable upload.
        </p>
      )}
      <Button type="button" variant="outline" size="sm" disabled>
        Future: compare timeline (placeholder)
      </Button>
    </div>
  );
}
