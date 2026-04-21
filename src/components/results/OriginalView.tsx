"use client";

import Image from "next/image";

export function OriginalView({ previewUrl }: { previewUrl: string | null }) {
  if (!previewUrl) {
    return <p className="text-sm text-muted-foreground">No image in store — return to upload.</p>;
  }
  return (
    <div className="relative aspect-[4/3] max-h-[320px] w-full overflow-hidden rounded-lg border bg-muted">
      <Image src={previewUrl} alt="Uploaded chest X-ray" fill className="object-contain" unoptimized />
    </div>
  );
}
