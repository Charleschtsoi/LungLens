import { ShieldAlert } from "lucide-react";

/** On-home permanent disclaimer; site-wide legal footer remains in layout `Footer`. */
export function LandingFooterDisclaimer() {
  return (
    <aside
      className="mt-4 rounded-2xl border border-sky-100/90 bg-sky-50/40 px-5 py-6 sm:px-8"
      aria-labelledby="landing-disclaimer-heading"
    >
      <div className="flex gap-3">
        <ShieldAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-primary/80"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <h2 id="landing-disclaimer-heading" className="text-base font-semibold text-foreground">
            Medical disclaimer
          </h2>
          <p>
            LungLens is an educational health-literacy tool only. It is not a medical device and does not
            provide a diagnosis, prognosis, or treatment advice. Always follow the guidance of a qualified
            healthcare professional and your official radiology report.
          </p>
          <p>
            If you have chest pain, trouble breathing, fever, or other concerning symptoms, seek appropriate
            medical care rather than relying on this website.
          </p>
        </div>
      </div>
    </aside>
  );
}
