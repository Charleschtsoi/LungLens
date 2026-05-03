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
import {
  bothClassifierModelsLive,
  buildFlatProvenanceSummary,
  buildNestedProvenanceSummary,
  flatProvenanceImpactRows,
  hybridRunModeBannerMessage,
  isFlatSectionProvenance,
  isNestedStageProvenance,
  nestedProvenanceImpactRows,
  pipelineProvenanceSource,
  provenanceBadgeClassName,
  resolveFindingsBadgeSource,
} from "@/lib/provenance-ui";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";
import type { AnalyzeStageSource } from "@/types";

type ImpactRow = {
  section: string;
  source: string;
  status: string;
  sourceKind?: AnalyzeStageSource | null;
};

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
  const model2Fallback: Array<{ label: FindingLabel; score: number }> =
    analysis.model2?.label && analysis.model2.label !== "Normal"
      ? [
          {
            label:
              analysis.model2.label === "Viral Pneumonia"
                ? "Pneumonia"
                : analysis.model2.label === "Lung Opacity"
                  ? "Infiltration"
                  : "Mass",
            score: analysis.model2.confidence,
          }
        ]
      : [];
  const findingsForSections = notable.length > 0 ? notable : model2Fallback;
  const stageLabel = (value: string) => t(`stage.${value}`, value);
  const gateLabel = (value: string) => t(`gate.${value}`, value);
  const riskLabel = (value: string) => t(`risk.${value}`, value);
  const reportSummary =
    locale === "en"
      ? analysis.model4?.summary
      : analysis.model4
        ? `${t("results.reportSummaryGenerated")} ${conditionName(locale, analysis.gradcam.top_prediction)}.`
        : null;
  const doctorQuestions = buildDoctorQuestions(findingsForSections, locale);
  const runMode = analysis.provenance?.run_mode ?? (process.env.NEXT_PUBLIC_USE_MOCK === "true" ? "mock" : "real");
  const runModeLabel = t(`results.runMode.${runMode}`, runMode);
  const warningMessages = (analysis.warnings ?? []).map((w) => w.message);
  const flatProv = isFlatSectionProvenance(analysis.provenance);
  const nestedProv = isNestedStageProvenance(analysis.provenance);
  const flatSummary =
    flatProv && analysis.provenance ? buildFlatProvenanceSummary(analysis.provenance, t, locale) : "";
  const nestedSummary =
    !flatProv && nestedProv && analysis.provenance ? buildNestedProvenanceSummary(analysis.provenance, t) : "";
  const hybridBanner =
    analysis.provenance?.run_mode === "hybrid"
      ? hybridRunModeBannerMessage(analysis.provenance, t)
      : "";
  const bothModelsNeural = bothClassifierModelsLive(analysis.provenance);
  const specificSummary = bothModelsNeural
    ? ""
    : hybridBanner || flatSummary || nestedSummary;

  const impactRows: ImpactRow[] =
    nestedProv && analysis.provenance
      ? nestedProvenanceImpactRows(analysis.provenance, t)
      : flatProv && analysis.provenance
        ? flatProvenanceImpactRows(analysis.provenance, t)
        : [
        {
          section: t("results.impact.pipelineSection"),
          source: t("results.impact.sourceModel"),
          status:
            analysis.provenance?.model1?.status === "failed" || analysis.provenance?.model2?.status === "failed"
              ? t("results.impact.statusFailed")
              : t("results.impact.statusOk"),
        },
        {
          section: t("results.impact.findingsSection"),
          source: t("results.impact.sourceRulesModel"),
          status:
            findingsForSections.length > 0 ? t("results.impact.statusOk") : t("results.impact.statusFallback"),
        },
        {
          section: t("results.impact.questionsSection"),
          source: t("results.impact.sourceRulesModel"),
          status: t("results.impact.statusOk"),
        },
        {
          section: t("results.impact.reportSection"),
          source: t("results.impact.sourceLlm"),
          status: analysis.model4 ? t("results.impact.statusOk") : t("results.impact.statusSkipped"),
        },
        {
          section: t("results.impact.anatomySection"),
          source: t("results.impact.sourceStatic"),
          status: t("results.impact.statusOk"),
        },
      ];

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
        stage1Label: t("results.model1"),
        stage1Value: analysis.model1
          ? `${stageLabel(analysis.model1.label)} (${Math.round(analysis.model1.confidence * 100)}%)`
          : t("results.na"),
        stage2Label: t("results.model2"),
        stage2Value: analysis.model2
          ? `${stageLabel(analysis.model2.label)} (${Math.round(analysis.model2.confidence * 100)}%)`
          : t("results.na"),
        gateDecisionLabel: t("results.gateDecision"),
        gateDecisionValue: analysis.gate
          ? `${gateLabel(analysis.gate.route)} (${gateLabel(analysis.gate.reason)})`
          : t("results.na"),
        stage3RiskLabel: t("results.model3Risk"),
        stage3RiskValue: analysis.model3?.enabled
          ? `${riskLabel(analysis.model3.risk_level)} / ${riskLabel(analysis.model3.severity)}`
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
        runModeTitle: t("results.runModeTitle"),
        runModeValue: runModeLabel,
        warningsTitle: t("results.warningsTitle"),
        warnings: warningMessages,
        impactMapTitle: t("results.impact.title"),
        impactRows,
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
          <p className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {t("results.runModeTitle")}: {runModeLabel}
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
      {specificSummary ? (
        <Alert className="mt-4 border-amber-300 bg-amber-100/90 text-foreground shadow-sm">
          <AlertDescription className="space-y-2 text-sm text-amber-950">
            <p className="font-medium leading-relaxed">{specificSummary}</p>
            {warningMessages.length > 0 && (
              <p>
                <span className="font-semibold">{t("results.warningsTitle")}:</span> {warningMessages.join(" ")}
              </p>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        warningMessages.length > 0 && (
          <Alert className="mt-4 border-amber-300 bg-amber-100/90 text-foreground shadow-sm">
            <AlertDescription className="text-sm text-amber-950">
              <span className="font-medium">{t("results.warningsTitle")}:</span> {warningMessages.join(" ")}
            </AlertDescription>
          </Alert>
        )
      )}

      <div className="mt-8">
        <ResultsImageTabs
          previewUrl={previewUrl}
          heatmapBase64={heatmap}
          fileLabel={imageFile?.name ?? null}
          anatomyGuideProvenance={
            analysis.provenance?.anatomy_guide ?? (nestedProv ? "static" : undefined)
          }
        />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results.pipelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{t("results.model1")}: </span>
                {analysis.model1
                  ? `${stageLabel(analysis.model1.label)} (${Math.round(analysis.model1.confidence * 100)}%)`
                  : t("results.na")}
              </p>
              <SectionSourceBadge source={pipelineProvenanceSource(analysis.provenance, "model1")} />
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{t("results.model2")}: </span>
                {analysis.model2
                  ? `${stageLabel(analysis.model2.label)} (${Math.round(analysis.model2.confidence * 100)}%)`
                  : t("results.na")}
              </p>
              <SectionSourceBadge source={pipelineProvenanceSource(analysis.provenance, "model2")} />
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{t("results.gateDecision")}: </span>
                {analysis.gate
                  ? `${gateLabel(analysis.gate.route)} (${gateLabel(analysis.gate.reason)})`
                  : t("results.na")}
              </p>
              <SectionSourceBadge
                source={
                  analysis.provenance?.gate_decision ?? (nestedProv ? "rule" : undefined)
                }
              />
            </div>
            {analysis.model3?.enabled && (
              <p>
                <span className="font-medium text-foreground">{t("results.model3Risk")}: </span>
                {riskLabel(analysis.model3.risk_level)} / {riskLabel(analysis.model3.severity)}
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
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{t("results.reportSummary")}: </span>
                {reportSummary ?? t("results.questionnaireRequired")}
              </p>
              <SectionSourceBadge
                source={
                  analysis.provenance?.report_summary ?? analysis.provenance?.model4?.source
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t("results.impact.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {impactRows.map((row) => (
            <div key={row.section} className="grid grid-cols-1 gap-1 border-b pb-2 last:border-b-0 md:grid-cols-3">
              <p className="font-medium text-foreground">{row.section}</p>
              <p>
                {row.sourceKind != null ? (
                  <span className={provenanceBadgeClassName(row.sourceKind)}>{row.source}</span>
                ) : (
                  <span className="text-muted-foreground">{row.source}</span>
                )}
              </p>
              <p className="text-muted-foreground">{row.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-10 space-y-10">
        <FindingsCard
          predictions={predictions}
          model2={analysis.model2}
          findingsBadgeSource={resolveFindingsBadgeSource(analysis.provenance)}
          model2ProvenanceSource={analysis.provenance?.model2?.source}
        />
        <DoctorQuestions
          findings={findingsForSections}
          doctorQuestionsProvenance={
            analysis.provenance?.doctor_questions ??
            analysis.provenance?.model3?.source ??
            (nestedProv ? "rule" : undefined)
          }
        />
        <LearnMoreCards
          findings={findingsForSections}
          anatomyGuideProvenance={
            analysis.provenance?.anatomy_guide ?? (nestedProv ? "static" : undefined)
          }
        />
      </div>

      <ResultsStickyDisclaimer />
    </div>
  );
}
