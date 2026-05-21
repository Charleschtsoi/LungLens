"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { EducationalInsight, FindingLabel } from "@/types";
import { useI18n } from "@/hooks/useI18n";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";

interface EducationalInsightsProps {
  findings: { label: FindingLabel }[];
  insightsProvenance?: unknown;
  insights: EducationalInsight[] | null;
  isLoading: boolean;
}

export function DoctorQuestions({
  findings: _findings,
  insightsProvenance,
  insights,
  isLoading,
}: EducationalInsightsProps) {
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
            <SectionSourceBadge source={insightsProvenance} />
          </CardTitle>
          <CardDescription>{t("results.questionsSub")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3" aria-busy="true" aria-label={t("results.loading")}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-muted/60 bg-muted/10 p-4"
              >
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoading && (!insights || insights.length === 0)) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        {t("results.doctorQuestionsEmptyFallback")}
      </div>
    );
  }

  const resolved = insights as EducationalInsight[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <span>{t("results.questionsTitle")}</span>
          <SectionSourceBadge source={insightsProvenance} />
        </CardTitle>
        <CardDescription>{t("results.questionsSub")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {resolved.map((row) => {
            const copyText = `${row.title}\n\n${row.text}`;
            return (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border border-sky-100/80 bg-sky-50/20 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">{row.title}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{row.text}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => copy(copyText, row.id)}
                >
                  {copiedKey === row.id ? (
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
