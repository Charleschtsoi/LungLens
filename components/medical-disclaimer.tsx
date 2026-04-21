import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MedicalDisclaimerBanner({ className }: { className?: string }) {
  return (
    <Alert className={className} variant="default">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Educational use only</AlertTitle>
      <AlertDescription>
        LungLens does not provide medical diagnoses or treatment advice. Only a qualified clinician
        can interpret your imaging. If you have symptoms or concerns, contact a healthcare
        professional.
      </AlertDescription>
    </Alert>
  );
}

export function MedicalDisclaimerFooter() {
  return (
    <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto px-4 py-6">
      LungLens is an educational health-literacy tool. It is not FDA-cleared or intended as a
      substitute for professional medical judgment. Always follow your care team&apos;s guidance.
    </p>
  );
}
