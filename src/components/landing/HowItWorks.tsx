"use client";

import { Stethoscope, Upload, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

export function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    {
      step: 1,
      title: t("landing.how.step1.title"),
      body: t("landing.how.step1.body"),
      icon: Stethoscope,
    },
    {
      step: 2,
      title: t("landing.how.step2.title"),
      body: t("landing.how.step2.body"),
      icon: Upload,
    },
    {
      step: 3,
      title: t("landing.how.step3.title"),
      body: t("landing.how.step3.body"),
      icon: MessageCircle,
    },
  ] as const;
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{t("landing.how.title")}</h2>
        <p className="mt-3 text-muted-foreground">
          {t("landing.how.subtitle")}
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map((s) => (
          <li key={s.step}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
                "border-sky-100/90",
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-primary">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700/80">
                  {t("landing.how.step")} {s.step}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-foreground">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
