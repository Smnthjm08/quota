"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const plans = [
  {
    id: 1,
    key: "free",
    name: "Free Plan",
    priceCents: 0,
    maxAllowedSeats: 2,
    initDeposit: 1,
    subtitle: "Perfect for exploring on-chain spend control.",
  },
  {
    id: 2,
    key: "starter",
    name: "Starter Plan",
    priceCents: 2000,
    maxAllowedSeats: 5,
    initDeposit: 5,
    subtitle: "Ideal for individual agents and small projects.",
  },
  {
    id: 3,
    key: "team",
    name: "Team Plan",
    priceCents: 5000,
    maxAllowedSeats: 25,
    initDeposit: 25,
    subtitle: "Perfect for scaling agent fleets across teams.",
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-background/50 px-6 py-24 sm:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Your subscription directly funds your vault. Every dollar you pay is
            available for your agents to spend.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-border/40 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 ${
                plan.key === "team"
                  ? "border-primary/30 shadow-xl ring-1 shadow-primary/5 ring-primary/20"
                  : ""
              }`}
            >
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold tracking-widest text-primary uppercase">
                    {plan.name}
                  </p>
                  {plan.key === "team" && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/30 bg-primary/10 text-primary"
                    >
                      Popular
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-4 flex items-baseline gap-1 text-4xl font-bold">
                  ${(plan.priceCents / 100).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mo
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-8 p-8 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <Check className="size-4 text-primary" />
                    <span>
                      {plan.maxAllowedSeats || "Unlimited"} seats included
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <Check className="size-4 text-primary" />
                    <span>${plan.initDeposit} initial vault deposit</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <Check className="size-4 text-primary" />
                    <span>On-chain spend control</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <Check className="size-4 text-primary" />
                    <span>Dodo Payments integration</span>
                  </div>
                </div>

                <Button
                  asChild
                  className={`h-12 w-full rounded-full font-semibold transition-all ${
                    plan.key === "team"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Link href="/signup">Start with {plan.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
