"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ClassProbabilitiesList } from "@/components/results/ClassProbabilitiesList";
import type { VisualPipelineModelSlot } from "@/lib/ensemble-architecture";
import { useAppMotion } from "@/lib/app-motion";
import {
  modelHeadlineClassName,
  sortVisualPipelineSlots,
  type ModelResultTone,
} from "@/lib/model-summary-display";
import { useI18n } from "@/hooks/useI18n";

export type VisualPipelineRowView = {
  summary: string;
  poweredByKey: string;
  /** When false, row is sorted to the bottom and summary uses muted styling. */
  available?: boolean;
  headlineTone?: ModelResultTone;
  probabilities?: Record<string, number> | null;
  trailing?: ReactNode;
  extra?: ReactNode;
};

type VisualXrayPipelineSectionProps = {
  rows: Record<VisualPipelineModelSlot, VisualPipelineRowView>;
  /** Model 6 (COPD tabular) — same row layout as vision models. */
  clinicalRow?: VisualPipelineRowView | null;
};

function PipelineModelRow({
  rowKey,
  row,
  showBorderBelow,
}: {
  rowKey: string;
  row: VisualPipelineRowView;
  showBorderBelow: boolean;
}) {
  const { t } = useI18n();
  const live = row.available !== false;
  const tone = row.headlineTone ?? (live ? "caution" : "muted");

  return (
    <div
      key={rowKey}
      className={`space-y-2 py-3 ${showBorderBelow ? "border-b border-border/60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={modelHeadlineClassName(tone, live)}>{row.summary}</p>
          <p className="text-xs text-muted-foreground">{t(row.poweredByKey)}</p>
        </div>
        {row.trailing}
      </div>
      {row.probabilities ? <ClassProbabilitiesList probabilities={row.probabilities} /> : null}
      {row.extra}
    </div>
  );
}

export function VisualXrayPipelineSection({ rows, clinicalRow }: VisualXrayPipelineSectionProps) {
  const { t } = useI18n();
  const { staggerContainer, staggerItem, scrollReveal, viewport } = useAppMotion();
  const orderedSlots = sortVisualPipelineSlots(rows);
  const hasClinical = Boolean(clinicalRow);

  return (
    <section className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
      <h3 className="text-sm font-semibold text-foreground">{t("results.pipelineAllModelsTitle")}</h3>
      <motion.div
        className="space-y-0"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {orderedSlots.map((slot, index) => (
          <motion.div key={slot} variants={staggerItem}>
            <PipelineModelRow
              rowKey={slot}
              row={rows[slot]}
              showBorderBelow={index < orderedSlots.length - 1 || hasClinical}
            />
          </motion.div>
        ))}
      </motion.div>
      {clinicalRow ? (
        <motion.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <PipelineModelRow rowKey="model6" row={clinicalRow} showBorderBelow={false} />
        </motion.div>
      ) : null}
    </section>
  );
}
