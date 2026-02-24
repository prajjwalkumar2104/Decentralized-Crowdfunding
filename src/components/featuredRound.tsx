"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, Cpu, Leaf, Code2 } from "lucide-react";

const rounds = [
  {
    title: "AI Research & Safety",
    pool: "$850,000",
    timeLeft: "14d 6h",
    projects: 42,
    icon: Cpu,
    color: "text-primary",
  },
  {
    title: "Climate Tech Innovation",
    pool: "$1,200,000",
    timeLeft: "21d 3h",
    projects: 67,
    icon: Leaf,
    color: "text-emerald-400",
  },
  {
    title: "Open Source Tooling",
    pool: "$620,000",
    timeLeft: "7d 18h",
    projects: 38,
    icon: Code2,
    color: "text-secondary",
  },
];

const FeaturedRounds = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="rounds" ref={ref} className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Active Funding Rounds
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Contribute to live matching rounds and amplify your impact through quadratic funding.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {rounds.map((round, i) => (
            <motion.div
              key={round.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.5 }}
              className="glass-card glass-card-hover rounded-1xl p-6 group cursor-pointer transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`p-3 rounded-xl glass-card ${round.color}`}>
                  <round.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass-card rounded-3xl px-3 py-1">
                  <Clock className="h-3 w-9" />
                  {round.timeLeft}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {round.title}
              </h3>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Matching Pool</div>
                  <div className="text-lg font-bold ">{round.pool}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-0.5">Projects</div>
                  <div className="text-lg font-bold text-foreground">{round.projects}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedRounds;