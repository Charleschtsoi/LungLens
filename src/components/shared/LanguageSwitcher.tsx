"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/useI18n";
import { useLocaleStore, type Locale } from "@/store/useLocaleStore";

const ORDER: Locale[] = ["en", "zh-Hant", "zh-Hans"];

export function LanguageSwitcher() {
  const { t, locale } = useI18n();
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className="flex items-center gap-1 rounded-md border bg-background/80 p-1">
      <span className="px-1.5 text-[10px] font-medium text-muted-foreground">
        {t("nav.language")}
      </span>
      {ORDER.map((l) => (
        <Button
          key={l}
          type="button"
          size="sm"
          variant={locale === l ? "default" : "ghost"}
          className="h-7 px-2 text-[11px]"
          onClick={() => setLocale(l)}
        >
          {t(
            l === "en" ? "lang.en" : l === "zh-Hant" ? "lang.hant" : "lang.hans",
          )}
        </Button>
      ))}
    </div>
  );
}

