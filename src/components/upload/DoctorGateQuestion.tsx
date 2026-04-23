"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { useI18n } from "@/hooks/useI18n";

const FIND_DOCTOR_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=doctors+near+me";

export function DoctorGateQuestion() {
  const { t } = useI18n();
  const doctorGateNoBranch = useAppStore((s) => s.doctorGateNoBranch);
  const setDoctorGateNoBranch = useAppStore((s) => s.setDoctorGateNoBranch);
  const setDoctorReviewed = useAppStore((s) => s.setDoctorReviewed);
  const setUploadFlowStep = useAppStore((s) => s.setUploadFlowStep);

  const goStep2 = (reviewed: boolean) => {
    setDoctorReviewed(reviewed);
    setDoctorGateNoBranch(false);
    setUploadFlowStep(2);
  };

  if (doctorGateNoBranch) {
    return (
      <Card className="border-amber-200/80 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="text-base text-foreground">{t("upload.gate.warnTitle")}</CardTitle>
          <CardDescription className="text-foreground/80">
            {t("upload.gate.warnBody")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="default" asChild>
            <Link href={FIND_DOCTOR_MAPS_URL} target="_blank" rel="noopener noreferrer">
              {t("upload.gate.findDoctor")}
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              goStep2(false);
            }}
          >
            {t("upload.gate.continue")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t("upload.gate.title")}</CardTitle>
        <CardDescription>
          {t("upload.gate.desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={() => goStep2(true)}>
          {t("upload.gate.yes")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setDoctorGateNoBranch(true)}>
          {t("upload.gate.no")}
        </Button>
      </CardContent>
    </Card>
  );
}
