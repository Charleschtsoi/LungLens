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
  const setUploadFlowStep = useAppStore((s) => s.setUploadFlowStep);
  const doctorReviewed = useAppStore((s) => s.doctorReviewed);
  const educationalNotDiagnosticAck = useAppStore((s) => s.educationalNotDiagnosticAck);
  const preQuestionnaireAnalysis = useAppStore((s) => s.preQuestionnaireAnalysis);
  const questionnaireSubmitted = useAppStore((s) => s.questionnaireSubmitted);
  const configuredMode = process.env.NEXT_PUBLIC_USE_MOCK === "true" ? "demo" : "api";

  const steps = [
    { n: 1 as const, label: t("upload.step1") },
    { n: 2 as const, label: t("upload.step2") },
    { n: 3 as const, label: t("upload.step3") },
    { n: 4 as const, label: t("upload.step4") },
  ];
  const canAccessStep = (target: (typeof steps)[number]["n"]): boolean => {
    if (target === 1) return true;
    if (target === 2) return doctorReviewed !== null;
    if (target === 3) return doctorReviewed !== null && educationalNotDiagnosticAck;
    return (
      doctorReviewed !== null &&
      educationalNotDiagnosticAck &&
      (preQuestionnaireAnalysis !== null || questionnaireSubmitted)
    );
  };

  return (
    <div className="flex min-h-[min(70vh,640px)] flex-col">
      <div className="flex-1 space-y-8">
        <header>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("upload.subtitle")}
          </h1>
        </header>

        <ol className="flex flex-wrap gap-2 border-b border-border/60 pb-4" aria-label={t("upload.title")}>
          {steps.map((s) => (
            <li key={s.n}>
              <button
                type="button"
                disabled={!canAccessStep(s.n)}
                onClick={() => setUploadFlowStep(s.n)}
                aria-current={step === s.n ? "step" : undefined}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  step === s.n
                    ? "bg-primary text-primary-foreground"
                    : step > s.n
                      ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                      : "bg-muted text-muted-foreground",
                  canAccessStep(s.n) ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                )}
              >
                {s.n}. {s.label}
              </button>
            </li>
          ))}
        </ol>

        {step === 1 && <DoctorGateQuestion />}
        {step === 2 && <PrivacyNotice />}
        {step === 3 && <ImageUploader />}
        {step === 4 && <ClinicalQuestionnaire />}
      </div>

      <footer className="mt-auto border-t border-transparent pt-10 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground/60">
          <span className="font-medium text-muted-foreground/70">{t("upload.modeConfiguredTitle")}</span>
          {" · "}
          {t(`upload.modeConfigured.${configuredMode}`, configuredMode)}
        </p>
      </footer>
    </div>
  );
}
