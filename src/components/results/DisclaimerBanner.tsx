import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function DisclaimerBanner() {
  return (
    <Alert>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Educational only</AlertTitle>
      <AlertDescription>
        Placeholder banner — always visible on results. Not a diagnosis; follow your clinician&apos;s report.
      </AlertDescription>
    </Alert>
  );
}
