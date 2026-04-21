export function MedicalDisclaimer({ className }: { className?: string }) {
  return (
    <p className={className}>
      <strong className="font-semibold text-foreground">Permanent notice:</strong> LungLens is for education
      only. It does not diagnose disease, interpret your scan as a clinician would, or replace advice from
      your doctor or radiologist.
    </p>
  );
}
