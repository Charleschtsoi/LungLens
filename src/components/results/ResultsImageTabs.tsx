"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttentionMapEducationPanel } from "@/components/results/AttentionMapEducationPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import type { AnalyzeSuccessResponse, DenseNetResponse } from "@/types";

function heatmapBase64ForDisplay(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "";
  const t = raw.trim();
  const m = /^data:image\/\w+;base64,(.+)$/i.exec(t);
  return m && m[1] ? m[1] : t;
}

function attentionDataUrl(rawBase64: string): string {
  const t = rawBase64.trim();
  if (t.startsWith("data:")) return t;
  return `data:image/png;base64,${t}`;
}

function resolveModel3GradcamRaw(
  analysis: AnalyzeSuccessResponse,
  denseNetDisplay: DenseNetResponse | null,
): string | null {
  if (denseNetDisplay?.success) {
    const g = typeof denseNetDisplay.gradcam === "string" ? denseNetDisplay.gradcam.trim() : "";
    if (g) return g;
  }
  const fromAnalyze =
    typeof analysis.model3?.gradcam === "string" ? analysis.model3.gradcam.trim() : "";
  return fromAnalyze.length > 0 ? fromAnalyze : null;
}

interface ResultsImageTabsProps {
  analysis: AnalyzeSuccessResponse;
  /** Merged DenseNet UI payload (analyze `model3` + supplemental `/predict/densenet`); used for `gradcam` when present. */
  denseNetDisplay: DenseNetResponse | null;
  previewUrl: string | null;
  fileLabel: string | null;
}

