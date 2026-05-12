import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@workspace/ui/components/button";

export function CtaSection() {
  return (
    <section id="cta" className="px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[3rem] border border-primary/20 bg-card/40 px-6 py-20 text-center shadow-2xl shadow-primary/5 backdrop-blur-md sm:px-16 lg:px-24">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Stop guessing what your agents are spending.
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Set up your vault in minutes. Issue your first seat. Enforce
              programmable spend control on-chain.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full px-10 font-bold shadow-xl shadow-primary/20"
              >
                <Link href="/signup">Get started for free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-full border-border/60 px-10 font-semibold hover:bg-muted"
              >
                <Link href="https://github.com/Smnthjm08/qouta-app">
                  Read the docs
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground/60">
              No credit card required. Devnet ready.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
