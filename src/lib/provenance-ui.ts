import type {
  AnalyzeSuccessResponse,
  AnalyzeProvenance,
  AnalyzeStageSource,
  AnalyzeStageStatus,
  ProvenanceSectionSource,
  StageProvenance,
} from "@/types";

export type ImpactRow = {
  section: string;
  source: string;
  sourceKind: AnalyzeStageSource | null;
  status: string;
};
import type { Locale } from "@/store/useLocaleStore";

export const FLAT_PROVENANCE_KEYS = [
  "model1_result",
  "model2_result",
  "model6_result",
  "gate_decision",
  "findings",
  "doctor_questions",
  "report_summary",
  "anatomy_guide",
] as const;

export type FlatProvenanceKey = (typeof FLAT_PROVENANCE_KEYS)[number];

const BADGE_SOURCES: ReadonlySet<string> = new Set(["model", "mock", "rule", "llm", "static"]);

/**
 * Normalizes backend `source` strings for badges (nested `model1.source`, flat tags, etc.).
 * Accepts `rules` (flat) as an alias of `rule`.
 */
export function normalizeToBadgeSource(raw: unknown): AnalyzeStageSource | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (s === "rules") return "rule";
  if (BADGE_SOURCES.has(s)) return s as AnalyzeStageSource;
  return null;
}

export function normalizeProvenanceSectionSource(raw: unknown): ProvenanceSectionSource | null {
  const b = normalizeToBadgeSource(raw);
  if (!b) return null;
  return b === "rule" ? "rules" : (b as ProvenanceSectionSource);
}

export function isFlatSectionProvenance(p: AnalyzeProvenance | undefined): boolean {
  if (!p) return false;
  const rec = p as unknown as Record<string, unknown>;
  return FLAT_PROVENANCE_KEYS.some((k) => normalizeToBadgeSource(rec[k]) != null);
}

/** Prefer nested `provenance.modelN.source` over flat `modelN_result` so badges match real inference. */
export function pipelineProvenanceSource(
  provenance: AnalyzeProvenance | undefined,
  which: "model1" | "model2" | "model6",
): unknown {
  if (!provenance) return undefined;
  const nested = provenance[which]?.source;
  if (nested != null && String(nested).trim() !== "") return nested;
  const flatKey =
    which === "model1"
      ? "model1_result"
      : which === "model2"
        ? "model2_result"
        : "model6_result";
  return (provenance as unknown as Record<string, unknown>)[flatKey];
}

function classifierSourceIsModel(
  provenance: AnalyzeProvenance | undefined,
  which: "model1" | "model2" | "model6",
): boolean {
  return normalizeToBadgeSource(pipelineProvenanceSource(provenance, which)) === "model";
}

/** True when primary X-ray classifier (Model 1) ran as live `source: "model"`. */
export function bothClassifierModelsLive(provenance: AnalyzeProvenance | undefined): boolean {
  return classifierSourceIsModel(provenance, "model1");
}

export function hybridRunModeBannerMessage(
  provenance: AnalyzeProvenance | undefined,
  t: (key: string, defaultValue?: string) => string,
): string {
  const m1 = classifierSourceIsModel(provenance, "model1");
  const m2Vision = classifierSourceIsModel(provenance, "model2");
  const m6Copd = classifierSourceIsModel(provenance, "model6");
  if (m1 && m2Vision) {
    return "";
  }
  if (m1 && !m2Vision) {
    return t(
      "results.provenance.hybridBanner.model1Only",
      "Model 1 used a live classifier. Model 2 (ResNet-152V2) did not run as a loaded neural model on this run (mock or rules). Findings, attention overlay, and doctor-question hints may still be mock or rule-based.",
    );
  }
  if (!m1 && m2Vision) {
    return t(
      "results.provenance.hybridBanner.model2Only",
      "Model 2 (ResNet-152V2) ran on this upload. Model 1 did not run as a loaded X-ray classifier (mock or rules). Findings, attention overlay, and doctor-question hints may still be mock or rule-based.",
    );
  }
  if (!m1 && !m2Vision && m6Copd) {
    return t(
      "results.provenance.hybridBanner.model6Only",
      "Model 6 (COPD tabular) ran on this upload. X-ray classifiers did not run as loaded neural models (mock or rules).",
    );
  }
  return t(
    "results.provenance.hybridBanner.fallback",
    "This run mixed live and non-live sources. Check the pipeline badges for which steps used a model versus mock or rules.",
  );
}

