"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BookX,
  Brain,
  Clock,
  Cpu,
  Eye,
  GitBranch,
  Layers,
  LineChart,
  Server,
  Sparkles,
  Table2,
} from "lucide-react";
import { GradCamDemoVisual } from "@/components/pitch/GradCamDemoVisual";
import { usePitchMotion } from "@/components/pitch/pitch-motion";
import { FreshUploadLink } from "@/components/upload/FreshUploadLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const SECTION = "px-6 py-24 md:py-32";
const H2 = "mt-3 max-w-3xl text-3xl font-bold tracking-tight md:text-5xl";

const VISION_MODELS = [
  { n: 1, name: "ResNet-50", focus: "Baseline convolutional detector for multi-label thoracic patterns." },
  { n: 2, name: "ResNet-152V2", focus: "Deep residual backbone with strong validation accuracy on holdout CXR." },
  { n: 3, name: "DenseNet-121", focus: "Dense connectivity + Grad-CAM interpretability for educational overlays." },
  { n: 4, name: "Swin-T", focus: "Hierarchical vision transformer capturing long-range lung field context." },
  { n: 5, name: "DenseNet-121 Expansion", focus: "Augmented training pipeline extending Model 3 capacity." },
] as const;

const CLINICAL_GAP = [
  {
    icon: Clock,
    title: "Critical report turnaround",
    body: "Backlogs stretch turnaround times. Delayed or dense reports leave patients waiting without actionable context they can safely discuss with care teams.",
  },
  {
    icon: BookX,
    title: "Impenetrable jargon",
    body: "Terms like “opacification” or “consolidation” rarely map to what patients feel. Without translation, reports become documents—not conversations.",
  },
  {
    icon: Activity,
    title: "Radiologist fatigue & search satisfaction",
    body: "High volume and cognitive load increase satisfaction-of-search errors—stopping once something is found while subtler patterns may be missed.",
  },
] as const;

const TEAM = [
  {
    name: "Charles Tsoi",
    badges: ["Project Lead", "Full-Stack Developer", "Lead Architect"],
    modelBadge: "Model 3",
    initials: "CT",
    accent: "from-sky-500 to-teal-600",
  },
  {
    name: "Casper Lee",
    badges: ["Lead Vision AI", "Models 1 & 4"],
    modelBadge: "ResNet-50 · Swin-T",
    initials: "CL",
    accent: "from-violet-500 to-indigo-600",
  },
  {
    name: "Edward Choi",
    badges: ["Vision AI", "Clinical Logic Lead"],
    modelBadge: "Model 2",
    initials: "EC",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    name: "Dicky Ng",
    badges: ["Research Analyst", "Vision AI Engineer"],
    modelBadge: "Model 5",
    initials: "DN",
    accent: "from-slate-600 to-slate-800",
  },
  {
    name: "Jina Tse",
    badges: ["Systems Optimization", "Presentation"],
    modelBadge: "Platform & delivery",
    initials: "JT",
    accent: "from-amber-500 to-orange-600",
  },
] as const;

const METRICS = [
  { label: "Ensemble consensus accuracy", value: 94.0 },
  { label: "Model 2 (ResNet) validation accuracy", value: 88.6 },
  { label: "Model 3 (DenseNet) precision", value: 92.0 },
] as const;

const GITHUB_FRONTEND = "https://github.com/Charleschtsoi/LungLens";
const GITHUB_BACKEND = "https://github.com/Charleschtsoi/lunglens-backend";

const PRIMARY_CTA =
  "h-12 rounded-full px-8 text-base font-bold shadow-lg shadow-primary/15 sm:h-14 sm:px-10 sm:text-lg";
const OUTLINE_CTA =
  "h-12 rounded-full px-8 text-base font-semibold sm:h-14 sm:px-10 sm:text-lg";

function SectionLabel({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.2em]",
        dark ? "text-sky-400" : "text-primary/80",
      )}
    >
      {children}
    </p>
  );
}

function MetricCard({ label, value }: (typeof METRICS)[number]) {
  return (
    <Card className="h-full border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <CardContent className="flex flex-col items-center p-8 pt-8 text-center md:p-10">
        <p className="text-6xl font-extrabold tracking-tighter text-blue-600">
          {value.toFixed(1)}
          <span className="text-4xl">%</span>
        </p>
        <p className="mt-4 max-w-[12rem] text-sm font-medium leading-snug text-muted-foreground">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
      {children}
    </div>
  );
}

