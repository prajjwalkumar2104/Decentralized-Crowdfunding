"use client";
import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { value: 24, label: "Distributed", prefix: "$", suffix: "M+" },
  { value: 1200, label: "Projects Funded", prefix: "", suffix: "" },
  { value: 45, label: "Contributors", prefix: "", suffix: "K+" },
  { value: 12, label: "Active Rounds", prefix: "", suffix: "" },
];

const Counter = ({ value, prefix, suffix, isVisible }: { value: number; prefix: string; suffix: string; isVisible: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const controls = animate(0, value, {
        duration: 2, // Counting duration in seconds
        ease: "easeOut",
        onUpdate: (latest) => setCount(Math.floor(latest)),
      });
      return () => controls.stop();
    }
  }, [isVisible, value]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatsRibbon = () => {
  const ref = useRef(null);
  // once: true ensures it doesn't restart every time you scroll up/down
  const isInView = useInView(ref, { once: false, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 border-y border-border/50 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-2">
                <Counter 
                  value={stat.value} 
                  prefix={stat.prefix} 
                  suffix={stat.suffix} 
                  isVisible={isInView} 
                />
              </div>
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsRibbon;