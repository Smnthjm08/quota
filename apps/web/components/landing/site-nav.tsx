import Link from "next/link";

import { Button } from "@workspace/ui/components/button";

import LogoTitle from "../utils/logo-title";

const navItems = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  // { label: "SDK", href: "https://github.com/Smnthjm08/qouta-app" },
  { label: "GitHub", href: "https://github.com/Smnthjm08/quota" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <LogoTitle />

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Button
            asChild
            size="sm"
            className="h-9 rounded-full px-5 font-medium"
          >
            <Link href="/signup">Open console</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
