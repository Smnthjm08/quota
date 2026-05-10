import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

type BrandProps = {
  href?: string;
  className?: string;
  showTagline?: boolean;
};

export function Brand({
  href = "/",
  className,
  showTagline = true,
}: BrandProps) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-3", className)}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-300 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_rgba(8,15,28,0.35)] backdrop-blur">
        <ShieldCheck className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-semibold tracking-[0.22em] text-white uppercase">
          Quota
        </span>
        {showTagline ? (
          <span className="mt-1 text-xs text-slate-300">
            On-chain spend firewall for AI agents.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
