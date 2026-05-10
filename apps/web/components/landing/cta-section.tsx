import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@workspace/ui/components/button";

export function CtaSection() {
  return (
    <section id="cta" className="px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_32%),linear-gradient(180deg,rgba(8,15,28,0.98),rgba(2,6,23,1))] px-6 py-14 shadow-[0_30px_90px_rgba(2,8,23,0.4)] sm:px-10 lg:px-14">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Stop guessing what your agents are spending.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
              Set up your vault in 5 minutes. Add your first seat. Know exactly
              where every credit goes.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-cyan-400 px-6 text-slate-950 hover:bg-cyan-300"
              >
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              >
                <Link href="#docs">Read the docs</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              No wallet required to start. Managed setup available.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
