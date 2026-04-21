"use client";

import Image from "next/image";

export function OriginalView({
  previewUrl,
  fileLabel,
}: {
  previewUrl: string | null;
  /** Shown when there is no bitmap preview (e.g. DICOM). */
  fileLabel?: string | null;
}) {
  if (!previewUrl) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        {fileLabel ? (
          <>
            <p>No inline preview for this file.</p>
            <p className="mt-1 text-xs font-medium text-foreground/80">{fileLabel}</p>
          </>
        ) : (
          <p>No image in store — return to upload.</p>
        )}
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] max-h-[320px] w-full overflow-hidden rounded-lg border bg-muted">
      <Image src={previewUrl} alt="Uploaded chest X-ray" fill className="object-contain" unoptimized />
    </div>
  );
}
