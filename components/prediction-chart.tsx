"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Predictions } from "@/lib/types/analyze";
import { FINDING_LABELS } from "@/lib/types/analyze";

function formatLabel(key: string) {
  return key.replace(/_/g, " ");
}

export function PredictionChart({ predictions }: { predictions: Predictions }) {
  const data = [...FINDING_LABELS]
    .map((id) => ({
      name: formatLabel(id),
      score: Math.round(predictions[id] * 1000) / 1000,
      pct: Math.round(predictions[id] * 100),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Model attention"]}
            contentStyle={{ borderRadius: 8 }}
          />
          <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
