"use client";

import { useEffect } from "react";
import { warmBackend } from "@/lib/backend-warmup";

/** Wake HF via BFF once on app load (fire-and-forget). */
export function BackendWarmup() {
  useEffect(() => {
    warmBackend();
  }, []);

  return null;
}
