"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";

export function PrivacyNotice() {
  const privacyAcknowledged = useAppStore((s) => s.privacyAcknowledged);
  const setPrivacyAcknowledged = useAppStore((s) => s.setPrivacyAcknowledged);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Privacy (placeholder)</CardTitle>
        <CardDescription>
          Skeleton copy: images are sent to this app&apos;s API for analysis; production may stay on your infrastructure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant={privacyAcknowledged ? "secondary" : "default"}
          onClick={() => setPrivacyAcknowledged(true)}
        >
          {privacyAcknowledged ? "Acknowledged" : "I understand — continue"}
        </Button>
      </CardContent>
    </Card>
  );
}
