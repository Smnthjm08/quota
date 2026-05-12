import { CheckCircle2, Receipt, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    title: "Enterprise Billing",
    description:
      "Full Dodo Payments integration. Automated tax compliance in 220+ countries, professional PDF invoices, and multiple payment methods (Card, UPI, Crypto).",
    icon: Receipt,
  },
  {
    title: "On-Chain Enforcement",
    description:
      "Hard-coded monthly USDC limits enforced by a Solana program. No agent can overspend, and no database edit can bypass the firewall.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time Auditing",
    description:
      "Every single API call is logged on-chain. Link every spend event to a verifiable Solana transaction signature in your dashboard.",
    icon: BarChart3,
  },
  {
    title: "Programmable Quotas",
    description:
      "Issue agent keys with precise monthly budgets. When the limit is hit, the firewall returns 402 Payment Required automatically.",
    icon: CheckCircle2,
  },
];

export function FeaturesSection() {
  return (
    <section id="how-it-works" className="px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Engineered for safe agent autonomy.
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Quota combines the reliability of traditional enterprise billing
              with the unbreakable enforcement of on-chain primitives.
            </p>

            <div className="mt-12 space-y-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-6">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                    <feature.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative isolate hidden lg:block">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_500px_at_50%_50%,rgba(78,110,242,0.1),transparent)]"></div>
            <div className="rounded-[3rem] border border-border/40 bg-card/50 p-8 shadow-2xl backdrop-blur-sm">
              <div className="space-y-4">
                <div className="h-4 w-1/3 rounded-full bg-muted"></div>
                <div className="h-32 w-full rounded-3xl border border-dashed border-border/60 bg-muted/20"></div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-muted"></div>
                  <div className="h-3 w-5/6 rounded-full bg-muted"></div>
                  <div className="h-3 w-4/6 rounded-full bg-muted"></div>
                </div>
                <div className="flex justify-end pt-4">
                  <div className="h-10 w-32 rounded-full border border-primary/30 bg-primary/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
