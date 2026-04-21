"use client";

export function HeatmapOverlay({ heatmapBase64 }: { heatmapBase64: string | null }) {
  if (!heatmapBase64) {
    return <p className="text-sm text-muted-foreground">No heatmap yet.</p>;
  }
  const src = `data:image/png;base64,${heatmapBase64}`;
  return (
    <div className="relative aspect-[4/3] max-h-[320px] w-full overflow-hidden rounded-lg border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Attention heatmap placeholder" className="h-full w-full object-contain" />
    </div>
  );
}
