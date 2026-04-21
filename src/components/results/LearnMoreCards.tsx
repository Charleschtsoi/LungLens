import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatConditionName } from "@/lib/findings-utils";
import type { FindingLabel } from "@/types";

interface LearnMoreCardsProps {
  findings: { label: FindingLabel }[];
}

export function LearnMoreCards({ findings }: LearnMoreCardsProps) {
  return (
    <section className="space-y-4" aria-labelledby="learn-more-heading">
      <h2 id="learn-more-heading" className="text-lg font-semibold tracking-tight">
        Learn more
      </h2>
      <p className="text-sm text-muted-foreground">
        Short guides on the Learn hub—use them to prepare for conversations with your clinician.
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
                  <CardTitle className="text-base leading-snug">Chest X-ray basics</CardTitle>
                  <CardDescription className="mt-1">
                    Anatomy, common terms, and how to read your report at a high level
                  </CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </CardHeader>
            </Card>
          </Link>
        ) : (
          findings.map(({ label }) => (
            <Link key={label} href={`/learn?topic=${encodeURIComponent(label)}`} className="group block">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-800">
                    <BookOpen className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base leading-snug">{formatConditionName(label)}</CardTitle>
                    <CardDescription className="mt-1">
                      Vocabulary, typical context, and questions for your visit
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
