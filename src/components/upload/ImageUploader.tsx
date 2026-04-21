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

const MAX_BYTES = 10 * 1024 * 1024;

const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/dicom": [".dcm"],
} as const;

function isPreviewableImage(file: File): boolean {
  return file.type.startsWith("image/") && (file.type === "image/jpeg" || file.type === "image/png");
}

function formatRejections(rejections: FileRejection[]): string {
  const first = rejections[0];
  if (!first) return "File not accepted.";
  const code = first.errors[0]?.code;
  if (code === "file-too-large") return "File is larger than 10MB.";
  if (code === "file-invalid-type") return "Use JPEG, PNG, or DICOM (.dcm).";
  return first.errors[0]?.message || "Could not use this file.";
}

export function ImageUploader() {
  const router = useRouter();
  const [rejectError, setRejectError] = useState<string | null>(null);

  const imageFile = useAppStore((s) => s.imageFile);
  const previewUrl = useAppStore((s) => s.previewUrl);
  const analysisLoading = useAppStore((s) => s.analysisLoading);
  const setImage = useAppStore((s) => s.setImage);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setAnalysisError = useAppStore((s) => s.setAnalysisError);
  const setAnalysisLoading = useAppStore((s) => s.setAnalysisLoading);

  const onDrop = useCallback(
    (accepted: File[]) => {
      setRejectError(null);
      const file = accepted[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        setRejectError("File must be 10MB or smaller.");
        return;
      }
      const url = isPreviewableImage(file) ? URL.createObjectURL(file) : null;
      setImage(file, url);
    },
    [setImage],
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    setRejectError(formatRejections(fileRejections));
  }, []);

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
        return { code: "file-invalid-type", message: "Use JPEG, PNG, or DICOM." };
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
      setAnalysisError(res.error || "Analysis failed.");
      return;
    }
    setAnalysis(res);
    router.push("/results");
  };

  const isDicom =
    imageFile &&
    (imageFile.name.toLowerCase().endsWith(".dcm") || imageFile.type === "application/dicom");

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTitle>DICOM files</AlertTitle>
        <AlertDescription>
          Many browsers can&apos;t preview DICOM. If upload fails, export a PNG or JPEG from your hospital
          portal or CD viewer. Maximum file size: 10MB.
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
        <p className="text-sm font-medium">Drag &amp; drop your chest X-ray</p>
        <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or DICOM (.dcm) · up to 10MB</p>
      </div>

      {imageFile && (
        <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-medium">Preview</h3>
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
                  ? "DICOM selected — preview not shown in the browser."
                  : "No image preview for this file type."}
              </p>
              <p className="text-xs">{imageFile.name}</p>
            </div>
          )}

          <Button type="button" className="w-full sm:w-auto" size="lg" disabled={analysisLoading} onClick={runAnalyze}>
            Analyze
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
            Our AI is studying your X-ray… (usually takes 5–10 seconds)
          </p>
        </div>
      )}
    </div>
  );
}
