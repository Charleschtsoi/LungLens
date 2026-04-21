import { ANATOMY_REGIONS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnatomyGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Anatomy guide (skeleton)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {ANATOMY_REGIONS.map((r) => (
          <div key={r.id}>
            <span className="font-medium text-foreground">{r.label}</span> — {r.description}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
