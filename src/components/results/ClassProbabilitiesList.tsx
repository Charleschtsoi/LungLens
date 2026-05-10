"use client";

type ClassProbabilitiesListProps = {
  probabilities: Record<string, number>;
};

export function ClassProbabilitiesList({ probabilities }: ClassProbabilitiesListProps) {
  const prettyLabel = (label: string): string => label.replace(/_/g, " ");
  const rows = Object.entries(probabilities)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([label, value]) => {
      const pct = value > 1 ? Math.max(0, Math.min(100, value)) : Math.max(0, Math.min(100, value * 100));
      return { label: prettyLabel(label), pct };
    })
    .sort((a, b) => b.pct - a.pct);

  if (!rows.length) return null;

  return (
    <div className="space-y-1.5 rounded-md border border-border/50 bg-muted/20 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Class Probabilities</p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">{row.pct.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80">
              <div className="h-full rounded-full bg-slate-500/70" style={{ width: `${row.pct}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
