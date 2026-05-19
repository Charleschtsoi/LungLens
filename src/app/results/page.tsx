"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsImageTabs } from "@/components/results/ResultsImageTabs";
import { ClassProbabilitiesList } from "@/components/results/ClassProbabilitiesList";
import { FindingsCard } from "@/components/results/FindingsCard";
import { DoctorQuestions } from "@/components/results/DoctorQuestions";
import { LearnMoreCards } from "@/components/results/LearnMoreCards";
import { ResultsStickyDisclaimer } from "@/components/results/ResultsStickyDisclaimer";
import { getMergedNotableFindingsForAiNotice } from "@/lib/findings-utils";
import { buildDoctorQuestions } from "@/lib/doctor-questions";
import { buildEducationReportPdf } from "@/lib/pdf-report";
import { FileDown, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useI18n } from "@/hooks/useI18n";
import {
  denseNetResponseFromAnalyzeModel3,
  mergeDenseNetDisplayForUi,
} from "@/lib/dense-net-from-analysis";
import { buildHighAttentionFindingKeys } from "@/lib/high-attention-findings";
import type { AiNoticeFindingRow, FindingLabel, SuggestedDoctorQuestion } from "@/types";
import { aiNoticeRowHeadline, conditionName } from "@/lib/i18n";
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
import { DenseNetPipelineBlock } from "@/components/results/DenseNetPipelineBlock";
import type { AnalyzeStageSource } from "@/types";

