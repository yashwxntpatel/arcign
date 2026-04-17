import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SplitReveal, Reveal } from "./Reveal";
import light from "@/assets/philosophy-light.jpg";

export const Philosophy = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} className="relative py-24 md:py-36 bg-surface overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <span className="font-display text-[40vw] leading-none text-foreground absolute -top-20 -left-10 select-none">
          Arcign
        </span>
      </motion.div>

      <div className="container-luxe relative">
        <Reveal>
          <p className="eyebrow text-center mb-10">— Philosophy</p>
        </Reveal>

        <h2 className="font-display text-[10vw] md:text-[5.5vw] leading-[1.02] text-center max-w-6xl mx-auto">
          <SplitReveal text="This isn't just" />
          <br />
          <span className="italic"><SplitReveal text="about buildings." delay={0.2} /></span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-20 items-center">
          <div className="md:col-span-5">
            <Reveal>
              <div className="reveal-mask aspect-[3/4]">
                <img src={light} alt="Light through architecture" loading="lazy" className="w-full h-full object-cover" />
              </div>
            </Reveal>
          </div>
          <div className="md:col-span-6 md:col-start-7 space-y-6">
            <Reveal>
              <p className="font-display text-3xl md:text-4xl leading-snug">
                It's about the way a space holds light. The way it shapes routine. The way design quietly influences how you live, gather, and feel.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                Our work is grounded in proportion, materiality, and the specific atmosphere a place asks for. We measure success not in square meters, but in moments — the morning sun across a hallway, the quiet of an entry, the warmth of a kitchen that finally feels like yours.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <a href="#projects" className="luxe-link inline-block text-[12px] uppercase tracking-[0.22em] mt-4">
                Explore the work
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
