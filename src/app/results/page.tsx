"use client";

import { useEffect, useState } from "react";
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
import { buildDoctorQuestions } from "@/lib/doctor-questions";
import { buildEducationReportPdf } from "@/lib/pdf-report";
import { FileDown, Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import type { FindingLabel } from "@/types";
import { conditionName } from "@/lib/i18n";

export default function ResultsPage() {
  const { t, locale } = useI18n();
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
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
  const stageLabel = (value: string) => t(`stage.${value}`, value);
  const gateLabel = (value: string) => t(`gate.${value}`, value);
  const riskLabel = (value: string) => t(`risk.${value}`, value);
  const reportSummary =
    locale === "en"
      ? analysis.report?.summary
      : analysis.report
        ? `${t("results.reportSummaryGenerated")} ${conditionName(locale, analysis.gradcam.top_prediction)}.`
        : null;
  const doctorQuestions = buildDoctorQuestions(findingsForSections, locale);

  const exportPdf = async () => {
    if (isExportingPdf) return;
    setExportError(null);
    setIsExportingPdf(true);
    try {
      await buildEducationReportPdf({
        filename: "lunglens-education-report",
        title: t("results.title"),
        subtitle: t("results.subtitle"),
        generatedAtLabel: t("results.pdfGeneratedAt"),
        generatedAtValue: new Date().toLocaleString(),
        disclaimer: t("results.sticky"),
        pipelineTitle: t("results.pipelineTitle"),
        stage1Label: t("results.stage1"),
        stage1Value: analysis.stage1
          ? `${stageLabel(analysis.stage1.label)} (${Math.round(analysis.stage1.confidence * 100)}%)`
          : t("results.na"),
        stage2Label: t("results.stage2"),
        stage2Value: analysis.stage2
          ? `${stageLabel(analysis.stage2.label)} (${Math.round(analysis.stage2.confidence * 100)}%)`
          : t("results.na"),
        gateDecisionLabel: t("results.gateDecision"),
        gateDecisionValue: analysis.gate
          ? `${gateLabel(analysis.gate.route)} (${gateLabel(analysis.gate.reason)})`
          : t("results.na"),
        stage3RiskLabel: t("results.stage3Risk"),
        stage3RiskValue: analysis.stage3?.enabled
          ? `${riskLabel(analysis.stage3.risk_level)} / ${riskLabel(analysis.stage3.severity)}`
          : t("results.na"),
        totalLatencyLabel: t("results.totalLatency"),
        totalLatencyValue: analysis.timing_ms ? `${analysis.timing_ms.total} ms` : t("results.na"),
        reportSummaryLabel: t("results.reportSummary"),
        reportSummaryValue: reportSummary ?? t("results.questionnaireRequired"),
        findingsTitle: t("results.anatomyHeader"),
        findings: findingsForSections.map((f) => ({
          label: conditionName(locale, f.label),
          scorePct: Math.round(f.score * 100),
        })),
        noFindingsText: t("results.noSignificant"),
        doctorQuestionsTitle: t("results.questionsTitle"),
        doctorQuestions,
        xrayTitle: t("results.pdfXray"),
        attentionMapTitle: t("results.pdfAttentionMap"),
        xrayUrl: previewUrl,
        heatmapBase64: heatmap,
      });
    } catch {
      setExportError(t("results.exportPdfError"));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="relative pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("results.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("results.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportPdf} disabled={isExportingPdf}>
            {isExportingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {t("results.exportingPdf")}
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" aria-hidden />
                {t("results.exportPdf")}
              </>
            )}
          </Button>
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
      </div>
      {exportError && <p className="mt-3 text-sm text-destructive">{exportError}</p>}

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
            <CardTitle className="text-base">{t("results.pipelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{t("results.stage1")}: </span>
              {analysis.stage1
                ? `${stageLabel(analysis.stage1.label)} (${Math.round(analysis.stage1.confidence * 100)}%)`
                : t("results.na")}
            </p>
            <p>
              <span className="font-medium text-foreground">{t("results.stage2")}: </span>
              {analysis.stage2
                ? `${stageLabel(analysis.stage2.label)} (${Math.round(analysis.stage2.confidence * 100)}%)`
                : t("results.na")}
            </p>
            <p>
              <span className="font-medium text-foreground">{t("results.gateDecision")}: </span>
              {analysis.gate
                ? `${gateLabel(analysis.gate.route)} (${gateLabel(analysis.gate.reason)})`
                : t("results.na")}
            </p>
            {analysis.stage3?.enabled && (
              <p>
                <span className="font-medium text-foreground">{t("results.stage3Risk")}: </span>
                {riskLabel(analysis.stage3.risk_level)} / {riskLabel(analysis.stage3.severity)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results.timingReportTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">{t("results.totalLatency")}: </span>
              {analysis.timing_ms ? `${analysis.timing_ms.total} ms` : t("results.na")}
            </p>
            <p>
              <span className="font-medium text-foreground">{t("results.reportSummary")}: </span>
              {reportSummary ?? t("results.questionnaireRequired")}
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
