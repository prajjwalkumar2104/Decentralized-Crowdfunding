import Navbar from "@/components/navbar";
import FeaturedRounds from "@/components/featuredRound";
import Image from "next/image";
import ProjectGrid from "@/components/projectGrid";
import HeroSection from "@/components/heroSection";
import MechanicsSection from "@/components/mechanicSection";
import Footer from "@/components/footer";
import StatsRibbon from "@/components/stats";
import TestimonialsSection from "@/components/feedback";
import FAQSection from "@/components/faq";

export default function Home() {
  return (
    <>
     <div className="min-h-screen bg-background">
    <Navbar/>
    <HeroSection/>
    <StatsRibbon/>
    <FeaturedRounds/>
    <ProjectGrid/>
    <MechanicsSection/>
    <TestimonialsSection/>
    <FAQSection/>
    <Footer/>
    </div>
   
    </>
  );
}
