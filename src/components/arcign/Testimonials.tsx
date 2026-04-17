import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";

const quotes = [
  { q: "ARCIGN approached our home like a piece of writing — every line considered, every silence intentional. The result is a place we feel deeply at ease in.", a: "Private Client", r: "Residential Villa, Italy" },
  { q: "What sets them apart is restraint. They removed everything that didn't serve the space and what remained felt richer than we imagined possible.", a: "S. & M.", r: "Penthouse, Dubai" },
  { q: "From the first sketch to the final shadow gap, the studio held the vision. The detailing alone is worth the engagement.", a: "Hospitality Group", r: "Boutique Hotel, Lisbon" },
];

export const Testimonials = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % quotes.length), 6500);
    return () => clearInterval(t);
  }, []);
  const cur = quotes[i];
  return (
    <section className="py-24 md:py-36 bg-surface">
      <div className="container-luxe max-w-5xl">
        <Reveal><p className="eyebrow text-center mb-12">— Voices</p></Reveal>
        <div className="relative min-h-[280px] md:min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 1, ease: [0.6, 0.05, 0.1, 1] }}
              className="text-center"
            >
              <p className="font-display text-3xl md:text-5xl leading-[1.2] mb-10">
                "{cur.q}"
              </p>
              <p className="text-[12px] uppercase tracking-[0.28em] text-muted-foreground">
                {cur.a} <span className="text-bronze mx-3">·</span> {cur.r}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex justify-center gap-3 mt-16">
          {quotes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Quote ${idx + 1}`}
              className={`h-px transition-all duration-500 ${idx === i ? "w-16 bg-foreground" : "w-8 bg-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
