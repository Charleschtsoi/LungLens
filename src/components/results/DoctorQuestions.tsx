"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildDoctorQuestions } from "@/lib/doctor-questions";
import type { FindingLabel } from "@/types";

interface DoctorQuestionsProps {
  findings: { label: FindingLabel }[];
}

export function DoctorQuestions({ findings }: DoctorQuestionsProps) {
  const questions = buildDoctorQuestions(findings);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 2000);
    } catch {
      setCopiedIndex(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Questions to ask your doctor</CardTitle>
        <CardDescription>
          Suggested conversation starters based on this educational output—not medical instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-sky-100/80 bg-sky-50/20 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <p className="text-sm leading-relaxed text-foreground">{q}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => copy(q, i)}
            >
              {copiedIndex === i ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </>
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
