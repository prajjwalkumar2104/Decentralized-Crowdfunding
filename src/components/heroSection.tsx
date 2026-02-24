"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 bg-background">
      {/* Subtle Static Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >

          {/* Headline - Simple Fade In */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            The Future of Public Goods is{" "}
            <span className="">Decentralized</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Small contributions are amplified through quadratic funding — where community
            voice matters more than capital. Fund the projects that shape tomorrow.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="gradient rounded-xl px-8 py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 flex items-center gap-2 w-full sm:w-auto justify-center shadow-sm">
              Launch Project
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <button className="gradient-border rounded-xl px-8 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted w-full sm:w-auto">
              Explore Grants
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;