/** Raw base64 for attention overlay (tabs + PDF); strips `data:image/...;base64,` if present. */
function heatmapBase64ForDisplay(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const t = raw.trim();
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(t);
  return m && m[1] ? m[1] : t;
}

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
  const denseNetLoading = useAppStore((s) => s.denseNetLoading);
  const denseNetResult = useAppStore((s) => s.denseNetResult);

  const denseNetFromAnalyze = analysis ? denseNetResponseFromAnalyzeModel3(analysis) : null;
  const denseNetDisplay = analysis ? mergeDenseNetDisplayForUi(denseNetFromAnalyze, denseNetResult) : null;

  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedDoctorQuestion[] | null>(null);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const hasFetchedQuestions = useRef(false);
  const prevAnalysisRef = useRef<typeof analysis>(undefined);
  const prevDenseNetResultRef = useRef(denseNetResult);

  useEffect(() => {
    if (loading) return;
    if (!analysis) {
      router.replace("/upload");
    }
  }, [analysis, loading, router]);

  useEffect(() => {
    console.log("Q&A Hook Triggered. Analysis exists:", !!analysis);

    if (prevAnalysisRef.current !== analysis) {
      console.log("Q&A: Analysis identity changed; resetting fetch guard and loading.");
      hasFetchedQuestions.current = false;
      prevAnalysisRef.current = analysis;
      prevDenseNetResultRef.current = denseNetResult;
      setIsQuestionsLoading(false);
    } else if (prevDenseNetResultRef.current !== denseNetResult) {
      console.log("Q&A: DenseNet supplemental result updated; resetting fetch guard.");
      hasFetchedQuestions.current = false;
      prevDenseNetResultRef.current = denseNetResult;
    }

    if (!analysis) {
      console.log("Q&A: No analysis; clearing questions and loading.");
      setSuggestedQuestions(null);
      setIsQuestionsLoading(false);
      return;
    }

    if (hasFetchedQuestions.current) {
      console.log("Q&A: Skip — already fetched for this analysis session.");
      return;
    }

    const denseNetForKeys = mergeDenseNetDisplayForUi(
      denseNetResponseFromAnalyzeModel3(analysis),
      denseNetResult,
    );
    const high_attention_findings = buildHighAttentionFindingKeys(analysis, denseNetForKeys);
    console.log("Q&A high_attention_findings:", high_attention_findings);

    if (high_attention_findings.length === 0) {
      console.log("Q&A: No high-attention findings; skipping fetch.");
      setSuggestedQuestions([]);
      setIsQuestionsLoading(false);
      hasFetchedQuestions.current = true;
      return;
    }

    const fetchQuestions = async () => {
      hasFetchedQuestions.current = true;
      setIsQuestionsLoading(true);
      console.log("Q&A: Initiating fetch to proxy...", { high_attention_findings });
      try {
        const res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ high_attention_findings }),
        });

        console.log("Q&A Proxy Response Status:", res.status);

        if (!res.ok) {
          throw new Error(`Proxy returned status ${res.status}`);
        }

        const data: unknown = await res.json();
        console.log("Q&A Data Received:", data);

        const rawList =
          data && typeof data === "object"
            ? (data as { suggested_questions?: unknown }).suggested_questions
            : undefined;
        if (!Array.isArray(rawList)) {
          setSuggestedQuestions([]);
          return;
        }
        const list = rawList.filter(
          (item): item is SuggestedDoctorQuestion =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as SuggestedDoctorQuestion).id === "string" &&
            typeof (item as SuggestedDoctorQuestion).text === "string" &&
            typeof (item as SuggestedDoctorQuestion).finding_trigger === "string",
        );
        setSuggestedQuestions(list);
      } catch (error) {
        console.error("Q&A Fetch Error on Client:", error);
        setSuggestedQuestions([]);
      } finally {
        console.log("Q&A: Fetch complete, disabling loader.");
        setIsQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, [analysis, denseNetResult]);

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
  const model1GradcamRaw =
    analysis.model1?.gradcam && analysis.model1.gradcam.trim().length > 0
      ? analysis.model1.gradcam.trim()
      : null;
  const attentionHeatmapBase64 = heatmapBase64ForDisplay(
    model1GradcamRaw ?? analysis.gradcam.heatmap_base64,
  );
  const notable = getMergedNotableFindingsForAiNotice(predictions, analysis, denseNetDisplay);
  const model2Fallback: AiNoticeFindingRow[] =
    analysis.model2?.label && analysis.model2.label !== "Normal"
      ? [
          {
            id: "model2-fallback",
            label: analysis.model2.label === "Viral Pneumonia" ? "Pneumonia" : "Lung Opacity",
            score: analysis.model2.confidence,
            noticeKind: analysis.model2.label === "Viral Pneumonia" ? "pneumonia_viral" : "default",
          },
        ]
      : [];
  const findingsForSections = notable.length > 0 ? notable : model2Fallback;
  const doctorQuestionFindings = findingsForSections.map((f) => ({
    label: f.label,
    displayName: aiNoticeRowHeadline(locale, f.label, f.noticeKind),
  }));
  const learnMoreFindings = findingsForSections.map((f) => ({
    label: f.label,
    sectionKey: f.id,
  }));
  const stageLabel = (value: string) => t(`stage.${value}`, value);
  const gateLabel = (value: string) => t(`gate.${value}`, value);
  const riskLabel = (value: string) => t(`risk.${value}`, value);
  const model3SummaryText = (() => {
    // Preferred normalized display payload.
    if (denseNetDisplay?.success && denseNetDisplay.prediction && Number.isFinite(denseNetDisplay.confidence)) {
      return `${stageLabel(denseNetDisplay.prediction)} (${denseNetDisplay.confidence.toFixed(0)}%)`;
    }

    // Backward/forward compatibility: read from raw analyze model3 if present.
    const m3 = analysis.model3 as
      | {
          prediction?: string | { class_name?: string; confidence_score?: number };
          class_name?: string;
          confidence_score?: number;
          confidence?: number;
        }
      | null
      | undefined;
    if (!m3) return null;

    const nestedPrediction =
      m3.prediction && typeof m3.prediction === "object" && !Array.isArray(m3.prediction)
        ? m3.prediction
        : null;
    const className =
      (nestedPrediction && typeof nestedPrediction.class_name === "string" ? nestedPrediction.class_name : undefined) ??
      (typeof m3.class_name === "string" ? m3.class_name : undefined) ??
      (typeof m3.prediction === "string" ? m3.prediction : undefined);
    const confidenceScore =
      (nestedPrediction &&
      typeof nestedPrediction.confidence_score === "number" &&
      Number.isFinite(nestedPrediction.confidence_score)
        ? nestedPrediction.confidence_score
        : undefined) ??
      (typeof m3.confidence_score === "number" && Number.isFinite(m3.confidence_score) ? m3.confidence_score : undefined) ??
      (typeof m3.confidence === "number" && Number.isFinite(m3.confidence) ? m3.confidence : undefined);

    if (!className || !Number.isFinite(confidenceScore)) return null;
    const cs = confidenceScore as number;
    const pct = cs <= 1 ? cs * 100 : cs;
    return `${stageLabel(className)} (${pct.toFixed(0)}% Confidence)`;
  })();
  const model1SummaryText = analysis.model1
    ? `${stageLabel(analysis.model1.label)} (${Math.round(analysis.model1.confidence * 100)}% Confidence)`
    : t("results.na");
  const model2SummaryText = analysis.model2
    ? `${stageLabel(analysis.model2.label)} (${Math.round(analysis.model2.confidence * 100)}% Confidence)`
    : t("results.na");
  const model4SwintSummaryText =
    analysis.model4_swint?.status === "success"
      ? `${stageLabel(analysis.model4_swint.prediction)} (${Math.round((analysis.model4_swint.confidence ?? 0) * 100)}% Confidence)`
      : t("results.na");
  const copdSummaryText = (() => {
    if (analysis.copd_screening?.status !== "success") return null;
    const riskText =
      analysis.copd_screening.prediction === "High COPD Risk"
        ? "Elevated Risk Detected"
        : analysis.copd_screening.prediction === "Low COPD Risk"
          ? "Standard Risk Profile"
          : analysis.copd_screening.prediction;
    const confidence = Math.round((analysis.copd_screening.confidence ?? 0) * 100);
    return { riskText, confidence };
  })();
  const reportSummary =
    locale === "en"
      ? analysis.model4?.summary
      : analysis.model4
        ? `${t("results.reportSummaryGenerated")} ${conditionName(locale, analysis.gradcam.top_prediction)}.`
        : null;
  const doctorQuestions = buildDoctorQuestions(doctorQuestionFindings, locale);
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
  const waitingOnSupplementalDenseNet =
    denseNetLoading &&
    (denseNetFromAnalyze == null ||
      !denseNetFromAnalyze.success ||
      !denseNetFromAnalyze.gradcam?.trim());
  const denseNetLoadingEffective = waitingOnSupplementalDenseNet;
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
  if (analysis.model4_swint?.status === "success") {
    impactRows.push({
      section: "Model 4 — Swin Transformer",
      source: t("results.provenance.badge.model"),
      sourceKind: "model",
      status: t("results.impact.statusOk"),
    });
  }
  if (analysis.copd_screening?.status === "success") {
    impactRows.push({
      section: "COPD Clinical Screening",
      source: "Tabular NN",
      sourceKind: "model",
      status: t("results.impact.statusOk"),
    });
  }

  const exportPdf = async () => {
    if (isExportingPdf) return;
    setExportError(null);
    setIsExportingPdf(true);
    try {
      await buildEducationReportPdf({
        filename: "lunglens-education-report",
        reportHeaderTitle: t("results.pdfReportHeaderTitle"),
        generatedAtLabel: t("results.pdfGeneratedAt"),
        generatedAtValue: new Date().toLocaleString(),
        documentSubtitle: t("results.subtitle"),
        llmSectionTitle: t("results.llmEducatorTitle"),
        llmMarkdown:
          analysis.llm_evaluation?.status === "success" && analysis.llm_evaluation.text.trim()
            ? analysis.llm_evaluation.text
            : null,
        pipelineTitle: t("results.pipelineTitle"),
        pipelineSections: [
          {
            heading: t("results.pdfSection.visualXray"),
            rows: [
              { primary: model1SummaryText, poweredBy: t("results.poweredBy.model1") },
              { primary: model2SummaryText, poweredBy: t("results.poweredBy.model2") },
              { primary: model3SummaryText ?? t("results.na"), poweredBy: t("results.poweredBy.model3") },
              { primary: model4SwintSummaryText, poweredBy: t("results.poweredBy.model4") },
            ],
          },
          {
            heading: t("results.pdfSection.clinicalAssessment"),
            rows: [
              {
                primary: copdSummaryText
                  ? `${copdSummaryText.riskText} (${copdSummaryText.confidence}% Confidence)`
                  : t("results.na"),
                poweredBy: t("results.poweredBy.copd"),
              },
            ],
          },
        ],
        gateLine: analysis.gate
          ? `${t("results.gateDecision")}: ${gateLabel(analysis.gate.route)} (${gateLabel(analysis.gate.reason)})`
          : null,
        clinicalRiskLine:
          analysis.clinical_risk?.enabled
            ? `${t("results.model3Risk")}: ${riskLabel(analysis.clinical_risk.risk_level)} / ${riskLabel(analysis.clinical_risk.severity)}`
            : null,
        reportSummaryLabel: t("results.reportSummary"),
        reportSummaryValue: reportSummary ?? t("results.questionnaireRequired"),
        findingsTitle: t("results.anatomyHeader"),
        findings: findingsForSections.map((f) => ({
          label: aiNoticeRowHeadline(locale, f.label, f.noticeKind),
          scorePct: Math.round(f.score * 100),
        })),
        noFindingsText: t("results.noSignificant"),
        doctorQuestionsTitle: t("results.questionsTitle"),
        doctorQuestions,
        warningsTitle: t("results.warningsTitle"),
        warnings: warningMessages,
        footerDisclaimer: t("results.sticky"),
        xrayTitle: t("results.pdfXray"),
        attentionMapTitle: t("results.pdfAttentionMap"),
        xrayUrl: previewUrl,
        heatmapBase64: attentionHeatmapBase64 || null,
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

      <div className="mt-8">
        <ResultsImageTabs
          analysis={analysis}
          denseNetDisplay={denseNetDisplay}
          previewUrl={previewUrl}
          fileLabel={imageFile?.name ?? null}
          anatomyGuideProvenance={
            analysis.provenance?.anatomy_guide ?? (nestedProv ? "static" : undefined)
          }
        />
      </div>

      {analysis.llm_evaluation?.text?.trim() ? (
        <Card
          className={
            analysis.llm_evaluation.status === "success"
              ? "mt-6 border-blue-200/70 bg-blue-50/30 shadow-sm"
              : "mt-6 border-muted bg-muted/30 shadow-sm"
          }
        >
          <CardHeader>
            <CardTitle
              className={
                analysis.llm_evaluation.status === "success" ? "text-base text-blue-900" : "text-base"
              }
            >
              {t("results.llmEducatorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.llm_evaluation.status === "success" ? (
              <div className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-strong:text-slate-900">
                <ReactMarkdown>{analysis.llm_evaluation.text}</ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{analysis.llm_evaluation.text}</p>
                {analysis.llm_evaluation.status === "failed" ? (
                  <p className="text-xs text-muted-foreground">{t("results.llmFailedHint")}</p>
                ) : analysis.llm_evaluation.status === "skipped" ? (
                  <p className="text-xs text-muted-foreground">{t("results.llmSkippedHint")}</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results.pipelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold text-foreground">Visual X-Ray Analysis</h3>
              <div className="space-y-1.5">
                <div className="space-y-2 border-b border-border/60 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{model1SummaryText}</p>
                      <p className="text-xs text-muted-foreground">Powered by Model 1 (ResNet-50)</p>
                    </div>
                    <SectionSourceBadge
                      source={pipelineProvenanceSource(analysis.provenance, "model1")}
                      className="px-2 py-0 text-xs"
                    />
                  </div>
                  {analysis.model1?.probabilities ? (
                    <ClassProbabilitiesList probabilities={analysis.model1.probabilities} />
                  ) : null}
                </div>

                <div className="space-y-2 border-b border-border/60 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{model2SummaryText}</p>
                      <p className="text-xs text-muted-foreground">Powered by Model 2 (ResNet-152V2)</p>
                    </div>
                    <SectionSourceBadge
                      source={pipelineProvenanceSource(analysis.provenance, "model2")}
                      className="px-2 py-0 text-xs"
                    />
                  </div>
                  {analysis.model2?.probabilities ? (
                    <ClassProbabilitiesList probabilities={analysis.model2.probabilities} />
                  ) : null}
                </div>

                <div className="space-y-2 border-b border-border/60 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{model3SummaryText ?? t("results.na")}</p>
                      <p className="text-xs text-muted-foreground">Powered by Model 3 (DenseNet-121)</p>
                    </div>
                    {denseNetDisplay?.success ? (
                      <SectionSourceBadge source="model" className="px-2 py-0 text-xs" />
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("results.model3DenseNet.unavailable")}</p>
                    )}
                  </div>
                  <DenseNetPipelineBlock
                    loading={denseNetLoadingEffective}
                    result={denseNetDisplay}
                    previewUrl={previewUrl}
                  />
                </div>

                <div className="space-y-2 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{model4SwintSummaryText}</p>
                      <p className="text-xs text-muted-foreground">{t("results.poweredBy.model4")}</p>
                    </div>
                    {analysis.model4_swint?.status === "success" ? (
                      <Badge variant="outline" className="border-violet-200 bg-violet-50 px-2 py-0 text-xs text-violet-700">
                        ViT Model ✓
                      </Badge>
                    ) : null}
                  </div>
                  {analysis.model4_swint?.probabilities ? (
                    <ClassProbabilitiesList probabilities={analysis.model4_swint.probabilities} />
                  ) : null}
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
              <h3 className="text-sm font-semibold text-foreground">Clinical Patient Assessment</h3>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        copdSummaryText
                          ? analysis.copd_screening?.prediction === "High COPD Risk"
                            ? "font-semibold text-red-600"
                            : "font-semibold text-green-600"
                          : "font-semibold text-foreground"
                      }
                    >
                      {copdSummaryText
                        ? `${copdSummaryText.riskText} (${copdSummaryText.confidence}% Confidence)`
                        : t("results.na")}
                    </p>
                    <p className="text-xs text-muted-foreground">Powered by Chronic Lung Risk (COPD)</p>
                  </div>
                  {copdSummaryText ? (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 px-2 py-0 text-xs text-blue-700">
                      Tabular NN ✓
                    </Badge>
                  ) : null}
                </div>
              </div>
            </section>

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
            {analysis.clinical_risk?.enabled && (
              <p>
                <span className="font-medium text-foreground">{t("results.model3Risk")}: </span>
                {riskLabel(analysis.clinical_risk.risk_level)} /{" "}
                {riskLabel(analysis.clinical_risk.severity)}
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
          notableFindings={notable}
          model2={analysis.model2}
          findingsBadgeSource={resolveFindingsBadgeSource(analysis.provenance)}
        />
        <DoctorQuestions
          findings={doctorQuestionFindings}
          doctorQuestionsProvenance={
            analysis.provenance?.doctor_questions ??
            analysis.provenance?.clinical_risk?.source ??
            (nestedProv ? "rule" : undefined)
          }
          questions={suggestedQuestions}
          isLoading={isQuestionsLoading}
        />
        <LearnMoreCards
          findings={learnMoreFindings}
          anatomyGuideProvenance={
            analysis.provenance?.anatomy_guide ?? (nestedProv ? "static" : undefined)
          }
        />
      </div>

      <ResultsStickyDisclaimer />
    </div>
  );
}
