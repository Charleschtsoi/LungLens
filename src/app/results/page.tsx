"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DisclaimerBanner } from "@/components/results/DisclaimerBanner";
import { OriginalView } from "@/components/results/OriginalView";
import { HeatmapOverlay } from "@/components/results/HeatmapOverlay";
import { AnatomyGuide } from "@/components/results/AnatomyGuide";
import { FindingsCard } from "@/components/results/FindingsCard";
import { DoctorQuestions } from "@/components/results/DoctorQuestions";
import { AlertTriangle } from "lucide-react";

export default function ResultsPage() {
  const previewUrl = useAppStore((s) => s.previewUrl);
  const analysis = useAppStore((s) => s.analysis);
  const loading = useAppStore((s) => s.analysisLoading);
  const error = useAppStore((s) => s.analysisError);
  const doctorReviewed = useAppStore((s) => s.doctorReviewed);
  const imageFile = useAppStore((s) => s.imageFile);
  const resetUploadFlow = useAppStore((s) => s.resetUploadFlow);

  const top = analysis?.gradcam.top_prediction ?? null;
  const heatmap = analysis?.gradcam.heatmap_base64 ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Results</h1>
          <p className="text-sm text-muted-foreground mt-1">Educational overview of your upload.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/upload"
            onClick={() => {
              resetUploadFlow();
            }}
          >
            New upload
          </Link>
        </Button>
      </div>

      {doctorReviewed === false && (
        <Alert className="border-amber-200 bg-amber-50 text-foreground">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertTitle className="text-amber-900">You continued without a prior doctor review</AlertTitle>
          <AlertDescription className="text-amber-950/90">
            This output is only for learning. If you feel unwell or have new symptoms, contact a healthcare
            professional. Do not use this page to rule out serious conditions.
          </AlertDescription>
        </Alert>
      )}

      <DisclaimerBanner />

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!previewUrl && !analysis && !loading && (
        <p className="text-sm text-muted-foreground">
          No session data.{" "}
          <Link href="/upload" className="text-primary underline" onClick={() => resetUploadFlow()}>
            Start the upload flow
          </Link>
          .
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Original</h2>
          <OriginalView previewUrl={previewUrl} fileLabel={imageFile?.name ?? null} />
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
