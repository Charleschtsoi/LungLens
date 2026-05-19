"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FindingLabel } from "@/types";
import { useI18n } from "@/hooks/useI18n";
import { conditionName } from "@/lib/i18n";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";

interface LearnMoreCardsProps {
  findings: { label: FindingLabel; sectionKey: string }[];
  anatomyGuideProvenance?: unknown;
}

export function LearnMoreCards({ findings, anatomyGuideProvenance }: LearnMoreCardsProps) {
  const { t, locale } = useI18n();
  return (
    <section className="space-y-4" aria-labelledby="learn-more-heading">
      <h2
        id="learn-more-heading"
        className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight"
      >
        <span>{t("results.learnMore")}</span>
        <SectionSourceBadge source={anatomyGuideProvenance} />
      </h2>
      <p className="text-sm text-muted-foreground">
        {t("results.learnMoreSub")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {findings.length === 0 ? (
          <Link href="/learn" className="group block">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                  <BookOpen className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base leading-snug">{t("results.basics")}</CardTitle>
                  <CardDescription className="mt-1">
                    {t("results.basicsSub")}
                  </CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardHeader>
            </Card>
          </Link>
        ) : (
          findings.map(({ label, sectionKey }) => (
            <Link key={sectionKey} href={`/learn?topic=${encodeURIComponent(label)}`} className="group block">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                    <BookOpen className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base leading-snug">{conditionName(locale, label)}</CardTitle>
                    <CardDescription className="mt-1">
                      {t("results.topicSub")}
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
