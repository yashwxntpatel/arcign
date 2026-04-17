import { Reveal, SplitReveal } from "./Reveal";
import a from "@/assets/philosophy-light.jpg";
import b from "@/assets/detail-material.jpg";
import c from "@/assets/project-bedroom.jpg";

const entries = [
  { t: "Designing with light in modern homes", c: "Essay", d: "How orientation and aperture quietly determine the emotional life of a space.", img: a, date: "Mar 2025" },
  { t: "Material palettes that define mood", c: "Notes", d: "On travertine, oak, plaster, and the alchemy of three good materials.", img: b, date: "Feb 2025" },
  { t: "Warmth and minimalism are not opposites", c: "Perspective", d: "Why the best minimal interiors feel inhabited, not staged.", img: c, date: "Jan 2025" },
];

export const Journal = () => {
  return (
    <section id="journal" className="py-24 md:py-32 bg-background border-t border-border">
      <div className="container-luxe">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <Reveal><p className="eyebrow mb-6">— Journal</p></Reveal>
            <h2 className="font-display text-5xl md:text-7xl leading-[1]">
              <SplitReveal text="Studio" />
              <br />
              <span className="italic"><SplitReveal text="perspectives." delay={0.15} /></span>
            </h2>
          </div>
          <Reveal delay={0.2}>
            <a href="#" className="luxe-link text-[12px] uppercase tracking-[0.22em]">All entries →</a>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {entries.map((e, i) => (
            <Reveal key={e.t} delay={i * 0.1}>
              <a href="#" className="group block">
                <div className="reveal-mask aspect-[4/5] mb-6 bg-secondary">
                  <img src={e.img} alt={e.t} loading="lazy" className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.6,0.05,0.1,1)] group-hover:scale-[1.05]" />
                </div>
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
                  <span className="text-bronze">{e.c}</span>
                  <span className="h-px w-6 bg-muted-foreground/40" />
                  <span>{e.date}</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl leading-tight mb-3 group-hover:text-bronze transition-colors duration-500">{e.t}</h3>
                <p className="text-muted-foreground text-[14px] leading-relaxed">{e.d}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
