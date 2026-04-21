import { DoctorGateQuestion } from "@/components/upload/DoctorGateQuestion";
import { PrivacyNotice } from "@/components/upload/PrivacyNotice";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadGateClient } from "@/components/upload/UploadGateClient";

export default function UploadPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Skeleton flow: doctor gate → privacy → drag-and-drop (state in Zustand).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Has a doctor reviewed this X-ray?</CardTitle>
            <CardDescription>Required before upload (skeleton gate).</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <UploadGateClient />
            <DoctorGateQuestion />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <code className="rounded bg-muted px-1">doctorReviewConfirmed</code> is stored in Zustand. The dialog is an
          alternate trigger.
        </CardContent>
      </Card>

      <PrivacyNotice />
      <ImageUploader />
    </div>
  );
}
