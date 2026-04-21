"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export function UploadGateClient() {
  const doctorReviewConfirmed = useAppStore((s) => s.doctorReviewConfirmed);
  const setDoctorReviewConfirmed = useAppStore((s) => s.setDoctorReviewConfirmed);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={doctorReviewConfirmed === true ? "default" : "outline"}
        onClick={() => setDoctorReviewConfirmed(true)}
      >
        Yes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={doctorReviewConfirmed === false ? "secondary" : "outline"}
        onClick={() => setDoctorReviewConfirmed(false)}
      >
        Not yet
      </Button>
    </>
  );
}
