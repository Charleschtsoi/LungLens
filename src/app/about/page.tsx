"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";

const TEAM = [
  { name: "Chung Him TSOI", role: "ML Model Development, Web Application" },
  { name: "Kai Chin NG", role: "ML Model Development" },
  { name: "Man Ho CHOI", role: "ML Model Development" },
  { name: "Yat Chun LEE", role: "ML Model Development" },
  { name: "Yuk Han TSE", role: "ML Model Development" },
] as const;

export default function AboutPage() {
  const { t, locale } = useI18n();
  return (
    <div className="space-y-8 pb-6">
      <section className="rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-teal-50/40 p-6 shadow-sm md:p-8">
        <Badge variant="secondary" className="bg-sky-100 text-sky-900">
          {t("about.badge")}
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("about.title")}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {t("about.subtitle")}
        </p>
      </section>

      <section>
        <Card className="border-sky-100/80">
          <CardHeader>
            <CardTitle className="text-xl">{t("about.storyTitle")}</CardTitle>
            <CardDescription>
              {t("about.storySub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{t("about.story1")}</p>
            <p>{t("about.story2")}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("about.team")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <Card key={member.name} className="border-sky-100/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {locale === "en"
                  ? member.role
                  : locale === "zh-Hans"
                    ? member.role
                        .replace("ML Model Development", "机器学习模型开发")
                        .replace("Web Application", "网页应用开发")
                  : member.role
                      .replace("ML Model Development", "機器學習模型開發")
                      .replace("Web Application", "網頁應用開發")}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-amber-200/80 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg">{t("about.disclaimerTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-950/90">
            <p>• {t("about.disclaimer1")}</p>
            <p>• {t("about.disclaimer2")}</p>
            <p>• {t("about.disclaimer3")}</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100/80">
          <CardHeader>
            <CardTitle className="text-lg">{t("about.stack")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• {t("about.stackModel")}</p>
            <p>• {t("about.stackFrontend")}</p>
            <p>• {t("about.stackDeploy")}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-sky-100/80">
          <CardHeader>
            <CardTitle className="text-lg">{t("about.contactTitle")}</CardTitle>
            <CardDescription>
              {t("about.contactSub")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="https://github.com/Charleschtsoi/LungLens" target="_blank" rel="noopener noreferrer">
                {t("about.github")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="mailto:your-email@example.com">
                {t("about.email")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                {t("about.linkedin")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