export function isNestedStageProvenance(p: AnalyzeProvenance | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.model1?.source ||
      p.model2?.source ||
      p.model6?.source ||
      p.model3?.source ||
      p.model4?.source ||
      p.clinical_risk?.source,
  );
}

export function provenanceBadgeClassName(
  source: AnalyzeStageSource,
  opts?: { prominent?: boolean },
): string {
  const prominent = opts?.prominent ?? false;
  const base =
    "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-tight";
  const ring =
    prominent && source === "mock"
      ? " ring-2 ring-amber-400 ring-offset-2 ring-offset-background"
      : "";
  switch (source) {
    case "model":
      return `${base} border-emerald-200 bg-emerald-100 text-emerald-950${ring}`;
    case "rule":
      return `${base} border-slate-300 bg-slate-100 text-slate-800${ring}`;
    case "mock":
      return `${base} border-amber-200 bg-amber-100 text-amber-950${ring}`;
    case "llm":
      return `${base} border-sky-200 bg-sky-100 text-sky-950${ring}`;
    case "static":
      return `${base} border-slate-200 bg-slate-100 text-slate-800${ring}`;
    default:
      return `${base} border-slate-200 bg-slate-100 text-slate-700${ring}`;
  }
}

function joinSectionLabels(items: string[], locale: Locale): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (locale === "en") {
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  }
  if (locale === "zh-Hans") {
    return items.join("、");
  }
  return items.join("、");
}

/**
 * Human-readable summary for the top banner when backend sends flat section provenance.
 */
export function buildFlatProvenanceSummary(
  provenance: AnalyzeProvenance,
  t: (key: string, fallback?: string) => string,
  locale: Locale,
): string {
  type Entry = { key: FlatProvenanceKey; label: string; source: ProvenanceSectionSource };
  const entries: Entry[] = [];
  const rec = provenance as unknown as Record<string, unknown>;
  for (const key of FLAT_PROVENANCE_KEYS) {
    const src = normalizeProvenanceSectionSource(rec[key]);
    if (!src) continue;
    const label = t(`results.provenance.section.${key}`, key);
    entries.push({ key, label, source: src });
  }
  if (!entries.length) return "";

  const bySource = new Map<ProvenanceSectionSource, string[]>();
  for (const e of entries) {
    const list = bySource.get(e.source) ?? [];
    list.push(e.label);
    bySource.set(e.source, list);
  }

  const order: ProvenanceSectionSource[] = ["model", "rules", "mock", "llm", "static"];
  const parts: string[] = [];
  for (const source of order) {
    const labels = bySource.get(source);
    if (!labels?.length) continue;
    const list = joinSectionLabels(labels, locale);
    const template = t(`results.provenance.narrative.${source}`, "");
    parts.push(template.includes("{list}") ? template.replace(/\{list\}/g, list) : `${list}. ${template}`);
  }
  return parts.join(" ");
}

function stageSentence(
  n: number,
  sp: StageProvenance,
  t: (key: string, fallback?: string) => string,
): string {
  const repl = (s: string) => s.replace(/\{n\}/g, String(n));
  if (sp.status === "skipped" || sp.status === "failed") {
    return repl(t("results.provenance.nested.stageSkipped", `Model ${n} was skipped.`));
  }
  switch (sp.source) {
    case "model":
      return repl(t("results.provenance.nested.stageUsesModel", `Model ${n} uses a real ML model.`));
    case "mock":
      return repl(t("results.provenance.nested.stageUsesMock", `Model ${n} uses mock data.`));
    case "rule":
      return repl(t("results.provenance.nested.stageUsesRule", `Model ${n} is rule-based.`));
    case "llm":
      return repl(t("results.provenance.nested.stageUsesLlm", `Model ${n} is LLM-based.`));
    case "static":
      return repl(t("results.provenance.nested.stageUsesStatic", `Model ${n} is static content.`));
    default:
      return repl(t("results.provenance.nested.stageUnknown", `Model ${n}: unknown source.`));
  }
}

