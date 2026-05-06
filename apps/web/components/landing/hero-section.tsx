import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CircleCheck,
  Clock3,
  Landmark,
//   ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

const stats = [
  { label: "Monthly vault", value: "20 USDC", accent: "from-cyan-300 to-cyan-500" },
  { label: "Seats active", value: "25", accent: "from-sky-300 to-cyan-400" },
  { label: "Blocked calls", value: "1,284", accent: "from-emerald-300 to-cyan-400" },
];

const events = [
  { label: "agent-alpha.lm", detail: "Consumed 20 credits on /api/generate" },
  { label: "finance-bot", detail: "402 returned. Monthly quota exhausted." },
  { label: "vault-owner", detail: "Raised seat limit. On-chain transaction confirmed." },
];

function HeroVisual() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_35%)] blur-2xl" />
      <Card className="border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(2,8,23,0.45)] backdrop-blur-xl">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live policy</p>
              <CardTitle className="mt-2 text-xl text-white">Agent spend control</CardTitle>
            </div>
            <Badge variant="outline" className="border-emerald-400/25 bg-emerald-400/10 text-emerald-200">
              <CircleCheck className="size-3" />
              Enforced on Solana
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
              >
                <div className={`h-1 w-12 rounded-full bg-linear-to-r ${stat.accent}`} />
                <p className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Landmark className="size-4 text-cyan-300" />
                Vault activity
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock3 className="size-3.5" />
                Last 5 minutes
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {events.map((event, index) => (
                <div
                  key={event.label}
                  className="flex items-start gap-3 rounded-xl bg-white/3 px-3 py-3"
                >
                  <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-semibold text-cyan-200">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{event.label}</p>
                    <p className="text-sm text-slate-400">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                <Users className="size-4" />
                Per-seat limits
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Wallet-based seats with enforceable monthly budgets.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-sky-400/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
                <BarChart3 className="size-4" />
                On-chain audit trail
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Every call maps back to a signed transaction.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="product" className="relative overflow-hidden px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-20">
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-2xl">
          <Badge variant="outline" className="border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-cyan-100">
            On-chain Spend Firewall for AI Agents
          </Badge>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl lg:leading-[1.02]">
            Your agents are spending. Do you know how much?
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Quota gives enterprises programmable spending limits for every AI agent and team member. Enforced by a Solana program. Not a database.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full bg-cyan-400 px-6 text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.24)] hover:bg-cyan-300">
              <Link href="/signup">
                Start for free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10">
              <Link href="#docs">See how it works</Link>
            </Button>
          </div>

          <p className="mt-5 text-sm text-slate-400">
            No wallet required to get started. Set up in under 5 minutes.
          </p>

          {/* <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Trusted by teams building with</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">OpenAI API</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Anthropic API</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Solana</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Dodo Payments</span>
          </div> */}

          <p className="mt-4 text-sm text-slate-400">
            100% on-chain enforcement. Zero trust required.
          </p>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}