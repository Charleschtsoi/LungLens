"use client";

import { CONDITION_DESCRIPTIONS } from "@/lib/constants";
import type { Predictions } from "@/types";
import type { StageMultiClassResult } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";
import type { AnalyzeStageSource } from "@/types";
import {
  confidenceTier,
  getNotableFindings,
  tierBarSegments,
  type ConfidenceTier,
} from "@/lib/findings-utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { CONDITION_DESC, conditionName } from "@/lib/i18n";

function TierLabel({ tier }: { tier: ConfidenceTier }) {
  const { t } = useI18n();
  const tierLabel =
    tier === "High" ? t("results.high") : tier === "Moderate" ? t("results.moderate") : t("results.low");
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {t("results.attentionLevel")}: <span className="text-foreground">{tierLabel}</span>
    </span>
  );
}

function ConfidenceBar({ tier }: { tier: ConfidenceTier }) {
  const filled = tierBarSegments(tier);
  const fillClass =
    tier === "High" ? "bg-primary" : tier === "Moderate" ? "bg-primary/80" : "bg-primary/55";
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Model attention level: ${tier}`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn("h-2.5 flex-1 rounded-full transition-colors", i <= filled ? fillClass : "bg-muted")}
        />
      ))}
    </div>
  );
}

export function FindingsCard({
  predictions,
  model2,
  findingsBadgeSource,
}: {
  predictions: Predictions | null;
  model2?: StageMultiClassResult;
  /** Resolved badge source (mock / rule / …) from provenance. */
  findingsBadgeSource?: AnalyzeStageSource | null;
}) {
  const { t, locale } = useI18n();
  const notable = predictions ? getNotableFindings(predictions) : [];
  const findingsAreMock = findingsBadgeSource === "mock";
  const showDemoFindingsNotice = findingsAreMock;
  const showPrimaryClassNotice = !showDemoFindingsNotice;
  const model2Hint =
    model2 && model2.label !== "Normal"
      ? `${t("results.stage2")}: ${t(`stage.${model2.label}`, model2.label)} (${Math.round(model2.confidence * 100)}%).`
      : null;

  return (
    <Card id="what-ai-noticed">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <span>{t("results.anatomyHeader")}</span>
              <SectionSourceBadge source={findingsBadgeSource} prominentMock={findingsAreMock} />
            </CardTitle>
            <CardDescription>{t("results.anatomySub")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showDemoFindingsNotice && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-950 shadow-sm [&>div]:text-amber-950">
            <AlertDescription className="text-sm font-medium">
              {t("results.provenance.findingsDemoNotice")}
            </AlertDescription>
          </Alert>
        )}
        {showPrimaryClassNotice && (
          <Alert className="border-slate-200 bg-slate-50 text-slate-900 shadow-sm [&>div]:text-slate-900">
            <AlertDescription className="text-sm font-medium">
              {t("results.provenance.findingsPrimaryClassNotice")}
            </AlertDescription>
          </Alert>
        )}
        {notable.length === 0 ? (
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>{t("results.noSignificant")}</p>
            {model2Hint && <p>{model2Hint}</p>}
          </div>
        ) : (
          notable.map(({ label, score }) => {
            const tier = confidenceTier(score);
            const desc = CONDITION_DESC[locale]?.[label] ?? CONDITION_DESCRIPTIONS[label];
            return (
              <div key={label} className="space-y-3 border-b border-border/60 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{conditionName(locale, label)}</h3>
                  <TierLabel tier={tier} />
                </div>
                <ConfidenceBar tier={tier} />
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
