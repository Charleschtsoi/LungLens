/** Browser localStorage key for optional BYOK Gemini key (same as questionnaire UI). */
export const GEMINI_API_KEY_STORAGE_KEY = "lunglens_gemini_api_key";

export function readStoredGeminiApiKey(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const v = window.localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY)?.trim();
    return v || undefined;
  } catch {
    return undefined;
  }
}
