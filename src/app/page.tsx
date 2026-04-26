import Navbar from "@/components/navbar";
// import FeaturedRounds from "@/components/featuredRound";
import ProjectGrid from "@/components/projectGrid";
import HeroSection from "@/components/heroSection";
import MechanicsSection from "@/components/mechanicSection";
import Footer from "@/components/footer";
// import StatsRibbon from "@/components/stats";
import TestimonialsSection from "@/components/feedback";
import FAQSection from "@/components/faq";
import UserTokenEarnings from "@/components/userTokenEarnings";
import EthDonationLeaderboard from "@/components/ethDonationLeaderboard";
// import Test from"@/components/test";


export default function Home() {
  return (
    <>
     <div className="min-h-screen bg-background">
    <Navbar/>
    <HeroSection/>
    {/* <StatsRibbon/> */}
    
    <UserTokenEarnings/>
    <EthDonationLeaderboard/>
    {/* <FeaturedRounds/> */}
    <ProjectGrid/>
    <MechanicsSection/>
    <TestimonialsSection/>
    <FAQSection/>
    <Footer/>
    </div>
    </>
  );
}
