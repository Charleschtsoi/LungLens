"use client";

import { motion } from "framer-motion";
import { usePitchMotion } from "@/components/pitch/pitch-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
/** CSS-only Grad-CAM-style demo panel for pitch scrollytelling (educational, not live inference). */
export function GradCamDemoVisual({ className }: { className?: string }) {
  const { scrollReveal, viewport } = usePitchMotion();

  return (
    <motion.div
      variants={scrollReveal}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className={className}
    >
      <Card className="overflow-hidden border-blue-100 bg-blue-50/50 shadow-sm">
        <CardHeader className="space-y-1 border-b border-blue-100/80 bg-blue-50/80 px-6 py-4">
          <CardTitle className="text-lg font-semibold text-blue-950">X-Ray Heatmap Analysis</CardTitle>
          <CardDescription className="text-blue-900/70">
            DenseNet-121 Grad-CAM overlay — educational demonstration, not a diagnosis.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative min-h-[300px] w-full aspect-[4/3] sm:min-h-[340px] md:min-h-[400px] md:aspect-[16/11]">
            <div
              className="absolute inset-4 overflow-hidden rounded-xl bg-slate-950 shadow-inner md:inset-6"
              aria-hidden
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,#1e293b,#0f172a)]" />
              <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="absolute left-[18%] top-[22%] h-[38%] w-[28%] rounded-full bg-rose-500/35 blur-2xl" />
              <div className="absolute right-[20%] top-[28%] h-[32%] w-[26%] rounded-full bg-orange-400/30 blur-2xl" />
              <div className="absolute left-[42%] top-[48%] h-[22%] w-[20%] rounded-full bg-amber-400/25 blur-xl" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/90 to-transparent px-5 pb-5 pt-20">
                <span className="text-xs font-medium uppercase tracking-wider text-sky-400/90">
                  Grad-CAM overlay
                </span>
                <span className="text-[10px] text-slate-500">Educational demo</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-blue-100/80 bg-white/60 px-6 py-4 text-center text-xs leading-relaxed text-muted-foreground">
          Illustrative attention heatmap — shows where a model may focus on lung fields, not a
          diagnosis. Discuss patterns with your clinician.
        </CardFooter>
      </Card>
    </motion.div>
  );
}
