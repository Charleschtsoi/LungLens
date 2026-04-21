"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResultsImageTabs } from "@/components/results/ResultsImageTabs";
import { FindingsCard } from "@/components/results/FindingsCard";
import { DoctorQuestions } from "@/components/results/DoctorQuestions";
import { LearnMoreCards } from "@/components/results/LearnMoreCards";
import { ResultsStickyDisclaimer } from "@/components/results/ResultsStickyDisclaimer";
import { getNotableFindings } from "@/lib/findings-utils";
import { Loader2 } from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const previewUrl = useAppStore((s) => s.previewUrl);
  const analysis = useAppStore((s) => s.analysis);
  const loading = useAppStore((s) => s.analysisLoading);
  const doctorReviewed = useAppStore((s) => s.doctorReviewed);
  const imageFile = useAppStore((s) => s.imageFile);
  const resetUploadFlow = useAppStore((s) => s.resetUploadFlow);

  useEffect(() => {
    if (loading) return;
    if (!analysis) {
      router.replace("/upload");
    }
  }, [analysis, loading, router]);

  if (!analysis && loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">Loading results…</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
        Redirecting to upload…
      </div>
    );
  }

  const predictions = analysis.predictions;
  const heatmap = analysis.gradcam.heatmap_base64;
  const notable = getNotableFindings(predictions);

  return (
    <div className="relative pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your education report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore your image, attention map, and anatomy—then bring questions to your care team.
          </p>
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
        <Alert className="mt-6 border-amber-300 bg-amber-100/90 text-foreground shadow-sm">
          <AlertDescription className="text-sm font-medium text-amber-950">
            ⚠️ You indicated a doctor has not yet reviewed your X-ray. Please consult a healthcare professional
            for proper diagnosis.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8">
        <ResultsImageTabs previewUrl={previewUrl} heatmapBase64={heatmap} fileLabel={imageFile?.name ?? null} />
      </div>

      <div className="mt-10 space-y-10">
        <FindingsCard predictions={predictions} />
        <DoctorQuestions findings={notable} />
        <LearnMoreCards findings={notable} />
      </div>

      <ResultsStickyDisclaimer />
    </div>
  );
}
