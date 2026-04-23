"use client";

import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

/** On-home permanent disclaimer; site-wide legal footer remains in layout `Footer`. */
export function LandingFooterDisclaimer() {
  const { t } = useI18n();
  return (
    <aside
      className="mt-4 rounded-2xl border border-sky-100/90 bg-sky-50/40 px-5 py-6 sm:px-8"
      aria-labelledby="landing-disclaimer-heading"
    >
      <div className="flex gap-3">
        <ShieldAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-primary/80"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <h2 id="landing-disclaimer-heading" className="text-base font-semibold text-foreground">
            {t("landing.disclaimer.title")}
          </h2>
          <p>
            {t("landing.disclaimer.p1")}
          </p>
          <p>
            {t("landing.disclaimer.p2")}
          </p>
        </div>
      </div>
    </aside>
  );
}
