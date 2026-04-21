import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLACEHOLDER_QUESTIONS = [
  "Which part of the film matches the wording in my report?",
  "Do I need follow-up imaging based on my history?",
  "What symptoms should prompt urgent care?",
];

export function DoctorQuestions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Questions for your doctor (skeleton)</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {PLACEHOLDER_QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
