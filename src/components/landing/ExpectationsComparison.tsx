"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export function ExpectationsComparison() {
  const { t } = useI18n();
  const doesItems = [1, 2, 3, 4].map((i) => t(`landing.expect.does.${i}`));
  const doesNotItems = [1, 2, 3, 4].map((i) => t(`landing.expect.not.${i}`));
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t("landing.expect.title")}
        </h2>
        <p className="mt-3 text-muted-foreground">
          {t("landing.expect.subtitle")}
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
        <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-b from-emerald-50/40 to-white p-6 shadow-sm sm:p-8">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            {t("landing.expect.does")}
          </h3>
          <ul className="mt-5 space-y-3">
            {doesItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600/90"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-sm sm:p-8">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/80 text-slate-700">
              <XCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            {t("landing.expect.not")}
          </h3>
          <ul className="mt-5 space-y-3">
            {doesNotItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <XCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/90"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
