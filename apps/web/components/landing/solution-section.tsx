import type { ComponentType } from "react";

import { BarChart3, Landmark, LockKeyhole, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { SectionHeading } from "./section-heading";

const features = [
  {
    icon: Landmark,
    title: "Fund once, control forever",
    body: "Your team pays a monthly subscription via card. Quota allocates a USDC budget to your on-chain vault. Agents spend from the vault within the limits you set.",
  },
  {
    icon: Users,
    title: "Per-seat monthly limits",
    body: "Assign every agent and team member a wallet address and a monthly credit limit. When they hit the limit, calls are blocked at the program level. Not by your server. By math.",
  },
  {
    icon: LockKeyhole,
    title: "Tamper-proof enforcement",
    body: "Spending limits live in a Solana program. Not in your database. Not in your config file. No engineer, no hacker, and not even Quota can override the limit without the vault owner's signature.",
  },
  {
    icon: BarChart3,
    title: "Full audit trail on-chain",
    body: "Every API call is a Solana transaction. Open Explorer and see exactly which agent called what, when, and how many credits it cost. Forever. No log rotation. No data loss.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <Card className="border-white/10 bg-white/4 transition-transform duration-300 hover:-translate-y-1 hover:bg-white/6">
      <CardHeader className="space-y-4 pb-0">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="size-5" />
        </div>
        <CardTitle className="text-xl text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-slate-300">
        {body}
      </CardContent>
    </Card>
  );
}

export function SolutionSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="The solution"
          title="Programmable on-chain budgets. For every agent, every team, every call."
          description="Quota replaces trust-us rate limiting with cryptographic enforcement. Every spending decision is a Solana transaction. Immutable, auditable, unstoppable."
          className="mb-10"
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
