import type { FindingLabel } from "@/types";
import { FINDING_LABELS } from "@/lib/constants";
import { LearnPageClient } from "@/components/learn/LearnPageClient";

function isFindingLabel(s: string): s is FindingLabel {
  return (FINDING_LABELS as readonly string[]).includes(s);
}

export default function LearnPage({
  searchParams,
}: {
  searchParams: { topic?: string };
}) {
  const raw = searchParams.topic;
  const topic = raw && isFindingLabel(raw) ? raw : null;
  return <LearnPageClient topic={topic} />;
}
