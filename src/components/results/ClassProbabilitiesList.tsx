"use client";

import { useI18n } from "@/hooks/useI18n";
import { ProbabilityBarList } from "@/components/results/ProbabilityBarList";

type ClassProbabilitiesListProps = {
  probabilities: Record<string, number>;
};

export function ClassProbabilitiesList({ probabilities }: ClassProbabilitiesListProps) {
  const { t } = useI18n();
  const prettyLabel = (label: string): string => label.replace(/_/g, " ");
  const rows = Object.entries(probabilities)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([label, value]) => {
      const pct = value > 1 ? Math.max(0, Math.min(100, value)) : Math.max(0, Math.min(100, value * 100));
      return { key: label, label: prettyLabel(label), pct };
    })
    .sort((a, b) => b.pct - a.pct);

  if (!rows.length) return null;

  return <ProbabilityBarList title={t("results.classProbabilitiesTitle")} rows={rows} />;
}
