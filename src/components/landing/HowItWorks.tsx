import { Stethoscope, Upload, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: 1,
    title: "Visit your doctor & get your X-ray",
    body: "Obtain your imaging through normal care—after a checkup, visit, or follow-up.",
    icon: Stethoscope,
  },
  {
    step: 2,
    title: "Upload your image for educational analysis",
    body: "Bring your JPEG or PNG here for anatomy context and plain-language guidance—not a diagnosis.",
    icon: Upload,
  },
  {
    step: 3,
    title: "Understand your results & ask smarter questions",
    body: "Explore what you're seeing and take better questions back to your clinician.",
    icon: MessageCircle,
  },
] as const;

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">How it works</h2>
        <p className="mt-3 text-muted-foreground">
          Three calm steps from your clinic&apos;s imaging to clearer understanding.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:grid-cols-3 md:gap-8">
        {steps.map((s) => (
          <li key={s.step}>
            <div
              className={cn(
                "relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
                "border-sky-100/90",
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100/80 text-primary">
                  <s.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700/80">
                  Step {s.step}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-foreground">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
