import { MedicalDisclaimer } from "@/components/shared/MedicalDisclaimer";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 text-center text-xs text-muted-foreground">
        <MedicalDisclaimer />
      </div>
    </footer>
  );
}
