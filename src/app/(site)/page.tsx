import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TemplatesPreview } from "@/components/landing/templates-preview";
import { Features } from "@/components/landing/features";
import { PricingPreview } from "@/components/landing/pricing-preview";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { WhatsAppSection } from "@/components/landing/whatsapp-section";
import { getActivePricingPlans } from "@/lib/pricing/get-plans";
import { getActiveTemplates } from "@/lib/templates/get-templates";
import { toTemplateCardItem } from "@/lib/templates/presentation";

export default async function HomePage() {
  const [plans, templates] = await Promise.all([getActivePricingPlans(), getActiveTemplates()]);

  return (
    <>
      <Hero />
      <HowItWorks />
      <TemplatesPreview items={templates.map(toTemplateCardItem)} />
      <Features />
      <PricingPreview plans={plans} />
      <Testimonials />
      <Faq />
      <WhatsAppSection />
    </>
  );
}