function SectionIntro({
  label,
  title,
  description,
  dark,
  descriptionClassName,
}: {
  label: string;
  title: string;
  description?: string;
  dark?: boolean;
  descriptionClassName?: string;
}) {
  const { scrollReveal, viewport } = usePitchMotion();
  return (
    <motion.div variants={scrollReveal} initial="hidden" whileInView="show" viewport={viewport}>
      <SectionLabel dark={dark}>{label}</SectionLabel>
      <h2 className={H2}>{title}</h2>
      {description ? (
        <p className={cn("mt-6 max-w-2xl md:text-lg", descriptionClassName ?? "text-muted-foreground")}>
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}

export function PitchPresentation() {
  const { heroStagger, heroItem, scrollReveal, staggerContainer, staggerItem, viewport } =
    usePitchMotion();

  return (
    <article className="bg-white text-foreground">
      {/* —— Hero —— */}
      <section
        className={cn(
          "relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white text-center",
          SECTION,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]"
          aria-hidden
        />
        <motion.div
          className="relative mx-auto max-w-4xl space-y-8"
          variants={heroStagger}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={heroItem}>
            <SectionLabel>Master&apos;s project pitch</SectionLabel>
          </motion.div>
          <motion.h1
            variants={heroItem}
            className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            LungLens
          </motion.h1>
          <motion.p
            variants={heroItem}
            className="text-xl font-semibold tracking-tight text-foreground/90 sm:text-2xl md:text-3xl"
          >
            Bridging the Diagnostic Gap with a 6-Model AI Ensemble
          </motion.p>
          <motion.p
            variants={heroItem}
            className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            An educational translation layer designed to combat radiologist burnout and bridge the
            patient health literacy gap — not a medical device, not a diagnosis.
          </motion.p>
          <motion.div
            variants={heroItem}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Button asChild size="lg" className={PRIMARY_CTA}>
              <FreshUploadLink href="/upload" className="inline-flex items-center gap-2 font-bold">
                Launch Live Demo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </FreshUploadLink>
            </Button>
            <Button asChild variant="outline" size="lg" className={OUTLINE_CTA}>
              <Link href="#architecture" className="inline-flex items-center gap-2">
                Read the Architecture
                <ArrowDown className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>
          <motion.p variants={heroItem} className="text-xs text-muted-foreground">
            Educational use only · Discuss all findings with a qualified clinician
          </motion.p>
        </motion.div>
      </section>

      {/* —— Clinical gap —— */}
      <section className={cn("bg-slate-50", SECTION)}>
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            label="The clinical gap"
            title="Why patients leave the reading room more confused than informed"
            description="Radiology excellence does not automatically translate into patient understanding. LungLens targets the friction between expert interpretation and everyday health literacy."
          />
          <motion.div
            className="mt-16 grid gap-8 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            {CLINICAL_GAP.map(({ icon: Icon, title, body }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <IconTile>
                  <Icon className="h-6 w-6" aria-hidden />
                </IconTile>
                <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* —— Architecture —— */}
      <section id="architecture" className={cn("scroll-mt-20 bg-slate-950 text-white", SECTION)}>
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            dark
            label="System architecture"
            title="Full-stack pipeline built for parallel inference"
            description="The browser never runs ML. Next.js orchestrates consent-aware UX; FastAPI owns preprocessing, ensemble fusion, and optional LLM synthesis server-side."
            descriptionClassName="text-slate-400"
          />

          <motion.div
            className="mt-14 flex flex-col items-stretch gap-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:flex-row md:items-center md:p-8"
            variants={scrollReveal}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            {(
              [
                { icon: Layers, label: "Next.js frontend", sub: "Gate · upload · results" },
                { icon: Server, label: "FastAPI BFF", sub: "Auth · validate · proxy" },
                { icon: Cpu, label: "Parallel inference", sub: "PyTorch · Keras · tabular" },
              ] as const
            ).map((step, i) => (
              <div key={step.label} className="flex flex-1 items-center gap-4">
                {i > 0 && (
                  <ArrowRight
                    className="mr-2 hidden h-5 w-5 shrink-0 text-slate-600 md:block"
                    aria-hidden
                  />
                )}
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold tracking-tight">{step.label}</p>
                  <p className="text-sm text-slate-400">{step.sub}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.h3
            className="mt-20 text-sm font-semibold uppercase tracking-widest text-slate-500"
            variants={scrollReveal}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            Five vision specialists
          </motion.h3>
          <motion.div
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            {VISION_MODELS.map((m) => (
              <motion.div
                key={m.n}
                variants={staggerItem}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-800"
              >
                <p className="text-xs font-medium text-sky-400">Model {m.n}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{m.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.focus}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-8 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 p-8 md:p-10"
            variants={scrollReveal}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                <Table2 className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
                  Model 6 · Tabular
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">COPD risk screening vector</h3>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                  When the vision gate requires clinical context, a 10-feature questionnaire vector
                  (age, fever, cough duration, smoking history, breathing difficulty, and related
                  signals) feeds a dedicated tabular model. Its output fuses with the vision ensemble
                  for COPD-oriented educational risk framing — still non-diagnostic, still for
                  discussion with clinicians.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* —— Interpretability & LLM (sticky scrollytelling) —— */}
      <section className={cn("bg-white", SECTION)}>
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            label="Trust & education"
            title="Interpretability plus responsible language"
          />

          <div className="mt-16 lg:grid lg:grid-cols-2 lg:gap-16">
            <motion.div
              className="space-y-5 lg:sticky lg:top-32 lg:self-start"
              variants={scrollReveal}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
            >
              <IconTile>
                <Eye className="h-6 w-6" aria-hidden />
              </IconTile>
              <h3 className="text-2xl font-bold tracking-tight">Grad-CAM attention maps</h3>
              <p className="leading-relaxed text-muted-foreground">
                DenseNet-121 Grad-CAM overlays show where convolutional filters attend on the lung
                field — helping users see whether the model focuses on anatomy versus spurious cues
                like tubes, labels, or hardware artifacts. That transparency supports educational
                critique, not automated diagnosis.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Spatial sanity checks before narrative synthesis
                </li>
                <li className="flex gap-2">
                  <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Paired with anatomy guides on the results experience
                </li>
              </ul>
            </motion.div>

            <div className="mt-12 space-y-16 lg:mt-0 lg:space-y-24">
              <GradCamDemoVisual />
              <motion.div
                className="space-y-5 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-white p-8 shadow-sm"
                variants={scrollReveal}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Sparkles className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-2xl font-bold tracking-tight">Gemini AI educator layer</h3>
                <p className="leading-relaxed text-muted-foreground">
                  After ensemble consensus, an optional BYOK Gemini pass turns structured findings into
                  general medical education — standard clinical strategies and vocabulary patients can
                  bring to appointments. The system is prompt-guarded to avoid prescriptive medical
                  advice, treatment directives, or diagnostic certainty language.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Brain className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                    Grounded in vision consensus + questionnaire context
                  </li>
                  <li className="flex gap-2">
                    <Brain className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                    Educational framing only; clinician validation required
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Metrics —— */}
      <section className={cn("bg-slate-50", SECTION)}>
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            label="Holdout validation"
            title="Performance metrics on validation splits"
            description="Reported figures reflect internal holdout evaluation for research demonstration — not clinical deployment claims."
          />
          <motion.div
            className="mt-14 grid gap-6 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            {METRICS.map((m) => (
              <motion.div key={m.label} variants={staggerItem}>
                <MetricCard {...m} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            className="mt-12 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-5 py-4 text-sm text-muted-foreground"
            variants={scrollReveal}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            <LineChart className="h-5 w-5 shrink-0 text-blue-600" aria-hidden />
            Ensemble fusion aggregates specialist votes before educator narrative generation.
          </motion.div>
        </div>
      </section>

      {/* —— Team —— */}
      <section className={cn("bg-white", SECTION)}>
        <div className="mx-auto max-w-6xl">
          <SectionIntro label="Meet the architects" title="Research team & model ownership" />
          <motion.div
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            {TEAM.map((member) => (
              <motion.div
                key={member.name}
                variants={staggerItem}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <span
                  className={cn(
                    "inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-lg font-semibold text-white",
                    member.accent,
                  )}
                >
                  {member.initials}
                </span>
                <h3 className="mt-5 text-lg font-bold tracking-tight">{member.name}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.badges.map((badge) => (
                    <Badge key={badge} variant="secondary">
                      {badge}
                    </Badge>
                  ))}
                </div>
                <Badge variant="outline" className="mt-4 w-fit text-xs font-normal text-muted-foreground">
                  {member.modelBadge}
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* —— CTA footer —— */}
      <section className={cn("border-t border-slate-200 bg-slate-950 text-center text-white", SECTION)}>
        <motion.div
          className="mx-auto max-w-3xl space-y-8"
          variants={scrollReveal}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to see the ensemble in action?
          </h2>
          <p className="text-slate-400 md:text-lg">
            Walk through the live gate, upload flow, attention overlays, and educator summary — the
            same path your audience can try after this pitch.
          </p>
          <Button asChild size="lg" className={cn(PRIMARY_CTA, "shadow-xl shadow-sky-500/25")}>
            <FreshUploadLink href="/upload" className="inline-flex items-center gap-2 font-bold">
              Start the Analysis
              <ArrowRight className="h-5 w-5" aria-hidden />
            </FreshUploadLink>
          </Button>
          <footer className="mt-16 space-y-4 border-t border-slate-800 pt-10 text-sm text-slate-500">
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <a
                href={GITHUB_FRONTEND}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
              >
                github.com/Charleschtsoi/LungLens
              </a>
              <span className="hidden text-slate-700 sm:inline" aria-hidden>
                ·
              </span>
              <a
                href={GITHUB_BACKEND}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
              >
                github.com/Charleschtsoi/lunglens-backend
              </a>
            </p>
            <p>
              Open core released under{" "}
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
              >
                GNU AGPLv3
              </a>
              . Educational demonstration — not FDA-cleared diagnostic software.
            </p>
          </footer>
        </motion.div>
      </section>
    </article>
  );
}
