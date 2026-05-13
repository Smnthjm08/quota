import Link from "next/link";

import LogoTitle from "../utils/logo-title";

export function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <LogoTitle />

        <p className="text-sm text-muted-foreground">
          © 2026 Quota. All rights reserved.
        </p>

        <div className="flex gap-6 text-sm font-medium text-muted-foreground">
          <Link
            target="_blank"
            href="https://x.com/Quota142507"
            className="transition-colors hover:text-foreground"
          >
            Twitter
          </Link>
          <Link
            target="_blank"
            href="https://github.com/Smnthjm08/qouta"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
