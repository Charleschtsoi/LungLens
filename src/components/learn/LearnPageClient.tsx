"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FindingLabel } from "@/types";
import { useI18n } from "@/hooks/useI18n";
import { conditionName } from "@/lib/i18n";

export function LearnPageClient({ topic }: { topic: FindingLabel | null }) {
  const { t, locale } = useI18n();
  const topicName = topic ? conditionName(locale, topic) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {topicName ? `${t("learn.topicPrefix")} ${topicName}` : t("learn.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topicName ? `${t("learn.topicDesc")} (${topicName})` : t("learn.desc")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("learn.coming")}</CardTitle>
          <CardDescription>{t("learn.comingDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">{t("nav.home")}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload">{t("nav.upload")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

