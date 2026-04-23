import type { FindingLabel } from "@/lib/constants";
import { formatConditionName } from "@/lib/findings-utils";
import type { Locale } from "@/store/useLocaleStore";

export function buildDoctorQuestions(
  findings: { label: FindingLabel }[],
  locale: Locale = "en",
): string[] {
  const zh = locale !== "en";
  if (findings.length === 0) {
    if (zh) {
      return [
        "工具未標示高關注模式；我的正式報告是否有需要跟進的地方？",
        "閱讀放射科摘要時，我應該重點留意哪些區域？",
        "根據我的病史與這次影像，是否需要覆檢？",
        "哪些症狀代表我需要盡快求醫？",
      ];
    }
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
      zh
        ? `我留意到 AI 在與 ${n} 相關的區域有較高關注，能否解釋這區在我的影像代表什麼？`
        : `I noticed the AI highlighted my lung fields in areas sometimes associated with ${n}—could you explain what that region shows on my film?`,
    );
  }
  if (findings[1]) {
    const n = formatConditionName(findings[1].label);
    out.push(
      zh
        ? `教育性輸出也提高了 ${n} 的權重，這與我報告中的 impression 是否一致？`
        : `The educational output also weighted ${n}—how does that line up with the impression section of my report?`,
    );
  }
  if (findings[2]) {
    const n = formatConditionName(findings[2].label);
    out.push(
      zh
        ? `我需要特別擔心 ${n} 嗎？還是這可能與正常變異或其他情況重疊？`
        : `Should I be concerned about ${n} specifically, or could that pattern overlap with normal variation or another condition?`,
    );
  }
  out.push(
    zh
      ? "根據我的症狀與這張 X 光，你建議我做哪些後續檢查或覆診安排？"
      : "What follow-up tests or visits, if any, do you recommend based on my symptoms and this X-ray?",
  );

  const fill = zh
    ? [
        "我應該如何把這次影像與過往胸部 X 光比較？",
        "根據影像結果，我是否需要討論生活習慣或疫苗安排？",
      ]
    : [
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
