import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ExpectationsComparison } from "@/components/landing/ExpectationsComparison";
import { LandingFooterDisclaimer } from "@/components/landing/LandingFooterDisclaimer";

export default function HomePage() {
  return (
    <div className="pb-8">
      <Hero />
      <HowItWorks />
      <ExpectationsComparison />
      <LandingFooterDisclaimer />
    </div>
  );
}
