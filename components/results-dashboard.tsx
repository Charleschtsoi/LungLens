"use client";

import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MedicalDisclaimerBanner } from "@/components/medical-disclaimer";
import { PredictionChart } from "@/components/prediction-chart";
import type { AnalyzeSuccessResponse } from "@/lib/types/analyze";

const ANATOMY_REGIONS = [
  { id: "trachea", label: "Trachea", blurb: "Airway midline; deviation can have many causes your radiologist evaluates." },
  { id: "heart", label: "Heart shadow", blurb: "Cardiac silhouette size and shape—your report comments on anything notable." },
  { id: "lungs", label: "Lung fields", blurb: "Where air fills the lungs; increased whiteness may relate to fluid, infection, or other processes." },
  { id: "diaphragm", label: "Diaphragm", blurb: "Domed muscle below the lungs; position helps assess lung volume and nearby structures." },
] as const;

function humanizeFinding(key: string) {
  return key.replace(/_/g, " ").toLowerCase();
}

export function ResultsDashboard({
  result,
  previewUrl,
}: {
  result: AnalyzeSuccessResponse;
  previewUrl: string;
}) {
  const { predictions, gradcam } = result;
  const top = gradcam.top_prediction;
  const heatmapSrc = `data:image/png;base64,${gradcam.heatmap_base64}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Your X-ray education report</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Plain-language context for what you&apos;re viewing—not a diagnosis.
        </p>
      </div>

      <MedicalDisclaimerBanner />

      <Tabs defaultValue="original" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="original">Your X-ray</TabsTrigger>
          <TabsTrigger value="heatmap">AI attention map</TabsTrigger>
          <TabsTrigger value="scores">Model output</TabsTrigger>
        </TabsList>
        <TabsContent value="original" className="mt-4">
          <div className="relative aspect-[4/3] max-h-[420px] w-full overflow-hidden rounded-lg border bg-black/5">
            <Image src={previewUrl} alt="Uploaded chest X-ray" fill className="object-contain" unoptimized />
          </div>
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Where the model looked</CardTitle>
              <CardDescription>
                Warmer colors indicate regions the model weighted more heavily. This is not a finding
                list and not a substitute for a radiologist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative aspect-[4/3] max-h-[360px] w-full overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heatmapSrc} alt="Attention heatmap overlay" className="h-full w-full object-contain" />
              </div>
              <p className="text-sm text-muted-foreground">
                The model placed relatively more emphasis on patterns associated with{" "}
                <Badge variant="secondary">{humanizeFinding(top)}</Badge> in this educational run
                (confidence shown is a technical score, not clinical certainty).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scores" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Educational score overview</CardTitle>
              <CardDescription>
                Relative scores from the model—use them to explore topics to discuss with your doctor,
                not to self-diagnose.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PredictionChart predictions={predictions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What the AI highlighted (educational)</CardTitle>
          <CardDescription>
            We describe regions in neutral language. A radiologist integrates history, exam, and often
            prior imaging.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            The model highlighted patterns that in some educational examples overlap with appearances
            seen in <strong>{humanizeFinding(top)}</strong>. Similar patterns can also appear in other
            conditions or in normal variation.
          </p>
          <Separator />
          <div>
            <p className="font-medium mb-2">Questions you might ask your care team</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Which part of the image should I focus on when I read my report?</li>
              <li>How does this compare to my prior imaging, if any?</li>
              <li>What follow-up, if any, is appropriate for my situation?</li>
              <li>What symptoms should prompt urgent care?</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anatomy guide</CardTitle>
          <CardDescription>Tap a region for a short, general overview.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] pr-4">
            <ul className="space-y-3">
              {ANATOMY_REGIONS.map((r) => (
                <li key={r.id} className="rounded-lg border p-3">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-muted-foreground text-sm mt-1">{r.blurb}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>

      <MedicalDisclaimerBanner />
    </div>
  );
}