function skippedRangeSentence(
  from: number,
  to: number,
  t: (key: string, fallback?: string) => string,
): string {
  if (from === to) {
    return t("results.provenance.nested.stageSkipped", `Model ${from} was skipped.`).replace(/\{n\}/g, String(from));
  }
  return t("results.provenance.nested.stagesSkippedRange", `Models ${from}-${to} were skipped.`)
    .replace(/\{from\}/g, String(from))
    .replace(/\{to\}/g, String(to));
}

/** Banner text for nested `model1`–`model4` provenance (e.g. hybrid pipeline). */
export function buildNestedProvenanceSummary(
  provenance: AnalyzeProvenance,
  t: (key: string, fallback?: string) => string,
): string {
  const slots = [provenance.model1, provenance.model2, provenance.model3, provenance.model4];
  const items: { n: number; sp: StageProvenance }[] = [];
  for (let i = 0; i < slots.length; i++) {
    const sp = slots[i];
    if (sp) items.push({ n: i + 1, sp });
  }

  if (!items.length) return "";

  const parts: string[] = [];
  let i = 0;
  while (i < items.length) {
    const { n, sp } = items[i]!;
    if (sp.status === "skipped") {
      let j = i;
      while (j + 1 < items.length && items[j + 1]!.sp.status === "skipped") {
        j++;
      }
      if (j > i) {
        parts.push(skippedRangeSentence(items[i]!.n, items[j]!.n, t));
        i = j + 1;
      } else {
        parts.push(stageSentence(n, sp, t));
        i++;
      }
    } else {
      parts.push(stageSentence(n, sp, t));
      i++;
    }
  }
  return parts.join(" ");
}

export function flatProvenanceImpactRows(
  provenance: AnalyzeProvenance,
  t: (key: string, fallback?: string) => string,
): ImpactRow[] {
  const rec = provenance as unknown as Record<string, unknown>;
  return FLAT_PROVENANCE_KEYS.map((key) => {
    const src = normalizeToBadgeSource(rec[key]);
    const section = t(`results.provenance.section.${key}`, key);
    const sourceLabel = src ? t(`results.provenance.badge.${src}`, src) : t("results.provenance.sourceUnknown");
    return {
      section,
      source: sourceLabel,
      sourceKind: src,
      status: t("results.impact.statusOk"),
    };
  });
}

function statusLabel(st: AnalyzeStageStatus, t: (key: string, fallback?: string) => string): string {
  if (st === "failed") return t("results.impact.statusFailed");
  if (st === "skipped") return t("results.impact.statusSkipped");
  if (st === "fallback") return t("results.impact.statusFallback");
  return t("results.impact.statusOk");
}

function stageProvenanceImpactRow(
  sp: StageProvenance,
  titleKey: string,
  fallback: string,
  t: (key: string, fallback?: string) => string,
): ImpactRow {
  const src = normalizeToBadgeSource(sp.source);
  return {
    section: t(titleKey, fallback),
    source: src ? t(`results.provenance.badge.${src}`, src) : t("results.provenance.sourceUnknown"),
    sourceKind: src,
    status: statusLabel(sp.status, t),
  };
}

function flatProvenanceSectionRow(
  provenance: AnalyzeProvenance,
  key: FlatProvenanceKey,
  t: (key: string, fallback?: string) => string,
): ImpactRow | null {
  const rec = provenance as unknown as Record<string, unknown>;
  const src = normalizeToBadgeSource(rec[key]);
  if (!src) return null;
  return {
    section: t(`results.provenance.section.${key}`, key),
    source: t(`results.provenance.badge.${src}`, src),
    sourceKind: src,
    status: t("results.impact.statusOk"),
  };
}

function visionClassifierImpactRow(
  rec: { status?: string } | undefined,
  titleKey: string,
  fallback: string,
  t: (key: string, fallback?: string) => string,
): ImpactRow | null {
  if (!rec) return null;
  const live = rec.status === "success";
  return {
    section: t(titleKey, fallback),
    source: live
      ? t("results.provenance.badge.model", "model")
      : t("results.provenance.sourceUnknown"),
    sourceKind: live ? "model" : null,
    status: live ? t("results.impact.statusOk") : t("results.impact.statusSkipped"),
  };
}

