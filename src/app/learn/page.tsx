import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatConditionName } from "@/lib/findings-utils";
import type { FindingLabel } from "@/types";
import { FINDING_LABELS } from "@/lib/constants";

function isFindingLabel(s: string): s is FindingLabel {
  return (FINDING_LABELS as readonly string[]).includes(s);
}

export default function LearnPage({
  searchParams,
}: {
  searchParams: { topic?: string };
}) {
  const raw = searchParams.topic;
  const topic = raw && isFindingLabel(raw) ? raw : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {topic ? `Learn: ${formatConditionName(topic)}` : "Learn about chest X-rays"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topic
            ? `Placeholder module for ${formatConditionName(topic)}. Rich articles and interactives will ship here.`
            : "Educational hub for anatomy, vocabulary, and how to read your report—without replacing your radiologist."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
          <CardDescription>
            Interactive diagrams, normal vs. example cases, and short quizzes will complement what you see on your
            results dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload">Upload</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
