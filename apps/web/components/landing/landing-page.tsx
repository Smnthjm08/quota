import { SiteNav } from "./site-nav";
import { HeroSection } from "./hero-section";
import { FeaturesSection } from "./features-section";
import { PricingSection } from "./pricing-section";
import { CtaSection } from "./cta-section";
import { Footer } from "./footer";

export function LandingPage() {
  return (
    <main className="relative isolate overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>

      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(circle_800px_at_50%_-100px,rgba(78,110,242,0.15),transparent)]"></div>

      <SiteNav />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
