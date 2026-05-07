"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ClassName = "Normal" | "Pneumonia-Bacteria" | "Pneumonia-Virus";

type PredictResponse = {
  success: boolean;
  prediction?: {
    class_id: number;
    class_name: ClassName;
    confidence_score: number;
    all_probabilities: Record<ClassName, number>;
  };
  error?: string;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function diagnosisTone(className: string): string {
  if (className === "Normal") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (className === "Pneumonia-Bacteria") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

function barTone(className: string): string {
  if (className === "Normal") return "bg-emerald-500";
  if (className === "Pneumonia-Bacteria") return "bg-amber-500";
  return "bg-rose-500";
}

export function DenseNetPredictorCard({ endpoint = "/predict" }: { endpoint?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse["prediction"] | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const onFileChange = (pickedFile: File | null) => {
    setError(null);
    setResult(null);
    if (!pickedFile) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(pickedFile.type)) {
      setError("Please upload a JPEG or PNG image.");
      setFile(null);
      return;
    }
    setFile(pickedFile);
  };

  const runAnalysis = async () => {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status}).`);
      }

      const data = (await response.json()) as PredictResponse;
      if (!data.success || !data.prediction) {
        throw new Error(data.error || "Prediction failed. Please try again.");
      }

      setResult(data.prediction);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error while calling prediction API.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">DenseNet-121 X-Ray Analysis</CardTitle>
        <CardDescription>
          Upload a chest X-ray (JPEG/PNG), then run inference against the backend `POST /predict` endpoint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:bg-slate-100">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <UploadCloud className="mb-2 h-8 w-8 text-slate-500" />
          <p className="text-sm font-medium text-slate-900">Drag and drop an X-ray image, or click to upload</p>
          <p className="mt-1 text-xs text-slate-500">Accepted formats: JPG, JPEG, PNG</p>
        </label>

        {previewUrl && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">Image preview</p>
            <div className="relative h-72 w-full overflow-hidden rounded-lg border bg-black/5">
              <Image src={previewUrl} alt="Uploaded chest X-ray preview" fill className="object-contain" unoptimized />
            </div>
          </div>
        )}

        <Button onClick={runAnalysis} disabled={!file || isAnalyzing} className="w-full sm:w-auto">
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze X-Ray"
          )}
        </Button>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        {result && (
          <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Primary diagnosis</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{result.class_name}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${diagnosisTone(result.class_name)}`}>
                Confidence {percent(result.confidence_score)}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Probability breakdown</p>
              {(Object.entries(result.all_probabilities) as [ClassName, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([className, value]) => (
                  <div key={className} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-800">{className}</span>
                      <span className="text-slate-600">{percent(value)}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${barTone(className)}`}
                        style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
