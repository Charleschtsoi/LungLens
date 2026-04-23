 "use client";

import { CONDITION_DESCRIPTIONS } from "@/lib/constants";
import type { Predictions } from "@/types";
import type { StageMultiClassResult } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  confidenceTier,
  formatConditionName,
  getNotableFindings,
  tierBarSegments,
  type ConfidenceTier,
} from "@/lib/findings-utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { CONDITION_DESC } from "@/lib/i18n";

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
  stage2,
}: {
  predictions: Predictions | null;
  stage2?: StageMultiClassResult;
}) {
  const { t, locale } = useI18n();
  const notable = predictions ? getNotableFindings(predictions) : [];
  const stage2Hint =
    stage2 && stage2.label !== "Normal"
      ? `Stage 2 prioritized: ${stage2.label} (${Math.round(stage2.confidence * 100)}%).`
      : null;

  return (
    <Card id="what-ai-noticed">
      <CardHeader>
        <CardTitle className="text-lg">{t("results.anatomyHeader")}</CardTitle>
        <CardDescription>
          {t("results.anatomySub")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notable.length === 0 ? (
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>{t("results.noSignificant")}</p>
            {stage2Hint && <p>{stage2Hint}</p>}
          </div>
        ) : (
          notable.map(({ label, score }) => {
            const tier = confidenceTier(score);
            const desc = CONDITION_DESC[locale]?.[label] ?? CONDITION_DESCRIPTIONS[label];
            return (
              <div key={label} className="space-y-3 border-b border-border/60 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{formatConditionName(label)}</h3>
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
