"use client";

import { DoctorGateQuestion } from "@/components/upload/DoctorGateQuestion";
import { PrivacyNotice } from "@/components/upload/PrivacyNotice";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const steps = [
  { n: 1 as const, label: "Doctor gate" },
  { n: 2 as const, label: "Privacy" },
  { n: 3 as const, label: "Upload" },
];

export function UploadFlowShell() {
  const step = useAppStore((s) => s.uploadFlowStep);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload your X-ray</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Three quick steps — all on this page. Your answers help us show the right disclaimers.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2 border-b border-sky-100/80 pb-4" aria-label="Upload progress">
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
    </div>
  );
}
