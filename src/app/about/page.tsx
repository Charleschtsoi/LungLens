"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/hooks/useI18n";

const CONTRIBUTORS = [
  {
    id: "charles",
    name: "Charles Tsoi",
    initials: "CT",
    roleKey: "about.member.charles.role",
    detailKey: "about.member.charles.detail",
    ringClass: "ring-sky-200/80",
    avatarClass: "bg-gradient-to-br from-sky-500 to-teal-600 text-white",
    cardClass: "border-sky-100/90 bg-gradient-to-br from-white to-sky-50/40",
  },
  {
    id: "casper",
    name: "Casper Lee",
    initials: "CL",
    roleKey: "about.member.casper.role",
    detailKey: "about.member.casper.detail",
    ringClass: "ring-violet-200/80",
    avatarClass: "bg-gradient-to-br from-violet-500 to-indigo-600 text-white",
    cardClass: "border-violet-100/90 bg-gradient-to-br from-white to-violet-50/40",
  },
  {
    id: "edward",
    name: "Edward Choi",
    initials: "EC",
    roleKey: "about.member.edward.role",
    detailKey: "about.member.edward.detail",
    ringClass: "ring-emerald-200/80",
    avatarClass: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    cardClass: "border-emerald-100/90 bg-gradient-to-br from-white to-emerald-50/40",
  },
  {
    id: "jina",
    name: "Jina Tse",
    initials: "JT",
    roleKey: "about.member.jina.role",
    detailKey: "about.member.jina.detail",
    ringClass: "ring-amber-200/80",
    avatarClass: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    cardClass: "border-amber-100/90 bg-gradient-to-br from-white to-amber-50/40",
  },
  {
    id: "dicky",
    name: "Dicky Ng",
    initials: "DN",
    roleKey: "about.member.dicky.role",
    detailKey: "about.member.dicky.detail",
    ringClass: "ring-slate-200/80",
    avatarClass: "bg-gradient-to-br from-slate-600 to-slate-800 text-white",
    cardClass: "border-slate-200/90 bg-gradient-to-br from-white to-slate-50/60",
  },
] as const;

export default function AboutPage() {
  const { t } = useI18n();
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
            <CardDescription>{t("about.storySub")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{t("about.story1")}</p>
            <p>{t("about.story2")}</p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5 rounded-2xl border border-border/60 bg-muted/20 p-6 md:p-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t("about.team")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{t("about.teamSub")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONTRIBUTORS.map((member) => (
            <Card
              key={member.id}
              className={`overflow-hidden shadow-sm transition-shadow hover:shadow-md ${member.cardClass}`}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-2 ${member.ringClass} ${member.avatarClass}`}
                  aria-hidden
                >
                  {member.initials}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <CardTitle className="text-lg leading-tight">{member.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="text-sm font-medium leading-snug text-foreground">{t(member.roleKey)}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(member.detailKey)}</p>
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
            <CardDescription>{t("about.contactSub")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="https://github.com/Charleschtsoi/LungLens" target="_blank" rel="noopener noreferrer">
                {t("about.github")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="mailto:charleschtsoi@gmail.com">{t("about.email")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://www.linkedin.com/in/charleschtsoi/" target="_blank" rel="noopener noreferrer">
                {t("about.linkedin")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

