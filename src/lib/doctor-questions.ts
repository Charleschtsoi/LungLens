import type { FindingLabel } from "@/lib/constants";
import { conditionName } from "@/lib/i18n";
import type { Locale } from "@/store/useLocaleStore";

export function buildDoctorQuestions(
  findings: { label: FindingLabel }[],
  locale: Locale = "en",
): string[] {
  if (findings.length === 0) {
    if (locale === "zh-Hant") {
      return [
        "工具未標示高關注模式；我的正式報告是否有需要跟進的地方？",
        "閱讀放射科摘要時，我應該重點留意哪些區域？",
        "根據我的病史與這次影像，是否需要覆檢？",
        "哪些症狀代表我需要盡快求醫？",
      ];
    }
    if (locale === "zh-Hans") {
      return [
        "工具未标示高关注模式；我的正式报告是否有需要随访的地方？",
        "阅读放射科摘要时，我应该重点留意哪些区域？",
        "根据我的病史与这次影像，是否需要复查？",
        "哪些症状代表我需要尽快就医？",
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
    const n = conditionName(locale, first.label);
    out.push(
      locale === "zh-Hant"
        ? `我留意到 AI 在與 ${n} 相關的區域有較高關注，能否解釋這區在我的影像代表什麼？`
        : locale === "zh-Hans"
          ? `我留意到 AI 在与 ${n} 相关的区域有较高关注，能否解释这一区域在我的影像中代表什么？`
        : `I noticed the AI highlighted my lung fields in areas sometimes associated with ${n}—could you explain what that region shows on my film?`,
    );
  }
  if (findings[1]) {
    const n = conditionName(locale, findings[1].label);
    out.push(
      locale === "zh-Hant"
        ? `教育性輸出也提高了 ${n} 的權重，這與我報告中的 impression 是否一致？`
        : locale === "zh-Hans"
          ? `教育性输出也提高了 ${n} 的权重，这与我报告中的 impression 是否一致？`
        : `The educational output also weighted ${n}—how does that line up with the impression section of my report?`,
    );
  }
  if (findings[2]) {
    const n = conditionName(locale, findings[2].label);
    out.push(
      locale === "zh-Hant"
        ? `我需要特別擔心 ${n} 嗎？還是這可能與正常變異或其他情況重疊？`
        : locale === "zh-Hans"
          ? `我需要特别担心 ${n} 吗？还是这可能与正常变异或其他情况重叠？`
        : `Should I be concerned about ${n} specifically, or could that pattern overlap with normal variation or another condition?`,
    );
  }
  out.push(
    locale === "zh-Hant"
      ? "根據我的症狀與這張 X 光，你建議我做哪些後續檢查或覆診安排？"
      : locale === "zh-Hans"
        ? "根据我的症状与这张 X 光，你建议我做哪些后续检查或复诊安排？"
      : "What follow-up tests or visits, if any, do you recommend based on my symptoms and this X-ray?",
  );

  const fill = locale === "zh-Hant"
    ? [
        "我應該如何把這次影像與過往胸部 X 光比較？",
        "根據影像結果，我是否需要討論生活習慣或疫苗安排？",
      ]
    : locale === "zh-Hans"
      ? [
          "我应该如何把这次影像与过往胸片比较？",
          "根据影像结果，我是否需要讨论生活习惯或疫苗安排？",
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
