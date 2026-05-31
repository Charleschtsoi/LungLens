"use client";

import { Badge } from "@/components/ui/badge";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";
import { normalizeToBadgeSource } from "@/lib/provenance-ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

const LIVE_MODEL_BADGE_CLASS =
  "border-emerald-200/80 bg-emerald-50 px-2 py-0 text-xs font-medium text-emerald-800";

export type PipelineModelNumber = 1 | 2 | 3 | 4 | 5 | 6;

type PipelineModelBadgeProps = {
  modelNumber: PipelineModelNumber;
  /** Model ran successfully (vision classifier or tabular Model 2). */
  live?: boolean;
  /** When not live, show rule/LLM/static badge from provenance if present. */
  provenanceSource?: unknown;
  className?: string;
};

/**
 * Uniform status pill for Models 1–5 in the pipeline card.
 * Live runs always show "Model N ✓"; non-live runs fall back to provenance badges.
 */
export function PipelineModelBadge({
  modelNumber,
  live = false,
  provenanceSource,
  className,
}: PipelineModelBadgeProps) {
  const { t } = useI18n();

  if (live) {
    return (
      <Badge variant="outline" className={cn(LIVE_MODEL_BADGE_CLASS, className)}>
        {t(`results.modelBadge.model${modelNumber}`)}
      </Badge>
    );
  }

  const normalized = normalizeToBadgeSource(provenanceSource);
  if (normalized && normalized !== "model") {
    return <SectionSourceBadge source={provenanceSource} className={className} />;
  }

  return null;
}
