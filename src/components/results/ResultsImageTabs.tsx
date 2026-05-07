"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ANATOMY_REGIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { SectionSourceBadge } from "@/components/results/SectionSourceBadge";
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
  anatomyGuideProvenance?: unknown;
}

export function ResultsImageTabs({
  analysis,
  denseNetDisplay,
  previewUrl,
  fileLabel,
  anatomyGuideProvenance,
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
    "relative flex min-h-[400px] w-full items-center justify-center rounded-lg bg-slate-50/50 p-4 md:p-6";

  const badgeClassName =
    "pointer-events-none absolute left-3 top-3 z-20 max-w-[min(100%,20rem)] rounded-md border border-slate-200/90 bg-white/95 px-2.5 py-1 text-left text-xs font-semibold leading-snug text-slate-900 shadow-sm backdrop-blur-sm sm:left-4 sm:top-4 sm:text-sm";

  const imgClassName = "object-contain max-h-[500px] mx-auto w-auto max-w-full";

  const hasM1 = Boolean(model1AttentionBase64);
  const hasM3 = Boolean(model3AttentionBase64);
  const hasGlobalDemoHeatmap = !hasM1 && !hasM3 && Boolean(globalHeatmapBase64);
  const globalHeatmapSrc = globalHeatmapBase64 ? attentionDataUrl(globalHeatmapBase64) : null;
  const hasAnyAttention = hasM1 || hasM3 || hasGlobalDemoHeatmap;

  return (
    <Tabs defaultValue="xray" className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3">
        <TabsTrigger value="xray" className="text-xs sm:text-sm">
          {t("results.tab.xray")}
        </TabsTrigger>
        <TabsTrigger value="attention" className="text-xs sm:text-sm">
          {t("results.tab.attention")}
        </TabsTrigger>
        <TabsTrigger value="anatomy" className="text-xs sm:text-sm">
          <span className="inline-flex flex-wrap items-center justify-center gap-1.5">
            {t("results.tab.anatomy")}
            <SectionSourceBadge source={anatomyGuideProvenance} />
          </span>
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

      <TabsContent value="attention" className="mt-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          This heatmap shows which areas of the lung the AI focused on the most when making its assessment.
        </p>
        {!hasAnyAttention ? (
          <figure className="m-0">
            <div
              className={cn(
                attentionFrameClass,
                "min-h-[280px] text-center text-sm text-muted-foreground",
              )}
            >
              {previewUrl ? (
                <>
                  <div className="relative z-0 mx-auto max-h-[500px] w-full max-w-4xl">
                    <Image
                      src={previewUrl}
                      width={1200}
                      height={900}
                      alt={t("alt.xray")}
                      className="mx-auto block max-h-[500px] w-auto max-w-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
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
        ) : hasGlobalDemoHeatmap && globalHeatmapSrc ? (
          <div className="grid w-full grid-cols-1 justify-items-center">
            <div className={cn(attentionFrameClass, "max-w-3xl")}>
              <span className={badgeClassName} aria-hidden>
                {t("results.attention.overlayBadgeGlobalDemo")}
              </span>
              {previewUrl ? (
                <div className="relative z-0 mx-auto max-h-[500px] w-full max-w-4xl">
                  <div className="relative mx-auto w-fit max-w-full">
                    <Image
                      src={previewUrl}
                      width={1200}
                      height={900}
                      alt=""
                      className="relative z-0 block max-h-[500px] w-auto max-w-full object-contain"
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
              "grid w-full grid-cols-1 gap-6",
              hasM1 && hasM3 ? "md:grid-cols-2" : "justify-items-center",
            )}
          >
            {hasM1 ? (
              <div className={cn(attentionFrameClass, !hasM3 && "max-w-3xl")}>
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
              <div className={cn(attentionFrameClass, !hasM1 && "max-w-3xl")}>
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
        )}
      </TabsContent>

      <TabsContent value="anatomy" className="mt-4">
        <figure className="relative flex aspect-[4/3] max-h-[420px] w-full items-center justify-center overflow-hidden rounded-xl border bg-slate-950/[0.03]">
          {previewUrl ? (
            <div className="relative h-full max-h-[420px] w-full max-w-[min(100%,420px)]">
              <Image
                src={previewUrl}
                alt={t("alt.anatomyXray")}
                fill
                className="object-contain"
                unoptimized
              />
              {ANATOMY_REGIONS.map((r) => (
                <div key={r.id} className="pointer-events-none absolute" style={{ top: r.top, left: r.left }}>
                  <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-sky-500 shadow-[0_0_0_2px_rgba(14,165,233,0.35)]" />
                  <span
                    className={cn(
                      "absolute top-1/2 h-px w-7 bg-sky-200/90",
                      r.labelSide === "left" ? "right-1/2 origin-right" : "left-1/2 origin-left",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute top-1/2 max-w-[110px] -translate-y-1/2 whitespace-nowrap rounded-md border border-sky-200/90 bg-white/92 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-sky-950 shadow-sm backdrop-blur-sm sm:px-2 sm:text-xs",
                      r.labelSide === "left"
                        ? "right-[calc(50%+1.9rem)]"
                        : "left-[calc(50%+1.9rem)]",
                    )}
                  >
                    {t(`anatomy.${r.id}`, r.label)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative flex h-full min-h-[260px] w-full items-center justify-center bg-gradient-to-b from-sky-50/50 to-muted/40 p-6">
              <div className="absolute inset-8 rounded-lg border-2 border-dashed border-sky-200/80 bg-white/50" aria-hidden />
              {ANATOMY_REGIONS.map((r) => (
                <span
                  key={r.id}
                  className="absolute max-w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-md border border-emerald-200/90 bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 shadow sm:max-w-[120px] sm:px-2 sm:text-xs"
                  style={{ top: r.top, left: r.left }}
                >
                  {t(`anatomy.${r.id}`, r.label)}
                </span>
              ))}
              <figcaption className="relative z-10 mt-auto max-w-sm text-center text-xs text-muted-foreground">
                {fileLabel
                  ? `${t("results.anatomyPlaceholder")} (${fileLabel})`
                  : t("results.anatomyPlaceholder")}
              </figcaption>
            </div>
          )}
        </figure>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground sm:text-sm">
          {ANATOMY_REGIONS.map((r) => (
            <li key={r.id}>
              <span className="font-medium text-foreground">{t(`anatomy.${r.id}`, r.label)}:</span>{" "}
              {t(`anatomy.desc.${r.id}`, r.description)}
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
