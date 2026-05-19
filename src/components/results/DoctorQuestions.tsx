"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FindingLabel, SuggestedDoctorQuestion } from "@/types";
import { useI18n } from "@/hooks/useI18n";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";

interface DoctorQuestionsProps {
  findings: { label: FindingLabel; displayName?: string }[];
  doctorQuestionsProvenance?: unknown;
  questions: SuggestedDoctorQuestion[] | null;
  isLoading: boolean;
}

export function DoctorQuestions({
  findings: _findings,
  doctorQuestionsProvenance,
  questions,
  isLoading,
}: DoctorQuestionsProps) {
  const { t } = useI18n();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <span>{t("results.questionsTitle")}</span>
            <SectionSourceBadge source={doctorQuestionsProvenance} />
          </CardTitle>
          <CardDescription>{t("results.questionsSub")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3" aria-busy="true" aria-label={t("results.loading")}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-muted/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted sm:h-5" />
                <div className="h-9 w-20 shrink-0 animate-pulse rounded-md bg-muted sm:ml-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && (!questions || questions.length === 0)) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No specific questions generated for these findings. Please consult your doctor directly.
      </div>
    );
  }

  const resolved = questions as SuggestedDoctorQuestion[];
  const apiRows = resolved.map((q) => ({ key: q.id, text: q.text }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <span>{t("results.questionsTitle")}</span>
          <SectionSourceBadge source={doctorQuestionsProvenance} />
        </CardTitle>
        <CardDescription>{t("results.questionsSub")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {apiRows.map((row) => (
            <div
              key={row.key}
              className="flex flex-col gap-2 rounded-lg border border-sky-100/80 bg-sky-50/20 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <p className="text-sm leading-relaxed text-foreground">{row.text}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => copy(row.text, row.key)}
              >
                {copiedKey === row.key ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    {t("results.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    {t("results.copy")}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
