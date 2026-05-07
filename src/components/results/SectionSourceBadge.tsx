"use client";

import { useI18n } from "@/hooks/useI18n";
import { normalizeToBadgeSource, provenanceBadgeClassName } from "@/lib/provenance-ui";
import { cn } from "@/lib/utils";

export function SectionSourceBadge({
  source,
  prominentMock,
  className,
}: {
  source: unknown;
  /** Extra emphasis when findings (or other critical sections) are mock. */
  prominentMock?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const normalized = normalizeToBadgeSource(source);
  if (!normalized) return null;
  const label = t(`results.provenance.badge.${normalized}`, normalized);
  const prominent = Boolean(prominentMock && normalized === "mock");
  return (
    <span className={cn(provenanceBadgeClassName(normalized, { prominent }), className)}>{label}</span>
  );
}
