"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sigma, ArrowUpRight, RotateCcw } from "lucide-react";

const mechanisms = [
  {
    icon: Sigma,
    title: "Quadratic Funding",
    description:
      "Small donations from many people are matched exponentially. A $1 contribution from 100 people generates more matching than a $100 contribution from one — democratizing capital allocation.",
  },
  {
    icon: ArrowUpRight,
    title: "Direct Grants",
    description:
      "Skip the matching pool. Fund projects directly with milestone-based disbursements, transparent on-chain tracking, and community-governed accountability frameworks.",
  },
  {
    icon: RotateCcw,
    title: "Retroactive Funding",
    description:
      "Reward projects that have already proven their impact. Community members stake on outcomes, and verified results unlock retroactive treasury distributions.",
  },
];

const MechanicsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="mechanics" ref={ref} className="py-24 border-t border-border/50">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Three powerful funding mechanisms designed to maximize impact and ensure transparency.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {mechanisms.map((mech, i) => (
            <motion.div
              key={mech.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="glass-card glass-card-hover rounded-1xl p-8 transition-all duration-300 group"
            >
              <div className="p-3 rounded-xl glass-card w-fit mb-6 text-primary group-hover:text-foreground transition-colors">
                <mech.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {mech.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mech.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MechanicsSection;