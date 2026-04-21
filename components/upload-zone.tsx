"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({ onFile, disabled, className }: UploadZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-10 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">
        {isDragActive ? "Drop your image here" : "Drag & drop a chest X-ray (JPEG or PNG)"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">or click to choose a file from your device</p>
    </div>
  );
}
