"use client";

import { isDistinctDenseNetInputPreview } from "@/lib/densenet-normalize";
import { ProbabilityBarList } from "@/components/results/ProbabilityBarList";
import { useI18n } from "@/hooks/useI18n";
import type { DenseNetResponse } from "@/types";

const CLASS_ORDER = ["COVID-19", "Normal", "Pneumonia"] as const;

function labelKeyForClass(c: string): string {
  if (c === "Normal") return "densenet.label.normal";
  if (c === "COVID-19") return "densenet.label.covid";
  if (c === "Pneumonia") return "densenet.label.pneumonia";
  return c;
}

export function DenseNetPipelineBlock({
  loading,
  result,
  previewUrl,
  /** When true, only loading/error/gradcam preview — summary + bars live in the parent card. */
  compact = false,
}: {
  loading: boolean;
  result: DenseNetResponse | null;
  previewUrl: string | null;
  compact?: boolean;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
        {t("results.model3DenseNet.loading")}
      </div>
    );
  }

  if (!result || !result.success) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200/90">
        {t("results.model3DenseNet.unavailable")}
        {result?.success === false && result.error ? ` — ${result.error}` : ""}
      </p>
    );
  }

  const gradcamRaw = typeof result.gradcam === "string" ? result.gradcam.trim() : "";

  const rawInputPreview =
    typeof result.input_preview_base64 === "string" ? result.input_preview_base64.trim() : "";
  const useInputCrop =
    Boolean(rawInputPreview) && isDistinctDenseNetInputPreview(rawInputPreview, gradcamRaw);
  const inputPreviewSrc = useInputCrop
    ? rawInputPreview.startsWith("data:")
      ? rawInputPreview
      : `data:image/png;base64,${rawInputPreview}`
    : null;

  let previewSrc = inputPreviewSrc ?? (previewUrl ?? "");
  let captionKey = useInputCrop
    ? "densenet.caption.modelInputCrop"
    : "densenet.caption.fullUploadPreview";

  const gradcamSrc =
    gradcamRaw.length > 0
      ? gradcamRaw.startsWith("data:")
        ? gradcamRaw
        : `data:image/png;base64,${gradcamRaw}`
      : null;
  if (gradcamSrc && previewSrc && previewSrc === gradcamSrc) {
    previewSrc = previewUrl ?? "";
    captionKey = "densenet.caption.fullUploadPreview";
  }

  const probabilityRows = CLASS_ORDER.map((key) => {
    const p = result.probabilities[key] ?? 0;
    const pct = Math.min(100, Math.max(0, p * 100));
    return { key, label: t(labelKeyForClass(key)), pct };
  });

  return (
    <div className="space-y-3">
      {!compact ? (
        <>
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              {t(labelKeyForClass(result.prediction))}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("densenet.confidence")}:{" "}
              <span className="font-medium text-foreground">{result.confidence.toFixed(2)}%</span>
            </p>
          </div>
          <ProbabilityBarList title={t("results.classProbabilitiesTitle")} rows={probabilityRows} />
        </>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("densenet.gradcam.sectionTitle")}
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground/90">{t(captionKey)}</p>
        <div className="overflow-hidden rounded-md border border-border/50 bg-muted/20">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={t("densenet.alt.preview")}
              className="mx-auto aspect-square w-full max-w-[224px] object-contain"
            />
          ) : (
            <p className="p-4 text-center text-xs text-muted-foreground">{t("results.na")}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("results.model3DenseNet.disclaimer")}</p>
    </div>
  );
}
