import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="space-y-4 py-12">
      <p className="text-sm font-medium text-primary">Chest X-ray education companion</p>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Understand your imaging — without replacing your doctor</h1>
      <p className="max-w-2xl text-muted-foreground">
        Placeholder hero: LungLens will walk through anatomy, attention maps, and questions to ask your care team.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/upload">Upload an X-ray</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/learn">Browse learning topics</Link>
        </Button>
      </div>
    </section>
  );
}
