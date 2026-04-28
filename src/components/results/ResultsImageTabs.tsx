"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ANATOMY_REGIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

interface ResultsImageTabsProps {
  previewUrl: string | null;
  heatmapBase64: string | null;
  fileLabel: string | null;
}

export function ResultsImageTabs({ previewUrl, heatmapBase64, fileLabel }: ResultsImageTabsProps) {
  const { t } = useI18n();
  const heatmapSrc = heatmapBase64 ? `data:image/png;base64,${heatmapBase64}` : null;

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
          {t("results.tab.anatomy")}
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
        <figure className="relative aspect-[4/3] max-h-[420px] w-full overflow-hidden rounded-xl border bg-slate-950/[0.03]">
          {previewUrl && heatmapSrc ? (
            <>
              <Image
                src={previewUrl}
                alt=""
                fill
                className="object-contain"
                unoptimized
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heatmapSrc}
                alt={t("alt.attentionOverlay")}
                className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-70 mix-blend-multiply"
              />
            </>
          ) : previewUrl && !heatmapSrc ? (
            <div className="relative h-full min-h-[220px] w-full">
              <Image src={previewUrl} alt={t("alt.xray")} fill className="object-contain" unoptimized />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
                <span className="rounded-md border border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-xs text-amber-950 shadow-sm backdrop-blur-sm">
                  {t("results.noAttention")}
                </span>
              </div>
            </div>
          ) : heatmapSrc ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heatmapSrc}
                alt={t("alt.attentionNoPreview")}
                className="max-h-[min(360px,70vh)] max-w-full object-contain"
              />
              <figcaption className="text-center text-xs text-muted-foreground">
                {t("results.noPreview")}
              </figcaption>
            </div>
          ) : (
            <figcaption className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {t("results.noAttentionReturned")}
            </figcaption>
          )}
        </figure>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("results.attentionNote")}
        </p>
      </TabsContent>

      <TabsContent value="anatomy" className="mt-4">
        <figure className="relative aspect-[4/3] max-h-[420px] w-full overflow-hidden rounded-xl border bg-slate-950/[0.03]">
          {previewUrl ? (
            <>
              <Image
                src={previewUrl}
                alt={t("alt.anatomyXray")}
                fill
                className="object-contain"
                unoptimized
              />
              {ANATOMY_REGIONS.map((r) => (
                <span
                  key={r.id}
                  className={cn(
                    "absolute max-w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-md border border-sky-200/90 bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-sky-900 shadow-sm backdrop-blur-sm sm:max-w-[120px] sm:px-2 sm:text-xs",
                  )}
                  style={{ top: r.top, left: r.left }}
                >
                  {t(`anatomy.${r.id}`, r.label)}
                </span>
              ))}
            </>
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
