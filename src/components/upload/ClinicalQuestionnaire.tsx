"use client";

import { analyzeImageFile } from "@/lib/api";
import { useI18n } from "@/hooks/useI18n";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MIN_BUTTON_LOADING_MS = 600;

export function ClinicalQuestionnaire() {
  const router = useRouter();
  const { t } = useI18n();
  const [submitUiLoading, setSubmitUiLoading] = useState(false);
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

  const submit = async () => {
    if (!imageFile || analysisLoading || submitUiLoading) return;
    const startedAt = Date.now();
    setSubmitUiLoading(true);
    setAnalysisError(null);
    setAnalysisLoading(true);
    const res = await analyzeImageFile(imageFile, { questionnaire });
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_BUTTON_LOADING_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_BUTTON_LOADING_MS - elapsed));
    }
    setAnalysisLoading(false);
    setSubmitUiLoading(false);
    if (!res.success) {
      setAnalysisError(res.error);
      return;
    }
    setQuestionnaireSubmitted(true);
    setPreQuestionnaireAnalysis(null);
    setAnalysis(res);
    router.push("/results");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("upload.q.title")}</CardTitle>
        <CardDescription>{t("upload.q.subtitle")}</CardDescription>
      </CardHeader>
      {analysisError && (
        <p className="px-6 pb-2 text-sm text-destructive" role="alert">
          {analysisError}
        </p>
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
          <Button
            type="button"
            onClick={submit}
            disabled={analysisLoading || submitUiLoading}
            aria-busy={analysisLoading || submitUiLoading}
          >
            {(analysisLoading || submitUiLoading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            )}
            {analysisLoading || submitUiLoading ? t("upload.q.generating") : t("upload.q.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

