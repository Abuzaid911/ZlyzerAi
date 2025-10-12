// Main landing page - assembled from all landing components
import LandingHero from '../components/landing/LandingHero';
import SocialProofBar from '../components/landing/SocialProofBar';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import UseCaseTabs from '../components/landing/UseCaseTabs';
import PricingSection from '../components/landing/PricingSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/landing/FinalCTA';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-[linear-gradient(180deg,#132e53_0%,#191e29_100%)]">
      {/* Interactive fluid cursor effect */}
      
      {/* Hero Section */}
      <LandingHero />

      {/* Social Proof Bar */}
      <SocialProofBar />

      {/* Features Grid */}
      <FeaturesGrid />

      {/* Use Case Tabs */}
      <UseCaseTabs />

      {/* Pricing Section */}
      <PricingSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCTA />
    </div>
  );
}

