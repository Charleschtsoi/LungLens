import type { FindingLabel } from "@/types";
import { FINDING_LABELS } from "@/lib/constants";
import { LearnPageClient } from "@/components/learn/LearnPageClient";

function isFindingLabel(s: string): s is FindingLabel {
  return (FINDING_LABELS as readonly string[]).includes(s);
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: raw } = await searchParams;
  const topic = raw && isFindingLabel(raw) ? raw : null;
  return <LearnPageClient topic={topic} />;
}
