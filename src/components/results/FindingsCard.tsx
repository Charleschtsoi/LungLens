import { CONDITION_DESCRIPTIONS } from "@/lib/constants";
import type { FindingLabel } from "@/types";
import type { Predictions } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  confidenceTier,
  formatConditionName,
  getNotableFindings,
  tierBarSegments,
  type ConfidenceTier,
} from "@/lib/findings-utils";
import { cn } from "@/lib/utils";

function TierLabel({ tier }: { tier: ConfidenceTier }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Attention level: <span className="text-foreground">{tier}</span>
    </span>
  );
}

function ConfidenceBar({ tier }: { tier: ConfidenceTier }) {
  const filled = tierBarSegments(tier);
  const fillClass =
    tier === "High" ? "bg-primary" : tier === "Moderate" ? "bg-primary/80" : "bg-primary/55";
  return (
    <div className="flex gap-1.5" role="img" aria-label={`Model attention level: ${tier}`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn("h-2.5 flex-1 rounded-full transition-colors", i <= filled ? fillClass : "bg-muted")}
        />
      ))}
    </div>
  );
}

export function FindingsCard({ predictions }: { predictions: Predictions | null }) {
  const notable = predictions ? getNotableFindings(predictions) : [];

  return (
    <Card id="what-ai-noticed">
      <CardHeader>
        <CardTitle className="text-lg">What the AI noticed</CardTitle>
        <CardDescription>
          Educational model scores—not a diagnosis. Only a radiologist can confirm what your film shows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notable.length === 0 ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            The AI did not highlight any significant areas. This is generally consistent with a normal chest X-ray,
            but only a radiologist can confirm.
          </p>
        ) : (
          notable.map(({ label, score }) => {
            const tier = confidenceTier(score);
            const desc = CONDITION_DESCRIPTIONS[label];
            return (
              <div key={label} className="space-y-3 border-b border-border/60 pb-6 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{formatConditionName(label)}</h3>
                  <TierLabel tier={tier} />
                </div>
                <ConfidenceBar tier={tier} />
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