/**
 * Classifier rows in the same order as the results pipeline card:
 * 1 → 2 (Edward) → 3 → 4 → 5 → 6 (COPD) → clinical risk.
 */
export function pipelineOrderedModelImpactRows(
  provenance: AnalyzeProvenance | undefined,
  analysis:
    | Pick<AnalyzeSuccessResponse, "model2" | "model4_swint" | "model5_densenet">
    | undefined,
  t: (key: string, fallback?: string) => string,
): ImpactRow[] {
  const rows: ImpactRow[] = [];
  if (!provenance && !analysis) return rows;

  const m1 = provenance?.model1;
  if (m1) {
    rows.push(
      stageProvenanceImpactRow(m1, "results.provenance.impact.model1", "Model 1 — ResNet-50", t),
    );
  } else if (provenance) {
    const flat = flatProvenanceSectionRow(provenance, "model1_result", t);
    if (flat) rows.push(flat);
  }

  const m2Vision =
    analysis?.model2 &&
    typeof analysis.model2 === "object" &&
    "status" in analysis.model2
      ? (analysis.model2 as { status?: string })
      : undefined;
  const edward = visionClassifierImpactRow(
    m2Vision,
    "results.provenance.impact.model2",
    "Model 2 — ResNet-152V2 (Edward)",
    t,
  );
  if (edward) rows.push(edward);

  const m3 = provenance?.model3;
  if (m3) {
    rows.push(
      stageProvenanceImpactRow(m3, "results.provenance.impact.model3", "Model 3 — DenseNet-121", t),
    );
  }

  const swint = visionClassifierImpactRow(
    analysis?.model4_swint,
    "results.provenance.impact.model4_swint",
    "Model 4 — Swin Transformer",
    t,
  );
  if (swint) rows.push(swint);

  const m5 = visionClassifierImpactRow(
    analysis?.model5_densenet,
    "results.provenance.impact.model5",
    "Model 5 — DenseNet-121 (H5)",
    t,
  );
  if (m5) rows.push(m5);

  const copd = provenance?.model6;
  if (copd) {
    rows.push(
      stageProvenanceImpactRow(
        copd,
        "results.provenance.impact.model6",
        "Model 6 — Chronic Lung Risk (COPD)",
        t,
      ),
    );
  } else if (provenance) {
    const flat = flatProvenanceSectionRow(provenance, "model6_result", t);
    if (flat) rows.push(flat);
  }

  const cr = provenance?.clinical_risk;
  if (cr) {
    const src = normalizeToBadgeSource(cr.source);
    rows.push({
      section: t("results.model3Risk"),
      source: src ? t(`results.provenance.badge.${src}`, src) : t("results.provenance.sourceUnknown"),
      sourceKind: src,
      status: statusLabel(cr.status, t),
    });
  }

  return rows;
}

const FLAT_IMPACT_TAIL_KEYS: FlatProvenanceKey[] = [
  "gate_decision",
  "findings",
  "doctor_questions",
  "report_summary",
  "anatomy_guide",
];

/** Flat provenance: ordered models first, then gate / findings / report tail. */
export function flatPipelineImpactRows(
  provenance: AnalyzeProvenance,
  analysis:
    | Pick<AnalyzeSuccessResponse, "model2" | "model4_swint" | "model5_densenet">
    | undefined,
  t: (key: string, fallback?: string) => string,
): ImpactRow[] {
  const rec = provenance as unknown as Record<string, unknown>;
  const tail = FLAT_IMPACT_TAIL_KEYS.map((key) => {
    const src = normalizeToBadgeSource(rec[key]);
    const section = t(`results.provenance.section.${key}`, key);
    const sourceLabel = src ? t(`results.provenance.badge.${src}`, src) : t("results.provenance.sourceUnknown");
    return {
      section,
      source: sourceLabel,
      sourceKind: src,
      status: t("results.impact.statusOk"),
    };
  });
  return [...pipelineOrderedModelImpactRows(provenance, analysis, t), ...tail];
}

