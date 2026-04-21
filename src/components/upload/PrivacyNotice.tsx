"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppStore } from "@/store/useAppStore";

export function PrivacyNotice() {
  const educationalNotDiagnosticAck = useAppStore((s) => s.educationalNotDiagnosticAck);
  const setEducationalNotDiagnosticAck = useAppStore((s) => s.setEducationalNotDiagnosticAck);
  const setUploadFlowStep = useAppStore((s) => s.setUploadFlowStep);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Privacy &amp; purpose</CardTitle>
        <CardDescription>
          Your image is sent to this app&apos;s secure API for educational analysis. We don&apos;t use it for
          advertising. In a future version, processing may stay entirely on your device—check the latest
          privacy policy before uploading anything sensitive.
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
            <span className="font-medium">I understand this is educational, not diagnostic.</span> I will not
            use LungLens to decide whether I need treatment or emergency care.
          </span>
        </label>

        <Button
          type="button"
          disabled={!educationalNotDiagnosticAck}
          onClick={() => setUploadFlowStep(3)}
        >
          Continue to upload
        </Button>
      </CardContent>
    </Card>
  );
}
