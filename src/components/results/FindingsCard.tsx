"use client";

import type { AiNoticeFindingRow, AnalyzeStageSource, FindingLabel, Predictions } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";
import {
  confidenceTier,
  getNotableFindings,
  tierBarSegments,
  type ConfidenceTier,
} from "@/lib/findings-utils";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { aiNoticeRowBody, aiNoticeRowHeadline } from "@/lib/i18n";

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

function legacyNotableToRows(
  rows: { label: FindingLabel; score: number }[],
): AiNoticeFindingRow[] {
  return rows.map((r) => ({
    id: `legacy-${r.label}`,
    label: r.label,
    score: r.score,
    noticeKind: "default",
  }));
}

export function FindingsCard({
  predictions,
  findingsBadgeSource,
  notableFindings,
}: {
  predictions: Predictions | null;
  /** When set (e.g. merged fusion + per-model >50%), drives notice rows instead of fusion-only scores. */
  notableFindings?: AiNoticeFindingRow[] | null;
  /** Resolved badge source from provenance. */
  findingsBadgeSource?: AnalyzeStageSource | null;
}) {
  const { t, locale } = useI18n();
  const notable: AiNoticeFindingRow[] =
    notableFindings != null
      ? notableFindings
      : predictions
        ? legacyNotableToRows(getNotableFindings(predictions))
        : [];
  return (
    <Card id="what-ai-noticed">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <span>{t("results.anatomyHeader")}</span>
              <SectionSourceBadge source={findingsBadgeSource} />
            </CardTitle>
            <CardDescription>{t("results.anatomySub")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-slate-200 bg-slate-50 text-slate-900 shadow-sm [&>div]:text-slate-900">
          <AlertDescription className="text-sm font-medium">
            {t("results.provenance.findingsPrimaryClassNotice")}
          </AlertDescription>
        </Alert>
        {notable.length === 0 ? (
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>{t("results.noSignificant")}</p>
          </div>
        ) : (
          notable.map((row) => {
            const tier = confidenceTier(row.score);
            const title = aiNoticeRowHeadline(locale, row.label, row.noticeKind);
            const desc = aiNoticeRowBody(locale, row.label, row.noticeKind);
            return (
              <div key={row.id} className="space-y-3 border-b border-border/60 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
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
