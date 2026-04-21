"use client";

import { useEffect } from "react";
import { Activity, Shield } from "lucide-react";
import { useLungLensStore } from "@/store/use-lunglens-store";
import { analyzeImageFile } from "@/lib/analyze-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MedicalDisclaimerBanner } from "@/components/medical-disclaimer";
import { UploadZone } from "@/components/upload-zone";
import { ResultsDashboard } from "@/components/results-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function HomePage() {
  const {
    step,
    setStep,
    doctorReviewConfirmed,
    setDoctorReview,
    file,
    setFile,
    previewUrl,
    setPreviewUrl,
    result,
    setResult,
    loading,
    setLoading,
    error,
    setError,
    resetSession,
  } = useLungLensStore();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setError(null);
    setResult(null);
    setLoading(true);
    setStep("results");

    const res = await analyzeImageFile(f);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Something went wrong.");
      return;
    }
    setResult(res);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LungLens</h1>
            <p className="text-sm text-muted-foreground">Chest X-ray education companion</p>
          </div>
        </div>
        {step !== "landing" && (
          <Button variant="outline" size="sm" onClick={resetSession}>
            Start over
          </Button>
        )}
      </header>

      {step === "landing" && (
        <div className="space-y-6">
          <MedicalDisclaimerBanner />
          <Card>
            <CardHeader>
              <CardTitle>Already have imaging from your clinic?</CardTitle>
              <CardDescription>
                LungLens helps you learn what you&apos;re looking at after you&apos;ve obtained a chest
                X-ray through normal care. It does not replace your doctor or radiologist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full sm:w-auto" onClick={() => setStep("consent")}>
                I have my chest X-ray
              </Button>
              <p className="text-xs text-muted-foreground">
                By continuing, you agree this tool is for education only and you will not rely on it for
                diagnosis or treatment decisions.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "consent" && (
        <div className="space-y-6">
          <MedicalDisclaimerBanner />
          <Card>
            <CardHeader>
              <CardTitle>Has a clinician already reviewed your X-ray?</CardTitle>
              <CardDescription>
                We recommend learning alongside professional care. If you haven&apos;t spoken with a
                clinician yet, consider doing so first—especially if you feel unwell.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  setDoctorReview(true);
                  setStep("upload");
                }}
              >
                Yes — proceed to upload
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDoctorReview(false);
                  setStep("upload");
                }}
              >
                Not yet — I still want the educational walkthrough
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-6">
          <MedicalDisclaimerBanner />
          {doctorReviewConfirmed === false && (
            <Alert variant="destructive">
              <AlertTitle>Please involve a clinician</AlertTitle>
              <AlertDescription>
                If you have new symptoms or an abnormal report, contact a healthcare professional. You
                can still explore the educational flow, but do not use it to decide whether you need
                care.
              </AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                For this demo, your image is sent to our Next.js API route. When the ML service is
                connected, you can keep processing on your own infrastructure. Do not upload images you
                are not allowed to share.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadZone
                onFile={handleFile}
                disabled={loading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {step === "results" && (
        <div className="space-y-6">
          {loading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Analyzing (educational model)…</CardTitle>
                <CardDescription>This may take a couple of seconds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={66} className="h-2" />
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Could not complete analysis</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && result && previewUrl && (
            <ResultsDashboard result={result} previewUrl={previewUrl} />
          )}
        </div>
      )}
    </main>
  );
}
