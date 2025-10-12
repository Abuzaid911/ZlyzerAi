// pages/Home.tsx (excerpt)
import StepFlow from "../components/StepFlow";
import SchedulerHero from "../components/SchedulerHero";
import FinalCTA from "../components/landing/FinalCTA";
import FAQSection from "../components/FAQSection";
// import PricingSection from "../components/landing/PricingSection";




export default function Home() {
  return (
    <main>
      
   <div id="hero">
   <SchedulerHero />
   </div>
      
      <div id="step-flow">
     <StepFlow />
   </div>
   <div id="faq">
     <FAQSection />
   </div>
      {/* <PricingSection /> */}
      <FinalCTA />
    
      {/* …rest of the page */}
    </main>
  );
}
