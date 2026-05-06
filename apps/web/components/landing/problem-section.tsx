import { AlertTriangle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

import { SectionHeading } from "./section-heading";

const problems = [
  {
    title: "No visibility",
    body:
      "You deploy 10 agents. Each one can call any API, any number of times. Your cloud bill arrives at the end of the month and nobody knows what caused the spike.",
  },
  {
    title: "No control",
    body:
      "Rate limiting in Redis can be bypassed. API keys can be shared. Database limits can be edited by any engineer with DB access. None of these are real controls.",
  },
  {
    title: "No accountability",
    body:
      "When an agent goes rogue and burns your budget, there is no audit trail. No on-chain proof. No way to show exactly which agent made which call at what cost.",
  },
];

export function ProblemSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="The problem"
          title="AI agents don't have expense policies. Yours should."
          className="mb-10"
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {problems.map((problem) => (
            <Card key={problem.title} className="border-white/10 bg-white/4 backdrop-blur-sm">
              <CardHeader className="space-y-4 pb-0">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-200">
                  <AlertTriangle className="size-5" />
                </div>
                <CardTitle className="text-xl text-white">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-slate-300">
                {problem.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}