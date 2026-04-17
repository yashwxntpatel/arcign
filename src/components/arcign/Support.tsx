import { Reveal } from "./Reveal";

const items = [
  {
    n: "01",
    t: "Design Development",
    d: "Working drawings, joinery details, and technical resolution — every junction considered.",
  },
  {
    n: "02",
    t: "Material & Finish Curation",
    d: "Stone, wood, plaster, brass, textile — sourced and harmonised into a singular palette.",
  },
  {
    n: "03",
    t: "Execution Coordination",
    d: "On-site liaison with contractors and craftspeople to protect intent through completion.",
  },
];

export const Support = () => {
  return (
    <section className="border-t border-border bg-background py-20 md:py-24 lg:py-28">
      <div className="container-luxe">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <Reveal>
              <p className="eyebrow mb-5">— Beyond Design</p>
            </Reveal>

            <Reveal>
              <h2 className="font-display text-[2.3rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-[4.4rem]">
                Support that extends
                <span className="block italic">far past the drawings.</span>
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-4 lg:self-end">
            <Reveal delay={0.15}>
              <p className="text-[15px] leading-relaxed text-muted-foreground md:text-base">
                ARCIGN remains involved through planning, detailing, sourcing, site coordination and final styling — so that what we drew is what you live in.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.n} delay={i * 0.08}>
              <div className="h-full rounded-[24px] border border-foreground/10 bg-surface p-7 shadow-[var(--shadow-elegant)] transition duration-500 hover:-translate-y-1 hover:bg-background md:p-8">
                <span className="text-[11px] tracking-[0.3em] text-bronze">— {it.n}</span>
                <h3 className="mt-5 font-display text-2xl leading-[1.05] md:text-3xl">
                  {it.t}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  {it.d}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};