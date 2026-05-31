"use client";

import { useI18n } from "@/hooks/useI18n";
import { normalizeToBadgeSource, provenanceBadgeClassName } from "@/lib/provenance-ui";
import { cn } from "@/lib/utils";

export function SectionSourceBadge({
  source,
  className,
}: {
  source: unknown;
  className?: string;
}) {
  const { t } = useI18n();
  const normalized = normalizeToBadgeSource(source);
  if (!normalized) return null;
  const label = t(`results.provenance.badge.${normalized}`, normalized);
  return (
    <span className={cn(provenanceBadgeClassName(normalized), className)}>{label}</span>
  );
}
