"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart } from "lucide-react";

const projects = [
  {
    title: "ZK Identity Protocol",
    desc: "Privacy-preserving identity verification using zero-knowledge proofs for decentralized applications.",
    raised: 72,
    goal: "$45,000",
    supporters: 312,
    category: "Privacy",
  },
  {
    title: "Carbon Credit DEX",
    desc: "Decentralized exchange for tokenized carbon credits with real-time satellite verification.",
    raised: 45,
    goal: "$120,000",
    supporters: 189,
    category: "Climate",
  },
  {
    title: "Open Source LLM Tools",
    desc: "Building accessible AI tooling for open-source developers with on-chain model governance.",
    raised: 88,
    goal: "$30,000",
    supporters: 547,
    category: "AI",
  },
  {
    title: "DeFi Education DAO",
    desc: "Free, multilingual courses on decentralized finance for underserved communities worldwide.",
    raised: 34,
    goal: "$60,000",
    supporters: 203,
    category: "Education",
  },
  {
    title: "Mesh Network Protocol",
    desc: "Censorship-resistant communication protocol using decentralized mesh networking infrastructure.",
    raised: 61,
    goal: "$85,000",
    supporters: 428,
    category: "Infrastructure",
  },
  {
    title: "DAO Governance Toolkit",
    desc: "Modular governance framework with delegation, quadratic voting, and treasury management.",
    raised: 53,
    goal: "$40,000",
    supporters: 276,
    category: "Governance",
  },
];

const ProjectGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section id="projects" ref={ref} className="py-24 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Discover Projects
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Support groundbreaking public goods — every contribution is matched and amplified.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08 * i, duration: 0.5 }}
              className="glass-card glass-card-hover rounded-1xl overflow-hidden group cursor-pointer transition-all duration-300"
            >
              {/* Image placeholder */}
              <div className="h-40 relative overflow-hidden bg-muted/30">
                <div className="absolute inset-0 grid-pattern opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                <div className="absolute top-3 left-3 text-xs font-medium glass-card rounded-full px-3 py-1 text-foreground">
                  {project.category}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                  {project.desc}
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{project.raised}% funded</span>
                    <span className="text-foreground font-medium">{project.goal}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-black transition-all duration-1000"
                      style={{ width: `${project.raised}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" />
                    {project.supporters} supporters
                  </div>
                  <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                    Support →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectGrid;
