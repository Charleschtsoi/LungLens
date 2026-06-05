/**
 * Fire-and-forget HF wake via Next BFF (no CORS, no public HF URL in browser).
 * Safe to call multiple times; errors are ignored.
 */
export function warmBackend(): void {
  if (typeof window === "undefined") return;
  void fetch("/api/health", { cache: "no-store" }).catch(() => {});
}
