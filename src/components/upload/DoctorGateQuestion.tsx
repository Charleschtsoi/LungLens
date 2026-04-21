"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

const FIND_DOCTOR_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=doctors+near+me";

export function DoctorGateQuestion() {
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
          <CardTitle className="text-base text-foreground">We recommend seeing a clinician first</CardTitle>
          <CardDescription className="text-foreground/80">
            We recommend consulting a doctor first. This tool helps you UNDERSTAND results, not replace
            professional diagnosis.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" variant="default" asChild>
            <Link href={FIND_DOCTOR_MAPS_URL} target="_blank" rel="noopener noreferrer">
              Find a doctor near me
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              goStep2(false);
            }}
          >
            Continue to learn anyway
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Has a doctor already reviewed your chest X-ray?</CardTitle>
        <CardDescription>
          We&apos;ll tailor disclaimers based on your answer. This app does not replace medical care.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={() => goStep2(true)}>
          Yes
        </Button>
        <Button type="button" variant="secondary" onClick={() => setDoctorGateNoBranch(true)}>
          No
        </Button>
      </CardContent>
    </Card>
  );
}
