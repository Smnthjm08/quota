import Link from "next/link";

import LogoTitle from "../logo-title";

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
      { label: "SDK", href: "#docs" },
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
    <footer id="blog" className="border-t border-white/10 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <LogoTitle />
            <p className="max-w-sm text-sm leading-7 text-slate-400">
              On-chain spend firewall for AI agents.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              <Link className="transition-colors hover:text-white" href="https://x.com">
                Twitter
              </Link>
              <Link className="transition-colors hover:text-white" href="https://github.com">
                GitHub
              </Link>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white">
                {column.title}
              </h3>
              <div className="space-y-3 text-sm text-slate-400">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="block transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2025 Quota. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#product" className="transition-colors hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="#product" className="transition-colors hover:text-slate-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}