import Link from "next/link";
import { Check } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

import { SectionHeading } from "./section-heading";

const plans = [
  {
    name: "Starter",
    price: "$20",
    subtitle: "For small teams and indie developers",
    seatLimit: "Up to 5 seats",
    allocation: "20 USDC monthly budget",
    credits: "10,000 per month",
    features: [
      "On-chain quota enforcement",
      "Usage dashboard",
      "Dodo billing portal",
      "Email support",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Team",
    price: "$50",
    subtitle: "For growing teams with multiple agents",
    seatLimit: "Up to 25 seats",
    allocation: "50 USDC monthly budget",
    credits: "50,000 per month",
    features: [
      "Everything in Starter",
      "Priority support",
      "Advanced usage analytics",
      "Custom credit costs per route",
      "Managed wallet option",
    ],
    cta: "Get started",
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          label="Pricing"
          title="Simple pricing. Predictable costs."
          description="Your subscription funds your vault. Your vault controls your agents. No hidden fees. No per-call charges from Quota."
          className="mb-10"
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative border-cyan-400/25 bg-linear-to-b from-cyan-400/10 to-white/5 shadow-[0_30px_80px_rgba(8,145,178,0.18)]"
                  : "border-white/10 bg-white/4"
              }
            >
              {plan.highlighted ? (
                <div className="absolute right-5 top-5">
                  <Badge className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Most popular</Badge>
                </div>
              ) : null}

              <CardHeader className="space-y-4 pb-0">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{plan.name}</p>
                  <CardTitle className="mt-3 text-4xl font-semibold text-white">
                    {plan.price}
                    <span className="ml-2 text-base font-normal text-slate-400">per month</span>
                  </CardTitle>
                </div>
                <p className="text-sm text-slate-300">{plan.subtitle}</p>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Seat limit</p>
                    <p className="mt-2 text-base text-white">{plan.seatLimit}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vault allocation</p>
                    <p className="mt-2 text-base text-white">{plan.allocation}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Credits per seat</p>
                    <p className="mt-2 text-base text-white">{plan.credits}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="flex size-5 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200">
                        <Check className="size-3.5" />
                      </span>
                      {feature}
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  size="lg"
                  className={
                    plan.highlighted
                      ? "w-full rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                      : "w-full rounded-full bg-white/10 text-white hover:bg-white/15"
                  }
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-5 text-sm text-slate-400">
          All plans include a managed wallet option. No Solana experience required. Your vault is funded automatically when your subscription activates.
        </p>
      </div>
    </section>
  );
}