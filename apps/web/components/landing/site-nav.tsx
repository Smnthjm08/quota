import Link from "next/link";

import { Button } from "@workspace/ui/components/button";

import LogoTitle from "../logo-title";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "Blog", href: "#blog" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        {/* <Brand showTagline={true} /> */}
        <LogoTitle />

        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-slate-200 hover:bg-white/10 hover:text-white"
            size="sm"
          >
            <Link href="/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-cyan-400 px-4 font-semibold text-slate-950 shadow-[0_14px_35px_rgba(34,211,238,0.25)] hover:bg-cyan-300"
          >
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
