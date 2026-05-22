"use client";

import { motion } from "framer-motion";
import { usePitchMotion } from "@/components/pitch/pitch-motion";
import { cn } from "@/lib/utils";

/** CSS-only Grad-CAM-style demo panel for pitch scrollytelling (educational, not live inference). */
export function GradCamDemoVisual({ className }: { className?: string }) {
  const { scrollReveal, viewport } = usePitchMotion();

  return (
    <motion.figure
      variants={scrollReveal}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className={cn("overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-950 shadow-lg", className)}
    >
      <div className="relative aspect-[4/3] w-full">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,#1e293b,#0f172a)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div
          className="absolute left-[18%] top-[22%] h-[38%] w-[28%] rounded-full bg-rose-500/35 blur-2xl"
          aria-hidden
        />
        <div
          className="absolute right-[20%] top-[28%] h-[32%] w-[26%] rounded-full bg-orange-400/30 blur-2xl"
          aria-hidden
        />
        <div
          className="absolute left-[42%] top-[48%] h-[22%] w-[20%] rounded-full bg-amber-400/25 blur-xl"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-slate-950/90 to-transparent px-4 pb-4 pt-16">
          <span className="text-xs font-medium uppercase tracking-wider text-sky-400/90">
            Grad-CAM overlay
          </span>
          <span className="text-[10px] text-slate-500">Educational demo</span>
        </div>
      </div>
      <figcaption className="border-t border-slate-800 bg-slate-900/80 px-4 py-3 text-center text-xs leading-relaxed text-slate-400">
        Illustrative attention heatmap — shows where a model may focus on lung fields, not a
        diagnosis. Discuss patterns with your clinician.
      </figcaption>
    </motion.figure>
  );
}
