import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SplitReveal, Reveal } from "./Reveal";
import dusk from "@/assets/cta-dusk.jpg";

export const FinalCTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);
  return (
    <section id="contact" ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-surface-deep">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img src={dusk} alt="Architectural terrace at dusk" loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-surface-deep/55" />
      </motion.div>

      <div className="relative z-10 h-full container-luxe flex flex-col justify-center text-background">
        <Reveal>
          <p className="eyebrow text-background/70 mb-8">— Let's begin</p>
        </Reveal>
        <h2 className="font-display text-[8vw] md:text-[6vw] leading-[0.95] max-w-[14ch]">
          <SplitReveal text="Let's design" />
          <br />
          <span className="italic"><SplitReveal text="something that lasts." delay={0.2} /></span>
        </h2>

        <div className="mt-12 flex flex-col md:flex-row md:items-end gap-8 md:justify-between">
          <Reveal delay={0.2}>
            <p className="max-w-md text-background/80 leading-relaxed">
              Tell us about your space, your site, or your ambition. We respond personally to every enquiry.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex items-center gap-5">
              <a href="mailto:studio@arcign.com" className="inline-flex items-center gap-3 bg-background text-foreground px-8 py-5 text-[12px] uppercase tracking-[0.24em] hover:bg-bronze hover:text-background transition-colors duration-500">
                Start Your Project →
              </a>
              <a href="https://www.instagram.com/arcign.architects/" target="_blank" rel="noreferrer" className="text-background luxe-link text-[12px] uppercase tracking-[0.22em]">
                @arcign.architects
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
