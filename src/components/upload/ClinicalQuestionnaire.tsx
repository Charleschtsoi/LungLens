"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { analyzeImageFile, probeGeminiApiKey } from "@/lib/api";
import { persistAnalyzeSuccessToSession } from "@/lib/analysis-session-storage";
import { ANALYSIS_PIPELINE_COMPLETE_HOLD_MS } from "@/lib/analysis-pipeline-loading";
import { denseNetResponseFromAnalyzeModel3 } from "@/lib/dense-net-from-analysis";
import { readStoredGeminiApiKey } from "@/lib/gemini-client-storage";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisPipelineLoader } from "@/components/upload/AnalysisPipelineLoader";
import { UploadDestructiveAlert } from "@/components/upload/UploadDestructiveAlert";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ClinicalQuestionnaire() {
  const router = useRouter();
  const { t } = useI18n();
  const [pipelineFinishing, setPipelineFinishing] = useState(false);

  const imageFile = useAppStore((s) => s.imageFile);
  const analysisError = useAppStore((s) => s.analysisError);
  const questionnaire = useAppStore((s) => s.questionnaire);
  const setQuestionnaire = useAppStore((s) => s.setQuestionnaire);
  const setQuestionnaireSubmitted = useAppStore((s) => s.setQuestionnaireSubmitted);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const setPreQuestionnaireAnalysis = useAppStore((s) => s.setPreQuestionnaireAnalysis);
  const setAnalysisLoading = useAppStore((s) => s.setAnalysisLoading);
  const setAnalysisError = useAppStore((s) => s.setAnalysisError);
  const analysisLoading = useAppStore((s) => s.analysisLoading);
  const startSupplementalDensenet = useAppStore((s) => s.startSupplementalDensenet);

  const showPipelineLoader = analysisLoading || pipelineFinishing;

  const stopPipeline = () => {
    setPipelineFinishing(false);
    setAnalysisLoading(false);
  };

  const finishPipelineSuccess = async () => {
    setPipelineFinishing(true);
    await delay(ANALYSIS_PIPELINE_COMPLETE_HOLD_MS);
    stopPipeline();
  };

  const submit = async () => {
    if (!imageFile || showPipelineLoader) return;
    setAnalysisError(null);
    setPipelineFinishing(false);
    setAnalysisLoading(true);

    try {
      const geminiApiKey = readStoredGeminiApiKey();
      const probe = await probeGeminiApiKey(geminiApiKey ?? "");
      if (!probe.ok) {
        const msg = probe.error_code
          ? t(`upload.geminiHealth.${probe.error_code}`, probe.error || t("upload.geminiHealth.failed"))
          : probe.error || t("upload.geminiHealth.failed");
        setAnalysisError(msg);
        stopPipeline();
        return;
      }

      const res = await analyzeImageFile(imageFile, {
        questionnaire,
        ...(geminiApiKey ? { geminiApiKey } : {}),
      });

      if (!res.success) {
        setAnalysisError(res.error || t("upload.error.analysisFailed"));
        stopPipeline();
        return;
      }

      await finishPipelineSuccess();
      setQuestionnaireSubmitted(true);
      setPreQuestionnaireAnalysis(null);
      setAnalysis(res);
      persistAnalyzeSuccessToSession(res);
      const dn = denseNetResponseFromAnalyzeModel3(res);
      if (!(dn?.success === true && Boolean(dn.gradcam?.trim()))) {
        startSupplementalDensenet();
      }
      router.push("/results");
    } catch {
      setAnalysisError(t("upload.error.analysisFailed"));
      stopPipeline();
    }
  };

  if (showPipelineLoader) {
    return (
      <div className="space-y-4">
        <AnalysisPipelineLoader active complete={pipelineFinishing} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upload.q.title")}</CardTitle>
        <CardDescription>{t("upload.q.subtitle")}</CardDescription>
        <p className="mt-2 text-xs text-muted-foreground">{t("upload.q.geminiReuseNote")}</p>
      </CardHeader>
      {analysisError && (
        <div className="px-6 pb-2">
          <UploadDestructiveAlert
            title={t("upload.error.analysisFailed")}
            description={analysisError}
          />
        </div>
      )}
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{t("upload.q.age")}</span>
          <input
            type="number"
            min={1}
            max={120}
            value={questionnaire.age}
            onChange={(e) => setQuestionnaire({ age: Number(e.target.value || 0) })}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{t("upload.q.coughDays")}</span>
          <input
            type="number"
            min={0}
            max={60}
            value={questionnaire.coughDurationDays}
            onChange={(e) =>
              setQuestionnaire({ coughDurationDays: Number(e.target.value || 0) })
            }
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{t("upload.q.fever")}</span>
          <select
            value={questionnaire.fever ? "yes" : "no"}
            onChange={(e) => setQuestionnaire({ fever: e.target.value === "yes" })}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="no">{t("upload.gate.no")}</option>
            <option value="yes">{t("upload.gate.yes")}</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{t("upload.q.smoking")}</span>
          <select
            value={questionnaire.smoking}
            onChange={(e) =>
              setQuestionnaire({
                smoking: e.target.value as "never" | "former" | "current",
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="never">{t("upload.q.never")}</option>
            <option value="former">{t("upload.q.former")}</option>
            <option value="current">{t("upload.q.current")}</option>
          </select>
        </label>

        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted-foreground">{t("upload.q.breathing")}</span>
          <select
            value={questionnaire.breathingDifficulty}
            onChange={(e) =>
              setQuestionnaire({
                breathingDifficulty: e.target.value as "none" | "mild" | "severe",
              })
            }
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="none">{t("upload.q.none")}</option>
            <option value="mild">{t("upload.q.mild")}</option>
            <option value="severe">{t("upload.q.severe")}</option>
          </select>
        </label>

        <div className="sm:col-span-2">
          <Button type="button" onClick={submit}>
            {t("upload.q.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
