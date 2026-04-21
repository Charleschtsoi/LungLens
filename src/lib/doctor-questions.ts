import type { FindingLabel } from "@/lib/constants";
import { formatConditionName } from "@/lib/findings-utils";

export function buildDoctorQuestions(findings: { label: FindingLabel }[]): string[] {
  if (findings.length === 0) {
    return [
      "The tool did not flag high-confidence patterns—does my official report mention anything I should follow up on?",
      "Which parts of my X-ray should I pay attention to when I read my radiology summary?",
      "Do I need repeat imaging based on my history and this film?",
      "What symptoms should I watch for that would mean I need urgent care?",
    ];
  }

  const out: string[] = [];

  const first = findings[0];
  if (first) {
    const n = formatConditionName(first.label);
    out.push(
      `I noticed the AI highlighted my lung fields in areas sometimes associated with ${n}—could you explain what that region shows on my film?`,
    );
  }
  if (findings[1]) {
    const n = formatConditionName(findings[1].label);
    out.push(
      `The educational output also weighted ${n}—how does that line up with the impression section of my report?`,
    );
  }
  if (findings[2]) {
    const n = formatConditionName(findings[2].label);
    out.push(
      `Should I be concerned about ${n} specifically, or could that pattern overlap with normal variation or another condition?`,
    );
  }
  out.push(
    "What follow-up tests or visits, if any, do you recommend based on my symptoms and this X-ray?",
  );

  const fill = [
    "How should I compare this film to any prior chest X-rays in my record?",
    "Are there lifestyle changes or vaccinations I should discuss given what you see?",
  ];
  let i = 0;
  while (out.length < 4 && i < fill.length) {
    out.push(fill[i]);
    i += 1;
  }

  return out.slice(0, 4);
}
