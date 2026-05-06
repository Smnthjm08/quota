import { SiteNav } from "./site-nav";
import { HeroSection } from "./hero-section";
import { ProblemSection } from "./problem-section";
import { SolutionSection } from "./solution-section";
import { HowItWorksSection } from "./how-it-works-section";
import { DeveloperSection } from "./developer-section";
import { PricingSection } from "./pricing-section";
import { WhySolanaSection } from "./why-solana-section";
import { FaqSection } from "./faq-section";
import { CtaSection } from "./cta-section";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <main className="relative isolate overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_32%),linear-gradient(180deg,rgba(2,6,23,1),rgba(2,6,23,0.92)_30%,rgba(2,6,23,1))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-128 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />

      <SiteNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <DeveloperSection />
      <PricingSection />
      <WhySolanaSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </main>
  );
}