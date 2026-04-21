import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learn</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Placeholder page for chest X-ray education modules.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Interactive anatomy, normal vs example cases, and quizzes will live here.
        </CardContent>
      </Card>
    </div>
  );
}
