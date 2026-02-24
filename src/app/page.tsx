import Navbar from "@/components/navbar";
import FeaturedRounds from "@/components/featuredRound";
import Image from "next/image";
import ProjectGrid from "@/components/projectGrid";
import HeroSection from "@/components/heroSection";
import MechanicsSection from "@/components/mechanicSection";
import Footer from "@/components/footer";
import StatsRibbon from "@/components/stats";

export default function Home() {
  return (
    <>
    <Navbar/>
    <HeroSection/>
    <StatsRibbon/>
    <FeaturedRounds/>
    <ProjectGrid/>
    <MechanicsSection/>
    <Footer/>
    </>
  );
}
