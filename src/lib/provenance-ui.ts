import type {
  AnalyzeProvenance,
  AnalyzeStageSource,
  AnalyzeStageStatus,
  ProvenanceSectionSource,
  StageProvenance,
} from "@/types";
import type { Locale } from "@/store/useLocaleStore";

export const FLAT_PROVENANCE_KEYS = [
  "model1_result",
  "model2_result",
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

export function isNestedStageProvenance(p: AnalyzeProvenance | undefined): boolean {
  if (!p) return false;
  return Boolean(
    p.model1?.source || p.model2?.source || p.model3?.source || p.model4?.source,
  );
}

export function provenanceBadgeClassName(
  source: AnalyzeStageSource,
  opts?: { prominent?: boolean },
): string {
  const prominent = opts?.prominent ?? false;
  const base =
    "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold tracking-tight";
  const ring = prominent && source === "mock" ? " ring-2 ring-red-400 ring-offset-2 ring-offset-background" : "";
  switch (source) {
    case "model":
      return `${base} border-emerald-200 bg-emerald-100 text-emerald-950${ring}`;
    case "rule":
      return `${base} border-amber-200 bg-amber-100 text-amber-950${ring}`;
    case "mock":
      return `${base} border-red-300 bg-red-100 text-red-950${ring}`;
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
    return repl(t("results.provenance.nested.stageSkipped", `Stage ${n} was skipped.`));
  }
  switch (sp.source) {
    case "model":
      return repl(t("results.provenance.nested.stageUsesModel", `Stage ${n} uses a real ML model.`));
    case "mock":
      return repl(t("results.provenance.nested.stageUsesMock", `Stage ${n} uses mock data.`));
    case "rule":
      return repl(t("results.provenance.nested.stageUsesRule", `Stage ${n} is rule-based.`));
    case "llm":
      return repl(t("results.provenance.nested.stageUsesLlm", `Stage ${n} is LLM-based.`));
    case "static":
      return repl(t("results.provenance.nested.stageUsesStatic", `Stage ${n} is static content.`));
    default:
      return repl(t("results.provenance.nested.stageUnknown", `Stage ${n}: unknown source.`));
  }
}

function skippedRangeSentence(
  from: number,
  to: number,
  t: (key: string, fallback?: string) => string,
): string {
  if (from === to) {
    return t("results.provenance.nested.stageSkipped", `Stage ${from} was skipped.`).replace(/\{n\}/g, String(from));
  }
  return t("results.provenance.nested.stagesSkippedRange", `Stages ${from}-${to} were skipped.`)
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
): { section: string; source: string; sourceKind: AnalyzeStageSource | null; status: string }[] {
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

export function nestedProvenanceImpactRows(
  provenance: AnalyzeProvenance,
  t: (key: string, fallback?: string) => string,
): { section: string; source: string; sourceKind: AnalyzeStageSource | null; status: string }[] {
  const rows: { section: string; source: string; sourceKind: AnalyzeStageSource | null; status: string }[] = [];
  const stageDefs: { key: "model1" | "model2" | "model3" | "model4"; titleKey: string }[] = [
    { key: "model1", titleKey: "results.provenance.impact.stage1" },
    { key: "model2", titleKey: "results.provenance.impact.stage2" },
    { key: "model3", titleKey: "results.provenance.impact.stage3" },
    { key: "model4", titleKey: "results.provenance.impact.stage4" },
  ];
  for (const { key, titleKey } of stageDefs) {
    const sp = provenance[key];
    if (!sp) continue;
    const src = normalizeToBadgeSource(sp.source);
    rows.push({
      section: t(titleKey, key),
      source: src ? t(`results.provenance.badge.${src}`, src) : t("results.provenance.sourceUnknown"),
      sourceKind: src,
      status: statusLabel(sp.status, t),
    });
  }

  const findingsSrc = resolveFindingsBadgeSource(provenance);
  rows.push({
    section: t("results.impact.findingsSection"),
    source: findingsSrc ? t(`results.provenance.badge.${findingsSrc}`, findingsSrc) : t("results.provenance.sourceUnknown"),
    sourceKind: findingsSrc,
    status: t("results.impact.statusOk"),
  });

  const dq =
    normalizeToBadgeSource(provenance.doctor_questions) ??
    normalizeToBadgeSource(provenance.model3?.source) ??
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
 * 14-class "findings" are not produced by the 3-class model2 output unless backend tags otherwise.
 */
export function resolveFindingsBadgeSource(prov: AnalyzeProvenance | undefined): AnalyzeStageSource | null {
  if (!prov) return null;
  const explicit = normalizeToBadgeSource(prov.findings);
  if (explicit) return explicit;
  if (prov.model2?.source === "model") return "mock";
  if (prov.model2?.source === "mock") return "mock";
  return "rule";
}
