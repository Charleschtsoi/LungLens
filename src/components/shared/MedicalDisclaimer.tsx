"use client";

import { useI18n } from "@/hooks/useI18n";

export function MedicalDisclaimer({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p className={className}>
      <strong className="font-semibold text-foreground">{t("footer.important")}:</strong>{" "}
      {t("footer.permanent")}
    </p>
  );
}
