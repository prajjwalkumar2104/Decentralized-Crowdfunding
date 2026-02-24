"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "NexusFund's quadratic funding model gave our small team the boost we needed. A $50 contribution turned into $2,000 in matched funds.",
    name: "Elena Vasquez",
    role: "Founder, ZK Identity Protocol",
    initials: "EV",
  },
  {
    quote: "The transparency and community-driven approach sets NexusFund apart. We raised our entire seed round through their platform.",
    name: "Marcus Chen",
    role: "Lead Dev, Carbon Credit DEX",
    initials: "MC",
  },
  {
    quote: "As a contributor, I love knowing my small donation gets amplified. It makes me feel like my voice truly matters in funding decisions.",
    name: "Aisha Patel",
    role: "Web3 Contributor",
    initials: "AP",
  },
  {
    quote: "We've distributed over $3M through NexusFund rounds. The platform handles the complexity so we can focus on impact.",
    name: "David Okonkwo",
    role: "Grants Lead, OpenDAO",
    initials: "DO",
  },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section ref={ref} className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Voices from the Community
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Hear from project founders, contributors, and grant managers who use NexusFund.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="glass-card glass-card-hover rounded-2xl p-6 relative group cursor-default transition-all duration-300"
            >
              <Quote className="h-8 w-8 text-primary/20 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground text-xs font-bold">{t.initials}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;