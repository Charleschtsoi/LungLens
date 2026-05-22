"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pickLlmMarkdownForLocale } from "@/lib/llm-evaluation-display";
import type { LlmEvaluationResult } from "@/types";

type TranslateFn = (key: string, fallback?: string) => string;

type LlmEducatorCardProps = {
  llm: LlmEvaluationResult;
  locale: string;
  t: TranslateFn;
};

const PROSE_LLM = cn(
  "prose prose-sm max-w-none",
  "[&>*:first-child]:mt-0",
  "[&_h2]:mt-4 [&_h2]:border-none [&_h2]:pb-0 [&_h2]:text-base [&_h2]:font-semibold",
  "[&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold",
  "[&_p]:leading-relaxed",
  "[&_ul]:my-2 [&_ol]:my-2",
  "[&_li]:my-0.5",
  "[&_strong]:font-semibold",
);

/** AI Advisor card: synthesized educational markdown from Gemini (not a diagnosis). */
export function LlmEducatorCard({ llm, locale, t }: LlmEducatorCardProps) {
  const isSuccess = llm.status === "success";
  const markdown = pickLlmMarkdownForLocale(llm, locale).trim();

  return (
    <Card
      className={cn(
        "mt-8 overflow-hidden",
        isSuccess
          ? "border-blue-100 bg-blue-50/50 shadow-sm"
          : "border-border bg-muted/50",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 border-b border-blue-100/80 bg-blue-50/80 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              isSuccess ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground",
            )}
            aria-hidden
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <CardTitle
            className={cn(
              "text-lg font-semibold leading-tight",
              isSuccess ? "text-blue-950" : "text-foreground",
            )}
          >
            {t("results.llmAdvisorTitle")}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="shrink-0 bg-white/80 text-xs font-medium">
          {t("results.llmAiGeneratedBadge")}
        </Badge>
      </CardHeader>
      <CardContent
        className={cn(
          "px-6 pb-6 pt-4",
          isSuccess ? cn("text-blue-950", PROSE_LLM, "[&_h2]:text-blue-900 [&_h3]:text-blue-900") : "text-muted-foreground",
        )}
      >
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
