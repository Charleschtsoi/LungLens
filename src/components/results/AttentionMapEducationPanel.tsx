"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/hooks/useI18n";

type AttentionMapEducationPanelProps = {
  /** Show ResNet-only / single-model crop note when Model 1 heatmap is shown without Model 3. */
  showSoloModelCamNote?: boolean;
};

export function AttentionMapEducationPanel({ showSoloModelCamNote }: AttentionMapEducationPanelProps) {
  const { t } = useI18n();

  return (
    <Accordion type="single" collapsible className="mt-6 w-full border-t border-blue-100/80 pt-4">
      <AccordionItem value="attention-edu" className="border-none">
        <AccordionTrigger className="py-2 text-sm font-medium text-blue-950 hover:no-underline [&[data-state=open]]:text-blue-900">
          {t("results.attention.edu.title")}
        </AccordionTrigger>
        <AccordionContent className="rounded-lg bg-blue-50/30 px-1 pb-2 pt-1">
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>{t("results.attention.edu.intro")}</p>
            <div>
              <p className="font-medium text-blue-950">{t("results.attention.edu.colorsTitle")}</p>
              <p className="mt-1">{t("results.attention.edu.colorsBody")}</p>
            </div>
            <div>
              <p className="font-medium text-blue-950">{t("results.attention.edu.purposeTitle")}</p>
              <p className="mt-1">{t("results.attention.edu.purposeBody")}</p>
            </div>
            {showSoloModelCamNote ? (
              <p className="text-xs text-blue-900/80">{t("results.attention.edu.soloModelCamNote")}</p>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
