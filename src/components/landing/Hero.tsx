import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-gradient-to-br from-sky-50/95 via-white to-emerald-50/50 px-6 py-14 shadow-sm sm:px-10 sm:py-16 md:px-12 md:py-20">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-200/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald-200/20 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-2xl space-y-6">
        <p className="text-sm font-medium tracking-wide text-primary/90">
          Chest X-ray education companion
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
          Understand Your Chest X-Ray
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl md:leading-relaxed">
          Already have your X-ray results? Let us help you learn what you&apos;re looking at.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="lg" className="rounded-full px-8 shadow-md shadow-primary/10">
            <Link href="/upload" className="gap-2">
              Upload Your X-Ray
              <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
          </Button>
          <Link
            href="/learn"
            className="text-center text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline sm:text-left sm:pl-2"
          >
            Learn about chest X-rays
          </Link>
        </div>

        <p className="inline-flex max-w-md items-center gap-2 rounded-full border border-emerald-200/70 bg-white/85 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
          <span aria-hidden>🔒</span>
          <span>Your images never leave your device</span>
        </p>
      </div>
    </section>
  );
}
