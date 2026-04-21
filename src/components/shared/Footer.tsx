import { MedicalDisclaimer } from "@/components/shared/MedicalDisclaimer";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-sky-100/80 bg-gradient-to-b from-slate-50/50 to-sky-50/30">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-sky-100/70 bg-white/70 px-4 py-5 text-center shadow-sm backdrop-blur-sm sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
            Important
          </p>
          <div className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <MedicalDisclaimer />
            <p className="mt-3 border-t border-sky-100/80 pt-3">
              LungLens does not replace professional medical judgment. For emergencies, call your local
              emergency number. Imaging interpretation belongs to your licensed care team.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-muted-foreground/90">
          © {new Date().getFullYear()} LungLens · Educational use only
        </p>
      </div>
    </footer>
  );
}
