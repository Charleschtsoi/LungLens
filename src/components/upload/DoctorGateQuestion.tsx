"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

/** Skeleton: modal gate — “Has a doctor reviewed this?” */
export function DoctorGateQuestion() {
  const setDoctorReviewConfirmed = useAppStore((s) => s.setDoctorReviewConfirmed);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Open doctor review gate (placeholder)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Has a doctor reviewed this X-ray?</AlertDialogTitle>
          <AlertDialogDescription>
            Placeholder modal. Yes/No will drive upload eligibility and disclaimers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setDoctorReviewConfirmed(false);
              setOpen(false);
            }}
          >
            Not yet
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setDoctorReviewConfirmed(true);
              setOpen(false);
            }}
          >
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
