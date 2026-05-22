import type { FindingLabel } from "@/lib/constants";
import { conditionName } from "@/lib/i18n";
import type { Locale } from "@/store/useLocaleStore";
import type { EducationalInsight } from "@/types";

type InsightTemplate = { title: string; text: string; category: string };

const TEMPLATES_EN: Record<FindingLabel, InsightTemplate[]> = {
  Pneumonia: [
    {
      title: "What this pattern may indicate",
      text: "Pneumonia on chest X-ray often shows areas where air spaces look filled or inflamed. Your clinician combines imaging with symptoms, exams, and sometimes blood tests or cultures—not AI scores alone.",
      category: "overview",
    },
    {
      title: "Treatment and follow-up (general)",
      text: "Care may include antibiotics for suspected bacterial infection, rest and fluids, oxygen if needed, and repeat imaging when symptoms persist. Vaccines (influenza, pneumococcal, COVID-19 where appropriate) help prevent some pneumonias.",
      category: "treatment",
    },
  ],
  "Lung Opacity": [
    {
      title: "Understanding lung opacity",
      text: "Opacity means part of the lung looks denser or hazier than normal. Causes range from infection and fluid to inflammation or scarring. Radiology wording and your symptoms guide next steps.",
      category: "overview",
    },
    {
      title: "Typical management themes",
      text: "Doctors may order follow-up X-rays, CT, or labs depending on context. Treatment targets the underlying cause—only your care team should decide what applies to you.",
      category: "treatment",
    },
  ],
  "COVID-19": [
    {
      title: "Imaging and COVID-19",
      text: "AI may flag patterns seen with viral pneumonia, including COVID-19. Imaging supports assessment but does not replace PCR/antigen testing or clinical diagnosis.",
      category: "overview",
    },
    {
      title: "Care and prevention context",
      text: "Management ranges from home monitoring to antivirals in eligible high-risk patients and hospital care when severe. Check official health-authority guidance on vaccines and variants with your clinician.",
      category: "treatment",
    },
  ],
};

const TEMPLATES_ZH_HANT: Record<FindingLabel, InsightTemplate[]> = {
  Pneumonia: [
    {
      title: "影像可能代表什麼",
      text: "胸肺 X 光上的肺炎常見表現是肺泡區域較實或發炎。醫師會結合症狀、理學檢查，有時加上血液或培養檢查，而不只依賴 AI 分數。",
      category: "overview",
    },
    {
      title: "治療與跟進（一般說明）",
      text: "視病因而定，可能包括抗生素、休息與補充水分、需要時的氧氣治療，以及症狀持續時的覆照影像。流感、肺炎鏈球菌、COVID-19 等疫苗有助降低部分肺炎風險。",
      category: "treatment",
    },
  ],
  "Lung Opacity": [
    {
      title: "肺野不透明度的意義",
      text: "表示肺部部分區域在 X 光上較濃或較霧，可能與感染、積液、發炎或疤痕等有關，需配合放射科報告與臨床情況判斷。",
      category: "overview",
    },
    {
      title: "常見處理方向",
      text: "醫師可能安排覆照、電腦掃描或化驗。治療針對真正病因，請以你的主診醫師計劃為準。",
      category: "treatment",
    },
  ],
  "COVID-19": [
    {
      title: "與 COVID-19 相關的影像表現",
      text: "AI 可能標示與病毒性肺炎（包括 COVID-19）相關的模式。影像有助評估，但不能取代 PCR/抗原檢測或臨床診斷。",
      category: "overview",
    },
    {
      title: "照護與預防背景",
      text: "由居家監測到高風險族群的抗病毒治療，以及需要時的住院支援。疫苗與公共衛生建議會更新，請向醫護人員及官方來源查證。",
      category: "treatment",
    },
  ],
};

const TEMPLATES_ZH_HANS: Record<FindingLabel, InsightTemplate[]> = {
  Pneumonia: [
    {
      title: "影像可能代表什么",
      text: "胸片上的肺炎常表现为肺泡区域较实或发炎。医生会结合症状、查体，有时加上血液或培养检查，而不只依赖 AI 分数。",
      category: "overview",
    },
    {
      title: "治疗与随访（一般说明）",
      text: "视病因而定，可能包括抗生素、休息与补液、需要时的氧疗，以及症状持续时的复查影像。流感、肺炎球菌、COVID-19 等疫苗有助于降低部分肺炎风险。",
      category: "treatment",
    },
  ],
  "Lung Opacity": [
    {
      title: "肺野不透明度的意义",
      text: "表示肺部部分区域在 X 光上较浓或较雾，可能与感染、积液、炎症或瘢痕等有关，需结合放射科报告与临床情况判断。",
      category: "overview",
    },
    {
      title: "常见处理方向",
      text: "医生可能安排复查、CT 或化验。治疗针对真正病因，请以你的主治医生方案为准。",
      category: "treatment",
    },
  ],
  "COVID-19": [
    {
      title: "与 COVID-19 相关的影像表现",
      text: "AI 可能标示与病毒性肺炎（包括 COVID-19）相关的模式。影像有助于评估，但不能取代 PCR/抗原检测或临床诊断。",
      category: "overview",
    },
    {
      title: "照护与预防背景",
      text: "从居家监测到高风险人群的抗病毒治疗，以及需要时的住院支持。疫苗与公共卫生建议会更新，请向医护人员及官方来源查证。",
      category: "treatment",
    },
  ],
};

function templatesForLocale(locale: Locale): Record<FindingLabel, InsightTemplate[]> {
  if (locale === "zh-Hant") return TEMPLATES_ZH_HANT;
  if (locale === "zh-Hans") return TEMPLATES_ZH_HANS;
  return TEMPLATES_EN;
}

export function buildEducationalInsights(
  findings: { label: FindingLabel; displayName?: string }[],
  locale: Locale = "en",
): EducationalInsight[] {
  const templates = templatesForLocale(locale);
  const out: EducationalInsight[] = [];
  let idx = 1;

  if (findings.length === 0) {
    const generic =
      locale === "zh-Hant"
        ? {
            title: "本次掃描重點",
            text: "AI 未標示明顯高關注模式。這並不代表沒有問題—請以放射科正式報告及醫師評估為準，並了解常見胸部 X 光跟進方式。",
          }
        : locale === "zh-Hans"
          ? {
              title: "本次扫描重点",
              text: "AI 未标示明显高关注模式。这并不代表没有问题—请以放射科正式报告及医生评估为准，并了解常见胸片随访方式。",
            }
          : {
              title: "About your scan",
              text: "The AI did not flag strong patterns on this film. That does not rule out important findings—always rely on your official radiology report and clinician, and discuss whether repeat imaging is needed for your situation.",
            };
    return [
      {
        id: "i1",
        title: generic.title,
        text: generic.text,
        finding_trigger: "General",
        category: "overview",
      },
    ];
  }

  for (const f of findings.slice(0, 3)) {
    const label = f.label;
    const name = f.displayName ?? conditionName(locale, label);
    for (const tpl of templates[label] ?? []) {
      out.push({
        id: `i${idx}`,
        title: tpl.title.replace(/finding/gi, name),
        text: tpl.text,
        finding_trigger: label,
        category: tpl.category,
      });
      idx += 1;
    }
  }
  return out.slice(0, 6);
}

/** Plain strings for PDF export. */
export function educationalInsightsToPdfLines(insights: EducationalInsight[]): string[] {
  return insights.map((row) => `${row.title}: ${row.text}`);
}
