import { Reveal, ImageReveal } from "./Reveal";
import detail from "@/assets/detail-material.jpg";

const pillars = [
  {
    n: "01",
    t: "Bespoke by nature",
    d: "Every project begins with the people who will inhabit it. No templates. No repetition.",
  },
  {
    n: "02",
    t: "Material intelligence",
    d: "Stone, wood, plaster and light — chosen for honesty, longevity, and quiet richness.",
  },
  {
    n: "03",
    t: "Detail-led execution",
    d: "From shadow gaps to door pulls, the smallest gestures define the experience of a space.",
  },
  {
    n: "04",
    t: "Functional poetry",
    d: "Spaces that perform beautifully — for routine, for stillness, for the way you actually live.",
  },
];

export const WhySection = () => {
  return (
    <section id="studio" className="bg-background py-20 md:py-24 lg:py-28">
      <div className="container-luxe">
        <Reveal>
          <p className="eyebrow mb-5">Why ARCIGN</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base">
                ARCIGN is an architecture and interior design practice working at the
                intersection of craft, calm, and contemporary living. We design fewer
                projects, with greater depth.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <ImageReveal
                src={detail}
                alt="Material study"
                className="mt-8 aspect-[4/3] rounded-[24px]"
              />
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <Reveal>
              <h2 className="font-display text-[2.3rem] leading-[1.02] sm:text-5xl md:text-6xl lg:text-[4.4rem]">
                A studio built on restraint and intent.
              </h2>
            </Reveal>

            <div className="mt-8 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-2">
              {pillars.map((p, i) => (
                <Reveal key={p.n} delay={i * 0.08}>
                  <div className="h-full rounded-[24px] border border-foreground/10 bg-surface p-7 shadow-[var(--shadow-elegant)] transition duration-500 hover:-translate-y-1 hover:border-bronze/35 hover:bg-background md:p-8">
                    <span className="text-[11px] tracking-[0.3em] text-bronze">— {p.n}</span>
                    <h3 className="mt-4 font-display text-2xl leading-[1.05] md:text-3xl">
                      {p.t}
                    </h3>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                      {p.d}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};