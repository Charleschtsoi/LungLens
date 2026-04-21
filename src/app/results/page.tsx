"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/results/DisclaimerBanner";
import { OriginalView } from "@/components/results/OriginalView";
import { HeatmapOverlay } from "@/components/results/HeatmapOverlay";
import { AnatomyGuide } from "@/components/results/AnatomyGuide";
import { FindingsCard } from "@/components/results/FindingsCard";
import { DoctorQuestions } from "@/components/results/DoctorQuestions";

export default function ResultsPage() {
  const previewUrl = useAppStore((s) => s.previewUrl);
  const analysis = useAppStore((s) => s.analysis);
  const loading = useAppStore((s) => s.analysisLoading);
  const error = useAppStore((s) => s.analysisError);

  const top = analysis?.gradcam.top_prediction ?? null;
  const heatmap = analysis?.gradcam.heatmap_base64 ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Results</h1>
          <p className="text-sm text-muted-foreground mt-1">Dashboard skeleton — wire rich UI later.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/upload">Back to upload</Link>
        </Button>
      </div>

      <DisclaimerBanner />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!previewUrl && !loading && (
        <p className="text-sm text-muted-foreground">
          No session data.{" "}
          <Link href="/upload" className="text-primary underline">
            Upload an image
          </Link>
          .
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Original</h2>
          <OriginalView previewUrl={previewUrl} />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Heatmap</h2>
          <HeatmapOverlay heatmapBase64={heatmap} />
        </div>
      </div>

      <FindingsCard topLabel={top} />
      <AnatomyGuide />
      <DoctorQuestions />
      <DisclaimerBanner />
    </div>
  );
}
