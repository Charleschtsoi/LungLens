"use client";

import { useI18n } from "@/hooks/useI18n";
import { normalizeToBadgeSource, provenanceBadgeClassName } from "@/lib/provenance-ui";

export function SectionSourceBadge({
  source,
  prominentMock,
}: {
  source: unknown;
  /** Extra emphasis when findings (or other critical sections) are mock. */
  prominentMock?: boolean;
}) {
  const { t } = useI18n();
  const normalized = normalizeToBadgeSource(source);
  if (!normalized) return null;
  const label = t(`results.provenance.badge.${normalized}`, normalized);
  const prominent = Boolean(prominentMock && normalized === "mock");
  return (
    <span className={provenanceBadgeClassName(normalized, { prominent })}>{label}</span>
  );
}
