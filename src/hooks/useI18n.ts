"use client";

import { useMemo } from "react";
import { t } from "@/lib/i18n";
import { useLocaleStore } from "@/store/useLocaleStore";

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  return useMemo(
    () => ({
      locale,
      t: (key: string, fallback?: string) => t(locale, key, fallback),
    }),
    [locale],
  );
}

