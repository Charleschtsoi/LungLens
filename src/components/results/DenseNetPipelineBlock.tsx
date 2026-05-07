"use client";

import { cn } from "@/lib/utils";
import { isDistinctDenseNetInputPreview } from "@/lib/densenet-normalize";
import { useI18n } from "@/hooks/useI18n";
import type { DenseNetResponse } from "@/types";

const CLASS_ORDER = ["Normal", "Pneumonia-Bacteria", "Pneumonia-Virus"] as const;

function labelKeyForClass(c: string): string {
  if (c === "Normal") return "densenet.label.normal";
  if (c === "Pneumonia-Bacteria") return "stage.Pneumonia-Bacteria";
  if (c === "Pneumonia-Virus") return "stage.Pneumonia-Virus";
  return c;
}

function predictionTextClass(prediction: string): string {
  if (prediction === "Normal") return "text-emerald-600";
  if (prediction === "Pneumonia-Bacteria") return "text-amber-600";
  if (prediction === "Pneumonia-Virus") return "text-red-600";
  return "text-foreground";
}

function barToneClass(className: string): string {
  if (className === "Normal") return "bg-emerald-500/90";
  if (className === "Pneumonia-Bacteria") return "bg-amber-500/85";
  return "bg-red-500/85";
}

export function DenseNetPipelineBlock({
  loading,
  result,
  previewUrl,
}: {
  loading: boolean;
  result: DenseNetResponse | null;
  previewUrl: string | null;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
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

  /** 224×224 crop or full upload — never `model3.gradcam` (attention maps live in ResultsImageTabs). */
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

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p
          className={cn(
            "text-lg font-semibold tracking-tight md:text-xl",
            predictionTextClass(result.prediction),
          )}
        >
          {t(labelKeyForClass(result.prediction))}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("densenet.confidence")}:{" "}
          <span className="font-medium text-foreground">{result.confidence.toFixed(2)}%</span>
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("densenet.probabilities")}
        </p>
        <ul className="space-y-2">
          {CLASS_ORDER.map((key) => {
            const p = result.probabilities[key] ?? 0;
            const pct = Math.min(100, Math.max(0, p * 100));
            return (
              <li key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{t(labelKeyForClass(key))}</span>
                  <span className="tabular-nums text-muted-foreground">{pct.toFixed(2)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", barToneClass(key))}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("densenet.gradcam.sectionTitle")}
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground/90">{t(captionKey)}</p>
        <div className="overflow-hidden rounded-lg border bg-muted/20">
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
