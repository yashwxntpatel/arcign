import { Reveal, SplitReveal } from "./Reveal";
import sketch from "@/assets/process-sketch.jpg";

const steps = [
  { n: "I.", t: "Discover", d: "We listen first. Lifestyle, function, aspiration, site, light, climate, constraint — everything that will shape the brief." },
  { n: "II.", t: "Design", d: "Concept, planning, material direction, and detail development — refined through sketches, models, and quiet iteration." },
  { n: "III.", t: "Deliver", d: "Execution guidance, on-site coordination, and final styling. We stay involved until the last shadow falls in the right place." },
];

export const Reimagined = () => {
  return (
    <section id="process" className="py-24 md:py-32 bg-surface-deep text-background grain">
      <div className="container-luxe">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow text-background/60 mb-8">— Process</p>
            </Reveal>
            <h2 className="font-display text-[10vw] md:text-[7vw] leading-[0.95]">
              <SplitReveal text="Architecture," />
              <br />
              <span className="text-background/90"><SplitReveal text="refined." delay={0.2} /></span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 self-end">
            <Reveal delay={0.2}>
              <p className="text-background/70 leading-relaxed">
                A three-act practice. Slow, deliberate, and entirely tailored to the place and the people. No phase is skipped. No detail is delegated to chance.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-background/10">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="bg-surface-deep p-8 md:p-10 h-full min-h-[280px] flex flex-col justify-between hover:bg-foreground/40 transition-colors duration-700">
                <span className="font-display text-bronze-soft text-2xl">{s.n}</span>
                <div>
                  <h3 className="font-display text-4xl md:text-5xl mb-4">{s.t}</h3>
                  <p className="text-background/70 leading-relaxed text-[15px]">{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-7">
            <Reveal>
              <div className="reveal-mask aspect-[16/9]">
                <img src={sketch} alt="Architect sketching plan" loading="lazy" className="w-full h-full object-cover" />
              </div>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <Reveal delay={0.2}>
              <p className="font-display text-2xl md:text-3xl mb-6 leading-snug">
                Begin with a conversation. Leave with a space that lasts.
              </p>
              <a href="#contact" className="inline-flex items-center gap-3 bg-background text-foreground px-7 py-4 text-[12px] uppercase tracking-[0.22em] hover:bg-bronze hover:text-background transition-colors duration-500">
                Start Your Project →
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
