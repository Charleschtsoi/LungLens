/** @deprecated COPD tabular lives on API `model6` — use `@/lib/model6-tabular`. */
export {
  copdTabularFromAnalyze,
  formatModel2ClinicalHeadline,
  formatModel6ClinicalHeadline,
  formatModel6ClinicalSummary,
  isModel6Tabular as isModel2Tabular,
  model6ClinicalProbabilityRows as model2ClinicalProbabilityRows,
  model6TabularFromAnalysis as model2TabularFromAnalysis,
  model6TabularFromLegacyCopd as model2TabularFromLegacyCopd,
} from "@/lib/model6-tabular";
