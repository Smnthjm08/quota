import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { SectionHeading } from "./section-heading";

const steps = [
  {
    number: "01",
    title: "Subscribe via Dodo",
    body: "Pay with your corporate card. Quota handles billing, invoicing, and tax compliance in 220 countries. Your vault is funded automatically when payment clears.",
  },
  {
    number: "02",
    title: "Add seats for your agents",
    body: "Enter the wallet address for each agent or team member. Set their monthly credit limit. One seat is one agent. One limit is one budget. Simple.",
  },
  {
    number: "03",
    title: "Agents call your APIs",
    body: "Agents include their wallet address in API requests. Quota's middleware checks the on-chain seat, deducts credits, and either serves the response or returns 402 quota exceeded.",
  },
  {
    number: "04",
    title: "Monitor everything",
    body: "Your dashboard shows real-time usage per seat, vault balance, approaching limits, and a live log of every API call linked to its Solana transaction.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="How it works"
          title="From signup to enforced in minutes"
          className="mb-10"
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.number} className="border-white/10 bg-white/4">
              <CardHeader className="space-y-4 pb-0">
                <Badge
                  variant="outline"
                  className="w-fit border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                >
                  {step.number}
                </Badge>
                <CardTitle className="text-xl text-white">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-slate-300">
                {step.body}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
