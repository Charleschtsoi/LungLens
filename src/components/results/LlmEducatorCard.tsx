"use client";

import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pickLlmMarkdownForLocale } from "@/lib/llm-evaluation-display";
import type { LlmEvaluationResult } from "@/types";

type TranslateFn = (key: string, fallback?: string) => string;

type LlmEducatorCardProps = {
  llm: LlmEvaluationResult;
  locale: string;
  t: TranslateFn;
};

const PROSE_LLM =
  "prose prose-sm max-w-none dark:prose-invert [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_p]:leading-relaxed [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_strong]:font-semibold";

/** Prominent AI Clinical Educator block with markdown sections from Gemini. */
export function LlmEducatorCard({ llm, locale, t }: LlmEducatorCardProps) {
  const isSuccess = llm.status === "success";
  const markdown = pickLlmMarkdownForLocale(llm, locale).trim();

  return (
    <Card
      className={`mt-8 ${
        isSuccess
          ? "border-blue-200 bg-gradient-to-b from-blue-50/90 to-white shadow-md"
          : "border-border bg-muted/30"
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-blue-950">{t("results.llmEducatorTitle")}</CardTitle>
      </CardHeader>
      <CardContent className={isSuccess ? `text-blue-950 ${PROSE_LLM}` : "text-muted-foreground"}>
        {isSuccess && markdown ? (
          <ReactMarkdown>{markdown}</ReactMarkdown>
        ) : (
          <div className="space-y-3 text-sm not-prose">
            <p>{markdown || llm.text}</p>
            {llm.status === "failed" ? (
              <p className="text-xs text-muted-foreground">{t("results.llmFailedHint")}</p>
            ) : llm.status === "skipped" ? (
              <p className="text-xs text-muted-foreground">{t("results.llmSkippedHint")}</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