export function ResultsImageTabs({
  analysis,
  denseNetDisplay,
  previewUrl,
  fileLabel,
}: ResultsImageTabsProps) {
  const { t } = useI18n();

  const model1GradcamRaw =
    typeof analysis.model1?.gradcam === "string" ? analysis.model1.gradcam.trim() : "";
  const model1AttentionBase64 = model1GradcamRaw
    ? heatmapBase64ForDisplay(model1GradcamRaw)
    : "";

  const model3GradcamRaw = resolveModel3GradcamRaw(analysis, denseNetDisplay);
  const model3AttentionBase64 = model3GradcamRaw
    ? heatmapBase64ForDisplay(model3GradcamRaw)
    : "";

  const globalHeatmapBase64 = heatmapBase64ForDisplay(analysis.gradcam?.heatmap_base64);

  const attentionFrameClass =
    "relative flex min-h-[440px] w-full items-center justify-center rounded-lg bg-slate-50/50 p-6 md:min-h-[480px] md:p-8";

  const badgeClassName =
    "pointer-events-none absolute left-4 top-4 z-20 max-w-[min(100%,20rem)] rounded-md border border-slate-200/90 bg-white/95 px-2.5 py-1 text-left text-xs font-semibold leading-snug text-slate-900 shadow-sm backdrop-blur-sm sm:text-sm";

  const imgClassName = "object-contain max-h-[560px] mx-auto w-auto max-w-full";

  const hasM1 = Boolean(model1AttentionBase64);
  const hasM3 = Boolean(model3AttentionBase64);
  const hasFallbackHeatmap = !hasM1 && !hasM3 && Boolean(globalHeatmapBase64);
  const globalHeatmapSrc = globalHeatmapBase64 ? attentionDataUrl(globalHeatmapBase64) : null;
  const hasAnyAttention = hasM1 || hasM3 || hasFallbackHeatmap;
  const showSoloModelCamNote = hasM1 && !hasM3 && hasAnyAttention;

  const attentionBody = !hasAnyAttention ? (
    <figure className="m-0">
      <div
        className={cn(
          attentionFrameClass,
          "min-h-[320px] text-center text-sm text-muted-foreground",
        )}
      >
        {previewUrl ? (
          <>
            <div className="relative z-0 mx-auto max-h-[560px] w-full max-w-4xl">
              <Image
                src={previewUrl}
                width={1200}
                height={900}
                alt={t("alt.xray")}
                className="mx-auto block max-h-[560px] w-auto max-w-full object-contain"
                unoptimized
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
              <span className="rounded-md border border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-xs text-amber-950 shadow-sm backdrop-blur-sm">
                {t("results.noAttention")}
              </span>
            </div>
          </>
        ) : (
          t("results.noAttentionReturned")
        )}
      </div>
    </figure>
  ) : hasFallbackHeatmap && globalHeatmapSrc ? (
    <div className="grid w-full grid-cols-1 justify-items-center">
      <div className={cn(attentionFrameClass, "max-w-4xl")}>
        <span className={badgeClassName} aria-hidden>
          {t("results.attention.overlayBadgeGlobal")}
        </span>
        {previewUrl ? (
          <div className="relative z-0 mx-auto max-h-[560px] w-full max-w-4xl">
            <div className="relative mx-auto w-fit max-w-full">
              <Image
                src={previewUrl}
                width={1200}
                height={900}
                alt=""
                className="relative z-0 block max-h-[560px] w-auto max-w-full object-contain"
                unoptimized
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={globalHeatmapSrc}
                alt={t("alt.attentionOverlay")}
                className="pointer-events-none absolute inset-0 z-[1] object-contain opacity-70 mix-blend-multiply"
              />
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={globalHeatmapSrc}
              alt={t("alt.attentionNoPreview")}
              className={imgClassName}
            />
            <p className="text-center text-xs text-muted-foreground">{t("results.noPreview")}</p>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-8",
        hasM1 && hasM3 ? "md:grid-cols-2" : "justify-items-center",
      )}
    >
      {hasM1 ? (
        <div className={cn(attentionFrameClass, !hasM3 && "max-w-4xl")}>
          <span className={badgeClassName} aria-hidden>
            {t("results.attention.overlayBadge")}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attentionDataUrl(model1AttentionBase64)}
            alt={t("alt.attentionOverlay")}
            className={imgClassName}
          />
        </div>
      ) : null}
      {hasM3 ? (
        <div className={cn(attentionFrameClass, !hasM1 && "max-w-4xl")}>
          <span className={badgeClassName} aria-hidden>
            {t("results.attention.overlayBadgeModel3")}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attentionDataUrl(model3AttentionBase64)}
            alt={t("densenet.alt.gradcam")}
            className={imgClassName}
          />
        </div>
      ) : null}
    </div>
  );

  return (
    <Tabs defaultValue="xray" className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-2">
        <TabsTrigger value="xray" className="text-xs sm:text-sm">
          {t("results.tab.xray")}
        </TabsTrigger>
        <TabsTrigger value="attention" className="text-xs sm:text-sm">
          {t("results.tab.attention")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="xray" className="mt-4">
        <figure className="relative aspect-[4/3] max-h-[420px] w-full overflow-hidden rounded-xl border bg-slate-950/[0.03]">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={t("alt.uploadedXray")}
              fill
              className="object-contain"
              unoptimized
              priority
            />
          ) : (
            <figcaption className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {fileLabel
                ? `${t("results.noPreview")} (${fileLabel})`
                : t("results.noPreview")}
            </figcaption>
          )}
        </figure>
      </TabsContent>

      <TabsContent value="attention" className="mt-4">
        <Card className="overflow-hidden border-blue-100 bg-blue-50/50 shadow-sm">
          <CardHeader className="space-y-1 border-b border-blue-100/80 bg-blue-50/80 px-6 py-4">
            <CardTitle className="text-lg font-semibold text-blue-950">
              {t("results.attention.cardTitle")}
            </CardTitle>
            <CardDescription className="text-blue-900/70">
              {t("results.attention.cardDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
            {attentionBody}
            {hasAnyAttention ? (
              <AttentionMapEducationPanel showSoloModelCamNote={showSoloModelCamNote} />
            ) : null}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
