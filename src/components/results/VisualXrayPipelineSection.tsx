"use client";

import type { ReactNode } from "react";
import { ClassProbabilitiesList } from "@/components/results/ClassProbabilitiesList";
import { VISUAL_PIPELINE_MODEL_SLOTS, type VisualPipelineModelSlot } from "@/lib/ensemble-architecture";
import { useI18n } from "@/hooks/useI18n";

export type VisualPipelineRowView = {
  summary: string;
  poweredByKey: string;
  probabilities?: Record<string, number> | null;
  trailing?: ReactNode;
  extra?: ReactNode;
};

type VisualXrayPipelineSectionProps = {
  rows: Record<VisualPipelineModelSlot, VisualPipelineRowView>;
};

export function VisualXrayPipelineSection({ rows }: VisualXrayPipelineSectionProps) {
  const { t } = useI18n();

  return (
    <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("results.pdfSection.visualXray")}</h3>
      <div className="space-y-0">
        {VISUAL_PIPELINE_MODEL_SLOTS.map((slot, index) => {
          const row = rows[slot];
          const isLast = index === VISUAL_PIPELINE_MODEL_SLOTS.length - 1;
          return (
            <div
              key={slot}
              className={`space-y-2 py-3 ${isLast ? "" : "border-b border-border/60"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{row.summary}</p>
                  <p className="text-xs text-muted-foreground">{t(row.poweredByKey)}</p>
                </div>
                {row.trailing}
              </div>
              {row.probabilities ? (
                <ClassProbabilitiesList probabilities={row.probabilities} />
              ) : null}
              {row.extra}
            </div>
          );
        })}
      </div>
    </section>
  );
}
