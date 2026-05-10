import type { ComponentType } from "react";

import { Database, KeyRound, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

import { SectionHeading } from "./section-heading";

type Comparison = {
  icon: ComponentType<{ className?: string }>;
  oldTitle: string;
  oldBody: string;
  newTitle: string;
  newBody: string;
};

const comparisons: Comparison[] = [
  {
    icon: Database,
    oldTitle: "Redis rate limiting",
    oldBody:
      "A number in a cache. Any engineer with Redis access can change it. Expires silently. No audit trail.",
    newTitle: "Solana program enforcement",
    newBody:
      "A number in a PDA account. Only the vault owner can change it. Permanent. Every change is a signed transaction.",
  },
  {
    icon: KeyRound,
    oldTitle: "API key management",
    oldBody:
      "Keys get shared, leaked, and rotated constantly. You never really know who is calling what.",
    newTitle: "Wallet-based identity",
    newBody:
      "Every seat is a cryptographic keypair. You know exactly which agent made which call. Unforgeable.",
  },
  {
    icon: Wallet,
    oldTitle: "Monthly cloud billing surprise",
    oldBody:
      "You find out what your agents spent after the fact. No real-time control. No per-agent breakdown.",
    newTitle: "Pre-allocated on-chain budget",
    newBody:
      "Agents can only spend what is in their vault allocation. When it runs out it stops. Before the billing cycle ends.",
  },
];

function ComparisonBlock({
  icon: Icon,
  oldTitle,
  oldBody,
  newTitle,
  newBody,
}: Comparison) {
  return (
    <Card className={"border-white/10 bg-white/4"}>
      <CardHeader className="space-y-4 pb-0">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <Icon className="size-5" />
        </div>
        <CardTitle className="text-xl text-white">{newTitle}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-rose-400/15 bg-rose-400/10 p-4">
          <p className="text-xs tracking-[0.24em] text-rose-200 uppercase">
            Old way
          </p>
          <p className="mt-2 text-base font-medium text-white">{oldTitle}</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{oldBody}</p>
        </div>
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
          <p className="text-xs tracking-[0.24em] text-emerald-200 uppercase">
            New way
          </p>
          <p className="mt-2 text-base font-medium text-white">{newTitle}</p>
          <p className="mt-3 text-sm leading-7 text-slate-300">{newBody}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function WhySolanaSection() {
  return (
    <section className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="Why Solana"
          title="Because databases can be hacked. Blockchains cannot."
          className="mb-10"
        />

        <div className="space-y-5">
          {comparisons.map((comparison) => (
            <ComparisonBlock key={comparison.oldTitle} {...comparison} />
          ))}
        </div>
      </div>
    </section>
  );
}
