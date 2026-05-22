"use client";

import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";

/** Homepage quick links to About and Master's pitch (after main content). */
export function LandingExploreLinks() {
  const { t } = useI18n();
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-sky-100/80 pt-12 text-sm font-medium"
      aria-label={t("landing.explore.aria")}
    >
      <Link
        href="/about"
        className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        {t("nav.about")}
      </Link>
      <Link
        href="/pitch"
        className="text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        {t("nav.pitch")}
      </Link>
    </nav>
  );
}
