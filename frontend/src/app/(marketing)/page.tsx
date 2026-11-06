import { Demo } from "@/features/marketing/components/Demo";
import { Faq } from "@/features/marketing/components/Faq";
import { Hero } from "@/features/marketing/components/Hero";
import { HowItWorks } from "@/features/marketing/components/HowItWorks";
import { Pillars } from "@/features/marketing/components/Pillars";
import { Pricing } from "@/features/marketing/components/Pricing";
import { UseCases } from "@/features/marketing/components/UseCases";

export default function MarketingHomePage() {
  return (
    <>
      <Hero />
      <Pillars />
      <Demo />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <Faq />
    </>
  );
}
