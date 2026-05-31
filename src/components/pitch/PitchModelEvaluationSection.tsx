"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ClipboardList, LayoutDashboard, Sparkles } from "lucide-react";
import { usePitchMotion } from "@/components/pitch/pitch-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SECTION = "px-6 py-24 md:py-32";
const H2 = "mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl";

/** Product UI screenshots in /public (interface captures, not holdout plots). */
const PRODUCT_ASSETS = {
  resultsDashboard: "/result-page-ui.jpeg",
  clinicalQuestionnaire: "/clinical-questionnaire-ui.png",
  aiClinicalAdvisor: "/ai-clinical-advisor-ui.png",
} as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">{children}</p>
  );
}

type ProductScreenshotCardProps = {
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
};

function ProductScreenshotCard({
  title,
  src,
  alt,
  width,
  height,
  caption,
}: ProductScreenshotCardProps) {
  return (
    <Card className="h-full overflow-hidden border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center justify-center rounded-lg border border-slate-100 bg-muted/20 p-3 md:p-4">
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-auto w-full max-h-[480px] object-contain"
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  );
}

export function PitchModelEvaluationSection() {
  const { scrollReveal, staggerContainer, staggerItem, viewport } = usePitchMotion();

  return (
    <section id="evaluation" className={cn("scroll-mt-20 bg-white", SECTION)}>
      <div className="mx-auto max-w-6xl">
        <motion.div variants={scrollReveal} initial="hidden" whileInView="show" viewport={viewport}>
          <SectionLabel>Product experience</SectionLabel>
          <h2 className={H2}>From ensemble inference to patient-ready education</h2>
          <p className="mt-6 max-w-2xl text-muted-foreground md:text-lg">
            LungLens turns parallel model outputs into a structured results dashboard, optional
            clinical intake when the gate requires it, and a plain-language educator summary — all
            framed for discussion with clinicians, not as a diagnosis.
          </p>
        </motion.div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <motion.div variants={staggerItem}>
            <ProductScreenshotCard
              title="Results dashboard: vision ensemble + report"
              src={PRODUCT_ASSETS.resultsDashboard}
              alt="LungLens results page showing uploaded chest X-ray, pipeline model summary with pneumonia viral pattern probability, and timing report"
              width={1400}
              height={1000}
              caption="After upload, users review the original film alongside Model 1 (ResNet-50) probabilities, fused findings such as lung opacity, and a rule-based report summary that can incorporate questionnaire-driven COPD screening — with a separate tab for AI attention maps (Grad-CAM)."
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <ProductScreenshotCard
              title="Gate-driven clinical questionnaire"
              src={PRODUCT_ASSETS.clinicalQuestionnaire}
              alt="Clinical questionnaire form with age, cough duration, fever, smoking, breathing difficulty, and optional Gemini API key"
              width={1400}
              height={1000}
              caption="When imaging findings trigger the clinical path, a short intake (age, cough duration, fever, smoking, breathing difficulty) feeds the tabular COPD risk model. An optional BYOK Gemini key is validated on submit and never stored on LungLens servers."
            />
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12"
          variants={scrollReveal}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <Card className="overflow-hidden border-blue-100 bg-blue-50/50 shadow-md">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-blue-100/80 bg-blue-50/80 px-6 py-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
                aria-hidden
              >
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-blue-950">
                  AI Clinical Advisor (educator layer)
                </CardTitle>
                <p className="mt-1 text-sm text-blue-900/70">
                  Synthesized from ensemble scores and questionnaire context — educational only.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:items-start">
                <div className="lg:col-span-3">
                  <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                    <Image
                      src={PRODUCT_ASSETS.aiClinicalAdvisor}
                      alt="AI Clinical Advisor card explaining lung opacity in plain language with AI Generated badge"
                      width={1600}
                      height={900}
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="h-auto w-full max-h-[520px] object-contain"
                    />
                  </div>
                </div>
                <div className="space-y-3 lg:col-span-2">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    Interpretability in the narrative
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    The educator ties radiographic patterns such as{" "}
                    <span className="font-medium text-foreground">lung opacity</span> to the
                    patient&apos;s stated symptoms (for example, cough duration and smoking history)
                    so families can prepare questions for appointments. It does not replace
                    radiologist interpretation or clinical judgment.
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Use the <span className="font-medium text-foreground">AI Attention Maps</span> tab
                    on the results screen to visually verify that convolutional models attend to lung
                    fields rather than labels, tubes, or hardware — the same transparency goal as
                    Grad-CAM in the research pipeline.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mt-10 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-5 py-4 text-sm text-muted-foreground"
          variants={scrollReveal}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
          <p>
            Screenshots reflect a representative educational run (e.g. Pneumonia-Virus pattern with
            optional COPD screening). Outcomes vary by image quality, gate routing, and whether a
            Gemini key is supplied.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
