"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsImageTabs } from "@/components/results/ResultsImageTabs";
import { FindingsCard } from "@/components/results/FindingsCard";
import { DoctorQuestions } from "@/components/results/DoctorQuestions";
import { LearnMoreCards } from "@/components/results/LearnMoreCards";
import { ResultsStickyDisclaimer } from "@/components/results/ResultsStickyDisclaimer";
import { getNotableFindings } from "@/lib/findings-utils";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { FindingLabel } from "@/types";

export default function ResultsPage() {
  const { t } = useI18n();
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
        <p className="text-sm">{t("results.loading")}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
        {t("results.redirecting")}
      </div>
    );
  }

  const predictions = analysis.predictions;
  const heatmap = analysis.gradcam.heatmap_base64;
  const notable = getNotableFindings(predictions);
  const stage2Fallback: Array<{ label: FindingLabel; score: number }> =
    analysis.stage2?.label && analysis.stage2.label !== "Normal"
      ? [
          {
            label:
              analysis.stage2.label === "Viral Pneumonia"
                ? "Pneumonia"
                : analysis.stage2.label === "Lung Opacity"
                  ? "Infiltration"
                  : "Mass",
            score: analysis.stage2.confidence,
          }
        ]
      : [];
  const findingsForSections = notable.length > 0 ? notable : stage2Fallback;

  return (
    <div className="relative pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("results.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("results.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link
            href="/upload"
            onClick={() => {
              resetUploadFlow();
            }}
          >
            {t("results.newUpload")}
          </Link>
        </Button>
      </div>

      {doctorReviewed === false && (
        <Alert className="mt-6 border-amber-300 bg-amber-100/90 text-foreground shadow-sm">
          <AlertDescription className="text-sm font-medium text-amber-950">
            ⚠️ {t("results.noDoctor")}
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-8">
        <ResultsImageTabs previewUrl={previewUrl} heatmapBase64={heatmap} fileLabel={imageFile?.name ?? null} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline stage summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Stage 1 (Binary): </span>
              {analysis.stage1
                ? `${analysis.stage1.label} (${Math.round(analysis.stage1.confidence * 100)}%)`
                : "N/A"}
            </p>
            <p>
              <span className="font-medium text-foreground">Stage 2 (Multi-class): </span>
              {analysis.stage2
                ? `${analysis.stage2.label} (${Math.round(analysis.stage2.confidence * 100)}%)`
                : "N/A"}
            </p>
            <p>
              <span className="font-medium text-foreground">Gate decision: </span>
              {analysis.gate ? `${analysis.gate.route} (${analysis.gate.reason})` : "N/A"}
            </p>
            {analysis.stage3?.enabled && (
              <p>
                <span className="font-medium text-foreground">Stage 3 risk: </span>
                {analysis.stage3.risk_level} / {analysis.stage3.severity}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timing & report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Total latency: </span>
              {analysis.timing_ms ? `${analysis.timing_ms.total} ms` : "N/A"}
            </p>
            <p>
              <span className="font-medium text-foreground">Report summary: </span>
              {analysis.report?.summary ?? "Questionnaire required before final synthesis."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 space-y-10">
        <FindingsCard predictions={predictions} stage2={analysis.stage2} />
        <DoctorQuestions findings={findingsForSections} />
        <LearnMoreCards findings={findingsForSections} />
      </div>

      <ResultsStickyDisclaimer />
    </div>
  );
}
