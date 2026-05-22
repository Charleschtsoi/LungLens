
/** English-only educator text from backend `llm_evaluation.text`. */
export function pickLlmMarkdownForLocale(
  llm: LlmEvaluationResult,
  _locale: string,
): string {
  return llm.text ?? "";
}
