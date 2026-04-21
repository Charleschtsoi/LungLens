import { CONDITION_DESCRIPTIONS } from "@/lib/constants";
import type { FindingLabel } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FindingsCard({ topLabel }: { topLabel: FindingLabel | null }) {
  const desc = topLabel ? CONDITION_DESCRIPTIONS[topLabel] : "Run analysis to see educational context.";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What the AI noticed (placeholder)</CardTitle>
        <CardDescription>Educational framing only — not &quot;you have X.&quot;</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {topLabel ? (
          <>
            <p className="font-medium text-foreground mb-2">Highlighted topic: {topLabel.replace(/_/g, " ")}</p>
            <p>{desc}</p>
          </>
        ) : (
          <p>{desc}</p>
        )}
      </CardContent>
    </Card>
  );
}
