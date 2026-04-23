"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/useAppStore";
import { useI18n } from "@/hooks/useI18n";

export function PrivacyNotice() {
  const { t } = useI18n();
  const educationalNotDiagnosticAck = useAppStore((s) => s.educationalNotDiagnosticAck);
  const setEducationalNotDiagnosticAck = useAppStore((s) => s.setEducationalNotDiagnosticAck);
  const setUploadFlowStep = useAppStore((s) => s.setUploadFlowStep);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("upload.privacy.title")}</CardTitle>
        <CardDescription>
          {t("upload.privacy.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-sky-100/90 bg-sky-50/30 p-4">
          <Checkbox
            checked={educationalNotDiagnosticAck}
            onCheckedChange={(v) => setEducationalNotDiagnosticAck(v === true)}
            className="mt-0.5"
            id="educational-ack"
          />
          <span className="text-sm leading-relaxed text-foreground">
            <span className="font-medium">{t("upload.privacy.ack")}</span>
          </span>
        </label>

        <Button
          type="button"
          disabled={!educationalNotDiagnosticAck}
          onClick={() => setUploadFlowStep(3)}
        >
          {t("upload.privacy.next")}
        </Button>
      </CardContent>
    </Card>
  );
}
