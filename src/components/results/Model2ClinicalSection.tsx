"use client";

import { PipelineModelBadge } from "@/components/results/PipelineModelBadge";
import { ProbabilityBarList } from "@/components/results/ProbabilityBarList";
import { pipelineProvenanceSource } from "@/lib/provenance-ui";
import {
  formatModel2ClinicalHeadline,
  formatModel2ClinicalSummary,
  model2ClinicalProbabilityRows,
} from "@/lib/model2-tabular";
import { cn } from "@/lib/utils";
import type { AnalyzeProvenance, Model2TabularResult } from "@/types";
import { useI18n } from "@/hooks/useI18n";

const LABEL_KEYS: Record<string, string> = {
  "High COPD Risk": "results.model2Clinical.labelHigh",
  "Low COPD Risk": "results.model2Clinical.labelLow",
};

type Model2ClinicalSectionProps = {
  tabular: Model2TabularResult | undefined;
  provenance?: AnalyzeProvenance;
};

export function Model2ClinicalSection({ tabular, provenance }: Model2ClinicalSectionProps) {
  const { t } = useI18n();
  const summary = tabular ? formatModel2ClinicalSummary(tabular) : null;
  const headline = tabular ? formatModel2ClinicalHeadline(tabular, t) : t("results.model2Clinical.unavailable");
  const barRows = tabular
    ? model2ClinicalProbabilityRows(tabular).map((row) => ({
        ...row,
        label: t(LABEL_KEYS[row.key] ?? row.key, row.label),
      }))
    : [];

  return (
    <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("results.pdfSection.clinicalAssessment")}</h3>
      <div className="space-y-2 py-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-semibold",
                summary
                  ? summary.isHigh
                    ? "text-red-600"
                    : "text-green-600"
                  : "text-sm font-medium text-muted-foreground",
              )}
            >
              {headline}
            </p>
            <p className="text-xs text-muted-foreground">{t("results.poweredBy.model2")}</p>
          </div>
          <PipelineModelBadge
            modelNumber={2}
            live={Boolean(tabular)}
            provenanceSource={pipelineProvenanceSource(provenance, "model2")}
            className="px-2 py-0 text-xs"
          />
        </div>
        {barRows.length > 0 ? (
          <ProbabilityBarList title={t("results.model2Clinical.probabilitiesTitle")} rows={barRows} />
        ) : null}
      </div>
    </section>
  );
}
