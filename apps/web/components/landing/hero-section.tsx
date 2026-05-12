import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

export function HeroSection() {
  return (
    <section className="relative px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 flex justify-center">
          <Badge
            variant="outline"
            className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium tracking-widest text-primary uppercase"
          >
            Agent Payments / Solana
          </Badge>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-7xl">
          The on-chain spend firewall for your AI agents.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
          Quota lets you issue agent keys with hard-coded monthly USDC limits.
          Enforced by a Solana program, funded by Dodo Payments, impossible to
          hack.
        </p>

        <div className="mt-12 flex items-center justify-center gap-x-6">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-8 font-semibold shadow-lg shadow-primary/20"
          >
            <Link href="/signup">Open the console</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-full border-border/60 px-8 font-semibold hover:bg-muted"
          >
            <Link href="https://github.com/Smnthjm08/qouta-app">
              Read the SDK
            </Link>
          </Button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-x-3 text-xs font-medium tracking-[0.2em] text-muted-foreground/60 uppercase">
          <span>Devnet live</span>
          <span className="size-1 rounded-full bg-muted-foreground/30"></span>
          <span>Mainnet soon</span>
        </div>
      </div>
    </section>
  );
}