/** X-ray expansion slots — separate from `provenance.model4` (report synthesis). */
export function visionExpansionImpactRows(
  analysis:
    | Pick<AnalyzeSuccessResponse, "model2" | "model4_swint" | "model5_densenet">
    | undefined,
  t: (key: string, fallback?: string) => string,
): ImpactRow[] {
  const rows: ImpactRow[] = [];
  const m2 = analysis?.model2 as { status?: string; input_type?: string } | undefined;
  if (m2 && m2.input_type !== "tabular") {
    const live = m2.status === "success";
    rows.push({
      section: t("results.provenance.impact.model2", "Model 2 — ResNet-152V2 (Edward)"),
      source: live
        ? t("results.provenance.badge.model", "model")
        : t("results.provenance.sourceUnknown"),
      sourceKind: live ? "model" : null,
      status: live ? t("results.impact.statusOk") : t("results.impact.statusSkipped"),
    });
  }
  const m4Swint = analysis?.model4_swint;
  if (m4Swint) {
    const live = m4Swint.status === "success";
    rows.push({
      section: t("results.provenance.impact.model4_swint", "Model 4 — Swin Transformer"),
      source: live
        ? t("results.provenance.badge.model", "model")
        : t("results.provenance.sourceUnknown"),
      sourceKind: live ? "model" : null,
      status: live ? t("results.impact.statusOk") : t("results.impact.statusSkipped"),
    });
  }
  const m5 = analysis?.model5_densenet;
  if (m5) {
    const live = m5.status === "success";
    rows.push({
      section: t("results.provenance.impact.model5", "Model 5 — DenseNet-121 (H5)"),
      source: live
        ? t("results.provenance.badge.model", "model")
        : t("results.provenance.sourceUnknown"),
      sourceKind: live ? "model" : null,
      status: live ? t("results.impact.statusOk") : t("results.impact.statusSkipped"),
    });
  }
  return rows;
}

export function nestedProvenanceImpactRows(
  provenance: AnalyzeProvenance,
  t: (key: string, fallback?: string) => string,
  analysis?: Pick<AnalyzeSuccessResponse, "model2" | "model4_swint" | "model5_densenet">,
): ImpactRow[] {
  const rows: ImpactRow[] = [...pipelineOrderedModelImpactRows(provenance, analysis, t)];

  const findingsSrc = resolveFindingsBadgeSource(provenance);
  rows.push({
    section: t("results.impact.findingsSection"),
    source: findingsSrc ? t(`results.provenance.badge.${findingsSrc}`, findingsSrc) : t("results.provenance.sourceUnknown"),
    sourceKind: findingsSrc,
    status: t("results.impact.statusOk"),
  });

  const dq =
    normalizeToBadgeSource(provenance.doctor_questions) ??
    normalizeToBadgeSource(provenance.clinical_risk?.source) ??
    "rule";
  rows.push({
    section: t("results.impact.questionsSection"),
    source: t(`results.provenance.badge.${dq}`, dq),
    sourceKind: dq,
    status: t("results.impact.statusOk"),
  });

  const rep =
    normalizeToBadgeSource(provenance.report_summary) ??
    normalizeToBadgeSource(provenance.model4?.source) ??
    "rule";
  rows.push({
    section: t("results.impact.reportSection"),
    source: t(`results.provenance.badge.${rep}`, rep),
    sourceKind: rep,
    status:
      provenance.model4 != null
        ? statusLabel(provenance.model4.status, t)
        : t("results.impact.statusOk"),
  });

  const an =
    normalizeToBadgeSource(provenance.anatomy_guide) ?? "static";
  rows.push({
    section: t("results.impact.anatomySection"),
    source: t(`results.provenance.badge.${an}`, an),
    sourceKind: an,
    status: t("results.impact.statusOk"),
  });

  return rows;
}

/**
 * Findings scores mirror backend `predictions` (primary ML class scores). Badge defaults to rule-based
 * when the backend omits `provenance.findings`, so the UI does not imply separate mock 14-class scaffolding.
 */
export function resolveFindingsBadgeSource(prov: AnalyzeProvenance | undefined): AnalyzeStageSource | null {
  if (!prov) return null;
  const explicit = normalizeToBadgeSource(prov.findings);
  if (explicit) return explicit;
  if (prov.model2?.source === "model") return "rule";
  if (prov.model2?.source === "mock") return "mock";
  return "rule";
}
