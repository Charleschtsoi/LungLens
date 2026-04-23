"use client";

import { DoctorGateQuestion } from "@/components/upload/DoctorGateQuestion";
import { PrivacyNotice } from "@/components/upload/PrivacyNotice";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { ClinicalQuestionnaire } from "@/components/upload/ClinicalQuestionnaire";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

export function UploadFlowShell() {
  const { t } = useI18n();
  const step = useAppStore((s) => s.uploadFlowStep);
  const steps = [
    { n: 1 as const, label: t("upload.step1") },
    { n: 2 as const, label: t("upload.step2") },
    { n: 3 as const, label: t("upload.step3") },
    { n: 4 as const, label: t("upload.step4") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("upload.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("upload.subtitle")}
        </p>
      </div>

      <ol className="flex flex-wrap gap-2 border-b border-sky-100/80 pb-4" aria-label={t("upload.title")}>
        {steps.map((s) => (
          <li
            key={s.n}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              step === s.n
                ? "bg-primary text-primary-foreground"
                : step > s.n
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {s.n}. {s.label}
          </li>
        ))}
      </ol>

      {step === 1 && <DoctorGateQuestion />}
      {step === 2 && <PrivacyNotice />}
      {step === 3 && <ImageUploader />}
      {step === 4 && <ClinicalQuestionnaire />}
    </div>
  );
}
