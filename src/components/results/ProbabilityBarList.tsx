"use client";

/** One row: stable `key` for React, display `label`, width `pct` (0–100). */
export type ProbabilityBarRow = {
  key: string;
  label: string;
  pct: number;
};

export type ProbabilityBarListProps = {
  /** Section heading (e.g. i18n “Class probabilities”). */
  title: string;
  rows: ProbabilityBarRow[];
};

/**
 * Shared neutral bars for all classifier probability UIs (ResNet stages + DenseNet).
 * Same track/fill for every row; rank is read from bar length, not color.
 */
export function ProbabilityBarList({ title, rows }: ProbabilityBarListProps) {
  if (!rows.length) return null;

  return (
    <div className="space-y-1.5 rounded-md border border-border/50 bg-muted/20 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">{row.pct.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/50">
              <div
                className="h-full rounded-full bg-slate-500/70 dark:bg-slate-400/70"
                style={{ width: `${row.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
