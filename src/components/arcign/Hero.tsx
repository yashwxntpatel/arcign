import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SplitReveal } from "./Reveal";
import hero from "@/assets/hero-architecture.jpg";

export const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[700px] w-full overflow-hidden bg-surface-deep">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src={hero} alt="ARCIGN signature residence at golden hour" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-deep/40 via-surface-deep/10 to-surface-deep/70" />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="relative z-10 h-full container-luxe flex flex-col justify-end pb-20 md:pb-28">
        <div className="flex items-center gap-3 mb-8">
          <span className="h-px w-10 bg-background/60" />
          <span className="text-background/80 text-[11px] uppercase tracking-[0.32em]">Architecture · Interiors · Bespoke</span>
        </div>

        <h1 className="font-display text-background text-[6vw] md:text-[6vw] leading-[0.75] max-w-[18ch]">
          <span className="block"><SplitReveal text="Designing spaces" delay={0.3} /></span>
          <span className="block text-background/90"><SplitReveal text="that feel inevitable." delay={0.55} /></span>
        </h1>

        <div className="mt-10 md:mt-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="text-background/80 max-w-md text-base md:text-lg leading-relaxed"
          >
            A premium architecture and interiors studio crafting bespoke homes, refined interiors, and thoughtful spatial experiences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.25 }}
            className="flex items-center gap-4"
          >
            <a href="#projects" className="group inline-flex items-center gap-3 bg-background text-foreground px-7 py-4 text-[12px] uppercase tracking-[0.22em] hover:bg-bronze hover:text-background transition-colors duration-500">
              View Projects
              <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
            <a href="#contact" className="text-background luxe-link text-[12px] uppercase tracking-[0.22em]">
              Book Consultation
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-background/70 text-[10px] uppercase tracking-[0.4em]">Scroll</span>
        <motion.span
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="block w-px h-10 bg-background/60"
        />
      </motion.div>
    </section>
  );
};
