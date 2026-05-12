import Link from "next/link";

import LogoTitle from "../utils/logo-title";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#product" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#docs" },
      { label: "Roadmap", href: "#product" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "API Reference", href: "#docs" },
      { label: "GitHub", href: "https://github.com" },
      // { label: "SDK", href: "#docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#product" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#blog" },
      { label: "Contact", href: "#cta" },
    ],
  },
];

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
            href="https://x.com"
            className="transition-colors hover:text-foreground"
          >
            Twitter
          </Link>
          <Link
            href="https://github.com/Smnthjm08/qouta-app"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
