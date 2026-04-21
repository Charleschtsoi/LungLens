import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  { title: "1. Confirm care context", body: "Placeholder — doctor gate & privacy copy will live on /upload." },
  { title: "2. Upload your image", body: "Placeholder — drag-and-drop JPEG/PNG." },
  { title: "3. Explore education", body: "Placeholder — heatmap + anatomy on /results." },
];

export function HowItWorks() {
  return (
    <section className="space-y-4 py-8">
      <h2 className="text-xl font-semibold">How it works (skeleton)</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{s.body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
