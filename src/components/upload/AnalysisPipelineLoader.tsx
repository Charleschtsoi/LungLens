"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ANALYSIS_PIPELINE_MESSAGE_INTERVAL_MS,
  ANALYSIS_PIPELINE_MESSAGE_KEYS,
  ANALYSIS_PIPELINE_PROGRESS_CAP,
  ANALYSIS_PIPELINE_PROGRESS_DURATION_MS,
} from "@/lib/analysis-pipeline-loading";
import { useI18n } from "@/hooks/useI18n";

type AnalysisPipelineLoaderProps = {
  /** Show the full-screen-style loader (analysis in flight). */
  active: boolean;
  /** When true, snap progress to 100% (API succeeded). */
  complete?: boolean;
  className?: string;
};

/**
 * Multi-stage loading UI: simulated progress + rotating pipeline status messages.
 */
export function AnalysisPipelineLoader({
  active,
  complete = false,
  className,
}: AnalysisPipelineLoaderProps) {
  const { t } = useI18n();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setMessageIndex(0);
      setProgress(0);
      return;
    }

    setMessageIndex(0);
    setProgress(0);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % ANALYSIS_PIPELINE_MESSAGE_KEYS.length);
    }, ANALYSIS_PIPELINE_MESSAGE_INTERVAL_MS);

    const tickMs = 100;
    const step = (ANALYSIS_PIPELINE_PROGRESS_CAP / ANALYSIS_PIPELINE_PROGRESS_DURATION_MS) * tickMs;
    const progressTimer = window.setInterval(() => {
      setProgress((p) =>
        p >= ANALYSIS_PIPELINE_PROGRESS_CAP
          ? p
          : Math.min(ANALYSIS_PIPELINE_PROGRESS_CAP, p + step),
      );
    }, tickMs);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, [active]);

  useEffect(() => {
    if (complete && active) setProgress(100);
  }, [complete, active]);

  if (!active) return null;

  const messageKey = ANALYSIS_PIPELINE_MESSAGE_KEYS[messageIndex] ?? ANALYSIS_PIPELINE_MESSAGE_KEYS[0];

  return (
    <div
      className={
        className ??
        "flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-xl border border-sky-100 bg-gradient-to-b from-sky-50/80 to-white px-6 py-12 shadow-sm"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <div className="w-full max-w-md space-y-3">
        <Progress value={progress} className="h-2.5" aria-label={t("upload.pipeline.progressLabel")} />
        <p className="text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(progress)}%
        </p>
      </div>
      <p
        key={messageKey}
        className="max-w-lg animate-pulse text-center text-sm leading-relaxed text-muted-foreground transition-opacity"
      >
        {t(messageKey)}
      </p>
    </div>
  );
}
