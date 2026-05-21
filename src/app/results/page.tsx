"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { readPersistedAnalyzeSuccessFromSession } from "@/lib/analysis-session-storage";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResultsImageTabs } from "@/components/results/ResultsImageTabs";
import { LlmEducatorCard } from "@/components/results/LlmEducatorCard";
import { FindingsCard } from "@/components/results/FindingsCard";
import { DoctorQuestions } from "@/components/results/DoctorQuestions";
import { LearnMoreCards } from "@/components/results/LearnMoreCards";
import { ResultsStickyDisclaimer } from "@/components/results/ResultsStickyDisclaimer";
import { getNotableFindings } from "@/lib/findings-utils";
import { buildDoctorQuestions } from "@/lib/doctor-questions";
import { buildEducationReportPdf } from "@/lib/pdf-report";
import { pickLlmMarkdownForLocale } from "@/lib/llm-evaluation-display";
import { FileDown, Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import {
  denseNetResponseFromAnalyzeModel3,
  mergeDenseNetDisplayForUi,
  model3PredictionString,
} from "@/lib/dense-net-from-analysis";
import { mapModelSignalsToHighAttentionFindings } from "@/lib/high-attention-findings";
import type { AiNoticeFindingRow, FindingLabel, SuggestedDoctorQuestion } from "@/types";
import { aiNoticeRowHeadline, conditionName } from "@/lib/i18n";
import {
  bothClassifierModelsLive,
  buildFlatProvenanceSummary,
  buildNestedProvenanceSummary,
  flatPipelineImpactRows,
  hybridRunModeBannerMessage,
  isFlatSectionProvenance,
  isNestedStageProvenance,
  nestedProvenanceImpactRows,
  pipelineProvenanceSource,
  provenanceBadgeClassName,
  resolveFindingsBadgeSource,
  type ImpactRow,
} from "@/lib/provenance-ui";
import { PipelineModelBadge } from "@/components/results/PipelineModelBadge";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";
import { DenseNetPipelineBlock } from "@/components/results/DenseNetPipelineBlock";
import { EnsembleArchitectureAccordion } from "@/components/results/EnsembleArchitectureAccordion";
import {
  VisualXrayPipelineSection,
  type VisualPipelineRowView,
} from "@/components/results/VisualXrayPipelineSection";
import type { VisualPipelineModelSlot } from "@/lib/ensemble-architecture";
import { formatClassifierSummaryLine } from "@/lib/model-summary-display";
import { Model2ClinicalSection } from "@/components/results/Model2ClinicalSection";
import { DISPLAY_PIPELINE_MODEL } from "@/lib/model-display-numbers";
import { formatModel2ClinicalHeadline, model2TabularFromAnalysis } from "@/lib/model2-tabular";

/** Raw base64 for attention overlay (tabs + PDF); strips `data:image/...;base64,` if present. */
function heatmapBase64ForDisplay(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const t = raw.trim();
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(t);
  return m && m[1] ? m[1] : t;
}

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
  const [sessionRestored, setSessionRestored] = useState(false);
  const hasFetchedQuestions = useRef(false);
  const prevAnalysisRef = useRef<typeof analysis>(undefined);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (analysis) {
      setSessionRestored(true);
      useAppStore.getState().setAnalysisLoading(false);
      return;
    }
    const restored = readPersistedAnalyzeSuccessFromSession();
    if (restored) {
      useAppStore.getState().setAnalysis(restored);
      useAppStore.getState().setAnalysisLoading(false);
    }
    setSessionRestored(true);
  }, [analysis]);

  useEffect(() => {
    if (loading || !sessionRestored) return;
    if (!analysis) {
      router.replace("/upload");
    }
  }, [analysis, loading, router, sessionRestored]);

  useEffect(() => {
    console.log("Q&A Hook Triggered. Analysis exists:", !!analysis);

    if (prevAnalysisRef.current !== analysis) {
      console.log("Q&A: Analysis identity changed; resetting fetch guard and loading.");
      hasFetchedQuestions.current = false;
      prevAnalysisRef.current = analysis;
      setIsQuestionsLoading(false);
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

    const findings: string[] = [];
    if (analysis.model1?.label && analysis.model1.label !== "Normal") {
      findings.push(analysis.model1.label);
    }
    const m3pred = model3PredictionString(analysis.model3);
    if (m3pred && m3pred !== "Normal") {
      findings.push(m3pred);
    }

    console.log("Q&A Extracted Findings:", findings);

    if (findings.length === 0) {
      console.log("Q&A: No abnormal findings, skipping fetch.");
      setSuggestedQuestions([]);
      setIsQuestionsLoading(false);
      hasFetchedQuestions.current = true;
      return;
    }

    const high_attention_findings = mapModelSignalsToHighAttentionFindings(findings);
    console.log("Q&A Mapped high_attention_findings:", high_attention_findings);

    if (high_attention_findings.length === 0) {
      console.log("Q&A: No mappable finding keys after normalization; skipping fetch.");
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
  }, [analysis]);

  if (!analysis && loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm">{t("results.loading")}</p>
      </div>
    );
  }

  if (!analysis && !sessionRestored) {
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
  const notable = getNotableFindings(predictions);
  const findingsForSections = notable;
  const model2Tabular = model2TabularFromAnalysis(analysis);
  const learnMoreFindings = findingsForSections.map((f) => ({
    label: f.label,
    sectionKey: "id" in f && typeof f.id === "string" ? f.id : `finding-${f.label}`,
  }));
  const doctorQuestionFindings = findingsForSections.map((f) => {
    const row = f as AiNoticeFindingRow | { label: FindingLabel; score: number };
    const displayName =
      "noticeKind" in row
        ? aiNoticeRowHeadline(locale, row.label, row.noticeKind)
        : conditionName(locale, row.label);
    return { label: row.label, displayName };
  });
  const stageLabel = (value: string) => t(`stage.${value}`, value);
  const gateLabel = (value: string) => t(`gate.${value}`, value);
  const riskLabel = (value: string) => t(`risk.${value}`, value);
  const model3SummaryText = (() => {
    if (denseNetDisplay?.success && denseNetDisplay.prediction && Number.isFinite(denseNetDisplay.confidence)) {
      return formatClassifierSummaryLine(stageLabel, denseNetDisplay.prediction, {
        confidence: denseNetDisplay.confidence,
        probabilities: denseNetDisplay.probabilities,
        t,
      });
    }

    const m3 = analysis.model3 as
      | {
          prediction?: string | { class_name?: string; confidence_score?: number };
          class_name?: string;
          confidence_score?: number;
          confidence?: number;
          probabilities?: Record<string, number>;
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
    return formatClassifierSummaryLine(stageLabel, className, {
      confidence: confidenceScore as number,
      probabilities: m3.probabilities,
      t,
    });
  })();
  const model1SummaryText = analysis.model1
    ? formatClassifierSummaryLine(stageLabel, analysis.model1.label, {
        confidence: analysis.model1.confidence,
        probabilities: analysis.model1.probabilities,
        t,
      })
    : t("results.na");
  const model6VisionSummaryText =
    analysis.model6_vision_h5?.status === "success"
      ? formatClassifierSummaryLine(stageLabel, analysis.model6_vision_h5.prediction, {
          confidence: analysis.model6_vision_h5.confidence,
          probabilities: analysis.model6_vision_h5.probabilities,
          t,
        })
      : t("results.na");
  const model4SwintSummaryText =
    analysis.model4_swint?.status === "success"
      ? formatClassifierSummaryLine(stageLabel, analysis.model4_swint.prediction, {
          confidence: analysis.model4_swint.confidence,
          probabilities: analysis.model4_swint.probabilities,
          t,
        })
      : t("results.na");
  const model5DenseNetSummaryText =
    analysis.model5_densenet?.status === "success"
      ? formatClassifierSummaryLine(stageLabel, analysis.model5_densenet.prediction, {
          confidence: analysis.model5_densenet.confidence,
          probabilities: analysis.model5_densenet.probabilities,
          t,
        })
      : t("results.na");
  const model2ClinicalLine = model2Tabular
    ? formatModel2ClinicalHeadline(model2Tabular, t)
    : t("results.model2Clinical.unavailable");
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
      ? nestedProvenanceImpactRows(analysis.provenance, t, analysis)
      : flatProv && analysis.provenance
        ? flatPipelineImpactRows(analysis.provenance, analysis, t)
        : [
        {
          section: t("results.impact.pipelineSection"),
          source: t("results.impact.sourceModel"),
          sourceKind: "model",
          status:
            analysis.provenance?.model1?.status === "failed" || analysis.provenance?.model2?.status === "failed"
              ? t("results.impact.statusFailed")
              : t("results.impact.statusOk"),
        },
        {
          section: t("results.impact.findingsSection"),
          source: t("results.impact.sourceRulesModel"),
          sourceKind: "rule",
          status:
            findingsForSections.length > 0 ? t("results.impact.statusOk") : t("results.impact.statusFallback"),
        },
        {
          section: t("results.impact.questionsSection"),
          source: t("results.impact.sourceRulesModel"),
          sourceKind: "rule",
          status: t("results.impact.statusOk"),
        },
        {
          section: t("results.impact.reportSection"),
          source: t("results.impact.sourceLlm"),
          sourceKind: "llm",
          status: analysis.model4 ? t("results.impact.statusOk") : t("results.impact.statusSkipped"),
        },
        {
          section: t("results.impact.anatomySection"),
          source: t("results.impact.sourceStatic"),
          sourceKind: "static",
          status: t("results.impact.statusOk"),
        },
      ];

  const model3Probabilities =
    denseNetDisplay?.success && denseNetDisplay.probabilities
      ? denseNetDisplay.probabilities
      : null;

  const visualPipelineRows: Record<VisualPipelineModelSlot, VisualPipelineRowView> = {
    model1: {
      summary: model1SummaryText,
      available: Boolean(analysis.model1),
      poweredByKey: "results.poweredBy.model1",
      probabilities: analysis.model1?.probabilities ?? null,
      trailing: (
        <PipelineModelBadge
          modelNumber={1}
          live={Boolean(analysis.model1)}
          provenanceSource={pipelineProvenanceSource(analysis.provenance, "model1")}
          className="px-2 py-0 text-xs"
        />
      ),
    },
    model6_vision_h5: {
      summary: model6VisionSummaryText,
      available: analysis.model6_vision_h5?.status === "success",
      poweredByKey: "results.poweredBy.model2",
      probabilities: analysis.model6_vision_h5?.probabilities ?? null,
      trailing: (
        <PipelineModelBadge
          modelNumber={DISPLAY_PIPELINE_MODEL.edwardResNet}
          live={analysis.model6_vision_h5?.status === "success"}
          className="px-2 py-0 text-xs"
        />
      ),
    },
    model3: {
      summary: model3SummaryText ?? t("results.model3DenseNet.unavailable"),
      available: Boolean(model3SummaryText || denseNetDisplay?.success),
      poweredByKey: "results.poweredBy.model3",
      probabilities: model3Probabilities,
      trailing: denseNetDisplay?.success ? (
        <PipelineModelBadge modelNumber={3} live className="px-2 py-0 text-xs" />
      ) : (
        <p className="text-xs text-muted-foreground">{t("results.model3DenseNet.unavailable")}</p>
      ),
      extra: (
        <DenseNetPipelineBlock
          compact
          loading={denseNetLoadingEffective}
          result={denseNetDisplay}
          previewUrl={previewUrl}
        />
      ),
    },
    model4_swint: {
      summary: model4SwintSummaryText,
      available: analysis.model4_swint?.status === "success",
      poweredByKey: "results.poweredBy.model4",
      probabilities: analysis.model4_swint?.probabilities ?? null,
      trailing: (
        <PipelineModelBadge
          modelNumber={4}
          live={analysis.model4_swint?.status === "success"}
          className="px-2 py-0 text-xs"
        />
      ),
    },
    model5_densenet: {
      summary: model5DenseNetSummaryText,
      available: analysis.model5_densenet?.status === "success",
      poweredByKey: "results.poweredBy.model5",
      probabilities: analysis.model5_densenet?.probabilities ?? null,
      trailing: (
        <PipelineModelBadge
          modelNumber={5}
          live={analysis.model5_densenet?.status === "success"}
          className="px-2 py-0 text-xs"
        />
      ),
    },
  };

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
          analysis.llm_evaluation?.status === "success"
            ? (() => {
                const md = pickLlmMarkdownForLocale(analysis.llm_evaluation, locale);
                return md.trim() ? md : null;
              })()
            : null,
        pipelineTitle: t("results.pipelineTitle"),
        pipelineSections: [
          {
            heading: t("results.pdfSection.visualXray"),
            rows: [
              { primary: model1SummaryText, poweredBy: t("results.poweredBy.model1") },
              { primary: model6VisionSummaryText, poweredBy: t("results.poweredBy.model2") },
              {
                primary: model3SummaryText ?? t("results.model3DenseNet.unavailable"),
                poweredBy: t("results.poweredBy.model3"),
              },
              { primary: model4SwintSummaryText, poweredBy: t("results.poweredBy.model4") },
              { primary: model5DenseNetSummaryText, poweredBy: t("results.poweredBy.model5") },
            ],
          },
          {
            heading: t("results.pdfSection.clinicalAssessment"),
            rows: [
              {
                primary: model2ClinicalLine,
                poweredBy: t("results.poweredBy.model6"),
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
          label: conditionName(locale, f.label),
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

      <Alert className="mt-6 border-amber-400 bg-amber-50 text-foreground shadow-md" role="alert">
        <AlertDescription className="text-sm font-semibold leading-relaxed text-amber-950">
          <span className="font-bold">{t("results.complianceImportant")}:</span> {t("results.sticky")}
        </AlertDescription>
      </Alert>

      {doctorReviewed === false && (
        <Alert className="mt-4 border-amber-300 bg-amber-100/90 text-foreground shadow-sm">
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
        <LlmEducatorCard llm={analysis.llm_evaluation} locale={locale} t={t} />
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results.pipelineTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-muted-foreground">
            <VisualXrayPipelineSection rows={visualPipelineRows} />

            <Model2ClinicalSection tabular={model2Tabular} provenance={analysis.provenance} />

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

      <div className="mt-6">
        <EnsembleArchitectureAccordion />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t("results.impact.title")}</CardTitle>
          <CardDescription className="text-sm">{t("results.impact.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="hidden gap-1 border-b pb-2 font-medium text-muted-foreground md:grid md:grid-cols-3">
            <span>{t("results.impact.colSection")}</span>
            <span>{t("results.impact.colSource")}</span>
            <span className="text-right md:text-left">{t("results.impact.colRun")}</span>
          </div>
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
              <p className="text-muted-foreground md:text-left">{row.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-10 space-y-10">
        <FindingsCard
          predictions={predictions}
          findingsBadgeSource={resolveFindingsBadgeSource(analysis.provenance)}
        />
        <DoctorQuestions
          findings={findingsForSections}
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
