import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TEAM = [
  { name: "Chung Him TSOI", role: "ML Model Development, Web Application" },
  { name: "Kai Chin NG", role: "ML Model Development" },
  { name: "Man Ho CHOI", role: "ML Model Development" },
  { name: "Yat Chun LEE", role: "ML Model Development" },
  { name: "Yuk Han TSE", role: "ML Model Development" },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-8 pb-6">
      <section className="rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-teal-50/40 p-6 shadow-sm md:p-8">
        <Badge variant="secondary" className="bg-sky-100 text-sky-900">
          About LungLens
        </Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Built to make chest X-ray learning accessible
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          LungLens is a medical chest X-ray analysis and education tool designed to help people better understand
          imaging results in plain language. The focus is health literacy: helping users ask better questions, not
          replacing professional care.
        </p>
      </section>

      <section>
        <Card className="border-sky-100/80">
          <CardHeader>
            <CardTitle className="text-xl">Project Story</CardTitle>
            <CardDescription>
              Research collaboration + independent product build
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              The machine learning model behind LungLens was developed as part of an MSc group project at
              <strong className="text-foreground"> [University Name]</strong>.
            </p>
            <p>
              I then built this web application independently so the tool could be freely accessible to everyone in a
              clean, easy-to-use format.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Team Credits</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => (
            <Card key={member.name} className="border-sky-100/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">{member.role}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-amber-200/80 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Medical Disclaimer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-950/90">
            <p>• This tool is for educational and research purposes only.</p>
            <p>• It is <strong>NOT</strong> a substitute for professional medical diagnosis.</p>
            <p>• Always consult a qualified healthcare professional.</p>
          </CardContent>
        </Card>

        <Card className="border-teal-100/80">
          <CardHeader>
            <CardTitle className="text-lg">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Model: PyTorch, trained on <strong className="text-foreground">[dataset name, e.g. NIH ChestX-ray14]</strong></p>
            <p>• Frontend: Next.js, Tailwind CSS</p>
            <p>• Deployment: <strong className="text-foreground">[Railway / Cloud Run / etc.]</strong></p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-sky-100/80">
          <CardHeader>
            <CardTitle className="text-lg">Open Source / Contact</CardTitle>
            <CardDescription>
              Interested in collaboration, feedback, or contributing?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="https://github.com/Charleschtsoi/LungLens" target="_blank" rel="noopener noreferrer">
                View GitHub Repository
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="mailto:your-email@example.com">
                Email Contact
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
